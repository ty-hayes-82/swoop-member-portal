export const vercelPostgresSchema = {
  tables: [
  {
    "name": "club",
    "description": "",
    "columns": [
      {
        "name": "club_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "name",
        "type": "text",
        "nullable": false
      },
      {
        "name": "city",
        "type": "text",
        "nullable": false
      },
      {
        "name": "state",
        "type": "text",
        "nullable": false
      },
      {
        "name": "zip",
        "type": "text",
        "nullable": false
      },
      {
        "name": "founded_year",
        "type": "integer",
        "nullable": true
      },
      {
        "name": "member_count",
        "type": "integer",
        "nullable": true
      },
      {
        "name": "course_count",
        "type": "integer",
        "nullable": true
      },
      {
        "name": "outlet_count",
        "type": "integer",
        "nullable": true
      }
    ],
    "relationships": []
  },
  {
    "name": "courses",
    "description": "",
    "columns": [
      {
        "name": "course_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "club_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "name",
        "type": "text",
        "nullable": false
      },
      {
        "name": "holes",
        "type": "integer",
        "nullable": false
      },
      {
        "name": "par",
        "type": "integer",
        "nullable": false
      },
      {
        "name": "tee_interval_min",
        "type": "integer",
        "nullable": false
      },
      {
        "name": "first_tee",
        "type": "text",
        "nullable": false
      },
      {
        "name": "last_tee",
        "type": "text",
        "nullable": false
      }
    ],
    "relationships": [
      {
        "fromColumn": "club_id",
        "toTable": "club",
        "toColumn": "club_id"
      }
    ]
  },
  {
    "name": "dining_outlets",
    "description": "",
    "columns": [
      {
        "name": "outlet_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "club_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "name",
        "type": "text",
        "nullable": false
      },
      {
        "name": "type",
        "type": "text",
        "nullable": false
      },
      {
        "name": "meal_periods",
        "type": "text",
        "nullable": false
      },
      {
        "name": "weekday_covers",
        "type": "integer",
        "nullable": false
      },
      {
        "name": "weekend_covers",
        "type": "integer",
        "nullable": false
      }
    ],
    "relationships": [
      {
        "fromColumn": "club_id",
        "toTable": "club",
        "toColumn": "club_id"
      }
    ]
  },
  {
    "name": "membership_types",
    "description": "",
    "columns": [
      {
        "name": "type_code",
        "type": "text",
        "nullable": false
      },
      {
        "name": "name",
        "type": "text",
        "nullable": false
      },
      {
        "name": "annual_dues",
        "type": "real",
        "nullable": false
      },
      {
        "name": "fb_minimum",
        "type": "real",
        "nullable": false
      },
      {
        "name": "golf_eligible",
        "type": "integer",
        "nullable": false
      }
    ],
    "relationships": []
  },
  {
    "name": "households",
    "description": "",
    "columns": [
      {
        "name": "household_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "primary_member_id",
        "type": "text",
        "nullable": true
      },
      {
        "name": "member_count",
        "type": "integer",
        "nullable": false
      },
      {
        "name": "address",
        "type": "text",
        "nullable": true
      },
      {
        "name": "is_multi_member",
        "type": "integer",
        "nullable": false
      }
    ],
    "relationships": []
  },
  {
    "name": "members",
    "description": "",
    "columns": [
      {
        "name": "member_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "member_number",
        "type": "integer",
        "nullable": false
      },
      {
        "name": "first_name",
        "type": "text",
        "nullable": false
      },
      {
        "name": "last_name",
        "type": "text",
        "nullable": false
      },
      {
        "name": "email",
        "type": "text",
        "nullable": true
      },
      {
        "name": "phone",
        "type": "text",
        "nullable": true
      },
      {
        "name": "date_of_birth",
        "type": "text",
        "nullable": true
      },
      {
        "name": "gender",
        "type": "text",
        "nullable": true
      },
      {
        "name": "membership_type",
        "type": "text",
        "nullable": false
      },
      {
        "name": "membership_status",
        "type": "text",
        "nullable": false
      },
      {
        "name": "join_date",
        "type": "text",
        "nullable": false
      },
      {
        "name": "resigned_on",
        "type": "text",
        "nullable": true
      },
      {
        "name": "household_id",
        "type": "text",
        "nullable": true
      },
      {
        "name": "archetype",
        "type": "text",
        "nullable": false
      },
      {
        "name": "annual_dues",
        "type": "real",
        "nullable": false
      },
      {
        "name": "account_balance",
        "type": "real",
        "nullable": false
      },
      {
        "name": "ghin_number",
        "type": "text",
        "nullable": true
      },
      {
        "name": "communication_opt_in",
        "type": "integer",
        "nullable": false
      }
    ],
    "relationships": [
      {
        "fromColumn": "membership_type",
        "toTable": "membership_types",
        "toColumn": "type_code"
      },
      {
        "fromColumn": "household_id",
        "toTable": "households",
        "toColumn": "household_id"
      }
    ]
  },
  {
    "name": "bookings",
    "description": "",
    "columns": [
      {
        "name": "booking_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "club_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "course_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "booking_date",
        "type": "text",
        "nullable": false
      },
      {
        "name": "tee_time",
        "type": "text",
        "nullable": false
      },
      {
        "name": "player_count",
        "type": "integer",
        "nullable": false
      },
      {
        "name": "has_guest",
        "type": "integer",
        "nullable": false
      },
      {
        "name": "transportation",
        "type": "text",
        "nullable": false
      },
      {
        "name": "has_caddie",
        "type": "integer",
        "nullable": false
      },
      {
        "name": "round_type",
        "type": "text",
        "nullable": false
      },
      {
        "name": "status",
        "type": "text",
        "nullable": false
      },
      {
        "name": "check_in_time",
        "type": "text",
        "nullable": true
      },
      {
        "name": "round_start",
        "type": "text",
        "nullable": true
      },
      {
        "name": "round_end",
        "type": "text",
        "nullable": true
      },
      {
        "name": "duration_minutes",
        "type": "integer",
        "nullable": true
      }
    ],
    "relationships": [
      {
        "fromColumn": "club_id",
        "toTable": "club",
        "toColumn": "club_id"
      },
      {
        "fromColumn": "course_id",
        "toTable": "courses",
        "toColumn": "course_id"
      }
    ]
  },
  {
    "name": "booking_players",
    "description": "",
    "columns": [
      {
        "name": "player_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "booking_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "member_id",
        "type": "text",
        "nullable": true
      },
      {
        "name": "guest_name",
        "type": "text",
        "nullable": true
      },
      {
        "name": "is_guest",
        "type": "integer",
        "nullable": false
      },
      {
        "name": "is_warm_lead",
        "type": "integer",
        "nullable": false
      },
      {
        "name": "position_in_group",
        "type": "integer",
        "nullable": false
      }
    ],
    "relationships": [
      {
        "fromColumn": "booking_id",
        "toTable": "bookings",
        "toColumn": "booking_id"
      }
    ]
  },
  {
    "name": "pace_of_play",
    "description": "",
    "columns": [
      {
        "name": "pace_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "booking_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "total_minutes",
        "type": "integer",
        "nullable": false
      },
      {
        "name": "is_slow_round",
        "type": "integer",
        "nullable": false
      },
      {
        "name": "groups_passed",
        "type": "integer",
        "nullable": false
      },
      {
        "name": "ranger_interventions",
        "type": "integer",
        "nullable": false
      }
    ],
    "relationships": [
      {
        "fromColumn": "booking_id",
        "toTable": "bookings",
        "toColumn": "booking_id"
      }
    ]
  },
  {
    "name": "pace_hole_segments",
    "description": "",
    "columns": [
      {
        "name": "segment_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "pace_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "hole_number",
        "type": "integer",
        "nullable": false
      },
      {
        "name": "tee_time",
        "type": "text",
        "nullable": true
      },
      {
        "name": "green_time",
        "type": "text",
        "nullable": true
      },
      {
        "name": "segment_minutes",
        "type": "integer",
        "nullable": false
      },
      {
        "name": "is_bottleneck",
        "type": "integer",
        "nullable": false
      }
    ],
    "relationships": [
      {
        "fromColumn": "pace_id",
        "toTable": "pace_of_play",
        "toColumn": "pace_id"
      }
    ]
  },
  {
    "name": "waitlist_entries",
    "description": "",
    "columns": [
      {
        "name": "entry_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "club_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "course_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "requested_date",
        "type": "text",
        "nullable": false
      },
      {
        "name": "requested_tee_time",
        "type": "text",
        "nullable": false
      },
      {
        "name": "waitlist_count",
        "type": "integer",
        "nullable": false
      },
      {
        "name": "has_event_overlap",
        "type": "integer",
        "nullable": false
      },
      {
        "name": "peak_slot",
        "type": "text",
        "nullable": true
      }
    ],
    "relationships": [
      {
        "fromColumn": "club_id",
        "toTable": "club",
        "toColumn": "club_id"
      },
      {
        "fromColumn": "course_id",
        "toTable": "courses",
        "toColumn": "course_id"
      }
    ]
  },
  {
    "name": "pos_checks",
    "description": "",
    "columns": [
      {
        "name": "check_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "outlet_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "member_id",
        "type": "text",
        "nullable": true
      },
      {
        "name": "opened_at",
        "type": "text",
        "nullable": false
      },
      {
        "name": "closed_at",
        "type": "text",
        "nullable": true
      },
      {
        "name": "first_item_fired_at",
        "type": "text",
        "nullable": true
      },
      {
        "name": "last_item_fulfilled_at",
        "type": "text",
        "nullable": true
      },
      {
        "name": "subtotal",
        "type": "real",
        "nullable": false
      },
      {
        "name": "tax_amount",
        "type": "real",
        "nullable": false
      },
      {
        "name": "tip_amount",
        "type": "real",
        "nullable": false
      },
      {
        "name": "comp_amount",
        "type": "real",
        "nullable": false
      },
      {
        "name": "discount_amount",
        "type": "real",
        "nullable": false
      },
      {
        "name": "void_amount",
        "type": "real",
        "nullable": false
      },
      {
        "name": "total",
        "type": "real",
        "nullable": false
      },
      {
        "name": "payment_method",
        "type": "text",
        "nullable": false
      },
      {
        "name": "post_round_dining",
        "type": "integer",
        "nullable": false
      },
      {
        "name": "linked_booking_id",
        "type": "text",
        "nullable": true
      },
      {
        "name": "event_id",
        "type": "text",
        "nullable": true
      },
      {
        "name": "is_understaffed_day",
        "type": "integer",
        "nullable": false
      }
    ],
    "relationships": [
      {
        "fromColumn": "outlet_id",
        "toTable": "dining_outlets",
        "toColumn": "outlet_id"
      },
      {
        "fromColumn": "member_id",
        "toTable": "members",
        "toColumn": "member_id"
      },
      {
        "fromColumn": "linked_booking_id",
        "toTable": "bookings",
        "toColumn": "booking_id"
      }
    ]
  },
  {
    "name": "pos_line_items",
    "description": "",
    "columns": [
      {
        "name": "line_item_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "check_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "item_name",
        "type": "text",
        "nullable": false
      },
      {
        "name": "category",
        "type": "text",
        "nullable": false
      },
      {
        "name": "unit_price",
        "type": "real",
        "nullable": false
      },
      {
        "name": "quantity",
        "type": "integer",
        "nullable": false
      },
      {
        "name": "line_total",
        "type": "real",
        "nullable": false
      },
      {
        "name": "is_comp",
        "type": "integer",
        "nullable": false
      },
      {
        "name": "is_void",
        "type": "integer",
        "nullable": false
      },
      {
        "name": "fired_at",
        "type": "text",
        "nullable": true
      }
    ],
    "relationships": [
      {
        "fromColumn": "check_id",
        "toTable": "pos_checks",
        "toColumn": "check_id"
      }
    ]
  },
  {
    "name": "pos_payments",
    "description": "",
    "columns": [
      {
        "name": "payment_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "check_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "payment_method",
        "type": "text",
        "nullable": false
      },
      {
        "name": "amount",
        "type": "real",
        "nullable": false
      },
      {
        "name": "processed_at",
        "type": "text",
        "nullable": false
      },
      {
        "name": "is_split",
        "type": "integer",
        "nullable": false
      }
    ],
    "relationships": [
      {
        "fromColumn": "check_id",
        "toTable": "pos_checks",
        "toColumn": "check_id"
      }
    ]
  },
  {
    "name": "event_definitions",
    "description": "",
    "columns": [
      {
        "name": "event_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "club_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "name",
        "type": "text",
        "nullable": false
      },
      {
        "name": "type",
        "type": "text",
        "nullable": false
      },
      {
        "name": "event_date",
        "type": "text",
        "nullable": false
      },
      {
        "name": "capacity",
        "type": "integer",
        "nullable": false
      },
      {
        "name": "registration_fee",
        "type": "real",
        "nullable": false
      },
      {
        "name": "description",
        "type": "text",
        "nullable": true
      }
    ],
    "relationships": [
      {
        "fromColumn": "club_id",
        "toTable": "club",
        "toColumn": "club_id"
      }
    ]
  },
  {
    "name": "event_registrations",
    "description": "",
    "columns": [
      {
        "name": "registration_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "event_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "member_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "status",
        "type": "text",
        "nullable": false
      },
      {
        "name": "guest_count",
        "type": "integer",
        "nullable": false
      },
      {
        "name": "fee_paid",
        "type": "real",
        "nullable": false
      },
      {
        "name": "registered_at",
        "type": "text",
        "nullable": false
      },
      {
        "name": "checked_in_at",
        "type": "text",
        "nullable": true
      }
    ],
    "relationships": [
      {
        "fromColumn": "event_id",
        "toTable": "event_definitions",
        "toColumn": "event_id"
      },
      {
        "fromColumn": "member_id",
        "toTable": "members",
        "toColumn": "member_id"
      }
    ]
  },
  {
    "name": "email_campaigns",
    "description": "",
    "columns": [
      {
        "name": "campaign_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "club_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "subject",
        "type": "text",
        "nullable": false
      },
      {
        "name": "type",
        "type": "text",
        "nullable": false
      },
      {
        "name": "send_date",
        "type": "text",
        "nullable": false
      },
      {
        "name": "recipient_count",
        "type": "integer",
        "nullable": false
      },
      {
        "name": "html_content_url",
        "type": "text",
        "nullable": true
      }
    ],
    "relationships": [
      {
        "fromColumn": "club_id",
        "toTable": "club",
        "toColumn": "club_id"
      }
    ]
  },
  {
    "name": "email_events",
    "description": "",
    "columns": [
      {
        "name": "event_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "campaign_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "member_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "event_type",
        "type": "text",
        "nullable": false
      },
      {
        "name": "occurred_at",
        "type": "text",
        "nullable": false
      },
      {
        "name": "link_clicked",
        "type": "text",
        "nullable": true
      },
      {
        "name": "device_type",
        "type": "text",
        "nullable": true
      }
    ],
    "relationships": [
      {
        "fromColumn": "campaign_id",
        "toTable": "email_campaigns",
        "toColumn": "campaign_id"
      },
      {
        "fromColumn": "member_id",
        "toTable": "members",
        "toColumn": "member_id"
      }
    ]
  },
  {
    "name": "feedback",
    "description": "",
    "columns": [
      {
        "name": "feedback_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "member_id",
        "type": "text",
        "nullable": true
      },
      {
        "name": "club_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "submitted_at",
        "type": "text",
        "nullable": false
      },
      {
        "name": "category",
        "type": "text",
        "nullable": false
      },
      {
        "name": "sentiment_score",
        "type": "real",
        "nullable": false
      },
      {
        "name": "description",
        "type": "text",
        "nullable": true
      },
      {
        "name": "status",
        "type": "text",
        "nullable": false
      },
      {
        "name": "resolved_at",
        "type": "text",
        "nullable": true
      },
      {
        "name": "is_understaffed_day",
        "type": "integer",
        "nullable": false
      }
    ],
    "relationships": [
      {
        "fromColumn": "member_id",
        "toTable": "members",
        "toColumn": "member_id"
      },
      {
        "fromColumn": "club_id",
        "toTable": "club",
        "toColumn": "club_id"
      }
    ]
  },
  {
    "name": "service_requests",
    "description": "",
    "columns": [
      {
        "name": "request_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "member_id",
        "type": "text",
        "nullable": true
      },
      {
        "name": "booking_id",
        "type": "text",
        "nullable": true
      },
      {
        "name": "request_type",
        "type": "text",
        "nullable": false
      },
      {
        "name": "requested_at",
        "type": "text",
        "nullable": false
      },
      {
        "name": "response_time_min",
        "type": "integer",
        "nullable": true
      },
      {
        "name": "resolved_at",
        "type": "text",
        "nullable": true
      },
      {
        "name": "resolution_notes",
        "type": "text",
        "nullable": true
      },
      {
        "name": "is_understaffed_day",
        "type": "integer",
        "nullable": false
      }
    ],
    "relationships": [
      {
        "fromColumn": "member_id",
        "toTable": "members",
        "toColumn": "member_id"
      },
      {
        "fromColumn": "booking_id",
        "toTable": "bookings",
        "toColumn": "booking_id"
      }
    ]
  },
  {
    "name": "staff",
    "description": "",
    "columns": [
      {
        "name": "staff_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "club_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "first_name",
        "type": "text",
        "nullable": false
      },
      {
        "name": "last_name",
        "type": "text",
        "nullable": false
      },
      {
        "name": "department",
        "type": "text",
        "nullable": false
      },
      {
        "name": "role",
        "type": "text",
        "nullable": false
      },
      {
        "name": "hire_date",
        "type": "text",
        "nullable": false
      },
      {
        "name": "hourly_rate",
        "type": "real",
        "nullable": false
      },
      {
        "name": "is_full_time",
        "type": "integer",
        "nullable": false
      }
    ],
    "relationships": [
      {
        "fromColumn": "club_id",
        "toTable": "club",
        "toColumn": "club_id"
      }
    ]
  },
  {
    "name": "staff_shifts",
    "description": "",
    "columns": [
      {
        "name": "shift_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "staff_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "shift_date",
        "type": "text",
        "nullable": false
      },
      {
        "name": "outlet_id",
        "type": "text",
        "nullable": true
      },
      {
        "name": "start_time",
        "type": "text",
        "nullable": false
      },
      {
        "name": "end_time",
        "type": "text",
        "nullable": false
      },
      {
        "name": "hours_worked",
        "type": "real",
        "nullable": false
      },
      {
        "name": "is_understaffed_day",
        "type": "integer",
        "nullable": false
      },
      {
        "name": "notes",
        "type": "text",
        "nullable": true
      }
    ],
    "relationships": [
      {
        "fromColumn": "staff_id",
        "toTable": "staff",
        "toColumn": "staff_id"
      }
    ]
  },
  {
    "name": "close_outs",
    "description": "",
    "columns": [
      {
        "name": "closeout_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "club_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "date",
        "type": "text",
        "nullable": false
      },
      {
        "name": "golf_revenue",
        "type": "real",
        "nullable": false
      },
      {
        "name": "fb_revenue",
        "type": "real",
        "nullable": false
      },
      {
        "name": "total_revenue",
        "type": "real",
        "nullable": false
      },
      {
        "name": "rounds_played",
        "type": "integer",
        "nullable": false
      },
      {
        "name": "covers",
        "type": "integer",
        "nullable": false
      },
      {
        "name": "weather",
        "type": "text",
        "nullable": false
      },
      {
        "name": "is_understaffed",
        "type": "integer",
        "nullable": false
      }
    ],
    "relationships": [
      {
        "fromColumn": "club_id",
        "toTable": "club",
        "toColumn": "club_id"
      }
    ]
  },
  {
    "name": "canonical_events",
    "description": "",
    "columns": [
      {
        "name": "event_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "entity_type",
        "type": "text",
        "nullable": false
      },
      {
        "name": "entity_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "event_type",
        "type": "text",
        "nullable": false
      },
      {
        "name": "event_timestamp",
        "type": "text",
        "nullable": false
      },
      {
        "name": "source_vendor",
        "type": "text",
        "nullable": false
      },
      {
        "name": "payload",
        "type": "text",
        "nullable": false
      }
    ],
    "relationships": []
  },
  {
    "name": "member_engagement_daily",
    "description": "",
    "columns": [
      {
        "name": "row_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "member_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "date",
        "type": "text",
        "nullable": false
      },
      {
        "name": "rounds_played",
        "type": "integer",
        "nullable": false
      },
      {
        "name": "dining_checks",
        "type": "integer",
        "nullable": false
      },
      {
        "name": "dining_spend",
        "type": "real",
        "nullable": false
      },
      {
        "name": "events_attended",
        "type": "integer",
        "nullable": false
      },
      {
        "name": "emails_opened",
        "type": "integer",
        "nullable": false
      },
      {
        "name": "feedback_submitted",
        "type": "integer",
        "nullable": false
      },
      {
        "name": "visit_flag",
        "type": "integer",
        "nullable": false
      }
    ],
    "relationships": [
      {
        "fromColumn": "member_id",
        "toTable": "members",
        "toColumn": "member_id"
      }
    ]
  },
  {
    "name": "member_engagement_weekly",
    "description": "",
    "columns": [
      {
        "name": "row_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "member_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "week_number",
        "type": "integer",
        "nullable": false
      },
      {
        "name": "week_start",
        "type": "text",
        "nullable": false
      },
      {
        "name": "week_end",
        "type": "text",
        "nullable": false
      },
      {
        "name": "rounds_played",
        "type": "integer",
        "nullable": false
      },
      {
        "name": "dining_visits",
        "type": "integer",
        "nullable": false
      },
      {
        "name": "dining_spend",
        "type": "real",
        "nullable": false
      },
      {
        "name": "events_attended",
        "type": "integer",
        "nullable": false
      },
      {
        "name": "email_open_rate",
        "type": "real",
        "nullable": false
      },
      {
        "name": "engagement_score",
        "type": "real",
        "nullable": false
      }
    ],
    "relationships": [
      {
        "fromColumn": "member_id",
        "toTable": "members",
        "toColumn": "member_id"
      }
    ]
  },
  {
    "name": "visit_sessions",
    "description": "",
    "columns": [
      {
        "name": "session_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "member_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "session_date",
        "type": "text",
        "nullable": false
      },
      {
        "name": "anchor_type",
        "type": "text",
        "nullable": false
      },
      {
        "name": "arrival_time",
        "type": "text",
        "nullable": true
      },
      {
        "name": "departure_time",
        "type": "text",
        "nullable": true
      },
      {
        "name": "duration_minutes",
        "type": "integer",
        "nullable": true
      },
      {
        "name": "touchpoints",
        "type": "integer",
        "nullable": false
      },
      {
        "name": "total_spend",
        "type": "real",
        "nullable": false
      },
      {
        "name": "activities",
        "type": "text",
        "nullable": false
      }
    ],
    "relationships": [
      {
        "fromColumn": "member_id",
        "toTable": "members",
        "toColumn": "member_id"
      }
    ]
  },
  {
    "name": "weather_daily",
    "description": "",
    "columns": [
      {
        "name": "weather_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "date",
        "type": "text",
        "nullable": false
      },
      {
        "name": "condition",
        "type": "text",
        "nullable": false
      },
      {
        "name": "temp_high",
        "type": "integer",
        "nullable": false
      },
      {
        "name": "temp_low",
        "type": "integer",
        "nullable": false
      },
      {
        "name": "wind_mph",
        "type": "integer",
        "nullable": false
      },
      {
        "name": "precipitation_in",
        "type": "real",
        "nullable": false
      },
      {
        "name": "golf_demand_modifier",
        "type": "real",
        "nullable": false
      },
      {
        "name": "fb_demand_modifier",
        "type": "real",
        "nullable": false
      }
    ],
    "relationships": []
  },
  {
    "name": "member_waitlist",
    "description": "",
    "columns": [
      {
        "name": "waitlist_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "member_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "course_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "requested_date",
        "type": "text",
        "nullable": false
      },
      {
        "name": "requested_slot",
        "type": "text",
        "nullable": false
      },
      {
        "name": "alternatives_accepted",
        "type": "text",
        "nullable": false
      },
      {
        "name": "days_waiting",
        "type": "integer",
        "nullable": false
      },
      {
        "name": "retention_priority",
        "type": "text",
        "nullable": false
      },
      {
        "name": "notified_at",
        "type": "text",
        "nullable": true
      },
      {
        "name": "filled_at",
        "type": "text",
        "nullable": true
      },
      {
        "name": "dining_incentive_attached",
        "type": "integer",
        "nullable": false
      }
    ],
    "relationships": [
      {
        "fromColumn": "member_id",
        "toTable": "members",
        "toColumn": "member_id"
      },
      {
        "fromColumn": "course_id",
        "toTable": "courses",
        "toColumn": "course_id"
      }
    ]
  },
  {
    "name": "cancellation_risk",
    "description": "",
    "columns": [
      {
        "name": "risk_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "booking_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "member_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "scored_at",
        "type": "text",
        "nullable": false
      },
      {
        "name": "cancel_probability",
        "type": "real",
        "nullable": false
      },
      {
        "name": "drivers",
        "type": "text",
        "nullable": false
      },
      {
        "name": "recommended_action",
        "type": "text",
        "nullable": false
      },
      {
        "name": "estimated_revenue_lost",
        "type": "real",
        "nullable": false
      },
      {
        "name": "action_taken",
        "type": "text",
        "nullable": true
      },
      {
        "name": "outcome",
        "type": "text",
        "nullable": true
      }
    ],
    "relationships": [
      {
        "fromColumn": "booking_id",
        "toTable": "bookings",
        "toColumn": "booking_id"
      },
      {
        "fromColumn": "member_id",
        "toTable": "members",
        "toColumn": "member_id"
      }
    ]
  },
  {
    "name": "demand_heatmap",
    "description": "",
    "columns": [
      {
        "name": "heatmap_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "course_id",
        "type": "text",
        "nullable": false
      },
      {
        "name": "day_of_week",
        "type": "text",
        "nullable": false
      },
      {
        "name": "time_block",
        "type": "text",
        "nullable": false
      },
      {
        "name": "fill_rate",
        "type": "real",
        "nullable": false
      },
      {
        "name": "unmet_rounds",
        "type": "integer",
        "nullable": false
      },
      {
        "name": "demand_level",
        "type": "text",
        "nullable": false
      },
      {
        "name": "computed_for_month",
        "type": "text",
        "nullable": false
      }
    ],
    "relationships": [
      {
        "fromColumn": "course_id",
        "toTable": "courses",
        "toColumn": "course_id"
      }
    ]
  }
]
};

export default vercelPostgresSchema;
