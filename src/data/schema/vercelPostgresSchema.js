export const vercelPostgresSchema = {
  tables: [
    {
      name: 'clubs',
      description: 'Core club records for each customer instance.',
      columns: [
        { name: 'id', type: 'uuid', nullable: false },
        { name: 'name', type: 'text', nullable: false },
        { name: 'timezone', type: 'text', nullable: false },
        { name: 'created_at', type: 'timestamptz', nullable: false },
      ],
      relationships: [],
    },
    {
      name: 'members',
      description: 'Primary member profile and account metadata.',
      columns: [
        { name: 'id', type: 'uuid', nullable: false },
        { name: 'club_id', type: 'uuid', nullable: false },
        { name: 'member_number', type: 'text', nullable: false },
        { name: 'status', type: 'text', nullable: false },
        { name: 'created_at', type: 'timestamptz', nullable: false },
      ],
      relationships: [
        { fromColumn: 'club_id', toTable: 'clubs', toColumn: 'id' },
      ],
    },
    {
      name: 'households',
      description: 'Household grouping for family and dependent views.',
      columns: [
        { name: 'id', type: 'uuid', nullable: false },
        { name: 'club_id', type: 'uuid', nullable: false },
        { name: 'household_name', type: 'text', nullable: false },
        { name: 'primary_member_id', type: 'uuid', nullable: true },
      ],
      relationships: [
        { fromColumn: 'club_id', toTable: 'clubs', toColumn: 'id' },
        { fromColumn: 'primary_member_id', toTable: 'members', toColumn: 'id' },
      ],
    },
    {
      name: 'tee_times',
      description: 'Bookings and attendance details for tee sheet analytics.',
      columns: [
        { name: 'id', type: 'uuid', nullable: false },
        { name: 'club_id', type: 'uuid', nullable: false },
        { name: 'member_id', type: 'uuid', nullable: true },
        { name: 'start_time', type: 'timestamptz', nullable: false },
        { name: 'status', type: 'text', nullable: false },
      ],
      relationships: [
        { fromColumn: 'club_id', toTable: 'clubs', toColumn: 'id' },
        { fromColumn: 'member_id', toTable: 'members', toColumn: 'id' },
      ],
    },
    {
      name: 'reservations',
      description: 'Dining and amenity reservations tied to member behavior.',
      columns: [
        { name: 'id', type: 'uuid', nullable: false },
        { name: 'club_id', type: 'uuid', nullable: false },
        { name: 'member_id', type: 'uuid', nullable: true },
        { name: 'venue', type: 'text', nullable: false },
        { name: 'reservation_at', type: 'timestamptz', nullable: false },
      ],
      relationships: [
        { fromColumn: 'club_id', toTable: 'clubs', toColumn: 'id' },
        { fromColumn: 'member_id', toTable: 'members', toColumn: 'id' },
      ],
    },
    {
      name: 'pos_checks',
      description: 'Point-of-sale checks used for F&B and engagement signals.',
      columns: [
        { name: 'id', type: 'uuid', nullable: false },
        { name: 'club_id', type: 'uuid', nullable: false },
        { name: 'member_id', type: 'uuid', nullable: true },
        { name: 'check_total_cents', type: 'integer', nullable: false },
        { name: 'closed_at', type: 'timestamptz', nullable: false },
      ],
      relationships: [
        { fromColumn: 'club_id', toTable: 'clubs', toColumn: 'id' },
        { fromColumn: 'member_id', toTable: 'members', toColumn: 'id' },
      ],
    },
    {
      name: 'member_events',
      description: 'Behavioral events emitted by app and integrated systems.',
      columns: [
        { name: 'id', type: 'uuid', nullable: false },
        { name: 'club_id', type: 'uuid', nullable: false },
        { name: 'member_id', type: 'uuid', nullable: false },
        { name: 'event_type', type: 'text', nullable: false },
        { name: 'occurred_at', type: 'timestamptz', nullable: false },
      ],
      relationships: [
        { fromColumn: 'club_id', toTable: 'clubs', toColumn: 'id' },
        { fromColumn: 'member_id', toTable: 'members', toColumn: 'id' },
      ],
    },
    {
      name: 'action_recommendations',
      description: 'AI-generated intervention recommendations and outcomes.',
      columns: [
        { name: 'id', type: 'uuid', nullable: false },
        { name: 'club_id', type: 'uuid', nullable: false },
        { name: 'member_id', type: 'uuid', nullable: true },
        { name: 'source_event_id', type: 'uuid', nullable: true },
        { name: 'status', type: 'text', nullable: false },
      ],
      relationships: [
        { fromColumn: 'club_id', toTable: 'clubs', toColumn: 'id' },
        { fromColumn: 'member_id', toTable: 'members', toColumn: 'id' },
        { fromColumn: 'source_event_id', toTable: 'member_events', toColumn: 'id' },
      ],
    },
  ],
};

export default vercelPostgresSchema;
