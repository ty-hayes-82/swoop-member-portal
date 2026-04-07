"""
seed/generators/golf.py
Phase 2 — Golf Operations domain
  bookings (~2,524), booking_players (~8,196),
  pace_of_play (~2,356), pace_hole_segments (~30,204)
"""
import random
from datetime import date, datetime, timedelta

# Operating days: all of January except Jan 6 (closed maintenance)
CLOSED_DATES = {'2026-01-06'}
OPERATING_DATES = [
    date(2026, 1, d).isoformat()
    for d in range(1, 32)
    if date(2026, 1, d).isoformat() not in CLOSED_DATES
]  # 30 days

# Championship: 8-min intervals, 7:00-16:00 → 68 slots/day
# Executive:   10-min intervals, 7:00-16:00 → 55 slots/day
COURSE_SLOTS = {'crs_001': 68, 'crs_002': 55}
COURSE_ROUND_TYPE = {'crs_001': '18', 'crs_002': '9'}
COURSE_PAR_MINUTES_PER_HOLE = {'crs_001': 14, 'crs_002': 13}  # expected min/hole

HOLIDAY_BOOST = {'2026-01-19': 0.15}   # MLK Day

# Archetype weekday/weekend booking probability weights
ARCHETYPE_GOLF_RATE = {
    'Die-Hard Golfer':  {'wd': 0.55, 'we': 0.70},
    'Social Butterfly': {'wd': 0.08, 'we': 0.12},
    'Balanced Active':  {'wd': 0.30, 'we': 0.45},
    'Weekend Warrior':  {'wd': 0.02, 'we': 0.55},
    'Declining':        {'wd': 0.04, 'we': 0.08},
    'New Member':       {'wd': 0.18, 'we': 0.28},
    'Ghost':            {'wd': 0.01, 'we': 0.02},
    'Snowbird':         {'wd': 0.28, 'we': 0.40},
}

RESIGNATION_GOLF_CUTOFFS = {
    'mbr_071': date(2025, 11, 15),   # Kevin Hurst – stopped Nov
    'mbr_089': date(2025, 10, 20),   # Linda Leonard – last visit Oct
    'mbr_059': None,                 # Anne Jordan – gradual (handled inline)
    'mbr_038': None,                 # James Whitfield – active until resignation
    'mbr_072': date(2025, 11, 1),    # Steven Park – no golf since Nov
}


def _tee_times(interval_min: int) -> list[str]:
    """Generate HH:MM tee time list from 7:00 to 16:00."""
    times = []
    t = datetime(2026, 1, 1, 7, 0)
    end = datetime(2026, 1, 1, 16, 0)
    while t <= end:
        times.append(t.strftime('%H:%M'))
        t += timedelta(minutes=interval_min)
    return times


TIMETABLE = {
    'crs_001': _tee_times(8),
    'crs_002': _tee_times(10),
}


def _is_weekend(d: str) -> bool:
    return date.fromisoformat(d).weekday() >= 5


def gen_bookings_and_players(
    members: list[dict],
    weather_map: dict,
    cfg: dict,
    rng: random.Random,
) -> tuple[list[tuple], list[tuple]]:
    """
    Returns (booking_rows, player_rows).
    members: list of dicts with keys member_id, archetype, membership_type
    weather_map: date -> {condition, golf_demand_modifier}
    """
    booking_rows = []
    player_rows = []
    bkg_num = 0
    plr_num = 0

    golf_eligible = [m for m in members if m['golf_eligible']]
    m_by_household = {}
    for m in members:
        hh = m['household_id']
        m_by_household.setdefault(hh, []).append(m['member_id'])

    for dt_str in OPERATING_DATES:
        is_we = _is_weekend(dt_str)
        wk = 'we' if is_we else 'wd'
        wx = weather_map.get(dt_str, {})
        wx_mod = wx.get('golf_demand_modifier', 0.0)
        holiday_mod = HOLIDAY_BOOST.get(dt_str, 0.0)

        # Base utilization per course
        for course_id, total_slots in COURSE_SLOTS.items():
            interval = 8 if course_id == 'crs_001' else 10
            times = TIMETABLE[course_id]
            base_util = (
                rng.uniform(cfg['weekday_utilization_min'], cfg['weekday_utilization_max'])
                if not is_we else
                rng.uniform(cfg['weekend_utilization_min'], cfg['weekend_utilization_max'])
            )
            util = min(0.98, max(0.10, base_util + wx_mod + holiday_mod))
            n_bookings = max(1, round(len(times) * util))
            selected_times = rng.sample(times, min(n_bookings, len(times)))

            for tee_time in selected_times:
                bkg_num += 1
                bkg_id = f'bkg_{bkg_num:04d}'

                # Pick a lead member (golf-eligible, weighted by archetype daily prob)
                lead = _pick_golfer(golf_eligible, dt_str, wk, rng,
                                    RESIGNATION_GOLF_CUTOFFS)
                if lead is None:
                    continue

                # Build group: 1–4 players; 30% household co-play
                group = [lead]
                target_size = rng.choices([1, 2, 3, 4], weights=[15, 30, 35, 20])[0]
                hh_mates = [
                    mid for mid in m_by_household.get(lead['household_id'], [])
                    if mid != lead['member_id']
                ]
                if hh_mates and rng.random() < 0.30 and target_size > 1:
                    hh_mate = next(
                        (m for m in golf_eligible if m['member_id'] == rng.choice(hh_mates)),
                        None
                    )
                    if hh_mate:
                        group.append(hh_mate)

                # Fill remaining slots from general pool
                while len(group) < target_size:
                    extra = _pick_golfer(golf_eligible, dt_str, wk, rng,
                                         RESIGNATION_GOLF_CUTOFFS)
                    if extra and extra['member_id'] not in [g['member_id'] for g in group]:
                        group.append(extra)
                    else:
                        break

                has_guest = 0
                guest_slot = None
                if rng.random() < 0.12 and len(group) < 4:
                    has_guest = 1
                    guest_slot = len(group)   # index where guest goes

                # Booking status
                dt_obj = date.fromisoformat(dt_str)
                sim_date = date(2026, 1, 17)
                if dt_obj > sim_date:
                    status = rng.choices(
                        ['confirmed', 'cancelled'],
                        weights=[88, 12]
                    )[0]
                    round_start = None
                    round_end = None
                    duration = None
                    check_in = None
                elif dt_obj == sim_date:
                    h, m_part = map(int, tee_time.split(':'))
                    tee_dt = datetime(2026, 1, 17, h, m_part)
                    if tee_dt.hour < 14:
                        status = 'completed'
                    else:
                        status = 'confirmed'
                    round_start = None
                    round_end = None
                    duration = None
                    check_in = None
                else:
                    status = rng.choices(
                        ['completed', 'no_show', 'cancelled'],
                        weights=[92, 4, 4]
                    )[0]
                    if status == 'completed':
                        h, m_part = map(int, tee_time.split(':'))
                        start_dt = datetime(2026, 1, int(dt_str[-2:]), h, m_part)
                        rtype = COURSE_ROUND_TYPE[course_id]
                        holes = 18 if rtype == '18' else 9
                        avg_min = COURSE_PAR_MINUTES_PER_HOLE[course_id] * holes
                        dur = int(rng.gauss(avg_min, 18))
                        dur = max(holes * 10, min(holes * 20, dur))
                        end_dt = start_dt + timedelta(minutes=dur)
                        round_start = start_dt.isoformat()
                        round_end = end_dt.isoformat()
                        duration = dur
                        check_in = (start_dt - timedelta(minutes=rng.randint(5, 20))).isoformat()
                    else:
                        round_start = round_end = duration = check_in = None

                rtype = COURSE_ROUND_TYPE[course_id]
                transport = rng.choices(['cart', 'walk'], weights=[80, 20])[0]
                has_caddie = 1 if rng.random() < 0.05 else 0

                booking_rows.append((
                    bkg_id, cfg['club_id'], course_id, dt_str, tee_time,
                    len(group) + has_guest, has_guest, transport, has_caddie,
                    rtype, status, check_in, round_start, round_end, duration,
                ))

                # Player rows
                for pos, member in enumerate(group, 1):
                    plr_num += 1
                    player_rows.append((
                        f'bp_{plr_num:05d}', bkg_id, member['member_id'],
                        None, 0,
                        1 if (pos == 1 and rng.random() < 0.08) else 0,  # warm lead (rare for members)
                        pos,
                    ))
                if has_guest:
                    plr_num += 1
                    is_warm = 1 if rng.random() < 0.40 else 0
                    player_rows.append((
                        f'bp_{plr_num:05d}', bkg_id, None,
                        fake_guest_name(rng), 1, is_warm,
                        len(group) + 1,
                    ))

    return booking_rows, player_rows


def _pick_golfer(
    pool: list[dict],
    dt_str: str,
    wk: str,
    rng: random.Random,
    cutoffs: dict,
) -> dict | None:
    """Weighted-random selection of a golf-eligible member for a given day."""
    candidates = []
    weights = []
    for m in pool:
        mid = m['member_id']
        arch = m['archetype']
        base_w = ARCHETYPE_GOLF_RATE.get(arch, {}).get(wk, 0.10)

        # Apply resignation/decay cutoffs
        cutoff = cutoffs.get(mid)
        if cutoff is not None:
            if date.fromisoformat(dt_str) > cutoff:
                continue

        # Anne Jordan: gradual decline (Weekend Warrior resign Jan 27)
        if mid == 'mbr_059' and arch == 'Weekend Warrior':
            dt_obj = date.fromisoformat(dt_str)
            if dt_obj.month == 1 and dt_obj.year == 2026:
                base_w *= 0.05   # near zero in January
            elif dt_obj >= date(2025, 12, 1):
                base_w *= 0.20
            elif dt_obj >= date(2025, 11, 1):
                base_w *= 0.50

        if base_w > 0:
            candidates.append(m)
            weights.append(base_w)

    if not candidates:
        return None
    return rng.choices(candidates, weights=weights, k=1)[0]


def fake_guest_name(rng: random.Random) -> str:
    first = rng.choice(['James','Sarah','Michael','Emily','David','Jessica',
                        'Robert','Ashley','John','Megan','William','Lauren'])
    last = rng.choice(['Smith','Johnson','Williams','Brown','Jones','Garcia',
                       'Miller','Davis','Wilson','Moore','Taylor','Anderson'])
    return f'{first} {last}'


# ─── Pace of play ─────────────────────────────────────────────────────────────

def gen_pace(booking_rows: list[tuple], rng: random.Random) -> tuple[list[tuple], list[tuple]]:
    """
    Generate pace_of_play and pace_hole_segments for completed rounds only.
    Returns (pace_rows, segment_rows).
    """
    pace_rows = []
    segment_rows = []
    pace_num = 0
    seg_num = 0

    # bkg_id -> (course_id, round_type, start, duration)
    for row in booking_rows:
        (bkg_id, club_id, course_id, bkg_date, tee_time,
         player_count, has_guest, transport, has_caddie,
         rtype, status, check_in, round_start, round_end, duration) = row

        if status != 'completed' or duration is None:
            continue

        pace_num += 1
        pace_id = f'pac_{pace_num:05d}'
        holes = 18 if rtype == '18' else 9
        is_slow = 1 if (holes == 18 and duration > 270) else 0
        groups_passed = rng.randint(0, 2) if is_slow else rng.randint(0, 1)
        ranger = 1 if is_slow and rng.random() < 0.40 else 0

        pace_rows.append((pace_id, bkg_id, duration, is_slow, groups_passed, ranger))

        # Hole segments
        if round_start is None:
            continue
        start_dt = datetime.fromisoformat(round_start)
        expected_per_hole = COURSE_PAR_MINUTES_PER_HOLE[course_id]
        remaining = duration
        current_time = start_dt

        for hole in range(1, holes + 1):
            # Distribute time across holes with variance; bottle-neck holes 7-9 for slow rounds
            if is_slow and 7 <= hole <= 9:
                seg_min = int(rng.gauss(expected_per_hole * 1.5, 3))
            else:
                seg_min = int(rng.gauss(expected_per_hole, 2.5))
            seg_min = max(8, min(30, seg_min))

            tee_t = current_time
            green_t = current_time + timedelta(minutes=seg_min)
            is_bottleneck = 1 if seg_min > expected_per_hole * 1.4 else 0

            seg_num += 1
            segment_rows.append((
                f'seg_{seg_num:06d}', pace_id, hole,
                tee_t.isoformat(), green_t.isoformat(),
                seg_min, is_bottleneck,
            ))
            current_time = green_t

    return pace_rows, segment_rows


BOOKING_COLS = [
    'booking_id', 'club_id', 'course_id', 'booking_date', 'tee_time',
    'player_count', 'has_guest', 'transportation', 'has_caddie',
    'round_type', 'status', 'check_in_time', 'round_start', 'round_end', 'duration_minutes',
]
PLAYER_COLS = [
    'player_id', 'booking_id', 'member_id', 'guest_name',
    'is_guest', 'is_warm_lead', 'position_in_group',
]
PACE_COLS = ['pace_id', 'booking_id', 'total_minutes', 'is_slow_round',
             'groups_passed', 'ranger_interventions']
SEGMENT_COLS = ['segment_id', 'pace_id', 'hole_number', 'tee_time', 'green_time',
                'segment_minutes', 'is_bottleneck']
