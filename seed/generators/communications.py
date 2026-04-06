"""
seed/generators/communications.py
Phase 2 — Email campaigns (8) and email events (~5,496)

Open rates are archetype-driven. Declining members show
10-15% monthly drop — earliest churn signal in the model.
"""
import random
from datetime import datetime, timedelta

# Archetype base open rates (from data model reference)
ARCHETYPE_OPEN_RATE = {
    'Die-Hard Golfer':  0.18,
    'Social Butterfly': 0.72,
    'Balanced Active':  0.55,
    'Weekend Warrior':  0.32,
    'Declining':        0.20,   # drops further via decay multiplier
    'New Member':       0.68,
    'Ghost':            0.10,
    'Snowbird':         0.40,
}

ARCHETYPE_CLICK_RATE = {
    'Die-Hard Golfer':  0.04,
    'Social Butterfly': 0.22,
    'Balanced Active':  0.14,
    'Weekend Warrior':  0.08,
    'Declining':        0.04,
    'New Member':       0.18,
    'Ghost':            0.01,
    'Snowbird':         0.10,
}

# Campaign index (0-based) → decay multiplier for Declining/resigning members
# Simulates 10-15% monthly drop across 8 campaigns spanning Jan 2-30
def _decay_multiplier(campaign_idx: int, archetype: str, member_id: str) -> float:
    """Return open-rate multiplier. Declining members decay progressively."""
    if archetype == 'Declining':
        # ~12% drop from start to end across 8 campaigns
        return max(0.05, 1.0 - campaign_idx * 0.025)
    resign_decay = {
        'mbr_042': 0.0,    # Kevin Hurst — stopped opening in November
        'mbr_117': 0.0,    # Linda Leonard — ghost, no opens
        'mbr_203': 1.0,    # James Whitfield — active until Jan 22 complaint
        'mbr_089': max(0.1, 1.0 - campaign_idx * 0.12),  # Anne Jordan — decay
        'mbr_271': max(0.05, 1.0 - campaign_idx * 0.05),  # Steven Park — slow decay
    }
    return resign_decay.get(member_id, 1.0)


RESIGN_DATES = {
    'mbr_042': datetime(2026, 1, 8),
    'mbr_117': datetime(2026, 1, 15),
    'mbr_203': datetime(2026, 1, 22),
    'mbr_089': datetime(2026, 1, 27),
    'mbr_271': datetime(2026, 1, 31),
}

LINK_URLS = [
    'https://pinetreecc.com/events',
    'https://pinetreecc.com/dining',
    'https://pinetreecc.com/tee-times',
    'https://pinetreecc.com/wine-dinner',
    'https://pinetreecc.com/super-bowl',
]

DEVICES = ['mobile', 'desktop', 'tablet']
DEVICE_WEIGHTS = [0.55, 0.35, 0.10]


def gen_email_campaigns(cfg: dict) -> list[tuple]:
    rows = []
    for camp in cfg['email_campaigns']:
        rows.append((
            camp['id'], cfg['club_id'], camp['subject'], camp['type'],
            camp['send_date'], 281, None,  # 281 opted-in recipients
        ))
    return rows

CAMPAIGN_COLS = ['campaign_id', 'club_id', 'subject', 'type',
                  'send_date', 'recipient_count', 'html_content_url']


def gen_email_events(
    campaigns: list[tuple],
    members: list[dict],
    rng: random.Random,
) -> list[tuple]:
    """
    For each campaign, generate send/open/click/bounce/unsubscribe events
    for every opted-in member.
    """
    rows = []
    ev_num = 0

    opted_in = [m for m in members if m['communication_opt_in'] == 1]

    for camp_idx, camp in enumerate(campaigns):
        (camp_id, club_id, subject, ctype, send_date,
         recipient_count, _) = camp

        send_dt = datetime.fromisoformat(send_date + 'T09:00:00')

        for member in opted_in:
            mid = member['member_id']
            arch = member['archetype']

            # Skip resigned members who resigned before send date
            resign_dt = RESIGN_DATES.get(mid)

            # --- Send event (always) ---
            ev_num += 1
            send_ts = (send_dt + timedelta(seconds=rng.randint(0, 3600))).isoformat()
            rows.append((
                f'ee_{ev_num:05d}', camp_id, mid, 'send', send_ts, None, None,
            ))

            # Bounce (2% of sends)
            if rng.random() < 0.02:
                ev_num += 1
                rows.append((
                    f'ee_{ev_num:05d}', camp_id, mid, 'bounce',
                    send_ts, None, None,
                ))
                continue

            # Open
            base_open = ARCHETYPE_OPEN_RATE.get(arch, 0.20)
            decay = _decay_multiplier(camp_idx, arch, mid)
            open_prob = base_open * decay

            # If member resigned before send, they can't open
            if resign_dt and send_dt > resign_dt:
                open_prob = 0.0

            if rng.random() < open_prob:
                open_offset = timedelta(hours=rng.uniform(0.1, 48))
                open_ts = (send_dt + open_offset).isoformat()
                device = rng.choices(DEVICES, weights=DEVICE_WEIGHTS)[0]
                ev_num += 1
                rows.append((
                    f'ee_{ev_num:05d}', camp_id, mid, 'open', open_ts, None, device,
                ))

                # Click (subset of openers)
                base_click = ARCHETYPE_CLICK_RATE.get(arch, 0.05) * decay
                if rng.random() < base_click:
                    click_ts = (send_dt + open_offset + timedelta(minutes=rng.randint(1, 10))).isoformat()
                    link = rng.choice(LINK_URLS)
                    ev_num += 1
                    rows.append((
                        f'ee_{ev_num:05d}', camp_id, mid, 'click', click_ts, link, device,
                    ))

            # Unsubscribe (rare, slightly higher for Declining)
            unsub_prob = 0.002 if arch == 'Declining' else 0.0005
            if rng.random() < unsub_prob:
                ev_num += 1
                rows.append((
                    f'ee_{ev_num:05d}', camp_id, mid, 'unsubscribe',
                    send_ts, None, None,
                ))

    return rows

EMAIL_EVENT_COLS = ['event_id', 'campaign_id', 'member_id', 'event_type',
                     'occurred_at', 'link_clicked', 'device_type']
