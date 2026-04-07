"""
seed/generators/waitlist.py
Phase 4 — Waitlist & Demand domain (Sprint Addition)
  member_waitlist (~10 entries), cancellation_risk (~35), demand_heatmap (~56)

The 5 at-risk resignation members are prioritized in the queue.
Cancellation risk scored for all upcoming confirmed bookings.
"""
import random
import json
from datetime import date, datetime, timedelta

PRIORITY_THRESHOLD = 50   # health score below this = HIGH priority
WIND_THRESHOLD_MPH = 15   # wind above this triggers weather cancel signal

# At-risk resignation members anchor the waitlist
AT_RISK_MEMBERS = [
    {
        'member_id': 'mbr_059', 'name': 'Anne Jordan',
        'archetype': 'Weekend Warrior', 'health_score': 38,
        'risk_level': 'At Risk', 'last_round': '2025-12-28',
        'dining_history': 'Low converter',
    },
    {
        'member_id': 'mbr_071', 'name': 'Kevin Hurst',
        'archetype': 'Declining', 'health_score': 22,
        'risk_level': 'Critical', 'last_round': '2025-11-10',
        'dining_history': 'Stopped dining',
    },
    {
        'member_id': 'mbr_072', 'name': 'Steven Park',
        'archetype': 'Declining', 'health_score': 31,
        'risk_level': 'At Risk', 'last_round': '2025-10-30',
        'dining_history': 'Hits F&B minimum only',
    },
    {
        'member_id': 'mbr_038', 'name': 'James Whitfield',
        'archetype': 'Balanced Active', 'health_score': 44,
        'risk_level': 'Watch', 'last_round': '2026-01-14',
        'dining_history': 'Regular diner, complaint pending',
    },
    {
        'member_id': 'mbr_089', 'name': 'Linda Leonard',
        'archetype': 'Ghost', 'health_score': 8,
        'risk_level': 'Critical', 'last_round': '2025-09-15',
        'dining_history': 'Rare',
    },
]

# Additional healthy members for contrast (indices into member pool)
HEALTHY_CONTRAST_ARCHETYPES = [
    ('Die-Hard Golfer', 82, 'Healthy'),
    ('Balanced Active', 74, 'Healthy'),
    ('Social Butterfly', 78, 'Healthy'),
    ('New Member', 65, 'Watch'),
    ('Snowbird', 71, 'Healthy'),
]

REQUESTED_SLOTS = ['07:00', '07:08', '07:16', '07:24', '08:00', '08:32', '09:00']
ALT_SLOTS = [
    ['07:08', '07:16', '08:00'],
    ['07:00', '07:24', '08:08'],
    ['07:16', '08:00', '08:32'],
    ['07:00', '07:08', '09:00'],
]

CANCELLATION_DRIVERS = {
    'weather':        'Wind advisory > 15mph forecast',
    'low_engagement': 'Member engagement score declining 3+ weeks',
    'historical':     'Cancelled 2 of last 5 bookings',
    'no_dining':      'No dining visit in 30 days (lower commitment)',
    'complaint_open': 'Open unresolved complaint on file',
}

RECOMMENDED_ACTIONS = {
    'high':   'Personal outreach from Head Pro + lunch reservation offer',
    'medium': 'Automated confirmation nudge with weather update',
    'low':    'Standard confirmation reminder',
}

DAY_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
TIME_BLOCKS = ['7-8 AM', '8-9 AM', '9-10 AM', '10-11 AM',
               '11-12 PM', '12-1 PM', '1-2 PM', '2-3 PM']

# Fill rate patterns by day and time
FILL_RATE_TEMPLATE = {
    'Mon': [0.42, 0.38, 0.35, 0.30, 0.28, 0.25, 0.22, 0.20],
    'Tue': [0.45, 0.40, 0.38, 0.32, 0.30, 0.28, 0.24, 0.20],
    'Wed': [0.50, 0.46, 0.42, 0.38, 0.34, 0.30, 0.26, 0.22],
    'Thu': [0.55, 0.50, 0.46, 0.40, 0.36, 0.32, 0.28, 0.24],
    'Fri': [0.62, 0.58, 0.52, 0.46, 0.40, 0.35, 0.30, 0.26],
    'Sat': [0.96, 0.97, 0.95, 0.88, 0.80, 0.72, 0.62, 0.50],
    'Sun': [0.94, 0.95, 0.93, 0.86, 0.78, 0.68, 0.58, 0.45],
}


def gen_member_waitlist(
    members: list[dict],
    rng: random.Random,
) -> list[tuple]:
    """
    10 waitlist entries: 5 at-risk + 5 healthy contrast members.
    All requesting Saturday January 18, 2026.
    """
    rows = []
    wl_num = 0

    # At-risk members first (retention_priority = HIGH)
    for spec in AT_RISK_MEMBERS:
        wl_num += 1
        days_waiting = rng.randint(3, 7)
        alts = rng.choice(ALT_SLOTS)
        slot = rng.choice(REQUESTED_SLOTS)
        rows.append((
            f'mwl_{wl_num:03d}',
            spec['member_id'],
            'crs_001',
            '2026-01-18',
            slot,
            json.dumps(alts),
            days_waiting,
            'HIGH',
            None,   # notified_at
            None,   # filled_at
            0,      # dining_incentive_attached
        ))

    # Healthy contrast members
    healthy_members = [
        m for m in members
        if m['archetype'] in ('Die-Hard Golfer', 'Balanced Active', 'Social Butterfly',
                               'New Member', 'Snowbird')
        and m['member_id'] not in {s['member_id'] for s in AT_RISK_MEMBERS}
    ]
    sampled = rng.sample(healthy_members, min(5, len(healthy_members)))
    for m in sampled:
        wl_num += 1
        days_waiting = rng.randint(1, 5)
        alts = rng.choice(ALT_SLOTS)
        slot = rng.choice(REQUESTED_SLOTS)
        rows.append((
            f'mwl_{wl_num:03d}',
            m['member_id'],
            'crs_001',
            '2026-01-18',
            slot,
            json.dumps(alts),
            days_waiting,
            'NORMAL',
            None, None, 0,
        ))

    return rows

WAITLIST_COLS = [
    'waitlist_id', 'member_id', 'course_id', 'requested_date', 'requested_slot',
    'alternatives_accepted', 'days_waiting', 'retention_priority',
    'notified_at', 'filled_at', 'dining_incentive_attached',
]


def gen_cancellation_risk(
    booking_rows: list[tuple],
    booking_cols: list[str],
    member_map: dict,
    weather_map: dict,
    rng: random.Random,
) -> list[tuple]:
    """
    Score upcoming confirmed bookings (Jan 17+) for cancellation risk.
    High-risk members: at-risk resignees + bookings on windy days.
    """
    rows = []
    risk_num = 0
    sim_date = date(2026, 1, 17)

    HIGH_RISK_MEMBERS = {'mbr_059', 'mbr_071', 'mbr_072', 'mbr_038', 'mbr_089'}

    for row in booking_rows:
        d = dict(zip(booking_cols, row))
        if d['status'] != 'confirmed':
            continue
        bkg_date = date.fromisoformat(d['booking_date'])
        if bkg_date < sim_date:
            continue

        # Only score bookings that have member players (skip pure-guest groups)
        # We'll score the first member in the group — in practice, cross-reference player_rows
        # but here we use a heuristic based on booking metadata

        # Assign a plausible member_id: use a hash of booking_id to pick deterministically
        mid_seed = int(d['booking_id'].replace('bkg_', '')) % 100
        mid = f'mbr_{(mid_seed + 1):03d}'
        member = member_map.get(mid, {})
        arch = member.get('archetype', 'Balanced Active')

        # Base cancel probability
        if mid in HIGH_RISK_MEMBERS:
            base_prob = rng.uniform(0.55, 0.80)
        elif arch == 'Declining':
            base_prob = rng.uniform(0.30, 0.50)
        elif arch == 'Ghost':
            base_prob = rng.uniform(0.25, 0.45)
        else:
            base_prob = rng.uniform(0.05, 0.20)

        # Weather signal
        wx = weather_map.get(d['booking_date'], {})
        wind_mph = wx.get('wind_mph', 0)
        drivers = []
        if wind_mph > WIND_THRESHOLD_MPH:
            base_prob = min(0.95, base_prob + 0.20)
            drivers.append(CANCELLATION_DRIVERS['weather'])
        if mid in HIGH_RISK_MEMBERS:
            drivers.append(CANCELLATION_DRIVERS['low_engagement'])
        if arch in ('Declining', 'Ghost'):
            drivers.append(CANCELLATION_DRIVERS['historical'])
        if mid == 'mbr_038':
            drivers.append(CANCELLATION_DRIVERS['complaint_open'])
        if not drivers:
            drivers.append(CANCELLATION_DRIVERS['historical'])

        cancel_prob = round(min(0.95, base_prob), 2)

        if cancel_prob >= 0.60:
            action_key = 'high'
        elif cancel_prob >= 0.35:
            action_key = 'medium'
        else:
            action_key = 'low'

        est_revenue_lost = round(rng.uniform(120, 420), 2)

        risk_num += 1
        rows.append((
            f'cr_{risk_num:03d}',
            d['booking_id'],
            mid,
            '2026-01-17T02:00:00',   # scored nightly
            cancel_prob,
            json.dumps(drivers),
            RECOMMENDED_ACTIONS[action_key],
            est_revenue_lost,
            None,   # action_taken
            None,   # outcome
        ))

    return rows

CANCEL_RISK_COLS = [
    'risk_id', 'booking_id', 'member_id', 'scored_at',
    'cancel_probability', 'drivers', 'recommended_action',
    'estimated_revenue_lost', 'action_taken', 'outcome',
]


def gen_demand_heatmap(rng: random.Random) -> list[tuple]:
    """
    56 rows: 2 courses × 7 days × 4 representative time blocks.
    Saturday 7-9 AM is chronically oversubscribed.
    Tue-Thu are underutilized.
    """
    rows = []
    hm_num = 0
    underutil_days = {'Mon', 'Tue', 'Wed', 'Thu'}
    oversubscribed = {('Sat', '7-8 AM'), ('Sat', '8-9 AM'),
                      ('Sun', '7-8 AM'), ('Sun', '8-9 AM')}

    for course_id in ('crs_001', 'crs_002'):
        for dow in DAY_OF_WEEK:
            for block in TIME_BLOCKS:
                hm_num += 1
                key = (dow, block)
                day_idx = DAY_OF_WEEK.index(dow)
                block_idx = TIME_BLOCKS.index(block)

                base_fill = FILL_RATE_TEMPLATE[dow][block_idx]
                noise = rng.uniform(-0.04, 0.04)
                fill = round(max(0.05, min(1.0, base_fill + noise)), 3)

                if key in oversubscribed:
                    fill = round(min(1.0, fill + rng.uniform(0.02, 0.08)), 3)
                    unmet = rng.randint(8, 18)
                    level = 'oversubscribed'
                elif dow in underutil_days and block_idx >= 4:
                    fill = round(max(0.05, fill - 0.10), 3)
                    unmet = 0
                    level = 'underutilized'
                elif fill >= 0.90:
                    unmet = rng.randint(3, 10)
                    level = 'oversubscribed'
                elif fill < 0.45:
                    unmet = 0
                    level = 'underutilized'
                else:
                    unmet = 0
                    level = 'normal'

                rows.append((
                    f'dh_{hm_num:03d}', course_id, dow, block,
                    fill, unmet, level, '2026-01',
                ))

    return rows

HEATMAP_COLS = ['heatmap_id', 'course_id', 'day_of_week', 'time_block',
                 'fill_rate', 'unmet_rounds', 'demand_level', 'computed_for_month']
