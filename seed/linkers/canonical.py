"""
seed/linkers/canonical.py
Phase 5 — Canonical event generation

Wraps every entity creation/update as a canonical_event with:
  - MD5-based idempotency key (entity_type + entity_id + event_type + timestamp)
  - source_vendor attribution (simulates multi-vendor ingestion)
  - JSON payload snapshot of the full entity state
"""
import hashlib
import json
from datetime import datetime

VENDOR_BY_ENTITY = {
    'member':                'Northstar',
    'booking':               'ForeTees',
    'booking_player':        'ForeTees',
    'pace_of_play':          'ForeTees',
    'pos_check':             'Jonas POS',
    'pos_line_item':         'Jonas POS',
    'pos_payment':           'Jonas POS',
    'event_registration':    'Club Prophet',
    'email_event':           'Club Prophet',
    'feedback':              'Northstar',
    'service_request':       'Northstar',
    'staff_shift':           'ClubReady',
    'close_out':             'Jonas POS',
    'waitlist_entry':        'ForeTees',
    'member_waitlist':       'ForeTees',
    'cancellation_risk':     'ForeTees',
}


def _md5_key(entity_type: str, entity_id: str, event_type: str, ts: str) -> str:
    raw = f'{entity_type}:{entity_id}:{event_type}:{ts}'
    return hashlib.md5(raw.encode()).hexdigest()


def _ts(row_dict: dict, fallback: str = '2026-01-01T00:00:00') -> str:
    """Extract a timestamp from a row dict for use as event_timestamp."""
    for key in ('opened_at', 'registered_at', 'occurred_at', 'submitted_at',
                'requested_at', 'shift_date', 'date', 'join_date', 'booking_date'):
        val = row_dict.get(key)
        if val:
            if len(val) == 10:
                return val + 'T08:00:00'
            return val
    return fallback


def _rows_to_dicts(rows: list[tuple], cols: list[str]) -> list[dict]:
    return [dict(zip(cols, row)) for row in rows]


def _build_events(
    entity_type: str,
    id_col: str,
    rows: list[tuple],
    cols: list[str],
    event_type: str = 'created',
) -> list[tuple]:
    events = []
    vendor = VENDOR_BY_ENTITY.get(entity_type, 'Northstar')
    for row in rows:
        d = dict(zip(cols, row))
        entity_id = d[id_col]
        ts = _ts(d)
        key = _md5_key(entity_type, entity_id, event_type, ts)
        payload = json.dumps({k: str(v) if v is not None else None for k, v in d.items()})
        events.append((key, entity_type, entity_id, event_type, ts, vendor, payload))

    # Deduplicate by key
    seen = set()
    unique = []
    for e in events:
        if e[0] not in seen:
            seen.add(e[0])
            unique.append(e)
    return unique


def gen_canonical_events(
    member_rows, member_cols,
    booking_rows, booking_cols,
    player_rows, player_cols,
    pace_rows, pace_cols,
    check_rows, check_cols,
    line_item_rows, line_item_cols,
    payment_rows, payment_cols,
    event_reg_rows, event_reg_cols,
    email_event_rows, email_event_cols,
    feedback_rows, feedback_cols,
    request_rows, request_cols,
    shift_rows, shift_cols,
    closeout_rows, closeout_cols,
    waitlist_rows, waitlist_cols,
) -> list[tuple]:
    """
    Generate canonical_events for all major entity types.
    Returns list of rows matching CANONICAL_COLS.
    """
    all_events = []

    # Members — 'created' for all, plus 'resigned' for the 5 resignees
    all_events += _build_events('member', 'member_id', member_rows, member_cols, 'created')
    resigned = [r for r in member_rows if dict(zip(member_cols, r)).get('membership_status') == 'resigned']
    for row in resigned:
        d = dict(zip(member_cols, row))
        ts = (d.get('resigned_on') or '2026-01-31') + 'T17:00:00'
        key = _md5_key('member', d['member_id'], 'resigned', ts)
        payload = json.dumps({k: str(v) if v is not None else None for k, v in d.items()})
        all_events.append((key, 'member', d['member_id'], 'resigned', ts,
                            VENDOR_BY_ENTITY['member'], payload))

    # Bookings
    all_events += _build_events('booking', 'booking_id', booking_rows, booking_cols, 'created')
    completed = [r for r in booking_rows if dict(zip(booking_cols, r)).get('status') == 'completed']
    all_events += _build_events('booking', 'booking_id', completed, booking_cols, 'completed')
    cancelled = [r for r in booking_rows if dict(zip(booking_cols, r)).get('status') in ('cancelled', 'no_show')]
    all_events += _build_events('booking', 'booking_id', cancelled, booking_cols, 'cancelled')

    # Booking players
    all_events += _build_events('booking_player', 'player_id', player_rows, player_cols, 'created')

    # Pace
    all_events += _build_events('pace_of_play', 'pace_id', pace_rows, pace_cols, 'completed')

    # POS — created when check opened, completed when closed
    all_events += _build_events('pos_check', 'check_id', check_rows, check_cols, 'created')
    closed_checks = [r for r in check_rows if dict(zip(check_cols, r)).get('closed_at')]
    all_events += _build_events('pos_check', 'check_id', closed_checks, check_cols, 'completed')

    # Line items (sample — too large to wrap every item)
    sampled_items = line_item_rows[::5]  # every 5th item
    all_events += _build_events('pos_line_item', 'line_item_id', sampled_items, line_item_cols, 'created')

    # Payments
    all_events += _build_events('pos_payment', 'payment_id', payment_rows, payment_cols, 'created')

    # Event registrations
    all_events += _build_events('event_registration', 'registration_id',
                                 event_reg_rows, event_reg_cols, 'created')

    # Email events (sample — high volume)
    sampled_emails = email_event_rows[::3]
    all_events += _build_events('email_event', 'event_id', sampled_emails, email_event_cols, 'created')

    # Feedback
    all_events += _build_events('feedback', 'feedback_id', feedback_rows, feedback_cols, 'created')

    # Service requests
    all_events += _build_events('service_request', 'request_id', request_rows, request_cols, 'created')

    # Staff shifts
    all_events += _build_events('staff_shift', 'shift_id', shift_rows, shift_cols, 'created')

    # Close-outs
    all_events += _build_events('close_out', 'closeout_id', closeout_rows, closeout_cols, 'created')

    # Waitlist
    all_events += _build_events('member_waitlist', 'waitlist_id', waitlist_rows, waitlist_cols, 'created')

    # Final dedup across entire set
    seen = set()
    unique = []
    for e in all_events:
        if e[0] not in seen:
            seen.add(e[0])
            unique.append(e)

    return unique


CANONICAL_COLS = ['event_id', 'entity_type', 'entity_id', 'event_type',
                   'event_timestamp', 'source_vendor', 'payload']
