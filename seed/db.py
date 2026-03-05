"""
seed/db.py — Database connection helper
Uses POSTGRES_URL_NON_POOLING for bulk inserts (bypasses pgBouncer).
Reads from .env.local (Vercel CLI output) or environment.
"""
import os
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv

# Load .env.local first, then fall back to environment
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env.local'))
load_dotenv()


def get_connection():
    """Return a direct (non-pooled) psycopg2 connection for bulk inserts."""
    url = os.environ.get('POSTGRES_URL_NON_POOLING')
    if not url:
        raise EnvironmentError(
            "POSTGRES_URL_NON_POOLING not found.\n"
            "Run: vercel env pull .env.local  (from the repo root)\n"
            "or set the variable in your environment."
        )
    conn = psycopg2.connect(url)
    conn.autocommit = False
    return conn


def bulk_insert(conn, table: str, columns: list[str], rows: list[tuple], page_size: int = 1000):
    """
    Insert rows using psycopg2 execute_values (fast batch insert).
    Falls back to a single call for small tables.
    """
    if not rows:
        return 0
    col_str = ', '.join(columns)
    sql = f"INSERT INTO {table} ({col_str}) VALUES %s ON CONFLICT DO NOTHING"
    with conn.cursor() as cur:
        execute_values(cur, sql, rows, page_size=page_size)
    return len(rows)


def copy_insert(conn, table: str, columns: list[str], rows: list[tuple]):
    """
    Ultra-fast COPY-based insert for very large tables (> 5,000 rows).
    Uses StringIO buffer — 10-50x faster than execute_values.
    """
    import io
    if not rows:
        return 0
    col_str = ', '.join(columns)
    buf = io.StringIO()
    for row in rows:
        line_parts = []
        for val in row:
            if val is None:
                line_parts.append('\\N')
            else:
                # Escape tab and newline for COPY format
                line_parts.append(str(val).replace('\\', '\\\\').replace('\t', '\\t').replace('\n', '\\n'))
        buf.write('\t'.join(line_parts) + '\n')
    buf.seek(0)
    with conn.cursor() as cur:
        cur.copy_from(buf, table, columns=columns, null='\\N')
    return len(rows)


def run_sql_file(conn, path: str):
    """Execute a .sql file against the connection (for schema creation)."""
    with open(path, 'r') as f:
        sql = f.read()
    with conn.cursor() as cur:
        cur.execute(sql)
    conn.commit()
    print(f"  ✓ Executed {path}")


def table_count(conn, table: str) -> int:
    with conn.cursor() as cur:
        cur.execute(f"SELECT COUNT(*) FROM {table}")
        return cur.fetchone()[0]
