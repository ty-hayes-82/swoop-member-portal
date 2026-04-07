"""
seed/generators/fb.py
Phase 2 — Food & Beverage domain
  pos_checks (~3,851), pos_line_items (~17,443), pos_payments (~3,920)

Post-round linking (linked_booking_id) is applied later by cross_domain.py.
Understaffed flags are also applied by cross_domain.py.
"""
import random
from datetime import datetime, timedelta

TAX_RATE = 0.085

OUTLET_MEAL_WINDOWS = {
    'out_001': [  # Main Dining Room: breakfast 7-10, dinner 18-21
        (7, 10, 0.35), (18, 21, 0.65),
    ],
    'out_002': [  # Grill Room: lunch 11-15
        (11, 15, 1.0),
    ],
    'out_003': [  # Bar/Lounge: all day 11-22
        (11, 22, 1.0),
    ],
    'out_004': [  # Halfway House: on-course 9-15
        (9, 15, 1.0),
    ],
    'out_005': [  # Pool Bar: all day 11-17
        (11, 17, 1.0),
    ],
}

# Expected covers per outlet per day (weekday / weekend)
# Scaled for 100-member club (~60% of 300-member baseline)
OUTLET_DAILY_COVERS = {
    'out_001': {'wd': 12, 'we': 20},
    'out_002': {'wd': 18, 'we': 28},
    'out_003': {'wd': 12, 'we': 14},
    'out_004': {'wd': 14, 'we': 18},
    'out_005': {'wd':  3, 'we':  6},
}

MENU_CATEGORIES = {
    'appetizer':    (8,  18,  0.20),   # (min_price, max_price, avg_qty)
    'entree':       (16, 42,  1.0),
    'sandwich':     (12, 22,  1.0),
    'salad':        (10, 18,  1.0),
    'side':         (4,  10,  0.50),
    'dessert':      (8,  14,  0.30),
    'beer':         (6,  12,  1.20),
    'wine':         (10, 22,  1.10),
    'cocktail':     (12, 18,  1.10),
    'na_beverage':  (3,   8,  1.30),
}

# Outlet → typical item mix (category: weight)
OUTLET_MENU_MIX = {
    'out_001': {'entree': 5, 'salad': 2, 'appetizer': 2, 'dessert': 2, 'wine': 3, 'cocktail': 2, 'na_beverage': 2},
    'out_002': {'sandwich': 4, 'salad': 3, 'entree': 3, 'side': 2, 'beer': 4, 'cocktail': 2, 'na_beverage': 2},
    'out_003': {'cocktail': 5, 'beer': 5, 'wine': 3, 'appetizer': 3, 'na_beverage': 2},
    'out_004': {'sandwich': 4, 'beer': 4, 'na_beverage': 3, 'side': 2, 'cocktail': 2},
    'out_005': {'beer': 5, 'cocktail': 4, 'na_beverage': 3, 'appetizer': 2},
}

ITEM_NAMES = {
    'appetizer':   ['Shrimp Cocktail', 'Bruschetta', 'Soup du Jour', 'Calamari', 'Caesar Side'],
    'entree':      ['Filet Mignon', 'Salmon', 'Chicken Piccata', 'Ribeye', 'Seared Tuna', 'Pasta Primavera'],
    'sandwich':    ['Club Sandwich', 'Turkey Avocado', 'Grilled Chicken', 'BLT', 'Tuna Melt'],
    'salad':       ['Caesar Salad', 'House Salad', 'Wedge Salad', 'Cobb Salad', 'Spinach Salad'],
    'side':        ['French Fries', 'Sweet Potato Fries', 'Coleslaw', 'Onion Rings', 'Side Salad'],
    'dessert':     ['Crème Brûlée', 'Chocolate Lava Cake', 'Cheesecake', 'Key Lime Pie', 'Ice Cream'],
    'beer':        ['Draft Lager', 'Craft IPA', 'Light Beer', 'Corona', 'Modelo'],
    'wine':        ['Cabernet Sauvignon', 'Chardonnay', 'Pinot Noir', 'Sauvignon Blanc', 'Rosé'],
    'cocktail':    ['Gin & Tonic', 'Margarita', 'Old Fashioned', 'Mojito', 'Club Soda & Lime'],
    'na_beverage': ['Iced Tea', 'Sparkling Water', 'Lemonade', 'Coffee', 'Arnold Palmer'],
}

ARCHETYPE_DINING_RATE = {
    'Die-Hard Golfer':  {'wd': 0.12, 'we': 0.18},
    'Social Butterfly': {'wd': 0.35, 'we': 0.50},
    'Balanced Active':  {'wd': 0.20, 'we': 0.30},
    'Weekend Warrior':  {'wd': 0.04, 'we': 0.22},
    'Declining':        {'wd': 0.04, 'we': 0.06},
    'New Member':       {'wd': 0.12, 'we': 0.20},
    'Ghost':            {'wd': 0.01, 'we': 0.03},
    'Snowbird':         {'wd': 0.20, 'we': 0.30},
}

OPERATING_DATES = [
    f'2026-01-{d:02d}'
    for d in range(1, 32)
    if f'2026-01-{d:02d}' not in {'2026-01-06'}
]


def _is_weekend(dt_str: str) -> bool:
    from datetime import date
    return date.fromisoformat(dt_str).weekday() >= 5


def gen_pos(
    members: list[dict],
    weather_map: dict,
    cfg: dict,
    rng: random.Random,
) -> tuple[list[tuple], list[tuple], list[tuple]]:
    """Returns (check_rows, line_item_rows, payment_rows)."""
    check_rows = []
    item_rows = []
    payment_rows = []
    chk_num = li_num = pay_num = 0

    for dt_str in OPERATING_DATES:
        is_we = _is_weekend(dt_str)
        wk = 'we' if is_we else 'wd'
        wx = weather_map.get(dt_str, {})
        fb_mod = wx.get('fb_demand_modifier', 0.0)

        for outlet_id, windows in OUTLET_MEAL_WINDOWS.items():
            base_covers = OUTLET_DAILY_COVERS[outlet_id][wk]
            covers = max(1, round(base_covers * (1 + fb_mod) * rng.uniform(0.85, 1.15)))

            for _ in range(covers):
                # Pick a dining time within outlet windows
                window = rng.choices(windows, weights=[w[2] for w in windows])[0]
                hour = rng.randint(window[0], window[1] - 1)
                minute = rng.randint(0, 59)
                day = int(dt_str[-2:])
                open_dt = datetime(2026, 1, day, hour, minute)
                service_min = rng.randint(25, 75)
                close_dt = open_dt + timedelta(minutes=service_min)
                fire_dt = open_dt + timedelta(minutes=rng.randint(4, 12))
                fulfill_dt = fire_dt + timedelta(minutes=rng.randint(12, 35))

                # Assign member (or None for anonymous)
                member = _pick_diner(members, wk, rng)
                member_id = member['member_id'] if member else None

                # Build line items
                mix = OUTLET_MENU_MIX[outlet_id]
                cats = list(mix.keys())
                cat_weights = list(mix.values())
                n_items = rng.randint(1, 5)
                subtotal = 0.0
                comp_total = 0.0
                void_total = 0.0
                items_for_check = []
                for _ in range(n_items):
                    cat = rng.choices(cats, weights=cat_weights)[0]
                    lo, hi, _ = MENU_CATEGORIES[cat]
                    price = round(rng.uniform(lo, hi), 2)
                    qty = max(1, round(rng.gauss(MENU_CATEGORIES[cat][2], 0.3)))
                    line_total = round(price * qty, 2)
                    is_void = 1 if rng.random() < cfg.get('void_rate', 0.02) else 0
                    is_comp = 1 if (not is_void and rng.random() < cfg.get('comp_rate', 0.05)) else 0
                    name = rng.choice(ITEM_NAMES[cat])
                    li_num += 1
                    items_for_check.append((
                        f'li_{li_num:06d}', None,  # check_id filled below
                        name, cat, price, qty, line_total,
                        is_comp, is_void,
                        (fire_dt + timedelta(minutes=rng.randint(0, 5))).isoformat(),
                    ))
                    if is_void:
                        void_total += line_total
                    elif is_comp:
                        comp_total += line_total
                    else:
                        subtotal += line_total

                discount = round(subtotal * cfg.get('discount_rate', 0.08) * (1 if rng.random() < 0.15 else 0), 2)
                taxable = max(0, subtotal - discount)
                tax = round(taxable * TAX_RATE, 2)
                tip = round(taxable * rng.gauss(cfg.get('tip_rate_avg', 0.18), 0.05), 2)
                tip = max(0, round(tip, 2))
                total = round(taxable + tax + tip, 2)

                method_weights = cfg['payment_method_mix']
                method = rng.choices(
                    list(method_weights.keys()),
                    weights=list(method_weights.values())
                )[0]

                chk_num += 1
                chk_id = f'chk_{chk_num:05d}'

                check_rows.append((
                    chk_id, outlet_id, member_id,
                    open_dt.isoformat(), close_dt.isoformat(),
                    fire_dt.isoformat(), fulfill_dt.isoformat(),
                    round(subtotal, 2), tax, tip, round(comp_total, 2),
                    discount, round(void_total, 2), total,
                    method,
                    0,    # post_round_dining — set by cross_domain
                    None, # linked_booking_id — set by cross_domain
                    None, # event_id — set by cross_domain
                    0,    # is_understaffed_day — set by cross_domain
                ))

                # Finalise line items with real check_id
                for item in items_for_check:
                    item_rows.append(item[:1] + (chk_id,) + item[2:])

                # Payment row
                pay_num += 1
                is_split = 1 if method == 'split' else 0
                payment_rows.append((
                    f'pay_{pay_num:05d}', chk_id, method, total,
                    close_dt.isoformat(), is_split,
                ))

    return check_rows, item_rows, payment_rows


def _pick_diner(members: list[dict], wk: str, rng: random.Random) -> dict | None:
    """Return a member or None (anonymous) based on archetype dining probability."""
    if rng.random() < 0.08:
        return None
    candidates, weights = [], []
    for m in members:
        w = ARCHETYPE_DINING_RATE.get(m['archetype'], {}).get(wk, 0.05)
        if w > 0:
            candidates.append(m)
            weights.append(w)
    if not candidates:
        return None
    return rng.choices(candidates, weights=weights, k=1)[0]


def gen_post_round_checks(
    booking_rows: list[tuple],
    booking_cols: list[str],
    pace_rows: list[tuple],
    pace_cols: list[str],
    player_rows: list[tuple],
    player_cols: list[str],
    member_map: dict,   # member_id -> {archetype, ...}
    cfg: dict,
    rng: random.Random,
    start_chk_num: int = 0,
    start_li_num: int = 0,
    start_pay_num: int = 0,
) -> tuple[list[tuple], list[tuple], list[tuple]]:
    """
    Generate dedicated post-round dining checks for completed rounds.
    Called AFTER gen_pos so check numbers don't collide.
    Returns (check_rows, line_item_rows, payment_rows) pre-flagged with
    post_round_dining=1 and linked_booking_id set.
    """
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
    SLOW_PENALTY = 0.15

    pace_slow = {r[1]: r[3] for r in pace_rows}  # booking_id -> is_slow_round

    # group_by_booking: booking_id -> list of member_ids
    group_by_booking: dict[str, list[str]] = {}
    for pr in player_rows:
        pd = dict(zip(player_cols, pr))
        if pd['is_guest'] == 0 and pd['member_id']:
            group_by_booking.setdefault(pd['booking_id'], []).append(pd['member_id'])

    check_rows, item_rows, payment_rows = [], [], []
    chk_num = start_chk_num
    li_num  = start_li_num
    pay_num = start_pay_num

    for bkg in booking_rows:
        bd = dict(zip(booking_cols, bkg))
        if bd['status'] != 'completed' or not bd['round_end']:
            continue

        is_slow = pace_slow.get(bd['booking_id'], 0)
        members_in_group = group_by_booking.get(bd['booking_id'], [])
        round_end_dt = datetime.fromisoformat(bd['round_end'])

        for mid in members_in_group:
            arch = member_map.get(mid, {}).get('archetype', 'Balanced Active')
            base_rate = ARCHETYPE_POST_ROUND_RATE.get(arch, 0.35)
            if is_slow:
                base_rate = max(0.05, base_rate - SLOW_PENALTY)
            if rng.random() > base_rate:
                continue

            # Check opens 5-75 min after round end
            offset_min = rng.randint(5, 75)
            open_dt = round_end_dt + timedelta(minutes=offset_min)
            service_min = rng.randint(25, 60)
            close_dt = open_dt + timedelta(minutes=service_min)
            fire_dt = open_dt + timedelta(minutes=rng.randint(4, 10))
            fulfill_dt = fire_dt + timedelta(minutes=rng.randint(12, 30))

            # Post-round → Grill Room or Bar
            outlet_id = rng.choice(['out_002', 'out_003'])
            mix = OUTLET_MENU_MIX[outlet_id]
            cats = list(mix.keys())
            cat_weights = list(mix.values())

            n_items = rng.randint(1, 4)
            subtotal = 0.0
            comp_total = 0.0
            void_total = 0.0
            items_for_check = []
            for _ in range(n_items):
                cat = rng.choices(cats, weights=cat_weights)[0]
                lo, hi, _ = MENU_CATEGORIES[cat]
                price = round(rng.uniform(lo, hi), 2)
                qty = 1
                line_total = round(price * qty, 2)
                is_void = 1 if rng.random() < cfg.get('void_rate', 0.02) else 0
                is_comp = 1 if (not is_void and rng.random() < cfg.get('comp_rate', 0.05)) else 0
                name = rng.choice(ITEM_NAMES[cat])
                li_num += 1
                items_for_check.append((
                    f'li_{li_num:06d}', None,
                    name, cat, price, qty, line_total, is_comp, is_void,
                    (fire_dt + timedelta(minutes=rng.randint(0, 3))).isoformat(),
                ))
                if is_void:
                    void_total += line_total
                elif is_comp:
                    comp_total += line_total
                else:
                    subtotal += line_total

            discount = round(subtotal * cfg.get('discount_rate', 0.08) * (1 if rng.random() < 0.12 else 0), 2)
            taxable = max(0, subtotal - discount)
            tax = round(taxable * TAX_RATE, 2)
            tip = round(taxable * rng.gauss(cfg.get('tip_rate_avg', 0.18), 0.04), 2)
            tip = max(0, round(tip, 2))
            total = round(taxable + tax + tip, 2)

            method_weights = cfg['payment_method_mix']
            method = rng.choices(list(method_weights.keys()), weights=list(method_weights.values()))[0]

            chk_num += 1
            chk_id = f'chk_{chk_num:05d}'

            check_rows.append((
                chk_id, outlet_id, mid,
                open_dt.isoformat(), close_dt.isoformat(),
                fire_dt.isoformat(), fulfill_dt.isoformat(),
                round(subtotal, 2), tax, tip, round(comp_total, 2),
                discount, round(void_total, 2), total, method,
                1,                    # post_round_dining = 1
                bd['booking_id'],     # linked_booking_id
                None,                 # event_id
                0,                    # is_understaffed_day (set by cross_domain if needed)
            ))

            for item in items_for_check:
                item_rows.append(item[:1] + (chk_id,) + item[2:])

            pay_num += 1
            payment_rows.append((
                f'pay_{pay_num:05d}', chk_id, method, total,
                close_dt.isoformat(), 1 if method == 'split' else 0,
            ))

    return check_rows, item_rows, payment_rows


CHECK_COLS = [
    'check_id', 'outlet_id', 'member_id', 'opened_at', 'closed_at',
    'first_item_fired_at', 'last_item_fulfilled_at',
    'subtotal', 'tax_amount', 'tip_amount', 'comp_amount', 'discount_amount',
    'void_amount', 'total', 'payment_method',
    'post_round_dining', 'linked_booking_id', 'event_id', 'is_understaffed_day',
]
LINE_ITEM_COLS = [
    'line_item_id', 'check_id', 'item_name', 'category',
    'unit_price', 'quantity', 'line_total', 'is_comp', 'is_void', 'fired_at',
]
PAYMENT_COLS = ['payment_id', 'check_id', 'payment_method', 'amount', 'processed_at', 'is_split']
