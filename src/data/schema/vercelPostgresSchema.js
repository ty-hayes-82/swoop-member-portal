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
      sampleRows: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          name: 'Swoop Ridge Country Club',
          timezone: 'America/New_York',
          created_at: '2025-01-08T14:32:10Z',
        },
        {
          id: '22222222-2222-4222-8222-222222222222',
          name: 'Harbor Point Golf & Beach',
          timezone: 'America/Chicago',
          created_at: '2025-02-16T09:11:54Z',
        },
        {
          id: '33333333-3333-4333-8333-333333333333',
          name: 'Desert Pines Athletic Club',
          timezone: 'America/Phoenix',
          created_at: '2025-03-03T19:45:01Z',
        },
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
      sampleRows: [
        {
          id: '4f89d8f1-2b61-4704-89d8-88f11a72be11',
          club_id: '11111111-1111-4111-8111-111111111111',
          member_number: 'M-10482',
          status: 'active',
          created_at: '2025-06-01T12:05:42Z',
        },
        {
          id: '7032f0dd-2935-43fc-b5f1-84f8cf7f4012',
          club_id: '11111111-1111-4111-8111-111111111111',
          member_number: 'M-10931',
          status: 'at_risk',
          created_at: '2025-06-18T08:22:09Z',
        },
        {
          id: '2c7f9ea1-9d6c-4a7d-a011-8013fef0f313',
          club_id: '22222222-2222-4222-8222-222222222222',
          member_number: 'M-20944',
          status: 'inactive',
          created_at: '2025-07-02T16:44:30Z',
        },
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
      sampleRows: [
        {
          id: '8d6b6cd0-0e52-4325-b6ba-fac39f1f3021',
          club_id: '11111111-1111-4111-8111-111111111111',
          household_name: 'The Martin Family',
          primary_member_id: '4f89d8f1-2b61-4704-89d8-88f11a72be11',
        },
        {
          id: '1bbfd442-74e4-49df-a16b-c7e9cc80cf22',
          club_id: '11111111-1111-4111-8111-111111111111',
          household_name: 'Lopez Household',
          primary_member_id: '7032f0dd-2935-43fc-b5f1-84f8cf7f4012',
        },
        {
          id: 'd4f59ab5-37b8-4c26-8a86-b8f5c0ca9023',
          club_id: '33333333-3333-4333-8333-333333333333',
          household_name: 'Chen Family',
          primary_member_id: null,
        },
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
      sampleRows: [
        {
          id: '7be1e8d9-4a07-4e39-9cb3-cf6c8d8a1011',
          club_id: '11111111-1111-4111-8111-111111111111',
          member_id: '4f89d8f1-2b61-4704-89d8-88f11a72be11',
          start_time: '2026-03-09T13:10:00Z',
          status: 'played',
        },
        {
          id: 'ad0f5748-2837-4d7c-81f2-fcb27fb3f812',
          club_id: '11111111-1111-4111-8111-111111111111',
          member_id: '7032f0dd-2935-43fc-b5f1-84f8cf7f4012',
          start_time: '2026-03-10T15:00:00Z',
          status: 'no_show',
        },
        {
          id: 'be1d7e18-f3c7-47c2-8a95-9686f2ec4d13',
          club_id: '22222222-2222-4222-8222-222222222222',
          member_id: null,
          start_time: '2026-03-12T08:20:00Z',
          status: 'booked',
        },
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
      sampleRows: [
        {
          id: 'f24d17bf-8ac8-4b53-9bde-f50252c76031',
          club_id: '11111111-1111-4111-8111-111111111111',
          member_id: '4f89d8f1-2b61-4704-89d8-88f11a72be11',
          venue: 'Clubhouse Main Dining Room',
          reservation_at: '2026-03-11T18:30:00Z',
        },
        {
          id: '835523aa-8f15-47ad-a3b5-0e6a04063532',
          club_id: '33333333-3333-4333-8333-333333333333',
          member_id: null,
          venue: 'Pool Bar Patio - Sunset Event Series',
          reservation_at: '2026-03-12T00:15:00Z',
        },
        {
          id: 'a4a9fba9-5a33-45a4-9f8e-a68d5d4abc33',
          club_id: '22222222-2222-4222-8222-222222222222',
          member_id: '2c7f9ea1-9d6c-4a7d-a011-8013fef0f313',
          venue: '19th Hole Lounge',
          reservation_at: '2026-03-12T19:45:00Z',
        },
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
      sampleRows: [
        {
          id: 'd7f3687e-f96d-4f38-9e87-b3812bb2a041',
          club_id: '11111111-1111-4111-8111-111111111111',
          member_id: '4f89d8f1-2b61-4704-89d8-88f11a72be11',
          check_total_cents: 12850,
          closed_at: '2026-03-10T21:07:34Z',
        },
        {
          id: '64b7f63e-a0d4-4a7a-bec3-eae937f9d742',
          club_id: '11111111-1111-4111-8111-111111111111',
          member_id: null,
          check_total_cents: 4600,
          closed_at: '2026-03-10T22:14:02Z',
        },
        {
          id: '5acde943-96d8-4c68-9f57-b49d671fcf43',
          club_id: '22222222-2222-4222-8222-222222222222',
          member_id: '2c7f9ea1-9d6c-4a7d-a011-8013fef0f313',
          check_total_cents: 9900,
          closed_at: '2026-03-11T01:33:47Z',
        },
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
      sampleRows: [
        {
          id: '7d6fd6c5-3589-49e8-b9bf-51e7b562dc51',
          club_id: '11111111-1111-4111-8111-111111111111',
          member_id: '4f89d8f1-2b61-4704-89d8-88f11a72be11',
          event_type: 'mobile_login',
          occurred_at: '2026-03-10T06:14:55Z',
        },
        {
          id: '2e2ddbf0-a231-49ab-b374-9485a4b67c52',
          club_id: '11111111-1111-4111-8111-111111111111',
          member_id: '7032f0dd-2935-43fc-b5f1-84f8cf7f4012',
          event_type: 'tee_time_cancelled_late',
          occurred_at: '2026-03-10T14:42:09Z',
        },
        {
          id: '95431d2e-52f2-43b1-b99e-45f3f832f253',
          club_id: '33333333-3333-4333-8333-333333333333',
          member_id: '2c7f9ea1-9d6c-4a7d-a011-8013fef0f313',
          event_type: 'dining_reservation_created',
          occurred_at: '2026-03-10T19:03:21Z',
        },
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
      sampleRows: [
        {
          id: 'ebed7023-c0a2-4d20-980a-0224449a1471',
          club_id: '11111111-1111-4111-8111-111111111111',
          member_id: '7032f0dd-2935-43fc-b5f1-84f8cf7f4012',
          source_event_id: '2e2ddbf0-a231-49ab-b374-9485a4b67c52',
          status: 'queued',
        },
        {
          id: '768918c0-91b0-4b89-a9bc-2f2180024e72',
          club_id: '11111111-1111-4111-8111-111111111111',
          member_id: '4f89d8f1-2b61-4704-89d8-88f11a72be11',
          source_event_id: '7d6fd6c5-3589-49e8-b9bf-51e7b562dc51',
          status: 'sent',
        },
        {
          id: 'bb84f368-f9df-4021-9a2d-0918f6fd4873',
          club_id: '33333333-3333-4333-8333-333333333333',
          member_id: null,
          source_event_id: null,
          status: 'dismissed',
        },
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
