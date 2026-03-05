"""
Bulk insert helper using Neon HTTP API.
Converts Python lists of dicts to parameterized INSERT statements.
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

def _http_execute(query, params=None):
    payload = {"query": query}
    if params is not None:
        payload["params"] = [None if p is None else str(p) if not isinstance(p, (int, float, bool)) else p for p in params]
    r = requests.post(BASE_URL, json=payload, headers=HEADERS, timeout=60)
    if r.status_code != 200:
        raise Exception(f"{r.status_code}: {r.text[:200]}")
    return r.json()

def insert_rows(table, rows, batch_size=500, on_conflict="DO NOTHING"):
    """Insert a list of dicts into a table using multi-row VALUES batches."""
    if not rows:
        return 0
    
    cols = list(rows[0].keys())
    col_list = ', '.join(cols)
    total = 0
    
    for batch_start in range(0, len(rows), batch_size):
        batch = rows[batch_start:batch_start + batch_size]
        
        # Build multi-row VALUES with $1, $2... parameters  
        placeholders = []
        params = []
        for i, row in enumerate(batch):
            row_placeholders = []
            for j, col in enumerate(cols):
                idx = i * len(cols) + j + 1
                row_placeholders.append(f"${idx}")
                val = row[col]
                params.append(val)
            placeholders.append(f"({', '.join(row_placeholders)})")
        
        sql = f"INSERT INTO {table} ({col_list}) VALUES {', '.join(placeholders)} ON CONFLICT {on_conflict}"
        _http_execute(sql, params)
        total += len(batch)
    
    return total

def truncate_all():
    """Truncate all tables in FK-safe reverse order."""
    tables = [
        'visit_sessions', 'member_engagement_weekly', 'member_engagement_daily',
        'canonical_events', 'close_outs',
        'demand_heatmap', 'cancellation_risk', 'member_waitlist',
        'staff_shifts', 'service_requests', 'feedback',
        'email_events', 'email_campaigns',
        'event_registrations', 'event_definitions',
        'pos_payments', 'pos_line_items', 'pos_checks',
        'pace_hole_segments', 'pace_of_play',
        'waitlist_entries', 'booking_players', 'bookings',
        'members', 'households',
        'weather_daily', 'staff',
        'membership_types', 'dining_outlets', 'courses', 'club',
    ]
    for t in tables:
        try:
            _http_execute(f"TRUNCATE TABLE {t} CASCADE")
        except Exception as e:
            pass  # Table may not exist yet

def count(table):
    result = _http_execute(f"SELECT COUNT(*) as n FROM {table}")
    return result['rows'][0]['n']

if __name__ == "__main__":
    result = _http_execute("SELECT COUNT(*) as n FROM information_schema.tables WHERE table_schema='public'")
    print(f"Tables in schema: {result['rows'][0]['n']}")
