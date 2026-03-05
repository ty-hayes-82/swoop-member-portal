"""
seed/generators/metrics.py
Phase 6 — Computed metrics

  member_engagement_daily  (9,300 rows: 300 × 31)
  member_engagement_weekly (1,500 rows: 300 × 5)
  visit_sessions           (~5,376 rows)
  close_outs               (30 rows: one per operating day)

All computed from transactional data already generated.
"""
import random as _rng_module
from datetime import date, datetime, timedelta
from collections import defaultdict
import json

# Week boundaries in January 2026
WEEKS = [
    (1, '2026-01-01', '2026-01-07'),
    (2, '2026-01-08', '2026-01-14'),
    (3, '2026-01-15', '2026-01-21'),
    (4, '2026-01-22', '2026-01-28'),
    (5, '2026-01-29', '2026-01-31'),
]

OPERATING_DATES = [
    date(2026, 1, d).isoformat()
    for d in range(1, 32)
    if date(2026, 1, d).isoformat() != '2026-01-06'
]

ALL_DATES = [date(2026, 1, d).isoformat() for d in range(1, 32)]

HEALTH_WEIGHTS = {
    'golf':   0.25,
    'dining': 0.20,
    'events': 0.15,
    'email':  0.15,
    'trend':  0.25,
}
FEEDBACK_PENALTY_NEGATIVE = -15
FEEDBACK_PENALTY_UNRESOLVED = -10


def _compute_daily(
    members: list[dict],
    booking_rows, booking_cols,
    player_rows, player_cols,
    check_rows, check_cols,
    event_reg_rows, event_reg_cols,
    email_event_rows, email_event_cols,
    feedback_rows, feedback_cols,
) -> list[tuple]:
    """9,300 rows: one per member per calendar day."""

    # Index: member_id -> date -> counts
    rounds_by_md  = defaultdict(lambda: defaultdict(int))
    checks_by_md  = defaultdict(lambda: defaultdict(int))
    spend_by_md   = defaultdict(lambda: defaultdict(float))
    events_by_md  = defaultdict(lambda: defaultdict(int))
    opens_by_md   = defaultdict(lambda: defaultdict(int))
    feedback_by_md = defaultdict(lambda: defaultdict(int))

    # Rounds: booking_players → bookings
    bkg_lookup = {r[0]: r for r in booking_rows}  # booking_id -> row
    for pr in player_rows:
        pd = dict(zip(player_cols, pr))
        if pd['is_guest'] or not pd['member_id']:
            continue
        bkg = bkg_lookup.get(pd['booking_id'])
        if bkg and dict(zip(booking_cols, bkg))['status'] == 'completed':
            bkg_date = dict(zip(booking_cols, bkg))['booking_date']
            rounds_by_md[pd['member_id']][bkg_date] += 1

    # Dining checks
    for chk in check_rows:
        cd = dict(zip(check_cols, chk))
        if not cd['member_id']:
            continue
        dt = cd['opened_at'][:10]
        checks_by_md[cd['member_id']][dt] += 1
        spend_by_md[cd['member_id']][dt] += float(cd['total'] or 0)

    # Event attendance
    for reg in event_reg_rows:
        rd = dict(zip(event_reg_cols, reg))
        if rd['status'] == 'attended':
            # event date from event_id is not in reg; use registered_at date as proxy
            dt = rd['registered_at'][:10]
            events_by_md[rd['member_id']][dt] += 1

    # Email opens
    for ev in email_event_rows:
        ed = dict(zip(email_event_cols, ev))
        if ed['event_type'] == 'open':
            dt = ed['occurred_at'][:10]
            opens_by_md[ed['member_id']][dt] += 1

    # Feedback
    for fb in feedback_rows:
        fd = dict(zip(feedback_cols, fb))
        if fd['member_id']:
            dt = fd['submitted_at'][:10]
            feedback_by_md[fd['member_id']][dt] += 1

    rows = []
    row_num = 0
    for m in members:
        mid = m['member_id']
        for dt_str in ALL_DATES:
            row_num += 1
            rounds   = rounds_by_md[mid][dt_str]
            checks   = checks_by_md[mid][dt_str]
            spend    = round(spend_by_md[mid][dt_str], 2)
            events   = events_by_md[mid][dt_str]
            opens    = opens_by_md[mid][dt_str]
            feedback = feedback_by_md[mid][dt_str]
            visit    = 1 if (rounds or checks or events or opens) else 0
            rows.append((
                f'med_{row_num:06d}', mid, dt_str,
                rounds, checks, spend, events, opens, feedback, visit,
            ))
    return rows

DAILY_COLS = ['row_id', 'member_id', 'date', 'rounds_played', 'dining_checks',
               'dining_spend', 'events_attended', 'emails_opened', 'feedback_submitted', 'visit_flag']


RESIGN_DECAY_MEMBERS = {
    'mbr_042': 0.55,   # Kevin Hurst — Declining, near-zero by Jan
    'mbr_117': 0.10,   # Linda Leonard — Ghost, minimal activity
    'mbr_089': 0.65,   # Anne Jordan — Weekend Warrior, progressive withdrawal
    'mbr_271': 0.60,   # Steven Park — Declining, F&B only obligation
    # mbr_203 (James Whitfield) is Balanced Active until complaint Jan 18 — natural decay from Week 3
}


def _compute_weekly(daily_rows: list[tuple], members: list[dict]) -> list[tuple]:
    """1,500 rows: 300 members × 5 weeks. Includes engagement_score."""
    # daily: 0=row_id,1=member_id,2=date,3=rounds,4=checks,5=spend,6=events,7=opens,8=fb,9=visit

    daily_by_member = defaultdict(list)
    for row in daily_rows:
        daily_by_member[row[1]].append(row)

    rows = []
    row_num = 0

    for m in members:
        mid = m['member_id']
        arch = m['archetype']
        member_daily = daily_by_member[mid]
        daily_by_date = {r[2]: r for r in member_daily}

        # Track prior 2-week score for trend calculation (weeks 1-2 = prior, 3-4 = recent)
        week_scores = []

        for wk_num, wk_start, wk_end in WEEKS:
            row_num += 1
            start_dt = date.fromisoformat(wk_start)
            end_dt   = date.fromisoformat(wk_end)
            days_in_week = []
            d = start_dt
            while d <= end_dt:
                days_in_week.append(d.isoformat())
                d += timedelta(days=1)

            rounds = sum(daily_by_date.get(dt, (0,)*10)[3] for dt in days_in_week)
            visits = sum(daily_by_date.get(dt, (0,)*10)[4] for dt in days_in_week)
            spend  = round(sum(daily_by_date.get(dt, (0,)*10)[5] for dt in days_in_week), 2)
            events = sum(daily_by_date.get(dt, (0,)*10)[6] for dt in days_in_week)
            opens  = sum(daily_by_date.get(dt, (0,)*10)[7] for dt in days_in_week)
            sends  = max(1, len([c for c in days_in_week if 1]))  # campaigns / week ≈ 2
            email_open_rate = round(min(1.0, opens / 2), 3)  # denominator ≈ 2 campaigns/week

            # Engagement score (0-100) — simplified version of health score
            golf_score   = min(100, rounds * 12)
            dining_score = min(100, visits * 8)
            event_score  = min(100, events * 30)
            email_score  = email_open_rate * 100
            raw_score = (
                golf_score   * HEALTH_WEIGHTS['golf']  +
                dining_score * HEALTH_WEIGHTS['dining'] +
                event_score  * HEALTH_WEIGHTS['events'] +
                email_score  * HEALTH_WEIGHTS['email']
            )

            # Trend component (prior vs recent)
            week_scores.append(raw_score)
            if len(week_scores) >= 2:
                trend_ratio = week_scores[-1] / max(1, week_scores[-2])
                trend_score = min(100, trend_ratio * 50)
            else:
                trend_score = 50

            engagement = round(
                raw_score * (1 - HEALTH_WEIGHTS['trend']) +
                trend_score * HEALTH_WEIGHTS['trend'],
                1
            )

            # Apply explicit decay for resignation members so the pattern is visible
            if mid in RESIGN_DECAY_MEMBERS:
                peak = RESIGN_DECAY_MEMBERS[mid]
                decay_factor = max(0.05, peak - (wk_num - 1) * (peak / 5))
                engagement = round(engagement * decay_factor, 1)
                engagement = max(0, engagement)
            elif mid == 'mbr_203' and wk_num >= 3:
                engagement = round(engagement * max(0.1, 1.0 - (wk_num - 2) * 0.30), 1)

            rows.append((
                f'mew_{row_num:06d}', mid, wk_num, wk_start, wk_end,
                rounds, visits, spend, events, email_open_rate, engagement,
            ))

    return rows

WEEKLY_COLS = ['row_id', 'member_id', 'week_number', 'week_start', 'week_end',
                'rounds_played', 'dining_visits', 'dining_spend', 'events_attended',
                'email_open_rate', 'engagement_score']


def _compute_sessions(
    members: list[dict],
    booking_rows, booking_cols,
    player_rows, player_cols,
    check_rows, check_cols,
    event_reg_rows, event_reg_cols,
) -> list[tuple]:
    """
    Sessionize each member's daily activity into arrival-to-departure visits.
    One session per member per day they have any activity.
    """
    # Build per-member per-date activity buckets
    bkg_by_mid_date   = defaultdict(list)   # (mid, date) -> [booking rows]
    check_by_mid_date = defaultdict(list)   # (mid, date) -> [check rows]
    event_by_mid_date = defaultdict(list)   # (mid, date) -> [reg rows]

    bkg_lookup = {r[0]: r for r in booking_rows}
    for pr in player_rows:
        pd = dict(zip(player_cols, pr))
        if pd['is_guest'] or not pd['member_id']:
            continue
        bkg = bkg_lookup.get(pd['booking_id'])
        if bkg and dict(zip(booking_cols, bkg))['status'] == 'completed':
            bd = dict(zip(booking_cols, bkg))
            bkg_by_mid_date[(pd['member_id'], bd['booking_date'])].append(bd)

    for chk in check_rows:
        cd = dict(zip(check_cols, chk))
        if not cd['member_id']:
            continue
        dt = cd['opened_at'][:10]
        check_by_mid_date[(cd['member_id'], dt)].append(cd)

    for reg in event_reg_rows:
        rd = dict(zip(event_reg_cols, reg))
        if rd['status'] == 'attended' and rd['member_id']:
            dt = rd['registered_at'][:10]
            event_by_mid_date[(rd['member_id'], dt)].append(rd)

    rows = []
    sess_num = 0

    all_active_dates = set()
    all_active_dates.update(k[1] for k in bkg_by_mid_date)
    all_active_dates.update(k[1] for k in check_by_mid_date)
    all_active_dates.update(k[1] for k in event_by_mid_date)

    for m in members:
        mid = m['member_id']
        active_dates = sorted({
            dt for (mid2, dt) in list(bkg_by_mid_date.keys()) +
                                    list(check_by_mid_date.keys()) +
                                    list(event_by_mid_date.keys())
            if mid2 == mid
        })

        for dt_str in active_dates:
            bookings_today = bkg_by_mid_date.get((mid, dt_str), [])
            checks_today   = check_by_mid_date.get((mid, dt_str), [])
            events_today   = event_by_mid_date.get((mid, dt_str), [])

            has_golf   = bool(bookings_today)
            has_dining = bool(checks_today)
            has_event  = bool(events_today)

            if not (has_golf or has_dining or has_event):
                continue

            # Anchor type
            if has_golf:
                anchor = 'golf'
            elif has_event:
                anchor = 'event'
            else:
                anchor = 'dining'

            # Arrival / departure
            timestamps = []
            for bkg in bookings_today:
                if bkg.get('round_start'):
                    timestamps.append(bkg['round_start'])
                if bkg.get('round_end'):
                    timestamps.append(bkg['round_end'])
            for chk in checks_today:
                if chk.get('opened_at'):
                    timestamps.append(chk['opened_at'])
                if chk.get('closed_at'):
                    timestamps.append(chk['closed_at'])

            if timestamps:
                arrival_dt   = min(timestamps)
                departure_dt = max(timestamps)
                # Add post-round buffer
                dep_obj = datetime.fromisoformat(departure_dt) + timedelta(minutes=15)
                departure_dt = dep_obj.isoformat()
                arr_obj = datetime.fromisoformat(arrival_dt)
                duration = int((dep_obj - arr_obj).total_seconds() / 60)
            else:
                arrival_dt = dt_str + 'T10:00:00'
                departure_dt = dt_str + 'T12:00:00'
                duration = 120

            touchpoints = sum([has_golf, has_dining, has_event])
            total_spend = round(sum(float(c.get('total', 0)) for c in checks_today), 2)

            activities = []
            if has_golf:
                activities.append('golf')
            for chk in checks_today:
                outlet_name_map = {
                    'out_001': 'main_dining', 'out_002': 'grill_room',
                    'out_003': 'bar_lounge', 'out_004': 'halfway_house', 'out_005': 'pool_bar',
                }
                outlet = outlet_name_map.get(chk.get('outlet_id', ''), 'dining')
                if outlet not in activities:
                    activities.append(outlet)
            if has_event:
                activities.append('event')

            sess_num += 1
            rows.append((
                f'vs_{sess_num:05d}', mid, dt_str, anchor,
                arrival_dt, departure_dt, duration,
                touchpoints, total_spend, json.dumps(activities),
            ))

    return rows

SESSION_COLS = ['session_id', 'member_id', 'session_date', 'anchor_type',
                 'arrival_time', 'departure_time', 'duration_minutes',
                 'touchpoints', 'total_spend', 'activities']


def gen_close_outs(
    booking_rows, booking_cols,
    check_rows, check_cols,
    weather_map: dict,
    cfg: dict,
) -> list[tuple]:
    """30 close-out rows: one per operating day."""
    UNDERSTAFFED = {'2026-01-09', '2026-01-16', '2026-01-28'}

    golf_rev_by_date = defaultdict(float)
    rounds_by_date   = defaultdict(int)
    for bkg in booking_rows:
        bd = dict(zip(booking_cols, bkg))
        if bd['status'] == 'completed':
            rounds_by_date[bd['booking_date']] += 1
            # Rough golf revenue: $80 per 18H round, $40 per 9H + $25 cart
            golf_rev_by_date[bd['booking_date']] += (
                80 if bd['round_type'] == '18' else 40
            ) + (25 if bd['transportation'] == 'cart' else 0)

    fb_rev_by_date  = defaultdict(float)
    covers_by_date  = defaultdict(int)
    for chk in check_rows:
        cd = dict(zip(check_cols, chk))
        dt = cd['opened_at'][:10] if cd.get('opened_at') else None
        if dt:
            fb_rev_by_date[dt] += float(cd.get('total', 0))
            covers_by_date[dt] += 1

    rows = []
    for i, dt_str in enumerate(OPERATING_DATES, 1):
        golf_rev = round(golf_rev_by_date[dt_str], 2)
        fb_rev   = round(fb_rev_by_date[dt_str], 2)
        total    = round(golf_rev + fb_rev, 2)
        rounds   = rounds_by_date[dt_str]
        covers   = covers_by_date[dt_str]
        wx       = weather_map.get(dt_str, {})
        weather  = wx.get('condition', 'sunny')
        is_under = 1 if dt_str in UNDERSTAFFED else 0
        rows.append((
            f'co_{i:03d}', cfg['club_id'], dt_str,
            golf_rev, fb_rev, total, rounds, covers, weather, is_under,
        ))
    return rows

CLOSEOUT_COLS = ['closeout_id', 'club_id', 'date', 'golf_revenue', 'fb_revenue',
                  'total_revenue', 'rounds_played', 'covers', 'weather', 'is_understaffed']


def gen_all_metrics(
    members, booking_rows, booking_cols, player_rows, player_cols,
    check_rows, check_cols, event_reg_rows, event_reg_cols,
    email_event_rows, email_event_cols, feedback_rows, feedback_cols,
):
    daily  = _compute_daily(
        members, booking_rows, booking_cols, player_rows, player_cols,
        check_rows, check_cols, event_reg_rows, event_reg_cols,
        email_event_rows, email_event_cols, feedback_rows, feedback_cols,
    )
    weekly = _compute_weekly(daily, members)
    sessions = _compute_sessions(
        members, booking_rows, booking_cols, player_rows, player_cols,
        check_rows, check_cols, event_reg_rows, event_reg_cols,
    )
    return daily, weekly, sessions


OPERATING_DATES = [
    date(2026, 1, d).isoformat()
    for d in range(1, 32)
    if date(2026, 1, d).isoformat() != '2026-01-06'
]
