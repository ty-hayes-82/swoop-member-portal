/**
 * Tool Registry — single source of truth for all agent tool definitions.
 *
 * Every tool that any managed agent can invoke is defined here with its
 * name, display name, description, category, risk level, and JSON Schema
 * input_schema.  The AGENT_TOOLS map assigns the subset each agent uses.
 *
 * Exports:
 *   AGENT_TOOLS        — { agentId: Tool[] }
 *   getToolsForAgent() — returns Tool[] for a given agentId
 *   getToolSchema()    — returns a single Tool by name (first match)
 */

// ---------------------------------------------------------------------------
// Individual tool definitions
// ---------------------------------------------------------------------------

const TOOLS = {
  // --- Member / profile tools ---
  lookup_member: {
    name: 'lookup_member',
    displayName: 'Lookup Member',
    description: 'Search for a member by name, email, or member number.',
    category: 'read',
    riskLevel: 'low',
    input_schema: {
      type: 'object',
      properties: {
        query:   { type: 'string', description: 'Search string — name, email, or member number' },
        club_id: { type: 'string', description: 'Club identifier to scope the search' },
      },
      required: ['query', 'club_id'],
    },
  },

  get_member_preferences: {
    name: 'get_member_preferences',
    displayName: 'Get Member Preferences',
    description: 'Retrieve stored preferences for a member (dietary, tee-time, communication, etc.).',
    category: 'read',
    riskLevel: 'low',
    input_schema: {
      type: 'object',
      properties: {
        member_id: { type: 'string', description: 'Member UUID' },
        club_id:   { type: 'string', description: 'Club identifier' },
      },
      required: ['member_id', 'club_id'],
    },
  },

  get_member_profile: {
    name: 'get_member_profile',
    displayName: 'Get Member Profile',
    description: 'Retrieve the full member profile including health score, tenure, and engagement summary.',
    category: 'read',
    riskLevel: 'low',
    input_schema: {
      type: 'object',
      properties: {
        member_id: { type: 'string', description: 'Member UUID' },
        club_id:   { type: 'string', description: 'Club identifier' },
      },
      required: ['member_id', 'club_id'],
    },
  },

  get_member_history: {
    name: 'get_member_history',
    displayName: 'Get Member History',
    description: 'Retrieve interaction and service history for a member.',
    category: 'read',
    riskLevel: 'low',
    input_schema: {
      type: 'object',
      properties: {
        member_id: { type: 'string', description: 'Member UUID' },
        club_id:   { type: 'string', description: 'Club identifier' },
        limit:     { type: 'integer', description: 'Max records to return', default: 50 },
      },
      required: ['member_id', 'club_id'],
    },
  },

  get_complaint_history: {
    name: 'get_complaint_history',
    displayName: 'Get Complaint History',
    description: 'Retrieve past complaints and resolutions for a member.',
    category: 'read',
    riskLevel: 'low',
    input_schema: {
      type: 'object',
      properties: {
        member_id: { type: 'string', description: 'Member UUID' },
        club_id:   { type: 'string', description: 'Club identifier' },
      },
      required: ['member_id', 'club_id'],
    },
  },

  // --- Communication tools ---
  send_message: {
    name: 'send_message',
    displayName: 'Send Message',
    description: 'Send a message to a member via their preferred channel (email, SMS, in-app).',
    category: 'communicate',
    riskLevel: 'medium',
    input_schema: {
      type: 'object',
      properties: {
        member_id: { type: 'string', description: 'Recipient member UUID' },
        club_id:   { type: 'string', description: 'Club identifier' },
        channel:   { type: 'string', enum: ['email', 'sms', 'in_app'], description: 'Delivery channel' },
        subject:   { type: 'string', description: 'Message subject (email only)' },
        body:      { type: 'string', description: 'Message body text' },
      },
      required: ['member_id', 'club_id', 'channel', 'body'],
    },
  },

  draft_member_message: {
    name: 'draft_member_message',
    displayName: 'Draft Member Message',
    description: 'Draft a message for GM review before sending to a member.',
    category: 'communicate',
    riskLevel: 'low',
    input_schema: {
      type: 'object',
      properties: {
        member_id: { type: 'string', description: 'Target member UUID' },
        club_id:   { type: 'string', description: 'Club identifier' },
        channel:   { type: 'string', enum: ['email', 'sms', 'in_app'], description: 'Intended channel' },
        subject:   { type: 'string', description: 'Message subject' },
        body:      { type: 'string', description: 'Draft message body' },
        context:   { type: 'string', description: 'Internal context for GM (not sent to member)' },
      },
      required: ['member_id', 'club_id', 'body'],
    },
  },

  // --- Calendar / events ---
  list_upcoming_events: {
    name: 'list_upcoming_events',
    displayName: 'List Upcoming Events',
    description: 'List upcoming club events within a date range.',
    category: 'read',
    riskLevel: 'low',
    input_schema: {
      type: 'object',
      properties: {
        club_id:    { type: 'string', description: 'Club identifier' },
        start_date: { type: 'string', format: 'date', description: 'Start of range (ISO date)' },
        end_date:   { type: 'string', format: 'date', description: 'End of range (ISO date)' },
        category:   { type: 'string', description: 'Optional event category filter' },
      },
      required: ['club_id'],
    },
  },

  get_club_calendar: {
    name: 'get_club_calendar',
    displayName: 'Get Club Calendar',
    description: 'Retrieve the club calendar for a specific date or date range.',
    category: 'read',
    riskLevel: 'low',
    input_schema: {
      type: 'object',
      properties: {
        club_id: { type: 'string', description: 'Club identifier' },
        date:    { type: 'string', format: 'date', description: 'Target date (ISO date)' },
      },
      required: ['club_id', 'date'],
    },
  },

  get_my_schedule: {
    name: 'get_my_schedule',
    displayName: 'Get My Schedule',
    description: 'Retrieve the requesting member\'s personal schedule (tee times, reservations, events).',
    category: 'read',
    riskLevel: 'low',
    input_schema: {
      type: 'object',
      properties: {
        member_id:  { type: 'string', description: 'Member UUID' },
        club_id:    { type: 'string', description: 'Club identifier' },
        start_date: { type: 'string', format: 'date', description: 'Start date' },
        end_date:   { type: 'string', format: 'date', description: 'End date' },
      },
      required: ['member_id', 'club_id'],
    },
  },

  // --- Weather ---
  get_weather_forecast: {
    name: 'get_weather_forecast',
    displayName: 'Get Weather Forecast',
    description: 'Retrieve the weather forecast for the club location.',
    category: 'read',
    riskLevel: 'low',
    input_schema: {
      type: 'object',
      properties: {
        club_id: { type: 'string', description: 'Club identifier' },
        date:    { type: 'string', format: 'date', description: 'Forecast date' },
      },
      required: ['club_id'],
    },
  },

  get_weather: {
    name: 'get_weather',
    displayName: 'Get Weather',
    description: 'Retrieve current and forecasted weather conditions for the club.',
    category: 'read',
    riskLevel: 'low',
    input_schema: {
      type: 'object',
      properties: {
        club_id: { type: 'string', description: 'Club identifier' },
        date:    { type: 'string', format: 'date', description: 'Target date (defaults to today)' },
      },
      required: ['club_id'],
    },
  },

  // --- Complaints / service requests ---
  file_complaint: {
    name: 'file_complaint',
    displayName: 'File Complaint',
    description: 'File a new member complaint with category, severity, and details.',
    category: 'write',
    riskLevel: 'high',
    input_schema: {
      type: 'object',
      properties: {
        member_id:   { type: 'string', description: 'Complaining member UUID' },
        club_id:     { type: 'string', description: 'Club identifier' },
        category:    { type: 'string', enum: ['course_conditions', 'food_beverage', 'staff', 'facilities', 'billing', 'other'], description: 'Complaint category' },
        severity:    { type: 'string', enum: ['low', 'medium', 'high', 'critical'], description: 'Severity level' },
        description: { type: 'string', description: 'Detailed complaint description' },
      },
      required: ['member_id', 'club_id', 'category', 'severity', 'description'],
    },
  },

  submit_service_request: {
    name: 'submit_service_request',
    displayName: 'Submit Service Request',
    description: 'Submit a service recovery request on behalf of a member.',
    category: 'write',
    riskLevel: 'medium',
    input_schema: {
      type: 'object',
      properties: {
        member_id:     { type: 'string', description: 'Member UUID' },
        club_id:       { type: 'string', description: 'Club identifier' },
        request_type:  { type: 'string', description: 'Type of service request' },
        description:   { type: 'string', description: 'Request details' },
        priority:      { type: 'string', enum: ['low', 'normal', 'high', 'urgent'], description: 'Request priority' },
      },
      required: ['member_id', 'club_id', 'request_type', 'description'],
    },
  },

  // --- Booking tools ---
  book_tee_time: {
    name: 'book_tee_time',
    displayName: 'Book Tee Time',
    description: 'Reserve a tee time for one or more players.',
    category: 'write',
    riskLevel: 'medium',
    input_schema: {
      type: 'object',
      properties: {
        club_id:      { type: 'string', description: 'Club identifier' },
        member_id:    { type: 'string', description: 'Booking member UUID' },
        date:         { type: 'string', format: 'date', description: 'Desired date (ISO date)' },
        time:         { type: 'string', description: 'Desired time (HH:MM)' },
        players:      { type: 'integer', minimum: 1, maximum: 4, description: 'Number of players' },
        guest_names:  { type: 'array', items: { type: 'string' }, description: 'Guest player names' },
      },
      required: ['club_id', 'member_id', 'date', 'time', 'players'],
    },
  },

  cancel_tee_time: {
    name: 'cancel_tee_time',
    displayName: 'Cancel Tee Time',
    description: 'Cancel an existing tee time reservation.',
    category: 'write',
    riskLevel: 'medium',
    input_schema: {
      type: 'object',
      properties: {
        club_id:        { type: 'string', description: 'Club identifier' },
        reservation_id: { type: 'string', description: 'Tee time reservation ID' },
        member_id:      { type: 'string', description: 'Member UUID requesting cancellation' },
        reason:         { type: 'string', description: 'Cancellation reason' },
      },
      required: ['club_id', 'reservation_id', 'member_id'],
    },
  },

  make_dining_reservation: {
    name: 'make_dining_reservation',
    displayName: 'Make Dining Reservation',
    description: 'Reserve a table at a club dining venue.',
    category: 'write',
    riskLevel: 'medium',
    input_schema: {
      type: 'object',
      properties: {
        club_id:     { type: 'string', description: 'Club identifier' },
        member_id:   { type: 'string', description: 'Booking member UUID' },
        venue:       { type: 'string', description: 'Dining venue name or ID' },
        date:        { type: 'string', format: 'date', description: 'Reservation date' },
        time:        { type: 'string', description: 'Reservation time (HH:MM)' },
        party_size:  { type: 'integer', minimum: 1, description: 'Number of guests' },
        notes:       { type: 'string', description: 'Special requests or dietary notes' },
      },
      required: ['club_id', 'member_id', 'venue', 'date', 'time', 'party_size'],
    },
  },

  check_availability: {
    name: 'check_availability',
    displayName: 'Check Availability',
    description: 'Check tee time or dining availability for a given date/time range.',
    category: 'read',
    riskLevel: 'low',
    input_schema: {
      type: 'object',
      properties: {
        club_id:    { type: 'string', description: 'Club identifier' },
        type:       { type: 'string', enum: ['tee_time', 'dining', 'event'], description: 'Availability type' },
        date:       { type: 'string', format: 'date', description: 'Target date' },
        start_time: { type: 'string', description: 'Start of time window (HH:MM)' },
        end_time:   { type: 'string', description: 'End of time window (HH:MM)' },
        party_size: { type: 'integer', description: 'Number of people' },
      },
      required: ['club_id', 'type', 'date'],
    },
  },

  add_to_waitlist: {
    name: 'add_to_waitlist',
    displayName: 'Add to Waitlist',
    description: 'Add a member to a waitlist for a fully-booked tee time or dining slot.',
    category: 'write',
    riskLevel: 'low',
    input_schema: {
      type: 'object',
      properties: {
        club_id:   { type: 'string', description: 'Club identifier' },
        member_id: { type: 'string', description: 'Member UUID' },
        type:      { type: 'string', enum: ['tee_time', 'dining', 'event'], description: 'Waitlist type' },
        date:      { type: 'string', format: 'date', description: 'Target date' },
        time:      { type: 'string', description: 'Preferred time (HH:MM)' },
      },
      required: ['club_id', 'member_id', 'type', 'date'],
    },
  },

  register_for_event: {
    name: 'register_for_event',
    displayName: 'Register for Event',
    description: 'Register a member for a club event.',
    category: 'write',
    riskLevel: 'medium',
    input_schema: {
      type: 'object',
      properties: {
        club_id:     { type: 'string', description: 'Club identifier' },
        member_id:   { type: 'string', description: 'Member UUID' },
        event_id:    { type: 'string', description: 'Event identifier' },
        guests:      { type: 'integer', minimum: 0, description: 'Number of additional guests' },
        notes:       { type: 'string', description: 'Registration notes' },
      },
      required: ['club_id', 'member_id', 'event_id'],
    },
  },

  // --- Action / intervention tools ---
  create_action: {
    name: 'create_action',
    displayName: 'Create Action',
    description: 'Create an action item (intervention, follow-up, or recommendation) for GM review.',
    category: 'write',
    riskLevel: 'medium',
    input_schema: {
      type: 'object',
      properties: {
        club_id:     { type: 'string', description: 'Club identifier' },
        agent_id:    { type: 'string', description: 'Creating agent identifier' },
        member_id:   { type: 'string', description: 'Target member UUID (if applicable)' },
        action_type: { type: 'string', description: 'Action category (e.g. outreach, comp, escalation)' },
        title:       { type: 'string', description: 'Short action title' },
        description: { type: 'string', description: 'Detailed action description' },
        priority:    { type: 'string', enum: ['low', 'normal', 'high', 'urgent'], description: 'Priority level' },
        due_date:    { type: 'string', format: 'date', description: 'Due date (ISO date)' },
      },
      required: ['club_id', 'action_type', 'title', 'description'],
    },
  },

  record_intervention_outcome: {
    name: 'record_intervention_outcome',
    displayName: 'Record Intervention Outcome',
    description: 'Record the outcome of a completed intervention (save, partial, loss).',
    category: 'write',
    riskLevel: 'medium',
    input_schema: {
      type: 'object',
      properties: {
        club_id:         { type: 'string', description: 'Club identifier' },
        intervention_id: { type: 'string', description: 'Intervention record ID' },
        outcome:         { type: 'string', enum: ['saved', 'partial', 'lost', 'pending'], description: 'Outcome status' },
        notes:           { type: 'string', description: 'Outcome notes' },
        revenue_impact:  { type: 'number', description: 'Estimated revenue impact in dollars' },
      },
      required: ['club_id', 'intervention_id', 'outcome'],
    },
  },

  update_playbook_step: {
    name: 'update_playbook_step',
    displayName: 'Update Playbook Step',
    description: 'Mark a playbook step as completed or update its status for a member lifecycle.',
    category: 'write',
    riskLevel: 'medium',
    input_schema: {
      type: 'object',
      properties: {
        club_id:     { type: 'string', description: 'Club identifier' },
        member_id:   { type: 'string', description: 'Member UUID' },
        playbook_id: { type: 'string', description: 'Playbook identifier' },
        step_number: { type: 'integer', description: 'Step number to update' },
        status:      { type: 'string', enum: ['pending', 'in_progress', 'completed', 'skipped'], description: 'Step status' },
        notes:       { type: 'string', description: 'Step completion notes' },
      },
      required: ['club_id', 'member_id', 'playbook_id', 'step_number', 'status'],
    },
  },

  // --- Tee sheet / scheduling ---
  get_tee_sheet: {
    name: 'get_tee_sheet',
    displayName: 'Get Tee Sheet',
    description: 'Retrieve the full tee sheet for a given date.',
    category: 'read',
    riskLevel: 'low',
    input_schema: {
      type: 'object',
      properties: {
        club_id: { type: 'string', description: 'Club identifier' },
        date:    { type: 'string', format: 'date', description: 'Tee sheet date (ISO date)' },
      },
      required: ['club_id', 'date'],
    },
  },

  get_staffing_schedule: {
    name: 'get_staffing_schedule',
    displayName: 'Get Staffing Schedule',
    description: 'Retrieve staffing schedule by department and date.',
    category: 'read',
    riskLevel: 'low',
    input_schema: {
      type: 'object',
      properties: {
        club_id:    { type: 'string', description: 'Club identifier' },
        date:       { type: 'string', format: 'date', description: 'Schedule date' },
        department: { type: 'string', description: 'Department filter (optional)' },
      },
      required: ['club_id', 'date'],
    },
  },

  get_demand_forecast: {
    name: 'get_demand_forecast',
    displayName: 'Get Demand Forecast',
    description: 'Retrieve demand forecast (rounds, covers, events) for planning.',
    category: 'read',
    riskLevel: 'low',
    input_schema: {
      type: 'object',
      properties: {
        club_id:    { type: 'string', description: 'Club identifier' },
        date:       { type: 'string', format: 'date', description: 'Forecast date' },
        range_days: { type: 'integer', description: 'Number of days to forecast (default 1)', default: 1 },
      },
      required: ['club_id', 'date'],
    },
  },

  get_labor_costs: {
    name: 'get_labor_costs',
    displayName: 'Get Labor Costs',
    description: 'Retrieve labor cost data by department and period.',
    category: 'read',
    riskLevel: 'low',
    input_schema: {
      type: 'object',
      properties: {
        club_id:    { type: 'string', description: 'Club identifier' },
        start_date: { type: 'string', format: 'date', description: 'Period start' },
        end_date:   { type: 'string', format: 'date', description: 'Period end' },
        department: { type: 'string', description: 'Department filter (optional)' },
      },
      required: ['club_id', 'start_date', 'end_date'],
    },
  },

  // --- F&B tools ---
  get_fb_revenue: {
    name: 'get_fb_revenue',
    displayName: 'Get F&B Revenue',
    description: 'Retrieve food & beverage revenue data by venue, period, and category.',
    category: 'read',
    riskLevel: 'low',
    input_schema: {
      type: 'object',
      properties: {
        club_id:    { type: 'string', description: 'Club identifier' },
        start_date: { type: 'string', format: 'date', description: 'Period start' },
        end_date:   { type: 'string', format: 'date', description: 'Period end' },
        venue:      { type: 'string', description: 'Venue filter (optional)' },
      },
      required: ['club_id', 'start_date', 'end_date'],
    },
  },

  get_fb_reservations: {
    name: 'get_fb_reservations',
    displayName: 'Get F&B Reservations',
    description: 'Retrieve dining reservations for a given date.',
    category: 'read',
    riskLevel: 'low',
    input_schema: {
      type: 'object',
      properties: {
        club_id: { type: 'string', description: 'Club identifier' },
        date:    { type: 'string', format: 'date', description: 'Reservation date' },
        venue:   { type: 'string', description: 'Venue filter (optional)' },
      },
      required: ['club_id', 'date'],
    },
  },

  get_menu_performance: {
    name: 'get_menu_performance',
    displayName: 'Get Menu Performance',
    description: 'Retrieve menu item performance data — sales, margins, popularity rankings.',
    category: 'read',
    riskLevel: 'low',
    input_schema: {
      type: 'object',
      properties: {
        club_id:    { type: 'string', description: 'Club identifier' },
        start_date: { type: 'string', format: 'date', description: 'Period start' },
        end_date:   { type: 'string', format: 'date', description: 'Period end' },
        venue:      { type: 'string', description: 'Venue filter (optional)' },
      },
      required: ['club_id', 'start_date', 'end_date'],
    },
  },

  get_post_round_conversion: {
    name: 'get_post_round_conversion',
    displayName: 'Get Post-Round Conversion',
    description: 'Retrieve post-round F&B conversion rates — what percentage of golfers dine after play.',
    category: 'read',
    riskLevel: 'low',
    input_schema: {
      type: 'object',
      properties: {
        club_id:    { type: 'string', description: 'Club identifier' },
        start_date: { type: 'string', format: 'date', description: 'Period start' },
        end_date:   { type: 'string', format: 'date', description: 'Period end' },
      },
      required: ['club_id', 'start_date', 'end_date'],
    },
  },

  // --- Game plan ---
  get_daily_game_plan_history: {
    name: 'get_daily_game_plan_history',
    displayName: 'Get Daily Game Plan History',
    description: 'Retrieve past daily game plans for trend analysis and comparison.',
    category: 'read',
    riskLevel: 'low',
    input_schema: {
      type: 'object',
      properties: {
        club_id: { type: 'string', description: 'Club identifier' },
        limit:   { type: 'integer', description: 'Number of past plans to retrieve', default: 7 },
      },
      required: ['club_id'],
    },
  },

  get_member_risk_list: {
    name: 'get_member_risk_list',
    displayName: 'Get Member Risk List',
    description: 'Retrieve the current at-risk member list with health scores and risk factors.',
    category: 'read',
    riskLevel: 'low',
    input_schema: {
      type: 'object',
      properties: {
        club_id:   { type: 'string', description: 'Club identifier' },
        threshold: { type: 'number', description: 'Health score threshold (members below this are included)', default: 60 },
        limit:     { type: 'integer', description: 'Max members to return', default: 25 },
      },
      required: ['club_id'],
    },
  },

  // --- Reporting / KPI tools ---
  get_monthly_kpis: {
    name: 'get_monthly_kpis',
    displayName: 'Get Monthly KPIs',
    description: 'Retrieve monthly key performance indicators across all domains.',
    category: 'read',
    riskLevel: 'low',
    input_schema: {
      type: 'object',
      properties: {
        club_id: { type: 'string', description: 'Club identifier' },
        month:   { type: 'string', description: 'Target month (YYYY-MM)' },
      },
      required: ['club_id', 'month'],
    },
  },

  get_intervention_outcomes: {
    name: 'get_intervention_outcomes',
    displayName: 'Get Intervention Outcomes',
    description: 'Retrieve aggregated intervention outcomes for reporting.',
    category: 'read',
    riskLevel: 'low',
    input_schema: {
      type: 'object',
      properties: {
        club_id:    { type: 'string', description: 'Club identifier' },
        start_date: { type: 'string', format: 'date', description: 'Period start' },
        end_date:   { type: 'string', format: 'date', description: 'Period end' },
      },
      required: ['club_id', 'start_date', 'end_date'],
    },
  },

  get_retention_metrics: {
    name: 'get_retention_metrics',
    displayName: 'Get Retention Metrics',
    description: 'Retrieve member retention and churn metrics.',
    category: 'read',
    riskLevel: 'low',
    input_schema: {
      type: 'object',
      properties: {
        club_id: { type: 'string', description: 'Club identifier' },
        period:  { type: 'string', enum: ['monthly', 'quarterly', 'annual'], description: 'Reporting period' },
      },
      required: ['club_id', 'period'],
    },
  },

  get_financial_summary: {
    name: 'get_financial_summary',
    displayName: 'Get Financial Summary',
    description: 'Retrieve high-level financial summary for board reporting.',
    category: 'read',
    riskLevel: 'low',
    input_schema: {
      type: 'object',
      properties: {
        club_id: { type: 'string', description: 'Club identifier' },
        month:   { type: 'string', description: 'Target month (YYYY-MM)' },
      },
      required: ['club_id', 'month'],
    },
  },

  // --- Revenue tools ---
  get_golf_revenue: {
    name: 'get_golf_revenue',
    displayName: 'Get Golf Revenue',
    description: 'Retrieve golf-related revenue (green fees, cart fees, range, lessons).',
    category: 'read',
    riskLevel: 'low',
    input_schema: {
      type: 'object',
      properties: {
        club_id:    { type: 'string', description: 'Club identifier' },
        start_date: { type: 'string', format: 'date', description: 'Period start' },
        end_date:   { type: 'string', format: 'date', description: 'Period end' },
      },
      required: ['club_id', 'start_date', 'end_date'],
    },
  },

  get_event_revenue: {
    name: 'get_event_revenue',
    displayName: 'Get Event Revenue',
    description: 'Retrieve event and banquet revenue data.',
    category: 'read',
    riskLevel: 'low',
    input_schema: {
      type: 'object',
      properties: {
        club_id:    { type: 'string', description: 'Club identifier' },
        start_date: { type: 'string', format: 'date', description: 'Period start' },
        end_date:   { type: 'string', format: 'date', description: 'Period end' },
      },
      required: ['club_id', 'start_date', 'end_date'],
    },
  },

  get_membership_dues: {
    name: 'get_membership_dues',
    displayName: 'Get Membership Dues',
    description: 'Retrieve membership dues collection data and aging.',
    category: 'read',
    riskLevel: 'low',
    input_schema: {
      type: 'object',
      properties: {
        club_id: { type: 'string', description: 'Club identifier' },
        month:   { type: 'string', description: 'Target month (YYYY-MM)' },
      },
      required: ['club_id', 'month'],
    },
  },

  get_financial_forecasts: {
    name: 'get_financial_forecasts',
    displayName: 'Get Financial Forecasts',
    description: 'Retrieve financial forecasts and budget-vs-actual comparisons.',
    category: 'read',
    riskLevel: 'low',
    input_schema: {
      type: 'object',
      properties: {
        club_id:    { type: 'string', description: 'Club identifier' },
        start_date: { type: 'string', format: 'date', description: 'Forecast start' },
        end_date:   { type: 'string', format: 'date', description: 'Forecast end' },
      },
      required: ['club_id', 'start_date', 'end_date'],
    },
  },

  // --- Growth / pipeline tools ---
  get_guest_passes: {
    name: 'get_guest_passes',
    displayName: 'Get Guest Passes',
    description: 'Retrieve guest pass usage and conversion data.',
    category: 'read',
    riskLevel: 'low',
    input_schema: {
      type: 'object',
      properties: {
        club_id:    { type: 'string', description: 'Club identifier' },
        start_date: { type: 'string', format: 'date', description: 'Period start' },
        end_date:   { type: 'string', format: 'date', description: 'Period end' },
      },
      required: ['club_id', 'start_date', 'end_date'],
    },
  },

  get_trial_memberships: {
    name: 'get_trial_memberships',
    displayName: 'Get Trial Memberships',
    description: 'Retrieve trial membership data — active trials, conversion rates, engagement.',
    category: 'read',
    riskLevel: 'low',
    input_schema: {
      type: 'object',
      properties: {
        club_id: { type: 'string', description: 'Club identifier' },
        status:  { type: 'string', enum: ['active', 'converted', 'expired', 'all'], description: 'Status filter' },
      },
      required: ['club_id'],
    },
  },

  get_referral_programs: {
    name: 'get_referral_programs',
    displayName: 'Get Referral Programs',
    description: 'Retrieve referral program performance — referrals made, conversions, rewards issued.',
    category: 'read',
    riskLevel: 'low',
    input_schema: {
      type: 'object',
      properties: {
        club_id: { type: 'string', description: 'Club identifier' },
      },
      required: ['club_id'],
    },
  },

  get_prospect_activity: {
    name: 'get_prospect_activity',
    displayName: 'Get Prospect Activity',
    description: 'Retrieve prospect/lead activity — visits, inquiries, propensity scores.',
    category: 'read',
    riskLevel: 'low',
    input_schema: {
      type: 'object',
      properties: {
        club_id:    { type: 'string', description: 'Club identifier' },
        start_date: { type: 'string', format: 'date', description: 'Period start' },
        end_date:   { type: 'string', format: 'date', description: 'Period end' },
        min_score:  { type: 'number', description: 'Minimum propensity score filter' },
      },
      required: ['club_id'],
    },
  },
};

// ---------------------------------------------------------------------------
// Agent -> Tool assignments
// ---------------------------------------------------------------------------

export const AGENT_TOOLS = {
  'personal-concierge': [
    TOOLS.lookup_member,
    TOOLS.get_member_preferences,
    TOOLS.send_message,
    TOOLS.list_upcoming_events,
    TOOLS.get_weather_forecast,
    TOOLS.get_club_calendar,
    TOOLS.get_my_schedule,
  ],

  'member-service-recovery': [
    TOOLS.file_complaint,
    TOOLS.cancel_tee_time,
    TOOLS.get_member_history,
    TOOLS.submit_service_request,
  ],

  'booking-agent': [
    TOOLS.book_tee_time,
    TOOLS.cancel_tee_time,
    TOOLS.make_dining_reservation,
    TOOLS.check_availability,
    TOOLS.add_to_waitlist,
    TOOLS.register_for_event,
  ],

  'member-risk-lifecycle': [
    TOOLS.get_member_profile,
    TOOLS.create_action,
    TOOLS.record_intervention_outcome,
    TOOLS.draft_member_message,
    TOOLS.update_playbook_step,
  ],

  'service-recovery': [
    TOOLS.get_member_profile,
    TOOLS.get_complaint_history,
    TOOLS.create_action,
    TOOLS.draft_member_message,
  ],

  'tomorrows-game-plan': [
    TOOLS.get_tee_sheet,
    TOOLS.get_weather,
    TOOLS.get_staffing_schedule,
    TOOLS.get_fb_reservations,
    TOOLS.get_member_risk_list,
    TOOLS.get_daily_game_plan_history,
  ],

  'staffing-demand': [
    TOOLS.get_staffing_schedule,
    TOOLS.get_demand_forecast,
    TOOLS.get_labor_costs,
    TOOLS.create_action,
  ],

  'fb-intelligence': [
    TOOLS.get_fb_revenue,
    TOOLS.get_menu_performance,
    TOOLS.get_post_round_conversion,
    TOOLS.get_staffing_schedule,
    TOOLS.create_action,
  ],

  'board-report-compiler': [
    TOOLS.get_monthly_kpis,
    TOOLS.get_intervention_outcomes,
    TOOLS.get_retention_metrics,
    TOOLS.get_financial_summary,
  ],

  'revenue-analyst': [
    TOOLS.get_fb_revenue,
    TOOLS.get_golf_revenue,
    TOOLS.get_event_revenue,
    TOOLS.get_membership_dues,
    TOOLS.get_financial_forecasts,
  ],

  'growth-pipeline': [
    TOOLS.get_guest_passes,
    TOOLS.get_trial_memberships,
    TOOLS.get_referral_programs,
    TOOLS.get_prospect_activity,
    TOOLS.create_action,
  ],

  'chief-of-staff': [],  // Uses callable_agents, not direct tools
};

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

/**
 * Return the tool array for a given agent ID.
 * Returns an empty array if the agent is unknown.
 *
 * @param {string} agentId — e.g. 'booking-agent'
 * @returns {object[]}
 */
export function getToolsForAgent(agentId) {
  return AGENT_TOOLS[agentId] || [];
}

/**
 * Look up a single tool definition by name across all agents.
 * Returns the first match or undefined.
 *
 * @param {string} toolName — e.g. 'book_tee_time'
 * @returns {object|undefined}
 */
export function getToolSchema(toolName) {
  return TOOLS[toolName] || undefined;
}
