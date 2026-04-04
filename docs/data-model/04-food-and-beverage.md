# 4. Food & Beverage Domain

*POS check data, line items, and payment records. Connects to golf via post_round_dining flag and linked_booking_id. Seed schema has granular check/line-item/payment tables; production uses a simplified transactions table.*

**Tables:** `pos_checks`, `pos_line_items`, `pos_payments`, `transactions`

---

## `pos_checks`

POS check headers. Central F&B fact table with links to outlets, members, bookings, and events.

**Schema source:** seed | **PK:** `check_id`
**Indexes:** idx_pos_member, idx_pos_outlet, idx_pos_date, idx_pos_post_round, idx_pos_understaffed

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `check_id` | TEXT | NO | | PK (chk_00001) | POS: **Chk#/Inv** (check number). **Extraction:** POS reports via SV. |
| `outlet_id` | TEXT | NO | | FK to dining_outlets | POS: **Sales Area** code. |
| `member_id` | TEXT | YES | | FK to members | POS: **Member #** on chit. |
| `opened_at` | TEXT | NO | | Check open timestamp | POS: Chit open timestamp. |
| `closed_at` | TEXT | YES | | Check close timestamp | POS: Chit close/settlement timestamp. |
| `first_item_fired_at` | TEXT | YES | | First kitchen fire | POS: First prep docket timestamp. |
| `last_item_fulfilled_at` | TEXT | YES | | Last item delivered | POS: Last item fulfillment timestamp. |
| `subtotal` | REAL | NO | 0 | Subtotal before tax/tip | POS: Net Amount from chit. |
| `tax_amount` | REAL | NO | 0 | Tax | POS: Tax amount per Tax Code. |
| `tip_amount` | REAL | NO | 0 | Tip | POS: Gratuity from settlement. |
| `comp_amount` | REAL | NO | 0 | Comp total | POS: Comp amount. |
| `discount_amount` | REAL | NO | 0 | Discount total | POS: Discount amount. |
| `void_amount` | REAL | NO | 0 | Void total | POS: Void amount from voided items. |
| `total` | REAL | NO | 0 | Final check total | POS: Total due including tax/tip. |
| `payment_method` | TEXT | NO | 'member_charge' | Payment method | POS: Settlement method (Member Charge, Cash, Credit). |
| `post_round_dining` | INTEGER | NO | 0 | Boolean: dining after golf | **Swoop Computed.** Linked via booking_id + timestamp proximity. |
| `linked_booking_id` | TEXT | YES | | FK to bookings if post-round | **Swoop Computed.** Matched by member_id + date + time window. |
| `event_id` | TEXT | YES | | FK to event_definitions | POS/JAM: Via **Settle to Event** workflow. |
| `is_understaffed_day` | INTEGER | NO | 0 | Boolean: understaffed correlation | **Swoop Computed.** Cross-ref from staff_shifts. |

---

## `pos_line_items`

Individual items on a POS check.

**Schema source:** seed | **PK:** `line_item_id`
**Indexes:** idx_line_items_check, idx_line_items_category

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `line_item_id` | TEXT | NO | | PK (li_000001) | POS: System line item ID. |
| `check_id` | TEXT | NO | | FK to pos_checks | POS: Parent chit number. |
| `item_name` | TEXT | NO | | Menu item name | POS: **Sales Item Description**. **Extraction:** F9 Lister. |
| `category` | TEXT | NO | | appetizer / entree / sandwich / salad / side / dessert / beer / wine / cocktail / na_beverage | POS: **Sales Category** code. |
| `unit_price` | REAL | NO | | Price per unit | POS: **Regular Price** on Sales Item. |
| `quantity` | INTEGER | NO | 1 | Quantity ordered | POS: Quantity on chit line. |
| `line_total` | REAL | NO | | Line total (price x qty) | POS: Calculated. |
| `is_comp` | INTEGER | NO | 0 | Boolean: comped item | POS: Comp flag. |
| `is_void` | INTEGER | NO | 0 | Boolean: voided item | POS: Void flag. |
| `fired_at` | TEXT | YES | | Kitchen fire timestamp | POS: Prep docket timestamp. |

---

## `pos_payments`

Payment records per check. Supports split-check tracking.

**Schema source:** seed | **PK:** `payment_id`
**Indexes:** idx_payments_check

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `payment_id` | TEXT | NO | | PK (pay_00001) | POS: System payment ID. |
| `check_id` | TEXT | NO | | FK to pos_checks | POS: Parent chit number. |
| `payment_method` | TEXT | NO | | Payment method used | POS: Settlement method. |
| `amount` | REAL | NO | | Payment amount | POS: Payment amount applied. |
| `processed_at` | TEXT | NO | | Processing timestamp | POS: Settlement timestamp. |
| `is_split` | INTEGER | NO | 0 | Boolean: part of split | POS: Split check indicator. |

---

## `transactions`

Production POS data from CMS integrations. Simpler than seed pos_checks/line_items split.

**Schema source:** migration | **PK:** `transaction_id`
**Indexes:** idx_transactions_member(member_id, transaction_date DESC)

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `transaction_id` | TEXT | NO | gen_random_uuid() | PK | System UUID. |
| `club_id` | TEXT | NO | | FK to club | Swoop-assigned. |
| `member_id` | TEXT | YES | | FK to members | POS: Member # on chit. |
| `outlet_id` | TEXT | YES | | FK to dining_outlets | POS: Sales Area code. |
| `outlet_name` | TEXT | YES | | Outlet name (denormalized) | POS: Sales Area Description. |
| `transaction_date` | TIMESTAMPTZ | NO | | Transaction timestamp | POS: Chit date/time. **CSV alias:** Toast 'Opened'. |
| `total_amount` | NUMERIC(10,2) | YES | | Total amount | POS: Chit total. **CSV alias:** Toast 'Total Due'. |
| `item_count` | INTEGER | YES | | Number of items | POS: Count of line items. |
| `category` | TEXT | YES | | Transaction category | POS: Primary Sales Category. |
| `is_post_round` | BOOLEAN | NO | FALSE | Post-round dining flag | **Swoop Computed.** |
| `data_source` | TEXT | NO | 'pos' | Source system | N/A (system). |
| `created_at` | TIMESTAMPTZ | YES | NOW() | Row created | N/A (system). |
