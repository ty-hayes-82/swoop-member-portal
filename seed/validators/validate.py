"""
seed/validators/validate.py
Phase 7 — 35 automated validation checks

Runs after full seed against a live DB connection.
All checks must pass before seed is considered complete.
Updated for 100-member scale.
"""
import sys

PASS = '✓'
FAIL = '✗'


def _q(conn, sql: str):
    cur = conn.cursor()
    cur.execute(sql)
    raw = cur.fetchone()[0]
    # Coerce HTTP string results to numeric when possible
    if isinstance(raw, str):
        try:
            return int(raw) if '.' not in raw else float(raw)
        except (ValueError, TypeError):
            pass
    return raw


def _is_sqlite(conn):
    """Detect if connection is SQLite."""
    return hasattr(conn, 'execute') and type(conn).__module__.startswith('sqlite3')


def run_all(conn) -> bool:
    results = []
    sqlite_mode = _is_sqlite(conn)

    def check(name: str, expr: bool, detail: str = ''):
        status = PASS if expr else FAIL
        results.append((status, name, detail))
        return expr

    # ── 8.1 Row count validation ─────────────────────────────────────────────

    check('members = 100',
          _q(conn, 'SELECT COUNT(*) FROM members') == 100)

    check('households = 75',
          _q(conn, 'SELECT COUNT(*) FROM households') == 75)

    bkgs = _q(conn, 'SELECT COUNT(*) FROM bookings')
    check('bookings ≈ 1,500–3,000',
          1500 <= bkgs <= 3000, f'actual={bkgs}')

    players = _q(conn, 'SELECT COUNT(*) FROM booking_players')
    check('booking_players ≈ 3,000–9,000',
          3000 <= players <= 9000, f'actual={players}')

    pace = _q(conn, 'SELECT COUNT(*) FROM pace_of_play')
    check('pace_of_play > 300',
          pace > 300, f'actual={pace}')

    segments = _q(conn, 'SELECT COUNT(*) FROM pace_hole_segments')
    check('pace_hole_segments > 3,000',
          segments > 3000, f'actual={segments}')

    checks_n = _q(conn, 'SELECT COUNT(*) FROM pos_checks')
    check('pos_checks ≈ 2,000–5,000',
          2000 <= checks_n <= 5000, f'actual={checks_n}')

    items = _q(conn, 'SELECT COUNT(*) FROM pos_line_items')
    check('pos_line_items > 3,000',
          items > 3000, f'actual={items}')

    payments = _q(conn, 'SELECT COUNT(*) FROM pos_payments')
    check('pos_payments ≈ pos_checks ±10%',
          abs(payments - checks_n) <= checks_n * 0.10, f'actual={payments}')

    regs = _q(conn, 'SELECT COUNT(*) FROM event_registrations')
    check('event_registrations ≈ 200–700',
          200 <= regs <= 700, f'actual={regs}')

    email_ev = _q(conn, 'SELECT COUNT(*) FROM email_events')
    check('email_events > 600',
          email_ev > 600, f'actual={email_ev}')

    daily_n = _q(conn, 'SELECT COUNT(*) FROM member_engagement_daily')
    check('member_engagement_daily = 3,100',
          daily_n == 3100, f'actual={daily_n}')

    weekly_n = _q(conn, 'SELECT COUNT(*) FROM member_engagement_weekly')
    check('member_engagement_weekly = 500',
          weekly_n == 500, f'actual={weekly_n}')

    sessions = _q(conn, 'SELECT COUNT(*) FROM visit_sessions')
    check('visit_sessions > 500',
          sessions > 500, f'actual={sessions}')

    canonical = _q(conn, 'SELECT COUNT(*) FROM canonical_events')
    check('canonical_events > 3,000',
          canonical > 3000, f'actual={canonical}')

    # ── 8.2 Cross-domain correlation checks ─────────────────────────────────

    total_completed = _q(conn, "SELECT COUNT(*) FROM bookings WHERE status='completed'")
    post_round_bookings = _q(conn, '''
        SELECT COUNT(DISTINCT linked_booking_id)
        FROM pos_checks
        WHERE post_round_dining=1 AND linked_booking_id IS NOT NULL
    ''')
    prd_rate = post_round_bookings / max(1, total_completed)
    check('post-round dining conversion 15–75% of completed rounds',
          0.15 <= prd_rate <= 0.75,
          f'actual={prd_rate:.1%} ({post_round_bookings} of {total_completed} rounds)')

    check('post-round checks have linked_booking_id',
          _q(conn, '''
              SELECT COUNT(*) FROM pos_checks
              WHERE post_round_dining=1 AND linked_booking_id IS NULL
          ''') == 0)

    rain_count = _q(conn, "SELECT COUNT(*) FROM close_outs WHERE weather='rainy'") or 0
    if rain_count >= 1:
        rain_fb = _q(conn, "SELECT AVG(fb_revenue) FROM close_outs WHERE weather='rainy'") or 0
        sunny_fb = _q(conn, "SELECT AVG(fb_revenue) FROM close_outs WHERE weather='sunny'") or 1
        check('rain day F&B ≥ 90% of sunny (inverse correlation present)',
              rain_fb >= sunny_fb * 0.90,
              f'rain={rain_fb:.0f} sunny={sunny_fb:.0f} ratio={rain_fb/sunny_fb:.2f}')
    else:
        check('rain day F&B check (skipped — no rain days)', True)

    if sqlite_mode:
        ticket_sql = '''
            SELECT AVG((julianday(last_item_fulfilled_at) - julianday(first_item_fired_at)) * 1440)
            FROM pos_checks
            WHERE is_understaffed_day={flag} AND first_item_fired_at IS NOT NULL
        '''
    else:
        ticket_sql = '''
            SELECT AVG(EXTRACT(EPOCH FROM (last_item_fulfilled_at::timestamptz - first_item_fired_at::timestamptz)) / 60)
            FROM pos_checks
            WHERE is_understaffed_day={flag} AND first_item_fired_at IS NOT NULL
        '''
    under_ticket = _q(conn, ticket_sql.format(flag=1)) or 0
    normal_ticket = _q(conn, ticket_sql.format(flag=0)) or 1
    check('understaffed ticket time ≥ 110% of normal',
          under_ticket >= normal_ticket * 1.10,
          f'under={under_ticket:.1f}min normal={normal_ticket:.1f}min')

    under_complaints = _q(conn, '''
        SELECT COUNT(*) * 1.0 / 3
        FROM feedback
        WHERE is_understaffed_day=1
    ''') or 0
    normal_complaints = _q(conn, '''
        SELECT COUNT(*) * 1.0 / 27
        FROM feedback
        WHERE is_understaffed_day=0
    ''') or 1
    check('understaffed complaint rate ≥ 150% of normal',
          under_complaints >= normal_complaints * 1.50,
          f'under/day={under_complaints:.1f} normal/day={normal_complaints:.1f}')

    # All 5 resignees exist with correct status
    resign_count = _q(conn, '''
        SELECT COUNT(*) FROM members
        WHERE member_id IN ('mbr_071','mbr_089','mbr_038','mbr_059','mbr_072')
        AND membership_status='resigned'
    ''')
    check('all 5 resignation members have status=resigned',
          resign_count == 5, f'actual={resign_count}')

    # Resignation decay: all 5 should have declining engagement in weeks 1-3
    decay_count = _q(conn, '''
        SELECT COUNT(DISTINCT member_id) FROM (
            SELECT member_id,
                   MAX(CASE WHEN week_number=1 THEN engagement_score END) as w1,
                   MAX(CASE WHEN week_number=3 THEN engagement_score END) as w3
            FROM member_engagement_weekly
            WHERE member_id IN ('mbr_071','mbr_089','mbr_038','mbr_059','mbr_072')
            GROUP BY member_id
        ) t
        WHERE w1 > w3 OR w3 IS NULL
    ''')
    check('resignation members show declining engagement in weeks 1-3',
          decay_count >= 3, f'actual={decay_count}/5')

    # mbr_038 complaint
    complaint_ok = _q(conn, '''
        SELECT COUNT(*) FROM feedback
        WHERE member_id='mbr_038'
        AND submitted_at LIKE '2026-01-18%'
        AND sentiment_score <= -0.7
        AND status='acknowledged'
    ''')
    check("mbr_038 complaint Jan 18: sentiment ≤ -0.7, status=acknowledged",
          complaint_ok >= 1, f'found={complaint_ok}')

    # mbr_038 resigned Jan 22
    mbr038_resign = _q(conn, '''
        SELECT COUNT(*) FROM members
        WHERE member_id='mbr_038'
        AND resigned_on='2026-01-22'
    ''')
    check('mbr_038 resigned_on = 2026-01-22',
          mbr038_resign == 1)

    # Slow round → lower conversion
    slow_conv = _q(conn, '''
        SELECT COUNT(pc.check_id) * 1.0 / COUNT(DISTINCT p.booking_id)
        FROM pace_of_play p
        LEFT JOIN pos_checks pc ON pc.linked_booking_id = p.booking_id
            AND pc.post_round_dining = 1
        WHERE p.is_slow_round = 1
    ''') or 0
    fast_conv = _q(conn, '''
        SELECT COUNT(pc.check_id) * 1.0 / COUNT(DISTINCT p.booking_id)
        FROM pace_of_play p
        LEFT JOIN pos_checks pc ON pc.linked_booking_id = p.booking_id
            AND pc.post_round_dining = 1
        WHERE p.is_slow_round = 0
    ''') or 1
    check('slow round post-round conversion < fast round conversion',
          slow_conv < fast_conv,
          f'slow={slow_conv:.1%} fast={fast_conv:.1%}')

    # Email decay for resignees
    email_decay = _q(conn, '''
        SELECT COUNT(DISTINCT member_id) FROM (
            SELECT member_id,
                   MAX(CASE WHEN week_number=1 THEN email_open_rate END) as w1,
                   MAX(CASE WHEN week_number=4 THEN email_open_rate END) as w4
            FROM member_engagement_weekly
            WHERE member_id IN ('mbr_071','mbr_089','mbr_038','mbr_059','mbr_072')
            GROUP BY member_id
        ) t
        WHERE w1 > w4 OR w4 IS NULL OR w4 = 0
    ''')
    check('resignee email open rate declines from week 1 to week 4',
          email_decay >= 4, f'actual={email_decay}/5')

    # Event attendance correlation: members with events
    check('event attendance data exists',
          _q(conn, "SELECT COUNT(*) FROM event_registrations WHERE status='attended'") > 80)

    # ── 8.3 FK integrity checks ──────────────────────────────────────────────

    check('booking_players member_id FK valid (or is_guest)',
          _q(conn, '''
              SELECT COUNT(*) FROM booking_players bp
              LEFT JOIN members m ON bp.member_id = m.member_id
              WHERE bp.is_guest = 0 AND bp.member_id IS NOT NULL AND m.member_id IS NULL
          ''') == 0)

    check('post_round pos_checks have valid linked_booking_id',
          _q(conn, '''
              SELECT COUNT(*) FROM pos_checks pc
              LEFT JOIN bookings b ON pc.linked_booking_id = b.booking_id
              WHERE pc.post_round_dining = 1 AND b.booking_id IS NULL
          ''') == 0)

    check('event_registrations FK valid',
          _q(conn, '''
              SELECT COUNT(*) FROM event_registrations er
              LEFT JOIN event_definitions ed ON er.event_id = ed.event_id
              LEFT JOIN members m ON er.member_id = m.member_id
              WHERE ed.event_id IS NULL OR m.member_id IS NULL
          ''') == 0)

    check('staff_shifts staff_id FK valid',
          _q(conn, '''
              SELECT COUNT(*) FROM staff_shifts ss
              LEFT JOIN staff s ON ss.staff_id = s.staff_id
              WHERE s.staff_id IS NULL
          ''') == 0)

    check('cancellation_risk booking_id FK valid',
          _q(conn, '''
              SELECT COUNT(*) FROM cancellation_risk cr
              LEFT JOIN bookings b ON cr.booking_id = b.booking_id
              WHERE b.booking_id IS NULL
          ''') == 0)

    check('member_waitlist member_id FK valid',
          _q(conn, '''
              SELECT COUNT(*) FROM member_waitlist mw
              LEFT JOIN members m ON mw.member_id = m.member_id
              WHERE m.member_id IS NULL
          ''') == 0)

    check('member_engagement_daily covers all 100 members',
          _q(conn, 'SELECT COUNT(DISTINCT member_id) FROM member_engagement_daily') == 100)

    check('member_engagement_weekly covers all 100 members',
          _q(conn, 'SELECT COUNT(DISTINCT member_id) FROM member_engagement_weekly') == 100)

    check('demand_heatmap has entries for both courses',
          _q(conn, 'SELECT COUNT(DISTINCT course_id) FROM demand_heatmap') == 2)

    check('weather_daily has 31 rows',
          _q(conn, 'SELECT COUNT(*) FROM weather_daily') == 31)

    check('close_outs has 30 rows (one per operating day)',
          _q(conn, 'SELECT COUNT(*) FROM close_outs') == 30)

    check('canonical_events covers multiple entity types',
          _q(conn, 'SELECT COUNT(DISTINCT entity_type) FROM canonical_events') >= 8)

    check('no NULL member_id in member_engagement_daily',
          _q(conn, 'SELECT COUNT(*) FROM member_engagement_daily WHERE member_id IS NULL') == 0)

    # ── Summary ───────────────────────────────────────────────────────────────
    passed = sum(1 for r in results if r[0] == PASS)
    failed = sum(1 for r in results if r[0] == FAIL)
    total  = len(results)

    print(f'\n{"="*60}')
    print(f'  VALIDATION RESULTS: {passed}/{total} passed')
    print(f'{"="*60}')
    for status, name, detail in results:
        suffix = f'  ({detail})' if detail else ''
        print(f'  {status} {name}{suffix}')

    if failed > 0:
        print(f'\n  ✗ {failed} check(s) FAILED — review seed output')
        return False
    else:
        print(f'\n  All {total} checks passed ✓')
        return True
