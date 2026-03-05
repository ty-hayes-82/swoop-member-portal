"""
seed/generators/service.py
Phase 2 — Staffing & Service domain
  staff (45), staff_shifts (~701), feedback (~34), service_requests (~214)

Understaffed dates (Jan 9, 16, 28) flagged here for shifts;
is_understaffed_day on feedback/requests set by cross_domain.py.
"""
import random
from datetime import date, datetime, timedelta
from faker import Faker

fake = Faker()

UNDERSTAFFED_DATES = {'2026-01-09', '2026-01-16', '2026-01-28'}

DEPARTMENTS = {
    'Golf Operations': {
        'roles': ['Head Golf Professional', 'Assistant Golf Pro', 'Starter', 'Ranger', 'Cart Attendant'],
        'count': 10,
        'hourly_range': (14, 55),
        'ft_rate': 0.70,
    },
    'F&B Service': {
        'roles': ['Food & Beverage Manager', 'Lead Server', 'Server', 'Bartender', 'Host/Hostess', 'Busser'],
        'count': 14,
        'hourly_range': (12, 32),
        'ft_rate': 0.50,
    },
    'F&B Kitchen': {
        'roles': ['Executive Chef', 'Sous Chef', 'Line Cook', 'Prep Cook', 'Dishwasher'],
        'count': 8,
        'hourly_range': (13, 65),
        'ft_rate': 0.75,
    },
    'Grounds': {
        'roles': ['Superintendent', 'Assistant Super', 'Equipment Operator', 'Grounds Crew'],
        'count': 7,
        'hourly_range': (13, 48),
        'ft_rate': 0.85,
    },
    'Pro Shop': {
        'roles': ['Pro Shop Manager', 'Pro Shop Associate', 'Merchandise Coordinator'],
        'count': 3,
        'hourly_range': (14, 28),
        'ft_rate': 0.67,
    },
    'Administration': {
        'roles': ['General Manager', 'Membership Director', 'Controller', 'Marketing Coordinator'],
        'count': 3,
        'hourly_range': (20, 90),
        'ft_rate': 1.00,
    },
}

# Grill Room outlet id
GRILL_ROOM_ID = 'out_002'

OPERATING_DATES = [
    date(2026, 1, d).isoformat()
    for d in range(1, 32)
    if date(2026, 1, d).isoformat() != '2026-01-06'
]

FEEDBACK_CATEGORIES = [
    'Service Speed', 'Food Quality', 'Course Condition',
    'Facility', 'Staff', 'Pace of Play', 'General',
]
REQUEST_TYPES = [
    'beverage_cart', 'pace_complaint', 'course_condition',
    'equipment', 'facility_maintenance',
]


def gen_staff(cfg: dict, rng: random.Random) -> list[tuple]:
    rows = []
    stf_num = 0
    for dept, info in DEPARTMENTS.items():
        for _ in range(info['count']):
            stf_num += 1
            stf_id = f'stf_{stf_num:03d}'
            role = rng.choice(info['roles'])
            lo, hi = info['hourly_range']
            rate = round(rng.uniform(lo, hi), 2)
            is_ft = 1 if rng.random() < info['ft_rate'] else 0
            days_ago = rng.randint(90, 3000)
            hire_dt = (date(2026, 1, 17) - timedelta(days=days_ago)).isoformat()
            rows.append((
                stf_id, cfg['club_id'],
                fake.first_name(), fake.last_name(),
                dept, role, hire_dt, rate, is_ft,
            ))
    return rows

STAFF_COLS = ['staff_id', 'club_id', 'first_name', 'last_name',
               'department', 'role', 'hire_date', 'hourly_rate', 'is_full_time']


def gen_staff_shifts(staff_rows: list[tuple], rng: random.Random) -> list[tuple]:
    """
    Generate ~701 shifts across 30 operating days.
    Jan 9, 16, 28: Grill Room is understaffed (1 fewer server scheduled).
    """
    rows = []
    shift_num = 0

    # Group staff by dept for easier lookup
    staff_by_dept = {}
    for row in staff_rows:
        (stf_id, club_id, fn, ln, dept, role, hire, rate, ft) = row
        staff_by_dept.setdefault(dept, []).append(stf_id)

    fb_service = staff_by_dept.get('F&B Service', [])
    fb_kitchen = staff_by_dept.get('F&B Kitchen', [])
    golf_ops   = staff_by_dept.get('Golf Operations', [])
    grounds    = staff_by_dept.get('Grounds', [])
    pro_shop   = staff_by_dept.get('Pro Shop', [])
    admin      = staff_by_dept.get('Administration', [])

    for dt_str in OPERATING_DATES:
        is_understaffed = dt_str in UNDERSTAFFED_DATES
        dt_obj = date.fromisoformat(dt_str)
        is_we = dt_obj.weekday() >= 5

        # Golf ops: 4-6 per day
        n_golf = rng.randint(5, 6) if is_we else rng.randint(4, 5)
        for stf_id in rng.sample(golf_ops, min(n_golf, len(golf_ops))):
            shift_num += 1
            start = '06:30' if is_we else '07:00'
            end   = '16:30' if is_we else '16:00'
            rows.append(_shift(f'shf_{shift_num:04d}', stf_id, dt_str,
                               None, start, end, 0))

        # F&B Service: 5-7 per day; understaffed days lose 2 Grill Room staff
        n_fb = rng.randint(6, 7) if is_we else rng.randint(5, 6)
        if is_understaffed:
            n_fb = max(3, n_fb - 2)
        for i, stf_id in enumerate(rng.sample(fb_service, min(n_fb, len(fb_service)))):
            outlet = GRILL_ROOM_ID if i < 3 else rng.choice(['out_001', 'out_003'])
            shift_num += 1
            rows.append(_shift(
                f'shf_{shift_num:04d}', stf_id, dt_str,
                outlet, '10:30', '20:00',
                1 if is_understaffed else 0,
                'Staff callout — short-handed' if is_understaffed and i >= n_fb - 1 else None,
            ))

        # F&B Kitchen: 3-5 per day
        n_kitchen = rng.randint(4, 5) if is_we else rng.randint(3, 4)
        for stf_id in rng.sample(fb_kitchen, min(n_kitchen, len(fb_kitchen))):
            shift_num += 1
            rows.append(_shift(f'shf_{shift_num:04d}', stf_id, dt_str,
                               GRILL_ROOM_ID, '09:00', '20:00', 0))

        # Grounds: 3-4 per day
        n_gr = rng.randint(3, 4)
        for stf_id in rng.sample(grounds, min(n_gr, len(grounds))):
            shift_num += 1
            rows.append(_shift(f'shf_{shift_num:04d}', stf_id, dt_str,
                               None, '05:30', '14:00', 0))

        # Pro shop: 2 per day
        for stf_id in rng.sample(pro_shop, min(2, len(pro_shop))):
            shift_num += 1
            rows.append(_shift(f'shf_{shift_num:04d}', stf_id, dt_str,
                               None, '07:00', '17:00', 0))

        # Admin: 1-2 on weekdays
        if not is_we:
            for stf_id in rng.sample(admin, min(2, len(admin))):
                shift_num += 1
                rows.append(_shift(f'shf_{shift_num:04d}', stf_id, dt_str,
                                   None, '08:00', '17:00', 0))

    return rows


def _shift(shift_id, stf_id, dt_str, outlet_id, start, end, is_understaffed, notes=None):
    sh = int(start.split(':')[0])
    sm = int(start.split(':')[1])
    eh = int(end.split(':')[0])
    em = int(end.split(':')[1])
    hours = round((eh * 60 + em - sh * 60 - sm) / 60, 2)
    return (shift_id, stf_id, dt_str, outlet_id, start, end, hours, is_understaffed, notes)

SHIFT_COLS = ['shift_id', 'staff_id', 'shift_date', 'outlet_id', 'start_time',
               'end_time', 'hours_worked', 'is_understaffed_day', 'notes']


def gen_feedback(members: list[dict], cfg: dict, rng: random.Random) -> list[tuple]:
    """
    ~34 feedback records. Understaffed days have 2x complaint rate.
    mbr_203 (James Whitfield) gets a Service Speed complaint on Jan 18 — status stays 'acknowledged'.
    """
    rows = []
    fb_num = 0

    # Normal feedback: ~1 per day across the month
    for day in range(1, 32):
        dt_str = f'2026-01-{day:02d}'
        if dt_str == '2026-01-06':
            continue
        is_understaffed = dt_str in UNDERSTAFFED_DATES
        n = rng.randint(1, 3) if is_understaffed else (1 if rng.random() < 0.65 else 0)

        for _ in range(n):
            member = rng.choice(members)
            mid = member['member_id']
            # Skip mbr_203's slot — we'll add it precisely below
            if mid == 'mbr_203':
                mid = rng.choice([m['member_id'] for m in members if m['member_id'] != 'mbr_203'])

            cat = rng.choice(FEEDBACK_CATEGORIES)
            # Understaffed → service speed complaints more likely
            if is_understaffed:
                cat = rng.choices(
                    FEEDBACK_CATEGORIES,
                    weights=[40, 20, 10, 10, 10, 5, 5]
                )[0]
            sentiment = round(rng.uniform(-0.9, 0.8), 2)
            if is_understaffed:
                sentiment = round(rng.uniform(-0.85, -0.10), 2)

            hour = rng.randint(11, 20)
            ts = f'2026-01-{day:02d}T{hour:02d}:{rng.randint(0,59):02d}:00'

            # Resolution status
            status = rng.choices(
                ['acknowledged', 'in_progress', 'resolved', 'escalated'],
                weights=[25, 20, 50, 5]
            )[0]
            resolved_at = None
            if status == 'resolved':
                res_day = min(31, day + rng.randint(1, 4))
                resolved_at = f'2026-01-{res_day:02d}T10:00:00'

            fb_num += 1
            rows.append((
                f'fb_{fb_num:03d}', mid, cfg['club_id'], ts,
                cat, sentiment, f'Member feedback on {cat.lower()}.',
                status, resolved_at, 1 if is_understaffed else 0,
            ))

    # mbr_203 James Whitfield — precise complaint Jan 18 (never resolved)
    fb_num += 1
    rows.append((
        f'fb_{fb_num:03d}', 'mbr_203', cfg['club_id'],
        '2026-01-18T14:32:00',
        'Service Speed', -0.8,
        'Waited 25 minutes for service at the Grill Room. Staff appeared overwhelmed.',
        'acknowledged', None, 0,
    ))

    return rows

FEEDBACK_COLS = ['feedback_id', 'member_id', 'club_id', 'submitted_at', 'category',
                  'sentiment_score', 'description', 'status', 'resolved_at', 'is_understaffed_day']


def gen_service_requests(
    members: list[dict],
    booking_rows: list[tuple],
    cfg: dict,
    rng: random.Random,
) -> list[tuple]:
    """~214 service requests spread across operating days."""
    rows = []
    req_num = 0

    completed_bookings = [
        b for b in booking_rows if b[10] == 'completed'
    ]
    bkg_by_date = {}
    for b in completed_bookings:
        bkg_by_date.setdefault(b[3], []).append(b[0])

    for day in range(1, 32):
        dt_str = f'2026-01-{day:02d}'
        if dt_str == '2026-01-06':
            continue
        is_understaffed = dt_str in UNDERSTAFFED_DATES
        n = rng.randint(7, 11) if is_understaffed else rng.randint(5, 9)

        day_bookings = bkg_by_date.get(dt_str, [])

        for _ in range(n):
            req_num += 1
            rtype = rng.choices(
                REQUEST_TYPES,
                weights=[30, 20, 20, 15, 15]
            )[0]
            member = rng.choice(members) if rng.random() > 0.15 else None
            mid = member['member_id'] if member else None
            bkg_id = rng.choice(day_bookings) if day_bookings and rng.random() < 0.60 else None

            hour = rng.randint(8, 18)
            ts = f'2026-01-{day:02d}T{hour:02d}:{rng.randint(0,59):02d}:00'

            # Response time: longer on understaffed days
            if is_understaffed:
                resp_min = rng.randint(12, 35)
            else:
                resp_min = rng.randint(3, 15)

            res_offset = rng.randint(5, 60)
            resolved_at = f'2026-01-{day:02d}T{min(hour+1, 20):02d}:{rng.randint(0,59):02d}:00'

            rows.append((
                f'sr_{req_num:04d}', mid, bkg_id, rtype, ts,
                resp_min, resolved_at, 'Resolved by staff.',
                1 if is_understaffed else 0,
            ))

    return rows

REQUEST_COLS = ['request_id', 'member_id', 'booking_id', 'request_type', 'requested_at',
                 'response_time_min', 'resolved_at', 'resolution_notes', 'is_understaffed_day']
