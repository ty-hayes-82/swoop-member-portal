"""
seed/generators/dimensions.py
Phase 1 — All reference/dimension data:
  club, courses, dining_outlets, membership_types,
  members (100, 8 archetypes, deterministic named roster),
  households (75), weather_daily (31 days, Scottsdale January)
"""
import random
from datetime import date, timedelta


# ─── Club reference ───────────────────────────────────────────────────────────

def gen_club(cfg: dict) -> list[tuple]:
    return [(
        cfg['club_id'],
        'Pinetree Country Club',
        'Kennesaw', 'GA', '30144',
        1987, 100, 2, 5,
        34.0234, -84.6155,
    )]

CLUB_COLS = ['club_id', 'name', 'city', 'state', 'zip',
             'founded_year', 'member_count', 'course_count', 'outlet_count',
             'latitude', 'longitude']


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


MEMBERSHIP_DUES = {
    'FG': 18000, 'SOC': 6000, 'JR': 9000,
    'LEG': 22000, 'SPT': 12000, 'NR': 5000,
}


# ─── Named Member Roster ────────────────────────────────────────────────────
# Each entry: (first_name, last_name, gender, membership_type)
# Ordered by member_id within each archetype block.

NAMED_ROSTER = {
    'Die-Hard Golfer': [
        ('John',     'Harrison',   'M', 'FG'),   # mbr_001
        ('Robert',   'Callaway',   'M', 'FG'),   # mbr_002
        ('Thomas',   'Mitchell',   'M', 'LEG'),  # mbr_003
        ('David',    'Kensington', 'M', 'FG'),   # mbr_004
        ('Michael',  'Brennan',    'M', 'SPT'),  # mbr_005
        ('William',  'Frasier',    'M', 'FG'),   # mbr_006
        ('Charles',  'Dunham',     'M', 'FG'),   # mbr_007
        ('Patricia', 'Hampton',    'F', 'FG'),   # mbr_008
        ('Richard',  'Tate',       'M', 'LEG'),  # mbr_009
        ('Susan',    'Tate',       'F', 'FG'),   # mbr_010
        ('James',    'O\'Brien',   'M', 'FG'),   # mbr_011
        ('George',   'Whitaker',   'M', 'FG'),   # mbr_012
        ('Donald',   'Price',      'M', 'FG'),   # mbr_013
        ('Edward',   'Lawson',     'M', 'LEG'),  # mbr_014
        ('Frank',    'Chambers',   'M', 'FG'),   # mbr_015
        ('Raymond',  'Voss',       'M', 'SPT'),  # mbr_016
        ('Kenneth',  'Marsh',      'M', 'FG'),   # mbr_017
        ('Daniel',   'Foley',      'M', 'FG'),   # mbr_018
    ],
    'Balanced Active': [
        ('Sarah',       'Collins',   'F', 'FG'),   # mbr_019
        ('Mark',        'Wheeler',   'M', 'SPT'),  # mbr_020
        ('Jennifer',    'Adams',     'F', 'JR'),   # mbr_021
        ('Christopher', 'Lane',      'M', 'FG'),   # mbr_022
        ('Angela',      'Morrison',  'F', 'LEG'),  # mbr_023
        ('Brian',       'Hawkins',   'M', 'FG'),   # mbr_024
        ('Karen',       'Patel',     'F', 'SPT'),  # mbr_025
        ('Raj',         'Patel',     'M', 'FG'),   # mbr_026
        ('Lisa',        'Bennett',   'F', 'FG'),   # mbr_027
        ('Steven',      'Torres',    'M', 'JR'),   # mbr_028
        ('Michelle',    'Foster',    'F', 'FG'),   # mbr_029
        ('Andrew',      'Cooper',    'M', 'SPT'),  # mbr_030
        ('Diane',       'Walsh',     'F', 'FG'),   # mbr_031
        ('Gregory',     'Schultz',   'M', 'LEG'),  # mbr_032
        ('Stephanie',   'Cruz',      'F', 'JR'),   # mbr_033
        ('Paul',        'Richmond',  'M', 'FG'),   # mbr_034
        ('Rachel',      'Kim',       'F', 'FG'),   # mbr_035
        ('Nathan',      'Bell',      'M', 'SPT'),  # mbr_036
        ('Laura',       'Fleming',   'F', 'FG'),   # mbr_037
        ('James',       'Whitfield', 'M', 'FG'),   # mbr_038 — RESIGNS Jan 22
        ('Derek',       'Hoffman',   'M', 'FG'),   # mbr_039
        ('Heather',     'Douglas',   'F', 'JR'),   # mbr_040
    ],
    'Social Butterfly': [
        ('Victoria',  'Sinclair', 'F', 'SOC'),  # mbr_041
        ('Margaret',  'Liu',      'F', 'SOC'),  # mbr_042
        ('Catherine', 'Hayes',    'F', 'FG'),   # mbr_043
        ('Evelyn',    'Drake',    'F', 'SOC'),  # mbr_044
        ('Barbara',   'Conway',   'F', 'SOC'),  # mbr_045
        ('Olivia',    'Grant',    'F', 'FG'),   # mbr_046
        ('Peter',     'Sinclair', 'M', 'FG'),   # mbr_047
        ('Natalie',   'West',     'F', 'SOC'),  # mbr_048
        ('Joanne',    'Tucker',   'F', 'SOC'),  # mbr_049
        ('Sandra',    'Reeves',   'F', 'FG'),   # mbr_050
        ('Alice',     'Chen',     'F', 'SOC'),  # mbr_051
        ('Deborah',   'Maxwell',  'F', 'SOC'),  # mbr_052
        ('Howard',    'Blake',    'M', 'FG'),   # mbr_053
        ('Christine', 'Vargas',   'F', 'SOC'),  # mbr_054
        ('Pamela',    'Nolan',    'F', 'SOC'),  # mbr_055
    ],
    'Weekend Warrior': [
        ('Scott',   'Patterson', 'M', 'SPT'),  # mbr_056
        ('Jeff',    'Larson',    'M', 'FG'),   # mbr_057
        ('Mike',    'Donovan',   'M', 'JR'),   # mbr_058
        ('Anne',    'Jordan',    'F', 'SPT'),  # mbr_059 — RESIGNS Jan 27
        ('Travis',  'Burke',     'M', 'FG'),   # mbr_060
        ('Carlos',  'Mendez',    'M', 'SPT'),  # mbr_061
        ('Ryan',    'Gallagher', 'M', 'JR'),   # mbr_062
        ('Chad',    'Simmons',   'M', 'FG'),   # mbr_063
        ('Nicole',  'Fraser',    'F', 'SPT'),  # mbr_064
        ('Brett',   'Dawson',    'M', 'FG'),   # mbr_065
        ('Tyler',   'Robbins',   'M', 'JR'),   # mbr_066
        ('Kyle',    'Preston',   'M', 'SPT'),  # mbr_067
        ('Todd',    'Morrison',  'M', 'FG'),   # mbr_068
        ('Aaron',   'Fletcher',  'M', 'SPT'),  # mbr_069
        ('Patrick', 'Dunn',      'M', 'FG'),   # mbr_070
    ],
    'Declining': [
        ('Kevin',   'Hurst',    'M', 'FG'),   # mbr_071 — RESIGNS Jan 8
        ('Steven',  'Park',     'M', 'SPT'),  # mbr_072 — RESIGNS Jan 31
        ('Gerald',  'Norton',   'M', 'FG'),   # mbr_073
        ('Barbara', 'Winters',  'F', 'JR'),   # mbr_074
        ('Harold',  'Simms',    'M', 'NR'),   # mbr_075
        ('Dorothy', 'Keane',    'F', 'SPT'),  # mbr_076
        ('Arthur',  'Bowen',    'M', 'FG'),   # mbr_077
        ('Carol',   'Marsh',    'F', 'JR'),   # mbr_078
        ('Walter',  'Gray',     'M', 'NR'),   # mbr_079
        ('Martha',  'Fleming',  'F', 'SPT'),  # mbr_080
    ],
    'New Member': [
        ('Jason',    'Rivera',     'M', 'JR'),   # mbr_081
        ('Emily',    'Chang',      'F', 'FG'),   # mbr_082
        ('Tyler',    'Grant',      'M', 'SPT'),  # mbr_083
        ('Samantha', 'Flores',     'F', 'JR'),   # mbr_084
        ('Connor',   'Blake',      'M', 'FG'),   # mbr_085
        ('Priya',    'Sharma',     'F', 'SPT'),  # mbr_086
        ('Derek',    'Washington', 'M', 'JR'),   # mbr_087
        ('Megan',    'Torres',     'F', 'FG'),   # mbr_088
    ],
    'Ghost': [
        ('Linda',   'Leonard',  'F', 'NR'),   # mbr_089 — RESIGNS Jan 15
        ('Roger',   'Haines',   'M', 'SOC'),  # mbr_090
        ('Philip',  'Duarte',   'M', 'FG'),   # mbr_091
        ('Janet',   'Reese',    'F', 'NR'),   # mbr_092
        ('Dennis',  'Olsen',    'M', 'SOC'),  # mbr_093
        ('Marilyn', 'Prescott', 'F', 'FG'),   # mbr_094
        ('Warren',  'Chang',    'M', 'NR'),   # mbr_095
    ],
    'Snowbird': [
        ('Ronald',  'Petersen', 'M', 'NR'),   # mbr_096
        ('Shirley', 'Hampton',  'F', 'FG'),   # mbr_097
        ('Douglas', 'Archer',   'M', 'SPT'),  # mbr_098
        ('Helen',   'Porter',   'F', 'NR'),   # mbr_099
        ('Robert',  'Sinclair', 'M', 'FG'),   # mbr_100
    ],
}

# Specific household pairings (hh_id -> [member_id, member_id])
# These are the named households from the plan; remaining multi-member
# households are assigned sequentially by the generator.
NAMED_HOUSEHOLDS = {
    'hh_005': ['mbr_009', 'mbr_010'],   # Richard & Susan Tate
    'hh_013': ['mbr_025', 'mbr_026'],   # Karen & Raj Patel
    'hh_021': ['mbr_041', 'mbr_047'],   # Victoria & Peter Sinclair
}


# ─── Households ───────────────────────────────────────────────────────────────

def gen_households(count: int = 75) -> list[tuple]:
    """
    Generate 75 households.
    25 multi-member (2 members), 50 single.
    Returns rows with placeholder primary_member_id (updated after members).
    """
    rows = []
    for i in range(1, count + 1):
        hh_id = f'hh_{i:03d}'
        is_multi = 1 if i <= 25 else 0
        rows.append((hh_id, None, 0, f'{100 + i} Pine Valley Dr, Kennesaw, GA 30144', is_multi))
    return rows

HH_COLS = ['household_id', 'primary_member_id', 'member_count', 'address', 'is_multi_member']


# ─── Members ──────────────────────────────────────────────────────────────────

def gen_members(cfg: dict, rng: random.Random) -> tuple[list[tuple], list[tuple]]:
    """
    Generate 100 members across 8 archetypes using the deterministic NAMED_ROSTER.
    Returns (member_rows, household_update_rows).
    Resignation scenarios are applied post-generation via cross_domain linker.
    """
    weights = cfg['archetype_weights']

    # Build ordered archetype list matching NAMED_ROSTER order
    archetype_order = [
        'Die-Hard Golfer', 'Balanced Active', 'Social Butterfly',
        'Weekend Warrior', 'Declining', 'New Member', 'Ghost', 'Snowbird',
    ]

    # Pre-assign households: 25 multi-member HHs get 2 members each (50 slots),
    # remaining 50 members get single HHs (hh_026 through hh_075).
    # First, build a flat list of all 100 members with their archetype + roster data
    all_members = []
    for archetype in archetype_order:
        roster = NAMED_ROSTER[archetype]
        for entry in roster:
            all_members.append((archetype, entry))

    # Build household assignments
    # Named households get specific slots
    member_to_hh = {}
    used_hh = set()
    for hh_id, member_ids in NAMED_HOUSEHOLDS.items():
        for mid in member_ids:
            member_to_hh[mid] = hh_id
        used_hh.add(hh_id)

    # Assign remaining multi-member households (fill hh_001 through hh_025, skipping used)
    unassigned = []
    for idx, (archetype, entry) in enumerate(all_members):
        m_id = f'mbr_{idx + 1:03d}'
        if m_id not in member_to_hh:
            unassigned.append(m_id)

    multi_hh_idx = 0
    multi_hh_queue = []
    for i in range(1, 26):
        hh_id = f'hh_{i:03d}'
        if hh_id not in used_hh:
            multi_hh_queue.append(hh_id)

    # Pair up unassigned members for multi-member households
    pair_idx = 0
    for hh_id in multi_hh_queue:
        # Find next two unassigned members
        assigned = 0
        while pair_idx < len(unassigned) and assigned < 2:
            mid = unassigned[pair_idx]
            if mid not in member_to_hh:
                member_to_hh[mid] = hh_id
                assigned += 1
            pair_idx += 1

    # Assign single households for remaining unassigned
    single_hh_idx = 26
    for mid in unassigned:
        if mid not in member_to_hh:
            member_to_hh[mid] = f'hh_{single_hh_idx:03d}'
            single_hh_idx += 1

    # Also assign any members from named households that were in the unassigned tracking
    # (they should already be assigned above)

    member_rows = []
    hh_member_map = {}  # hh_id -> [member_ids]

    for idx, (archetype, (first_name, last_name, gender, mtype)) in enumerate(all_members):
        m_num = idx + 1
        m_id = f'mbr_{m_num:03d}'
        dues = MEMBERSHIP_DUES[mtype]
        hh_id = member_to_hh[m_id]

        # Join date: archetype-appropriate
        if archetype == 'New Member':
            days_ago = rng.randint(30, 89)
        elif archetype == 'Ghost':
            days_ago = rng.randint(365, 2500)
        else:
            days_ago = rng.randint(180, 3650)
        join_dt = date(2026, 1, 17) - timedelta(days=days_ago)

        dob_year = rng.randint(1950, 1995)

        member_rows.append((
            m_id,
            m_num,
            cfg['club_id'],
            first_name,
            last_name,
            f'{first_name.lower()}.{last_name.lower()}@example.com',
            f'({rng.randint(200,999)}) {rng.randint(200,999)}-{rng.randint(1000,9999)}',
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
            1,               # communication_opt_in (some flipped to 0 below)
        ))

        if hh_id not in hh_member_map:
            hh_member_map[hh_id] = []
        hh_member_map[hh_id].append(m_id)

    # Opt out ~7% of members (7 out of 100)
    opt_out_indices = rng.sample(range(100), 7)
    for i in opt_out_indices:
        row = list(member_rows[i])
        row[18] = 0  # communication_opt_in index (after club_id addition)
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
    'member_id', 'member_number', 'club_id', 'first_name', 'last_name', 'email', 'phone',
    'date_of_birth', 'gender', 'membership_type', 'membership_status',
    'join_date', 'resigned_on', 'household_id', 'archetype',
    'annual_dues', 'account_balance', 'ghin_number', 'communication_opt_in',
]


# ─── Weather ──────────────────────────────────────────────────────────────────

# Scottsdale January: 19 sunny, 4 perfect, 4 cloudy, 2 windy, 2 rainy
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
