"""
seed/linkers/cross_domain.py
Phase 3 — Cross-domain linking

Applies:
  1. Post-round dining conversion (Golf → F&B)
     - Link pos_checks to bookings via linked_booking_id
     - Set post_round_dining = 1
  2. Resignation patterns (5 members)
     - Set membership_status = 'resigned', resigned_on
  3. Understaffed day flags on pos_checks, feedback, service_requests
  4. F&B minimum hit behavior (4 Declining members)
  5. Slow round → lower post-round conversion (Golf Pace → F&B)

Returns modified versions of the affected row lists.
"""
from datetime import datetime, timedelta, date
import random

# ─── Config ───────────────────────────────────────────────────────────────────

POST_ROUND_WINDOW_MIN = 90   # minutes after round end to be linkable
SLOW_ROUND_THRESHOLD  = 270  # minutes

# Base post-round conversion rates by archetype
ARCHETYPE_POST_ROUND_RATE = {
    'Die-Hard Golfer':  0.50,
    'Social Butterfly': 0.40,
    'Balanced Active':  0.40,
    'Weekend Warrior':  0.25,
    'Declining':        0.15,
    'New Member':       0.35,
    'Ghost':            0.10,
    'Snowbird':         0.38,
}

# Slow-round penalty: 15% lower conversion
SLOW_ROUND_CONVERSION_PENALTY = 0.15

UNDERSTAFFED_DATES = {'2026-01-09', '2026-01-16', '2026-01-28'}

# F&B minimum by membership type
FB_MINIMUMS = {
    'FG': 3000.0, 'SOC': 2000.0, 'JR': 1500.0,
    'LEG': 3000.0, 'SPT': 2500.0, 'NR': 0.0,
}

# Members who hit minimum then stop (4 Declining members with F&B minimum behavior)
FB_MINIMUM_MEMBERS = {'mbr_072', 'mbr_074', 'mbr_076', 'mbr_078'}

RESIGN_SPECS = {
    'mbr_071': {'resigned_on': '2026-01-08', 'archetype': 'Declining'},
    'mbr_089': {'resigned_on': '2026-01-15', 'archetype': 'Ghost'},
    'mbr_038': {'resigned_on': '2026-01-22', 'archetype': 'Balanced Active'},
    'mbr_059': {'resigned_on': '2026-01-27', 'archetype': 'Weekend Warrior'},
    'mbr_072': {'resigned_on': '2026-01-31', 'archetype': 'Declining'},
}


# ─── 1. Resignations ──────────────────────────────────────────────────────────

def apply_resignations(member_rows: list[tuple]) -> list[tuple]:
    """
    Mutate the 5 resignation members:
    membership_status → 'resigned', resigned_on → date.
    member_rows columns match MEMBER_COLS from dimensions.py.
    """
    # member_id is index 0, club_id is index 2, membership_status is index 9, resigned_on is index 12
    updated = []
    for row in member_rows:
        mid = row[0]
        if mid in RESIGN_SPECS:
            spec = RESIGN_SPECS[mid]
            row = list(row)
            row[9]  = 'resigned'
            row[12] = spec['resigned_on']
            row = tuple(row)
        updated.append(row)
    return updated


# ─── 2. Post-round dining linkage ────────────────────────────────────────────

def link_post_round_dining(
    booking_rows: list[tuple],
    player_rows: list[tuple],
    pace_rows: list[tuple],
    check_rows: list[tuple],
    member_map: dict,           # member_id -> {archetype, ...}
    rng: random.Random,
) -> list[tuple]:
    """
    For each completed round, attempt to link a qualifying pos_check
    as post-round dining. Returns updated check_rows.

    Booking cols (idx): 0=booking_id, 3=booking_date, 10=status,
                        12=round_start, 13=round_end, 14=duration_minutes
    Player cols (idx):  1=booking_id, 2=member_id, 4=is_guest
    Pace cols (idx):    1=booking_id, 3=is_slow_round
    Check cols (idx):   0=check_id, 1=outlet_id, 2=member_id, 3=opened_at,
                        15=post_round_dining, 16=linked_booking_id, 18=is_understaffed_day
    """
    # Build lookup structures
    pace_by_booking = {r[1]: r[3] for r in pace_rows}   # booking_id -> is_slow_round

    # booking_id -> list of member_ids in that group
    group_by_booking: dict[str, list[str]] = {}
    for pr in player_rows:
        if pr[4] == 0 and pr[2]:   # not a guest, has member_id
            group_by_booking.setdefault(pr[1], []).append(pr[2])

    # Build available checks indexed by (member_id, date)
    # check index: 0=check_id,1=outlet_id,2=member_id,3=opened_at,15=prd,16=linked_bkg
    check_index: dict[tuple, list[int]] = {}   # (member_id, date_str) -> [row_positions]
    for i, chk in enumerate(check_rows):
        mid  = chk[2]
        if mid is None:
            continue
        dt_str = chk[3][:10]
        check_index.setdefault((mid, dt_str), []).append(i)

    # Track which checks have already been linked
    linked_check_ids: set[str] = set()
    updated_checks = [list(c) for c in check_rows]

    for booking in booking_rows:
        (bkg_id, club_id, course_id, bkg_date, tee_time,
         player_count, has_guest, transport, has_caddie,
         rtype, status, check_in, round_start, round_end, duration) = booking

        if status != 'completed' or round_end is None:
            continue

        is_slow = pace_by_booking.get(bkg_id, 0)
        members_in_group = group_by_booking.get(bkg_id, [])
        round_end_dt = datetime.fromisoformat(round_end)

        for mid in members_in_group:
            arch = member_map.get(mid, {}).get('archetype', 'Balanced Active')
            base_rate = ARCHETYPE_POST_ROUND_RATE.get(arch, 0.35)
            if is_slow:
                base_rate = max(0.05, base_rate - SLOW_ROUND_CONVERSION_PENALTY)

            if rng.random() > base_rate:
                continue

            # Find a check for this member on this date, opened within 90 min of round end
            candidates = check_index.get((mid, bkg_date), [])
            linked = False
            for idx in candidates:
                chk = updated_checks[idx]
                if chk[0] in linked_check_ids:
                    continue
                opened_dt = datetime.fromisoformat(chk[3])
                delta_min = (opened_dt - round_end_dt).total_seconds() / 60
                if 0 <= delta_min <= POST_ROUND_WINDOW_MIN:
                    chk[15] = 1          # post_round_dining
                    chk[16] = bkg_id     # linked_booking_id
                    linked_check_ids.add(chk[0])
                    linked = True
                    break

    return [tuple(c) for c in updated_checks]


# ─── 3. Understaffed day flags ────────────────────────────────────────────────

def apply_understaffed_flags(
    check_rows: list[tuple],
    feedback_rows: list[tuple],
    request_rows: list[tuple],
) -> tuple[list[tuple], list[tuple], list[tuple]]:
    """
    Set is_understaffed_day = 1 for all records on Jan 9, 16, 28.
    Also apply 20% longer ticket times on those days for checks.

    Check cols: 3=opened_at, 5=first_item_fired_at, 6=last_item_fulfilled_at, 18=is_understaffed_day
    """
    updated_checks = []
    for row in check_rows:
        row = list(row)
        dt_str = row[3][:10] if row[3] else ''
        if dt_str in UNDERSTAFFED_DATES:
            row[18] = 1
            # Stretch ticket time by ~20%
            if row[5] and row[6]:
                fire_dt    = datetime.fromisoformat(row[5])
                fulfill_dt = datetime.fromisoformat(row[6])
                base_min   = (fulfill_dt - fire_dt).total_seconds() / 60
                extra_min  = base_min * 0.20
                row[6] = (fulfill_dt + timedelta(minutes=extra_min)).isoformat()
        updated_checks.append(tuple(row))

    updated_feedback = []
    for row in feedback_rows:
        row = list(row)
        dt_str = row[3][:10] if row[3] else ''
        if dt_str in UNDERSTAFFED_DATES:
            row[9] = 1
        updated_feedback.append(tuple(row))

    updated_requests = []
    for row in request_rows:
        row = list(row)
        dt_str = row[4][:10] if row[4] else ''
        if dt_str in UNDERSTAFFED_DATES:
            row[8] = 1
        updated_requests.append(tuple(row))

    return updated_checks, updated_feedback, updated_requests


# ─── 4. F&B minimum hit behavior ─────────────────────────────────────────────

def apply_fb_minimum_behavior(
    check_rows: list[tuple],
    member_map: dict,   # member_id -> {membership_type, archetype}
    rng: random.Random,
) -> list[tuple]:
    """
    For members in FB_MINIMUM_MEMBERS:
    - Keep their total dining spend within ±$20 of their annual F&B minimum
    - Remove all checks after they hit the minimum (simulate stopping)

    This is a targeted mutation: we sort their checks by date,
    track cumulative spend, and null out any check that would take them
    past minimum + $20.
    """
    # Accumulate spend per target member
    spend_by_member: dict[str, float] = {mid: 0.0 for mid in FB_MINIMUM_MEMBERS}
    stopped: set[str] = set()

    updated = []
    for row in check_rows:
        mid = row[2]
        if mid not in FB_MINIMUM_MEMBERS:
            updated.append(row)
            continue
        if mid in stopped:
            # Remove check by reassigning to None member (anonymous)
            row = list(row)
            row[2] = None
            updated.append(tuple(row))
            continue

        minimum = FB_MINIMUMS.get(member_map.get(mid, {}).get('membership_type', 'FG'), 3000.0)
        current = spend_by_member[mid]
        check_total = row[13]   # total column

        if current + check_total > minimum + 20:
            # Would exceed minimum — null out this check (member has stopped)
            stopped.add(mid)
            row = list(row)
            row[2] = None
            updated.append(tuple(row))
        else:
            spend_by_member[mid] = current + check_total
            updated.append(row)

    return updated
