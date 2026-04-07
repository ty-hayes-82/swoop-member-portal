"""
seed/generators/events.py
Phase 2 — Events & Programming domain
  event_definitions (12), event_registrations (~641)
"""
import random
from datetime import datetime

ATTENDANCE_RATE = 0.88  # 88% of registrants attend

# Archetype event participation weights per event type
ARCHETYPE_EVENT_RATE = {
    'golf_tournament': {
        'Die-Hard Golfer': 0.80, 'Balanced Active': 0.50, 'Weekend Warrior': 0.45,
        'Social Butterfly': 0.10, 'New Member': 0.35, 'Snowbird': 0.55,
        'Declining': 0.05, 'Ghost': 0.01,
    },
    'dining': {
        'Social Butterfly': 0.70, 'Balanced Active': 0.40, 'New Member': 0.35,
        'Die-Hard Golfer': 0.20, 'Weekend Warrior': 0.25, 'Snowbird': 0.45,
        'Declining': 0.05, 'Ghost': 0.01,
    },
    'league': {
        'Die-Hard Golfer': 0.30, 'Balanced Active': 0.20, 'Social Butterfly': 0.15,
        'Weekend Warrior': 0.10, 'New Member': 0.15, 'Snowbird': 0.20,
        'Declining': 0.02, 'Ghost': 0.01,
    },
    'social': {
        'Social Butterfly': 0.75, 'Balanced Active': 0.45, 'New Member': 0.50,
        'Weekend Warrior': 0.30, 'Die-Hard Golfer': 0.15, 'Snowbird': 0.40,
        'Declining': 0.03, 'Ghost': 0.01,
    },
}

# Resigned members don't attend events after their resignation date
RESIGN_DATES = {
    'mbr_071': '2026-01-08',
    'mbr_089': '2026-01-15',
    'mbr_038': '2026-01-22',
    'mbr_059': '2026-01-27',
    'mbr_072': '2026-01-31',
}


def gen_event_definitions(cfg: dict) -> list[tuple]:
    rows = []
    for ev in cfg['events']:
        rows.append((
            ev['id'], cfg['club_id'], ev['name'], ev['type'],
            ev['date'], ev['capacity'], float(ev['fee']),
            f"Join us for {ev['name']} at Pinetree.",
        ))
    return rows

EVENT_DEF_COLS = ['event_id', 'club_id', 'name', 'type', 'event_date',
                   'capacity', 'registration_fee', 'description']


def gen_event_registrations(
    event_defs: list[tuple],
    members: list[dict],
    rng: random.Random,
) -> list[tuple]:
    """Generate registrations for all 12 events."""
    rows = []
    reg_num = 0

    for ev in event_defs:
        (event_id, club_id, name, etype, event_date,
         capacity, fee, _) = ev

        # Build candidate member list weighted by archetype
        rates = ARCHETYPE_EVENT_RATE.get(etype, {})
        candidates = []
        weights = []
        for m in members:
            mid = m['member_id']
            arch = m['archetype']

            # Skip members who resigned before event date
            rd = RESIGN_DATES.get(mid)
            if rd and rd < event_date:
                continue

            # Declining members almost never attend
            w = rates.get(arch, 0.05)
            if w > 0:
                candidates.append(m)
                weights.append(w)

        # Register up to capacity (with some headroom for waitlist feel)
        target = min(capacity, max(5, round(capacity * rng.uniform(0.75, 1.00))))
        # Sample without replacement using weighted selection
        selected = _weighted_sample(candidates, weights, target, rng)

        for member in selected:
            reg_num += 1
            reg_id = f'reg_{reg_num:04d}'
            mid = member['member_id']

            # Simulate registration timestamp (1-14 days before event)
            event_dt = datetime.fromisoformat(event_date + 'T10:00:00')
            days_before = rng.randint(1, 14)
            from datetime import timedelta
            reg_dt = event_dt - timedelta(days=days_before)

            # Attendance
            attended = rng.random() < ATTENDANCE_RATE
            no_showed = (not attended) and rng.random() < 0.60
            cancelled = not attended and not no_showed

            if cancelled:
                status = 'cancelled'
                check_in = None
            elif no_showed:
                status = 'no_show'
                check_in = None
            else:
                status = 'attended'
                check_in = (event_dt + timedelta(minutes=rng.randint(-10, 10))).isoformat()

            guest_count = rng.choices([0, 1, 2], weights=[70, 25, 5])[0]
            fee_paid = float(fee) * (1 + guest_count) if status != 'cancelled' else 0.0

            rows.append((
                reg_id, event_id, mid, status,
                guest_count, fee_paid,
                reg_dt.isoformat(), check_in,
            ))

    return rows


def _weighted_sample(candidates, weights, k, rng):
    """Sample k items without replacement using weights."""
    if not candidates:
        return []
    k = min(k, len(candidates))
    selected = []
    pool = list(zip(candidates, weights))
    for _ in range(k):
        if not pool:
            break
        total = sum(w for _, w in pool)
        r = rng.uniform(0, total)
        cumulative = 0
        for i, (item, w) in enumerate(pool):
            cumulative += w
            if r <= cumulative:
                selected.append(item)
                pool.pop(i)
                break
    return selected


REG_COLS = ['registration_id', 'event_id', 'member_id', 'status',
             'guest_count', 'fee_paid', 'registered_at', 'checked_in_at']
