"""
seed/generators/dimensions.py
Phase 1 — All reference/dimension data:
  club, courses, dining_outlets, membership_types,
  members (300, 8 archetypes), households (220),
  weather_daily (31 days, Scottsdale January)
"""
import random
import hashlib
from datetime import date, timedelta
from faker import Faker

fake = Faker()


# ─── Club reference ───────────────────────────────────────────────────────────

def gen_club(cfg: dict) -> list[tuple]:
    return [(
        cfg['club_id'],
        'Pinetree Country Club',
        'Kennesaw', 'GA', '30144',
        1987, 300, 2, 5,
    )]

CLUB_COLS = ['club_id', 'name', 'city', 'state', 'zip',
             'founded_year', 'member_count', 'course_count', 'outlet_count']


def gen_courses(cfg: dict) -> list[tuple]:
    club = cfg['club_id']
    return [
        ('crs_001', club, 'Championship Course', 18, 72, 8,  '07:00', '16:00'),
        ('crs_002', club, 'Executive Nine',       9,  34, 10, '07:00', '16:00'),
    ]

COURSE_COLS = ['course_id', 'club_id', 'name', 'holes', 'par',
               'tee_interval_min', 'first_tee', 'last_tee']


def gen_dining_outlets(cfg: dict) -> list[tuple]:
    club = cfg['club_id']
    return [
        ('out_001', club, 'Main Dining Room', 'dining',    '["breakfast","dinner"]', 20, 30),
        ('out_002', club, 'Grill Room',        'dining',    '["lunch"]',             30, 45),
        ('out_003', club, 'Bar/Lounge',         'bar',       '["all_day"]',           20, 20),
        ('out_004', club, 'Halfway House',      'on-course', '["all_day"]',           25, 25),
        ('out_005', club, 'Pool Bar',            'bar',       '["all_day"]',            6, 10),
    ]

OUTLET_COLS = ['outlet_id', 'club_id', 'name', 'type', 'meal_periods',
               'weekday_covers', 'weekend_covers']


def gen_membership_types() -> list[tuple]:
    return [
        ('FG',  'Full Golf',        18000, 3000, 1),
        ('SOC', 'Social',            6000, 2000, 0),
        ('JR',  'Junior Executive',  9000, 1500, 1),
        ('LEG', 'Legacy',           22000, 3000, 1),
        ('SPT', 'Sports',           12000, 2500, 1),
        ('NR',  'Non-Resident',      5000,    0, 1),
    ]

MTYPE_COLS = ['type_code', 'name', 'annual_dues', 'fb_minimum', 'golf_eligible']

# Map archetypes → membership type distribution
ARCHETYPE_MEMBERSHIP = {
    'Die-Hard Golfer':  ['FG', 'FG', 'FG', 'LEG', 'SPT'],
    'Social Butterfly': ['SOC', 'SOC', 'FG'],
    'Balanced Active':  ['FG', 'SPT', 'JR', 'LEG'],
    'Weekend Warrior':  ['SPT', 'FG', 'JR'],
    'Declining':        ['FG', 'SPT', 'JR', 'NR'],
    'New Member':       ['JR', 'FG', 'SPT'],
    'Ghost':            ['NR', 'SOC', 'FG'],
    'Snowbird':         ['NR', 'FG', 'SPT'],
}

MEMBERSHIP_DUES = {
    'FG': 18000, 'SOC': 6000, 'JR': 9000,
    'LEG': 22000, 'SPT': 12000, 'NR': 5000,
}


# ─── Households ───────────────────────────────────────────────────────────────

def gen_households(count: int = 220) -> tuple[list[tuple], dict]:
    """
    Generate 220 households.
    80 multi-member (2–3 members), 140 single.
    Returns (rows, hh_id -> member_slots mapping).
    """
    rows = []
    # We'll fill primary_member_id after members are created; use placeholder
    for i in range(1, count + 1):
        hh_id = f'hh_{i:03d}'
        is_multi = 1 if i <= 80 else 0
        rows.append((hh_id, None, 0, fake.address().replace('\n', ', '), is_multi))
    return rows

HH_COLS = ['household_id', 'primary_member_id', 'member_count', 'address', 'is_multi_member']


# ─── Members ──────────────────────────────────────────────────────────────────

def gen_members(cfg: dict, rng: random.Random) -> tuple[list[tuple], list[tuple]]:
    """
    Generate 300 members across 8 archetypes.
    Returns (member_rows, household_update_rows).
    Resignation scenarios are applied post-generation via cross_domain linker.
    """
    weights = cfg['archetype_weights']
    archetype_list = []
    for archetype, count in weights.items():
        archetype_list.extend([archetype] * count)
    rng.shuffle(archetype_list)

    # Assign households: 80 multi-member HHs, 140 single
    # Multi-member HHs get 2 members each (80 × 2 = 160), remaining 140 get single HHs
    hh_assignments = []
    for i in range(1, 81):       # 80 multi-member households
        hh_assignments.extend([f'hh_{i:03d}', f'hh_{i:03d}'])
    for i in range(81, 221):     # 140 single households
        hh_assignments.append(f'hh_{i:03d}')
    rng.shuffle(hh_assignments)

    member_rows = []
    hh_member_map = {}  # hh_id -> [member_ids]

    for idx in range(300):
        m_num = idx + 1
        m_id = f'mbr_{m_num:03d}'
        archetype = archetype_list[idx]
        hh_id = hh_assignments[idx]

        mtype = rng.choice(ARCHETYPE_MEMBERSHIP[archetype])
        dues = MEMBERSHIP_DUES[mtype]

        # Join date: 1–10 years ago for most, <1 year for New Members
        if archetype == 'New Member':
            days_ago = rng.randint(30, 89)
        elif archetype == 'Ghost':
            days_ago = rng.randint(365, 2500)
        else:
            days_ago = rng.randint(180, 3650)
        join_dt = date(2026, 1, 17) - timedelta(days=days_ago)

        dob_year = rng.randint(1950, 1995)
        gender = rng.choice(['M', 'F'])

        member_rows.append((
            m_id,
            m_num,
            fake.first_name_male() if gender == 'M' else fake.first_name_female(),
            fake.last_name(),
            f'{m_id}@example.com',
            fake.phone_number()[:20],
            f'{dob_year}-{rng.randint(1,12):02d}-{rng.randint(1,28):02d}',
            gender,
            mtype,
            'active',        # status — overwritten by cross_domain linker for resignees
            join_dt.isoformat(),
            None,            # resigned_on
            hh_id,
            archetype,
            float(dues),
            round(rng.uniform(0, 200), 2),   # account_balance
            f'{rng.randint(1000000, 9999999)}',  # ghin_number
            1,               # communication_opt_in (19 members will be flipped to 0 below)
        ))

        if hh_id not in hh_member_map:
            hh_member_map[hh_id] = []
        hh_member_map[hh_id].append(m_id)

    # Opt out ~7% of members
    opt_out_indices = rng.sample(range(300), 19)
    for i in opt_out_indices:
        row = list(member_rows[i])
        row[17] = 0
        member_rows[i] = tuple(row)

    # Build household update data
    hh_updates = []
    for hh_id, mids in hh_member_map.items():
        primary = mids[0]
        count = len(mids)
        is_multi = 1 if count > 1 else 0
        hh_updates.append((primary, count, is_multi, hh_id))

    return member_rows, hh_updates


MEMBER_COLS = [
    'member_id', 'member_number', 'first_name', 'last_name', 'email', 'phone',
    'date_of_birth', 'gender', 'membership_type', 'membership_status',
    'join_date', 'resigned_on', 'household_id', 'archetype',
    'annual_dues', 'account_balance', 'ghin_number', 'communication_opt_in',
]


# ─── Weather ──────────────────────────────────────────────────────────────────

# Scottsdale January: 20 sunny, 4 perfect, 4 cloudy, 2 windy, 1 rainy
# Jan 6 = club closed (maintenance) — still gets a weather row
WEATHER_TEMPLATE = (
    ['sunny'] * 19 +
    ['perfect'] * 4 +
    ['cloudy'] * 4 +
    ['windy'] * 2 +
    ['rainy'] * 2
)

WEATHER_RANGES = {
    'sunny':   {'high': (62, 72), 'low': (42, 52), 'wind': (3, 8),  'precip': 0.0},
    'perfect': {'high': (68, 76), 'low': (48, 55), 'wind': (2, 6),  'precip': 0.0},
    'cloudy':  {'high': (55, 65), 'low': (40, 50), 'wind': (5, 12), 'precip': 0.0},
    'windy':   {'high': (58, 68), 'low': (44, 54), 'wind': (18, 28),'precip': 0.0},
    'rainy':   {'high': (52, 60), 'low': (38, 46), 'wind': (8, 15), 'precip': 0.25},
}

WEATHER_MODIFIERS = {
    'sunny':   (0.0,   0.0),
    'perfect': (0.10,  0.0),
    'cloudy':  (-0.05, 0.05),
    'windy':   (-0.15, 0.05),
    'rainy':   (-0.40, 0.30),
}


def gen_weather(rng: random.Random) -> list[tuple]:
    conditions = WEATHER_TEMPLATE.copy()
    rng.shuffle(conditions)
    rows = []
    for day_num in range(31):
        dt = date(2026, 1, day_num + 1)
        cond = conditions[day_num]
        r = WEATHER_RANGES[cond]
        high = rng.randint(*r['high'])
        low = rng.randint(*r['low'])
        wind = rng.randint(*r['wind'])
        precip = round(r['precip'] + rng.uniform(-0.05, 0.05), 2) if cond == 'rainy' else 0.0
        golf_mod, fb_mod = WEATHER_MODIFIERS[cond]
        rows.append((
            f'wth_{dt.isoformat()}',
            dt.isoformat(),
            cond, high, low, wind,
            max(0.0, precip),
            golf_mod, fb_mod,
        ))
    return rows

WEATHER_COLS = ['weather_id', 'date', 'condition', 'temp_high', 'temp_low',
                'wind_mph', 'precipitation_in', 'golf_demand_modifier', 'fb_demand_modifier']
