#!/usr/bin/env python3
"""
seed/seed_database.py
Main orchestrator — runs all 7 phases in sequence.

Usage:
  python seed_database.py                    # seed with default (seed 42)
  python seed_database.py --seed 123         # different seed
  python seed_database.py --validate-only    # run validation checks only
  python seed_database.py --sqlite           # use local SQLite for testing
"""
import argparse
import random
import sys
import time
import os

import yaml

# ─── Import generators ────────────────────────────────────────────────────────
sys.path.insert(0, os.path.dirname(__file__))

from generators.dimensions   import (
    gen_club, CLUB_COLS, gen_courses, COURSE_COLS,
    gen_dining_outlets, OUTLET_COLS, gen_membership_types, MTYPE_COLS,
    gen_households, HH_COLS, gen_members, MEMBER_COLS,
    gen_weather, WEATHER_COLS,
)
from generators.golf         import (
    gen_bookings_and_players, gen_pace,
    BOOKING_COLS, PLAYER_COLS, PACE_COLS, SEGMENT_COLS,
)
from generators.fb           import gen_pos, gen_post_round_checks, CHECK_COLS, LINE_ITEM_COLS, PAYMENT_COLS
from generators.events       import (
    gen_event_definitions, EVENT_DEF_COLS,
    gen_event_registrations, REG_COLS,
)
from generators.communications import (
    gen_email_campaigns, CAMPAIGN_COLS,
    gen_email_events, EMAIL_EVENT_COLS,
)
from generators.service      import (
    gen_staff, STAFF_COLS, gen_staff_shifts, SHIFT_COLS,
    gen_feedback, FEEDBACK_COLS, gen_service_requests, REQUEST_COLS,
)
from generators.waitlist     import (
    gen_member_waitlist, WAITLIST_COLS,
    gen_cancellation_risk, CANCEL_RISK_COLS,
    gen_demand_heatmap, HEATMAP_COLS,
)
from generators.metrics      import (
    gen_all_metrics, gen_close_outs,
    DAILY_COLS, WEEKLY_COLS, SESSION_COLS, CLOSEOUT_COLS,
)
from linkers.cross_domain    import (
    apply_resignations, link_post_round_dining,
    apply_understaffed_flags, apply_fb_minimum_behavior,
)
from linkers.canonical       import gen_canonical_events, CANONICAL_COLS
from validators.validate     import run_all


def log(msg: str):
    print(f'  {msg}', flush=True)


def phase(n: int, title: str):
    print(f'\nPhase {n} — {title}')
    print('  ' + '─' * 56)


def main():
    parser = argparse.ArgumentParser(description='Swoop Golf seed script')
    parser.add_argument('--seed',          type=int, default=42)
    parser.add_argument('--validate-only', action='store_true')
    parser.add_argument('--sqlite',        action='store_true',
                        help='Use local SQLite instead of Postgres (for testing)')
    args = parser.parse_args()

    # ── Load config ───────────────────────────────────────────────────────────
    cfg_path = os.path.join(os.path.dirname(__file__), 'config.yaml')
    with open(cfg_path) as f:
        cfg = yaml.safe_load(f)

    rng = random.Random(args.seed)

    print(f'\n{"="*60}')
    print(f'  Swoop Golf Seed — Pinetree CC · January 2026')
    print(f'  Random seed: {args.seed}')
    print(f'  Mode: {"SQLite (local test)" if args.sqlite else "Postgres (Vercel)"}')
    print(f'{"="*60}')

    # ── Database connection ───────────────────────────────────────────────────
    if args.sqlite:
        import sqlite3
        db_path = os.path.join(os.path.dirname(__file__), '..', 'pinetree_jan2026.db')
        conn = sqlite3.connect(db_path)
        conn.execute('PRAGMA journal_mode=WAL')
        conn.execute('PRAGMA foreign_keys=ON')
        _insert = _sqlite_insert
        _run_schema = _sqlite_schema
    else:
        from db import get_connection, bulk_insert, copy_insert, run_sql_file
        conn = get_connection()
        _insert = _pg_insert
        _run_schema = _pg_schema

    if args.validate_only:
        print('\nRunning validation only...')
        ok = run_all(conn)
        conn.close()
        sys.exit(0 if ok else 1)

    t_start = time.time()

    try:
        # ══════════════════════════════════════════════════════════════════════
        # PHASE 1 — Dimensions
        # ══════════════════════════════════════════════════════════════════════
        phase(1, 'Dimensions')

        _run_schema(conn, args.sqlite)

        club_rows = gen_club(cfg)
        _insert(conn, 'club', CLUB_COLS, club_rows, args.sqlite)
        log(f'club: {len(club_rows)} row')

        course_rows = gen_courses(cfg)
        _insert(conn, 'courses', COURSE_COLS, course_rows, args.sqlite)
        log(f'courses: {len(course_rows)} rows')

        outlet_rows = gen_dining_outlets(cfg)
        _insert(conn, 'dining_outlets', OUTLET_COLS, outlet_rows, args.sqlite)
        log(f'dining_outlets: {len(outlet_rows)} rows')

        mtype_rows = gen_membership_types()
        _insert(conn, 'membership_types', MTYPE_COLS, mtype_rows, args.sqlite)
        log(f'membership_types: {len(mtype_rows)} rows')

        hh_rows = gen_households(220)
        _insert(conn, 'households', HH_COLS, hh_rows, args.sqlite)
        log(f'households: {len(hh_rows)} rows (placeholder primary_member_id)')

        member_rows, hh_updates = gen_members(cfg, rng)
        _insert(conn, 'members', MEMBER_COLS, member_rows, args.sqlite)
        log(f'members: {len(member_rows)} rows')

        # Update household primary_member_id and member_count
        for (primary, count, is_multi, hh_id) in hh_updates:
            if args.sqlite:
                conn.execute(
                    'UPDATE households SET primary_member_id=?, member_count=?, is_multi_member=? WHERE household_id=?',
                    (primary, count, is_multi, hh_id)
                )
            else:
                with conn.cursor() as cur:
                    cur.execute(
                        'UPDATE households SET primary_member_id=%s, member_count=%s, is_multi_member=%s WHERE household_id=%s',
                        (primary, count, is_multi, hh_id)
                    )
        log('households: primary_member_id updated')

        weather_rows = gen_weather(rng)
        _insert(conn, 'weather_daily', WEATHER_COLS, weather_rows, args.sqlite)
        log(f'weather_daily: {len(weather_rows)} rows')

        weather_map = {r[1]: {
            'condition': r[2], 'golf_demand_modifier': r[7], 'fb_demand_modifier': r[8],
            'wind_mph': r[5],
        } for r in weather_rows}

        member_list = [dict(zip(MEMBER_COLS, r)) for r in member_rows]
        # Add golf_eligible based on membership type
        mtype_lookup = {r[0]: r[4] for r in mtype_rows}  # type_code -> golf_eligible
        for m in member_list:
            m['golf_eligible'] = mtype_lookup.get(m['membership_type'], 1)

        member_map = {m['member_id']: m for m in member_list}
        _commit(conn, args.sqlite)

        # ══════════════════════════════════════════════════════════════════════
        # PHASE 2 — Day-by-day simulation
        # ══════════════════════════════════════════════════════════════════════
        phase(2, 'Day-by-day simulation')

        # Events & email campaigns first (needed for FK refs later)
        event_def_rows = gen_event_definitions(cfg)
        _insert(conn, 'event_definitions', EVENT_DEF_COLS, event_def_rows, args.sqlite)
        log(f'event_definitions: {len(event_def_rows)} rows')

        campaign_rows = gen_email_campaigns(cfg)
        _insert(conn, 'email_campaigns', CAMPAIGN_COLS, campaign_rows, args.sqlite)
        log(f'email_campaigns: {len(campaign_rows)} rows')

        staff_rows = gen_staff(cfg, rng)
        _insert(conn, 'staff', STAFF_COLS, staff_rows, args.sqlite)
        log(f'staff: {len(staff_rows)} rows')

        # Bookings + players
        booking_rows, player_rows = gen_bookings_and_players(
            member_list, weather_map, cfg, rng
        )
        _insert(conn, 'bookings', BOOKING_COLS, booking_rows, args.sqlite)
        log(f'bookings: {len(booking_rows)} rows')
        _insert(conn, 'booking_players', PLAYER_COLS, player_rows, args.sqlite)
        log(f'booking_players: {len(player_rows)} rows')

        # Waitlist entries (aggregate unmet demand slots)
        wl_entry_rows = _gen_waitlist_entries(booking_rows, BOOKING_COLS, cfg)
        _insert(conn, 'waitlist_entries',
                ['entry_id','club_id','course_id','requested_date','requested_tee_time',
                 'waitlist_count','has_event_overlap','peak_slot'],
                wl_entry_rows, args.sqlite)
        log(f'waitlist_entries: {len(wl_entry_rows)} rows')

        # Pace of play
        pace_rows, segment_rows = gen_pace(booking_rows, rng)
        _insert(conn, 'pace_of_play', PACE_COLS, pace_rows, args.sqlite)
        log(f'pace_of_play: {len(pace_rows)} rows')
        _insert(conn, 'pace_hole_segments', SEGMENT_COLS, segment_rows, args.sqlite)
        log(f'pace_hole_segments: {len(segment_rows)} rows')

        # F&B
        check_rows, item_rows, payment_rows = gen_pos(member_list, weather_map, cfg, rng)
        log(f'pos_checks: {len(check_rows)} rows (pre-linking)')

        # Post-round dining checks (generated directly, pre-linked)
        prd_checks, prd_items, prd_payments = gen_post_round_checks(
            booking_rows, BOOKING_COLS, pace_rows, PACE_COLS,
            player_rows, PLAYER_COLS, member_map, cfg, rng,
            start_chk_num=len(check_rows),
            start_li_num=len(item_rows),
            start_pay_num=len(payment_rows),
        )
        check_rows  = check_rows  + prd_checks
        item_rows   = item_rows   + prd_items
        payment_rows = payment_rows + prd_payments
        log(f'post-round dining checks generated: {len(prd_checks)} (pre-link)')

        # Event registrations
        event_reg_rows = gen_event_registrations(event_def_rows, member_list, rng)
        log(f'event_registrations: {len(event_reg_rows)} rows')

        # Email events
        email_event_rows = gen_email_events(campaign_rows, member_list, rng)
        log(f'email_events: {len(email_event_rows)} rows')

        # Feedback + service requests
        feedback_rows = gen_feedback(member_list, cfg, rng)
        log(f'feedback: {len(feedback_rows)} rows')

        staff_shift_rows = gen_staff_shifts(staff_rows, rng)
        log(f'staff_shifts: {len(staff_shift_rows)} rows')

        service_req_rows = gen_service_requests(member_list, booking_rows, cfg, rng)
        log(f'service_requests: {len(service_req_rows)} rows')

        # ══════════════════════════════════════════════════════════════════════
        # PHASE 3 — Cross-domain linking
        # ══════════════════════════════════════════════════════════════════════
        phase(3, 'Cross-domain linking')

        # Resignations
        member_rows = apply_resignations(member_rows)
        log('resignations applied to 5 members')

        # Post-round dining linkage
        check_rows = link_post_round_dining(
            booking_rows, player_rows, pace_rows, check_rows,
            member_map, rng
        )
        prd_count = sum(1 for c in check_rows if c[15] == 1)
        log(f'post-round dining links: {prd_count} checks linked')

        # Understaffed flags
        check_rows, feedback_rows, service_req_rows = apply_understaffed_flags(
            check_rows, feedback_rows, service_req_rows
        )
        log('understaffed day flags applied (Jan 9, 16, 28)')

        # F&B minimum behavior
        check_rows = apply_fb_minimum_behavior(check_rows, member_map, rng)
        log('F&B minimum behavior applied for 4 Declining members')

        # Update member table with resignation data
        if args.sqlite:
            for row in member_rows:
                conn.execute(
                    'UPDATE members SET membership_status=?, resigned_on=? WHERE member_id=?',
                    (row[8], row[11], row[0])
                )
        else:
            with conn.cursor() as cur:
                for row in member_rows:
                    cur.execute(
                        'UPDATE members SET membership_status=%s, resigned_on=%s WHERE member_id=%s',
                        (row[8], row[11], row[0])
                    )

        # Now insert F&B and remaining data
        _insert(conn, 'pos_checks', CHECK_COLS, check_rows, args.sqlite)
        log(f'pos_checks: {len(check_rows)} rows inserted')
        _insert(conn, 'pos_line_items', LINE_ITEM_COLS, item_rows, args.sqlite)
        log(f'pos_line_items: {len(item_rows)} rows')
        _insert(conn, 'pos_payments', PAYMENT_COLS, payment_rows, args.sqlite)
        log(f'pos_payments: {len(payment_rows)} rows')

        _insert(conn, 'event_registrations', REG_COLS, event_reg_rows, args.sqlite)
        _insert(conn, 'email_events', EMAIL_EVENT_COLS, email_event_rows, args.sqlite)
        _insert(conn, 'feedback', FEEDBACK_COLS, feedback_rows, args.sqlite)
        _insert(conn, 'staff_shifts', SHIFT_COLS, staff_shift_rows, args.sqlite)
        _insert(conn, 'service_requests', REQUEST_COLS, service_req_rows, args.sqlite)

        _commit(conn, args.sqlite)

        # ══════════════════════════════════════════════════════════════════════
        # PHASE 4 — Waitlist & demand
        # ══════════════════════════════════════════════════════════════════════
        phase(4, 'Waitlist & demand')

        waitlist_rows = gen_member_waitlist(member_list, rng)
        _insert(conn, 'member_waitlist', WAITLIST_COLS, waitlist_rows, args.sqlite)
        log(f'member_waitlist: {len(waitlist_rows)} rows')

        cancel_risk_rows = gen_cancellation_risk(
            booking_rows, BOOKING_COLS, member_map, weather_map, rng
        )
        _insert(conn, 'cancellation_risk', CANCEL_RISK_COLS, cancel_risk_rows, args.sqlite)
        log(f'cancellation_risk: {len(cancel_risk_rows)} rows')

        heatmap_rows = gen_demand_heatmap(rng)
        _insert(conn, 'demand_heatmap', HEATMAP_COLS, heatmap_rows, args.sqlite)
        log(f'demand_heatmap: {len(heatmap_rows)} rows')

        _commit(conn, args.sqlite)

        # ══════════════════════════════════════════════════════════════════════
        # PHASE 5 — Canonical events
        # ══════════════════════════════════════════════════════════════════════
        phase(5, 'Canonical events')

        closeout_rows = gen_close_outs(
            booking_rows, BOOKING_COLS, check_rows, CHECK_COLS, weather_map, cfg
        )
        _insert(conn, 'close_outs', CLOSEOUT_COLS, closeout_rows, args.sqlite)
        log(f'close_outs: {len(closeout_rows)} rows')

        canonical_rows = gen_canonical_events(
            member_rows, MEMBER_COLS,
            booking_rows, BOOKING_COLS,
            player_rows, PLAYER_COLS,
            pace_rows, PACE_COLS,
            check_rows, CHECK_COLS,
            item_rows, LINE_ITEM_COLS,
            payment_rows, PAYMENT_COLS,
            event_reg_rows, REG_COLS,
            email_event_rows, EMAIL_EVENT_COLS,
            feedback_rows, FEEDBACK_COLS,
            service_req_rows, REQUEST_COLS,
            staff_shift_rows, SHIFT_COLS,
            closeout_rows, CLOSEOUT_COLS,
            waitlist_rows, WAITLIST_COLS,
        )
        _insert(conn, 'canonical_events', CANONICAL_COLS, canonical_rows, args.sqlite)
        log(f'canonical_events: {len(canonical_rows)} rows')
        _commit(conn, args.sqlite)

        # ══════════════════════════════════════════════════════════════════════
        # PHASE 6 — Metrics
        # ══════════════════════════════════════════════════════════════════════
        phase(6, 'Metrics computation')

        daily_rows, weekly_rows, session_rows = gen_all_metrics(
            member_list,
            booking_rows, BOOKING_COLS, player_rows, PLAYER_COLS,
            check_rows, CHECK_COLS, event_reg_rows, REG_COLS,
            email_event_rows, EMAIL_EVENT_COLS, feedback_rows, FEEDBACK_COLS,
        )
        _insert(conn, 'member_engagement_daily', DAILY_COLS, daily_rows, args.sqlite)
        log(f'member_engagement_daily: {len(daily_rows)} rows')
        _insert(conn, 'member_engagement_weekly', WEEKLY_COLS, weekly_rows, args.sqlite)
        log(f'member_engagement_weekly: {len(weekly_rows)} rows')
        _insert(conn, 'visit_sessions', SESSION_COLS, session_rows, args.sqlite)
        log(f'visit_sessions: {len(session_rows)} rows')
        _commit(conn, args.sqlite)

        # ══════════════════════════════════════════════════════════════════════
        # PHASE 7 — Validation
        # ══════════════════════════════════════════════════════════════════════
        phase(7, 'Validation')

        ok = run_all(conn)
        conn.close()

        elapsed = time.time() - t_start
        print(f'\n{"="*60}')
        print(f'  Seed completed in {elapsed:.1f}s')
        print(f'{"="*60}\n')
        sys.exit(0 if ok else 1)

    except Exception as e:
        print(f'\n  ERROR: {e}')
        import traceback; traceback.print_exc()
        try:
            if args.sqlite:
                conn.rollback()
            else:
                conn.rollback()
        except Exception:
            pass
        conn.close()
        sys.exit(1)


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _gen_waitlist_entries(booking_rows, booking_cols, cfg):
    """Generate aggregate waitlist_entries from unmet slot demand."""
    from collections import defaultdict
    # Count weekend morning bookings that hit capacity as proxy for unmet demand
    slot_counts = defaultdict(int)
    for row in booking_rows:
        d = dict(zip(booking_cols, row))
        if d['status'] == 'confirmed' and d['booking_date'] >= '2026-01-17':
            slot_counts[(d['booking_date'], d['course_id'], d['tee_time'])] += 1

    rows = []
    entry_num = 0
    seen = set()
    for (bdate, course_id, ttime), count in slot_counts.items():
        if (bdate, ttime) in seen:
            continue
        seen.add((bdate, ttime))
        entry_num += 1
        rows.append((
            f'wl_{entry_num:03d}', cfg['club_id'], course_id,
            bdate, ttime,
            max(1, count - 1),   # waitlist_count = overflow
            0, ttime,
        ))
        if entry_num >= 35:
            break
    return rows


def _sqlite_schema(conn, _sqlite):
    import os
    schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
    with open(schema_path) as f:
        sql = f.read()
    # Strip Postgres-specific syntax for SQLite
    sql = sql.replace('TIMESTAMPTZ', 'TEXT')
    sql = sql.replace('IF NOT EXISTS', 'IF NOT EXISTS')
    # Remove ALTER TABLE ... ADD CONSTRAINT (not supported in SQLite this way)
    lines = []
    skip = False
    for line in sql.splitlines():
        if line.strip().startswith('ALTER TABLE'):
            skip = True
        if not skip:
            lines.append(line)
        if skip and ';' in line:
            skip = False
    sql = '\n'.join(lines)
    conn.executescript(sql)
    print('  ✓ Schema created (SQLite)')


def _pg_schema(conn, _sqlite):
    import os
    from db import run_sql_file
    schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
    run_sql_file(conn, schema_path)


def _sqlite_insert(conn, table, cols, rows, _sqlite):
    if not rows:
        return
    placeholders = ','.join(['?' for _ in cols])
    col_str = ','.join(cols)
    conn.executemany(
        f'INSERT OR IGNORE INTO {table} ({col_str}) VALUES ({placeholders})', rows
    )


def _pg_insert(conn, table, cols, rows, _sqlite):
    if not rows:
        return
    from db import copy_insert, bulk_insert
    if len(rows) > 2000:
        copy_insert(conn, table, cols, rows)
    else:
        bulk_insert(conn, table, cols, rows)


def _commit(conn, sqlite_mode):
    conn.commit()


if __name__ == '__main__':
    main()
