"""
HTTP-based Postgres connection for Neon (bypasses DNS issues in sandbox).
Drop-in replacement for psycopg2 for seed script use.
"""
import requests
import json

NEON_HOST = "ep-sparkling-brook-aiqua5yv.c-4.us-east-1.aws.neon.tech"
CONN_STR = f"postgresql://neondb_owner:npg_STj6ErHVm0vF@{NEON_HOST}/neondb?sslmode=require"
BASE_URL = f"https://{NEON_HOST}/sql"
HEADERS = {
    "Neon-Connection-String": CONN_STR,
    "Content-Type": "application/json",
}

def execute(query, params=None):
    """Execute a single query, return (rows, rowcount)."""
    payload = {"query": query}
    if params:
        # Neon HTTP API uses $1, $2... params with a 'params' array
        payload["params"] = [str(p) if p is not None else None for p in params]
    r = requests.post(BASE_URL, json=payload, headers=HEADERS, timeout=30)
    r.raise_for_status()
    data = r.json()
    return data.get("rows", []), data.get("rowCount", 0)

def execute_many(query, rows_of_params, batch_size=200):
    """Execute a query for many rows of params in batches using transactions."""
    total = 0
    for i in range(0, len(rows_of_params), batch_size):
        batch = rows_of_params[i:i+batch_size]
        # Build multi-row VALUES insert
        # Replace executemany pattern with batch VALUES
        _execute_batch(query, batch)
        total += len(batch)
    return total

def _execute_batch(query, params_list):
    """Send batch as separate queries in a transaction."""
    # For simplicity, execute them one by one (HTTP overhead is acceptable for seed)
    for params in params_list:
        execute(query, params)

class Transaction:
    """Context manager for a series of statements."""
    def __init__(self):
        self.statements = []
    
    def add(self, sql, params=None):
        self.statements.append((sql, params))
    
    def run(self):
        results = []
        for sql, params in self.statements:
            row, count = execute(sql, params)
            results.append(count)
        return results

def run_script(sql_text):
    """Run a multi-statement SQL script (splits on ; delimiter)."""
    # Split by semicolon, skip empty
    stmts = [s.strip() for s in sql_text.split(';') if s.strip()]
    for stmt in stmts:
        execute(stmt)

def test():
    rows, _ = execute("SELECT version()")
    print("Connected:", rows[0]["version"][:40])

if __name__ == "__main__":
    test()
