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
    "relationships": [],
    "sampleRows": [
      {
        "club_id": "club_001",
        "name": "Pinnacle Country Club",
        "city": "Scottsdale",
        "state": "AZ",
        "zip": "85255",
        "founded_year": 1987,
        "member_count": 320,
        "course_count": 2,
        "outlet_count": 4
      },
      {
        "club_id": "club_002",
        "name": "Desert Ridge Golf & Social Club",
        "city": "Phoenix",
        "state": "AZ",
        "zip": "85054",
        "founded_year": 2001,
        "member_count": 285,
        "course_count": 1,
        "outlet_count": 3
      },
      {
        "club_id": "club_003",
        "name": "The Oasis at Troon",
        "city": "Scottsdale",
        "state": "AZ",
        "zip": "85262",
        "founded_year": 1994,
        "member_count": 410,
        "course_count": 2,
        "outlet_count": 5
      }
    ]
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
    ],
    "sampleRows": [
      {
        "course_id": "crs_001",
        "club_id": "club_001",
        "name": "Championship Course",
        "holes": 18,
        "par": 72,
        "tee_interval_min": 10,
        "first_tee": "06:30",
        "last_tee": "16:00"
      },
      {
        "course_id": "crs_002",
        "club_id": "club_001",
        "name": "Executive Nine",
        "holes": 9,
        "par": 36,
        "tee_interval_min": 8,
        "first_tee": "07:00",
        "last_tee": "15:30"
      },
      {
        "course_id": "crs_003",
        "club_id": "club_003",
        "name": "Desert Links",
        "holes": 18,
        "par": 71,
        "tee_interval_min": 10,
        "first_tee": "06:00",
        "last_tee": "15:30"
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
    ],
    "sampleRows": [
      {
        "outlet_id": "out_001",
        "club_id": "club_001",
        "name": "The Grille Room",
        "type": "casual",
        "meal_periods": "lunch,dinner",
        "weekday_covers": 85,
        "weekend_covers": 140
      },
      {
        "outlet_id": "out_002",
        "club_id": "club_001",
        "name": "19th Hole Bar",
        "type": "bar",
        "meal_periods": "lunch,dinner,late",
        "weekday_covers": 60,
        "weekend_covers": 110
      },
      {
        "outlet_id": "out_003",
        "club_id": "club_001",
        "name": "Pinnacle Fine Dining",
        "type": "fine_dining",
        "meal_periods": "dinner",
        "weekday_covers": 40,
        "weekend_covers": 72
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
    "relationships": [],
    "sampleRows": [
      {
        "type_code": "FG",
        "name": "Full Golf",
        "annual_dues": 18000,
        "fb_minimum": 3000,
        "golf_eligible": true
      },
      {
        "type_code": "SOC",
        "name": "Social",
        "annual_dues": 6000,
        "fb_minimum": 1500,
        "golf_eligible": false
      },
      {
        "type_code": "SPT",
        "name": "Sports",
        "annual_dues": 12000,
        "fb_minimum": 2400,
        "golf_eligible": true
      }
    ]
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
    "relationships": [],
    "sampleRows": [
      {
        "household_id": "hh_001",
        "primary_member_id": "mbr_001",
        "member_count": 3,
        "address": "8742 E Pinnacle Peak Rd, Scottsdale, AZ 85255",
        "is_multi_member": true
      },
      {
        "household_id": "hh_002",
        "primary_member_id": "mbr_005",
        "member_count": 1,
        "address": "14201 N Hayden Rd, Scottsdale, AZ 85260",
        "is_multi_member": false
      },
      {
        "household_id": "hh_003",
        "primary_member_id": "mbr_012",
        "member_count": 2,
        "address": "6320 E Camelback Rd, Scottsdale, AZ 85251",
        "is_multi_member": true
      }
    ]
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
    ],
    "sampleRows": [
      {
        "member_id": "mbr_001",
        "member_number": "1001",
        "first_name": "James",
        "last_name": "Thornton",
        "email": "j.thornton@email.com",
        "phone": "+14805551234",
        "date_of_birth": "1968-04-12",
        "gender": "M",
        "membership_type": "FG",
        "membership_status": "active",
        "join_date": "2015-03-01",
        "archetype": "Die-Hard Golfer",
        "ghin_number": "4821937",
        "household_id": "hh_001",
        "current_health_score": 92,
        "health_trend": "stable",
        "sponsor_id": null,
        "tier": "platinum"
      },
      {
        "member_id": "mbr_005",
        "member_number": "1005",
        "first_name": "Catherine",
        "last_name": "Walsh",
        "email": "c.walsh@email.com",
        "phone": "+14805552345",
        "date_of_birth": "1975-09-28",
        "gender": "F",
        "membership_type": "SOC",
        "membership_status": "active",
        "join_date": "2019-06-15",
        "archetype": "Social Butterfly",
        "ghin_number": null,
        "household_id": "hh_002",
        "current_health_score": 78,
        "health_trend": "declining",
        "sponsor_id": "mbr_001",
        "tier": "gold"
      },
      {
        "member_id": "mbr_012",
        "member_number": "1012",
        "first_name": "Robert",
        "last_name": "Kimura",
        "email": "r.kimura@email.com",
        "phone": "+14805553456",
        "date_of_birth": "1982-01-15",
        "gender": "M",
        "membership_type": "SPT",
        "membership_status": "active",
        "join_date": "2021-01-10",
        "archetype": "Weekend Warrior",
        "ghin_number": "6103482",
        "household_id": "hh_003",
        "current_health_score": 85,
        "health_trend": "improving",
        "sponsor_id": "mbr_001",
        "tier": "silver"
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
    ],
    "sampleRows": [
      {
        "booking_id": "bk_001",
        "club_id": "club_001",
        "course_id": "crs_001",
        "member_id": "mbr_001",
        "booking_date": "2026-03-08",
        "tee_time": "07:20",
        "players": 4,
        "holes_booked": 18,
        "transportation": "cart",
        "caddie_requested": false,
        "status": "confirmed",
        "created_at": "2026-03-05T10:30:00Z",
        "source": "app",
        "checked_in": true,
        "no_show": false
      },
      {
        "booking_id": "bk_002",
        "club_id": "club_001",
        "course_id": "crs_001",
        "member_id": "mbr_012",
        "booking_date": "2026-03-08",
        "tee_time": "09:10",
        "players": 2,
        "holes_booked": 18,
        "transportation": "cart",
        "caddie_requested": false,
        "status": "confirmed",
        "created_at": "2026-03-06T14:15:00Z",
        "source": "phone",
        "checked_in": true,
        "no_show": false
      },
      {
        "booking_id": "bk_003",
        "club_id": "club_001",
        "course_id": "crs_002",
        "member_id": "mbr_005",
        "booking_date": "2026-03-09",
        "tee_time": "10:00",
        "players": 3,
        "holes_booked": 9,
        "transportation": "walk",
        "caddie_requested": false,
        "status": "cancelled",
        "created_at": "2026-03-07T08:45:00Z",
        "source": "app",
        "checked_in": false,
        "no_show": false
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
    ],
    "sampleRows": [
      {
        "booking_player_id": "bp_001",
        "booking_id": "bk_001",
        "member_id": "mbr_001",
        "player_name": "James Thornton",
        "is_guest": false,
        "guest_name": null,
        "position": 1
      },
      {
        "booking_player_id": "bp_002",
        "booking_id": "bk_001",
        "member_id": "mbr_012",
        "player_name": "Robert Kimura",
        "is_guest": false,
        "guest_name": null,
        "position": 2
      },
      {
        "booking_player_id": "bp_003",
        "booking_id": "bk_001",
        "member_id": null,
        "player_name": "Mike Guest",
        "is_guest": true,
        "guest_name": "Mike Sullivan",
        "position": 3
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
    ],
    "sampleRows": [
      {
        "pace_id": "pace_001",
        "booking_id": "bk_001",
        "course_id": "crs_001",
        "total_minutes": 252,
        "pace_status": "acceptable",
        "bottleneck_holes": "7,12"
      },
      {
        "pace_id": "pace_002",
        "booking_id": "bk_002",
        "course_id": "crs_001",
        "total_minutes": 278,
        "pace_status": "slow",
        "bottleneck_holes": "4,7,12,15"
      },
      {
        "pace_id": "pace_003",
        "booking_id": "bk_003",
        "course_id": "crs_002",
        "total_minutes": 118,
        "pace_status": "good",
        "bottleneck_holes": null
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
    ],
    "sampleRows": [
      {
        "segment_id": "seg_001",
        "pace_id": "pace_001",
        "hole_number": 1,
        "par": 4,
        "elapsed_minutes": 14,
        "wait_minutes": 0,
        "is_bottleneck": false
      },
      {
        "segment_id": "seg_002",
        "pace_id": "pace_001",
        "hole_number": 7,
        "par": 5,
        "elapsed_minutes": 19,
        "wait_minutes": 5,
        "is_bottleneck": true
      },
      {
        "segment_id": "seg_003",
        "pace_id": "pace_001",
        "hole_number": 12,
        "par": 3,
        "elapsed_minutes": 17,
        "wait_minutes": 6,
        "is_bottleneck": true
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
    ],
    "sampleRows": [
      {
        "waitlist_id": "wl_001",
        "club_id": "club_001",
        "course_id": "crs_001",
        "member_id": "mbr_005",
        "requested_date": "2026-03-15",
        "requested_time_block": "morning",
        "status": "pending",
        "created_at": "2026-03-10T09:00:00Z"
      },
      {
        "waitlist_id": "wl_002",
        "club_id": "club_001",
        "course_id": "crs_001",
        "member_id": "mbr_012",
        "requested_date": "2026-03-15",
        "requested_time_block": "morning",
        "status": "offered",
        "created_at": "2026-03-10T09:30:00Z"
      },
      {
        "waitlist_id": "wl_003",
        "club_id": "club_001",
        "course_id": "crs_001",
        "member_id": "mbr_001",
        "requested_date": "2026-03-16",
        "requested_time_block": "afternoon",
        "status": "fulfilled",
        "created_at": "2026-03-09T16:00:00Z"
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
    ],
    "sampleRows": [
      {
        "check_id": "chk_001",
        "club_id": "club_001",
        "outlet_id": "out_001",
        "member_id": "mbr_001",
        "server_id": "staff_003",
        "opened_at": "2026-03-08T12:15:00Z",
        "closed_at": "2026-03-08T13:42:00Z",
        "subtotal": 87.5,
        "tax": 7.44,
        "tip": 17.5,
        "total": 112.44,
        "covers": 2,
        "payment_method": "member_charge",
        "void_amount": 0,
        "comp_amount": 0,
        "status": "closed",
        "check_number": "20260308-014",
        "meal_period": "lunch",
        "revenue_center": "food",
        "table_id": "T12"
      },
      {
        "check_id": "chk_002",
        "club_id": "club_001",
        "outlet_id": "out_002",
        "member_id": "mbr_012",
        "server_id": "staff_005",
        "opened_at": "2026-03-08T17:30:00Z",
        "closed_at": "2026-03-08T19:15:00Z",
        "subtotal": 62.0,
        "tax": 5.27,
        "tip": 12.4,
        "total": 79.67,
        "covers": 3,
        "payment_method": "member_charge",
        "void_amount": 0,
        "comp_amount": 8.0,
        "status": "closed",
        "check_number": "20260308-038",
        "meal_period": "dinner",
        "revenue_center": "beverage",
        "table_id": "B5"
      },
      {
        "check_id": "chk_003",
        "club_id": "club_001",
        "outlet_id": "out_003",
        "member_id": "mbr_005",
        "server_id": "staff_007",
        "opened_at": "2026-03-09T18:45:00Z",
        "closed_at": "2026-03-09T20:30:00Z",
        "subtotal": 215.0,
        "tax": 18.28,
        "tip": 43.0,
        "total": 276.28,
        "covers": 4,
        "payment_method": "member_charge",
        "void_amount": 0,
        "comp_amount": 0,
        "status": "closed",
        "check_number": "20260309-008",
        "meal_period": "dinner",
        "revenue_center": "food",
        "table_id": "D3"
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
    ],
    "sampleRows": [
      {
        "line_item_id": "li_001",
        "check_id": "chk_001",
        "item_name": "Grilled Salmon",
        "category": "food",
        "quantity": 1,
        "unit_price": 32.0,
        "extended_price": 32.0,
        "is_void": false,
        "is_comp": false,
        "modifier": null
      },
      {
        "line_item_id": "li_002",
        "check_id": "chk_001",
        "item_name": "Caesar Salad",
        "category": "food",
        "quantity": 1,
        "unit_price": 16.5,
        "extended_price": 16.5,
        "is_void": false,
        "is_comp": false,
        "modifier": "dressing on side"
      },
      {
        "line_item_id": "li_003",
        "check_id": "chk_002",
        "item_name": "Craft IPA Draft",
        "category": "beverage",
        "quantity": 3,
        "unit_price": 9.0,
        "extended_price": 27.0,
        "is_void": false,
        "is_comp": false,
        "modifier": null
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
    ],
    "sampleRows": [
      {
        "payment_id": "pay_001",
        "check_id": "chk_001",
        "method": "member_charge",
        "amount": 112.44,
        "member_id": "mbr_001",
        "processed_at": "2026-03-08T13:42:00Z"
      },
      {
        "payment_id": "pay_002",
        "check_id": "chk_002",
        "method": "member_charge",
        "amount": 79.67,
        "member_id": "mbr_012",
        "processed_at": "2026-03-08T19:15:00Z"
      },
      {
        "payment_id": "pay_003",
        "check_id": "chk_003",
        "method": "member_charge",
        "amount": 276.28,
        "member_id": "mbr_005",
        "processed_at": "2026-03-09T20:30:00Z"
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
    ],
    "sampleRows": [
      {
        "event_id": "evt_001",
        "club_id": "club_001",
        "name": "Spring Wine Dinner",
        "event_date": "2026-03-22",
        "capacity": 60,
        "fee_per_person": 125.0,
        "category": "dining",
        "description": "Five-course pairing with Napa Valley vintner"
      },
      {
        "event_id": "evt_002",
        "club_id": "club_001",
        "name": "Member-Guest Tournament",
        "event_date": "2026-04-12",
        "capacity": 120,
        "fee_per_person": 250.0,
        "category": "golf",
        "description": "Two-day scramble format with Saturday gala dinner"
      },
      {
        "event_id": "evt_003",
        "club_id": "club_001",
        "name": "Family BBQ & Pool Party",
        "event_date": "2026-03-29",
        "capacity": 200,
        "fee_per_person": 45.0,
        "category": "social",
        "description": "Casual family event with live music and kids activities"
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
    ],
    "sampleRows": [
      {
        "registration_id": "reg_001",
        "event_id": "evt_001",
        "member_id": "mbr_001",
        "guests": 1,
        "total_fee": 250.0,
        "status": "confirmed",
        "registered_at": "2026-03-05T11:00:00Z",
        "notes": null
      },
      {
        "registration_id": "reg_002",
        "event_id": "evt_001",
        "member_id": "mbr_005",
        "guests": 3,
        "total_fee": 500.0,
        "status": "confirmed",
        "registered_at": "2026-03-06T09:30:00Z",
        "notes": "Table near window please"
      },
      {
        "registration_id": "reg_003",
        "event_id": "evt_003",
        "member_id": "mbr_012",
        "guests": 2,
        "total_fee": 135.0,
        "status": "waitlisted",
        "registered_at": "2026-03-08T14:00:00Z",
        "notes": "Kids ages 6 and 9"
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
    ],
    "sampleRows": [
      {
        "campaign_id": "camp_001",
        "club_id": "club_001",
        "subject": "This Week at Pinnacle \u2014 Spring Wine Dinner & Tee Sheet Updates",
        "type": "newsletter",
        "sent_at": "2026-03-07T10:00:00Z",
        "recipients": 310,
        "status": "sent"
      },
      {
        "campaign_id": "camp_002",
        "club_id": "club_001",
        "subject": "Member-Guest Registration Now Open \u2014 Limited Spots",
        "type": "promo",
        "sent_at": "2026-03-03T08:30:00Z",
        "recipients": 285,
        "status": "sent"
      },
      {
        "campaign_id": "camp_003",
        "club_id": "club_001",
        "subject": "Your March Statement is Ready",
        "type": "transactional",
        "sent_at": "2026-03-01T06:00:00Z",
        "recipients": 300,
        "status": "sent"
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
    ],
    "sampleRows": [
      {
        "email_event_id": "ee_001",
        "campaign_id": "camp_001",
        "member_id": "mbr_001",
        "event_type": "open",
        "event_at": "2026-03-07T10:12:00Z",
        "link_url": null,
        "device": "mobile"
      },
      {
        "email_event_id": "ee_002",
        "campaign_id": "camp_001",
        "member_id": "mbr_001",
        "event_type": "click",
        "event_at": "2026-03-07T10:13:00Z",
        "link_url": "/events/wine-dinner",
        "device": "mobile"
      },
      {
        "email_event_id": "ee_003",
        "campaign_id": "camp_002",
        "member_id": "mbr_005",
        "event_type": "open",
        "event_at": "2026-03-03T09:45:00Z",
        "link_url": null,
        "device": "desktop"
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
    ],
    "sampleRows": [
      {
        "feedback_id": "fb_001",
        "club_id": "club_001",
        "member_id": "mbr_012",
        "category": "course_conditions",
        "comment": "Bunkers on holes 4 and 7 need attention \u2014 sand was rock hard after last week's rain.",
        "sentiment_score": 0.3,
        "status": "acknowledged",
        "created_at": "2026-03-07T16:30:00Z",
        "staff_response": "Maintenance team scheduled bunker renovation for Monday.",
        "understaffed_flag": false
      },
      {
        "feedback_id": "fb_002",
        "club_id": "club_001",
        "member_id": "mbr_001",
        "category": "dining_service",
        "comment": "Waited 25 minutes for drinks at the bar Saturday. Only one bartender for the whole patio.",
        "sentiment_score": 0.2,
        "status": "escalated",
        "created_at": "2026-03-09T11:00:00Z",
        "staff_response": null,
        "understaffed_flag": true
      },
      {
        "feedback_id": "fb_003",
        "club_id": "club_001",
        "member_id": "mbr_005",
        "category": "events",
        "comment": "Wine dinner was outstanding \u2014 the sommelier really knows her stuff. We'll be at every one.",
        "sentiment_score": 0.95,
        "status": "closed",
        "created_at": "2026-03-10T08:15:00Z",
        "staff_response": "Thank you Catherine! Glad you enjoyed it.",
        "understaffed_flag": false
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
    ],
    "sampleRows": [
      {
        "request_id": "sr_001",
        "club_id": "club_001",
        "member_id": "mbr_001",
        "category": "golf_ops",
        "description": "Need a forecaddie for Thursday 7:20 group \u2014 4 players, all riding.",
        "status": "fulfilled",
        "created_at": "2026-03-06T08:00:00Z",
        "resolved_at": "2026-03-06T09:15:00Z",
        "assigned_to": "staff_002"
      },
      {
        "request_id": "sr_002",
        "club_id": "club_001",
        "member_id": "mbr_005",
        "category": "dining",
        "description": "Reserving the private dining room for 12 guests on March 28th.",
        "status": "confirmed",
        "created_at": "2026-03-08T10:30:00Z",
        "resolved_at": "2026-03-08T11:00:00Z",
        "assigned_to": "staff_007"
      },
      {
        "request_id": "sr_003",
        "club_id": "club_001",
        "member_id": "mbr_012",
        "category": "facilities",
        "description": "Locker #247 combination isn't working \u2014 tried resetting twice.",
        "status": "in_progress",
        "created_at": "2026-03-10T14:00:00Z",
        "resolved_at": null,
        "assigned_to": "staff_010"
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
    ],
    "sampleRows": [
      {
        "staff_id": "staff_001",
        "club_id": "club_001",
        "first_name": "Maria",
        "last_name": "Gonzalez",
        "role": "Golf Operations Manager",
        "department": "golf",
        "hire_date": "2018-05-01",
        "hourly_rate": 38.5,
        "employment_type": "full_time"
      },
      {
        "staff_id": "staff_003",
        "club_id": "club_001",
        "first_name": "David",
        "last_name": "Chen",
        "role": "Lead Server",
        "department": "food_beverage",
        "hire_date": "2020-09-15",
        "hourly_rate": 22.0,
        "employment_type": "full_time"
      },
      {
        "staff_id": "staff_005",
        "club_id": "club_001",
        "first_name": "Tyler",
        "last_name": "Brooks",
        "role": "Bartender",
        "department": "food_beverage",
        "hire_date": "2023-03-01",
        "hourly_rate": 18.5,
        "employment_type": "part_time"
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
    ],
    "sampleRows": [
      {
        "shift_id": "sh_001",
        "staff_id": "staff_001",
        "club_id": "club_001",
        "shift_date": "2026-03-08",
        "start_time": "06:00",
        "end_time": "14:30",
        "department": "golf",
        "actual_hours": 8.5,
        "understaffed": false
      },
      {
        "shift_id": "sh_002",
        "staff_id": "staff_005",
        "club_id": "club_001",
        "shift_date": "2026-03-08",
        "start_time": "15:00",
        "end_time": "23:00",
        "department": "food_beverage",
        "actual_hours": 8.0,
        "understaffed": true
      },
      {
        "shift_id": "sh_003",
        "staff_id": "staff_003",
        "club_id": "club_001",
        "shift_date": "2026-03-09",
        "start_time": "10:00",
        "end_time": "18:30",
        "department": "food_beverage",
        "actual_hours": 8.5,
        "understaffed": false
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
    ],
    "sampleRows": [
      {
        "close_out_id": "co_001",
        "club_id": "club_001",
        "close_date": "2026-03-08",
        "golf_revenue": 14280.0,
        "fb_revenue": 9875.5,
        "event_revenue": 0,
        "total_revenue": 24155.5,
        "weather": "sunny_82F",
        "rounds_played": 168,
        "covers_served": 312
      },
      {
        "close_out_id": "co_002",
        "club_id": "club_001",
        "close_date": "2026-03-09",
        "golf_revenue": 16420.0,
        "fb_revenue": 12340.0,
        "event_revenue": 3200.0,
        "total_revenue": 31960.0,
        "weather": "sunny_78F",
        "rounds_played": 192,
        "covers_served": 385
      },
      {
        "close_out_id": "co_003",
        "club_id": "club_001",
        "close_date": "2026-03-10",
        "golf_revenue": 8650.0,
        "fb_revenue": 5420.0,
        "event_revenue": 0,
        "total_revenue": 14070.0,
        "weather": "partly_cloudy_74F",
        "rounds_played": 104,
        "covers_served": 178
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
    "relationships": [],
    "sampleRows": [
      {
        "event_id": "ce_001",
        "entity_type": "member",
        "entity_id": "mbr_005",
        "event_type": "health_score_drop",
        "payload": "{\"old_score\":85,\"new_score\":78,\"delta\":-7}",
        "occurred_at": "2026-03-08T00:00:00Z",
        "source": "system"
      },
      {
        "event_id": "ce_002",
        "entity_type": "feedback",
        "entity_id": "fb_002",
        "event_type": "feedback_escalated",
        "payload": "{\"category\":\"dining_service\",\"sentiment\":0.2}",
        "occurred_at": "2026-03-09T11:05:00Z",
        "source": "system"
      },
      {
        "event_id": "ce_003",
        "entity_type": "booking",
        "entity_id": "bk_003",
        "event_type": "booking_cancelled",
        "payload": "{\"member_id\":\"mbr_005\",\"reason\":\"schedule_change\"}",
        "occurred_at": "2026-03-08T12:00:00Z",
        "source": "member_app"
      }
    ]
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
    ],
    "sampleRows": [
      {
        "engagement_id": "ed_001",
        "member_id": "mbr_001",
        "engagement_date": "2026-03-08",
        "rounds_played": 1,
        "dining_spend": 112.44,
        "event_attended": false,
        "app_sessions": 3,
        "email_opened": true,
        "pro_shop_spend": 45.0,
        "facility_visits": 1,
        "guest_rounds": 1
      },
      {
        "engagement_id": "ed_002",
        "member_id": "mbr_012",
        "engagement_date": "2026-03-08",
        "rounds_played": 1,
        "dining_spend": 79.67,
        "event_attended": false,
        "app_sessions": 1,
        "email_opened": true,
        "pro_shop_spend": 0,
        "facility_visits": 1,
        "guest_rounds": 0
      },
      {
        "engagement_id": "ed_003",
        "member_id": "mbr_005",
        "engagement_date": "2026-03-09",
        "rounds_played": 0,
        "dining_spend": 276.28,
        "event_attended": false,
        "app_sessions": 2,
        "email_opened": false,
        "pro_shop_spend": 0,
        "facility_visits": 1,
        "guest_rounds": 0
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
    ],
    "sampleRows": [
      {
        "engagement_id": "ew_001",
        "member_id": "mbr_001",
        "week_start": "2026-03-03",
        "health_score": 92,
        "rounds": 3,
        "dining_spend": 342.5,
        "events_attended": 1,
        "email_open_rate": 1.0,
        "app_sessions": 12,
        "pro_shop_spend": 85.0,
        "facility_visits": 5,
        "guest_rounds": 2,
        "score_delta": 1
      },
      {
        "engagement_id": "ew_002",
        "member_id": "mbr_005",
        "week_start": "2026-03-03",
        "health_score": 78,
        "rounds": 0,
        "dining_spend": 476.28,
        "events_attended": 1,
        "email_open_rate": 0.5,
        "app_sessions": 4,
        "pro_shop_spend": 0,
        "facility_visits": 3,
        "guest_rounds": 0,
        "score_delta": -3
      },
      {
        "engagement_id": "ew_003",
        "member_id": "mbr_012",
        "week_start": "2026-03-03",
        "health_score": 85,
        "rounds": 2,
        "dining_spend": 179.67,
        "events_attended": 0,
        "email_open_rate": 0.75,
        "app_sessions": 6,
        "pro_shop_spend": 120.0,
        "facility_visits": 3,
        "guest_rounds": 1,
        "score_delta": 2
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
    ],
    "sampleRows": [
      {
        "visit_id": "vs_001",
        "member_id": "mbr_001",
        "club_id": "club_001",
        "visit_date": "2026-03-08",
        "anchor_type": "golf",
        "duration_minutes": 320,
        "total_spend": 157.44,
        "outlets_visited": "crs_001,out_001",
        "check_in_time": "2026-03-08T06:50:00Z",
        "check_out_time": "2026-03-08T12:10:00Z"
      },
      {
        "visit_id": "vs_002",
        "member_id": "mbr_012",
        "club_id": "club_001",
        "visit_date": "2026-03-08",
        "anchor_type": "golf",
        "duration_minutes": 240,
        "total_spend": 79.67,
        "outlets_visited": "crs_001,out_002",
        "check_in_time": "2026-03-08T08:45:00Z",
        "check_out_time": "2026-03-08T12:45:00Z"
      },
      {
        "visit_id": "vs_003",
        "member_id": "mbr_005",
        "club_id": "club_001",
        "visit_date": "2026-03-09",
        "anchor_type": "dining",
        "duration_minutes": 150,
        "total_spend": 276.28,
        "outlets_visited": "out_003",
        "check_in_time": "2026-03-09T18:00:00Z",
        "check_out_time": "2026-03-09T20:30:00Z"
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
    "relationships": [],
    "sampleRows": [
      {
        "weather_id": "wx_001",
        "club_id": "club_001",
        "weather_date": "2026-03-08",
        "high_temp_f": 82,
        "low_temp_f": 58,
        "condition": "sunny",
        "wind_mph": 5,
        "precipitation_in": 0,
        "demand_modifier": 1.15
      },
      {
        "weather_id": "wx_002",
        "club_id": "club_001",
        "weather_date": "2026-03-09",
        "high_temp_f": 78,
        "low_temp_f": 55,
        "condition": "sunny",
        "wind_mph": 8,
        "precipitation_in": 0,
        "demand_modifier": 1.1
      },
      {
        "weather_id": "wx_003",
        "club_id": "club_001",
        "weather_date": "2026-03-10",
        "high_temp_f": 74,
        "low_temp_f": 52,
        "condition": "partly_cloudy",
        "wind_mph": 12,
        "precipitation_in": 0,
        "demand_modifier": 0.95
      }
    ]
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
    ],
    "sampleRows": [
      {
        "waitlist_id": "mw_001",
        "club_id": "club_001",
        "member_id": "mbr_012",
        "requested_date": "2026-03-15",
        "requested_time": "07:30",
        "course_id": "crs_001",
        "priority": "high",
        "status": "pending",
        "reason": "peak_demand",
        "created_at": "2026-03-10T08:00:00Z",
        "retention_score": 85
      },
      {
        "waitlist_id": "mw_002",
        "club_id": "club_001",
        "member_id": "mbr_001",
        "requested_date": "2026-03-15",
        "requested_time": "07:40",
        "course_id": "crs_001",
        "priority": "platinum",
        "status": "fulfilled",
        "reason": "peak_demand",
        "created_at": "2026-03-09T16:00:00Z",
        "retention_score": 92
      },
      {
        "waitlist_id": "mw_003",
        "club_id": "club_001",
        "member_id": "mbr_005",
        "requested_date": "2026-03-16",
        "requested_time": "09:00",
        "course_id": "crs_002",
        "priority": "normal",
        "status": "expired",
        "reason": "guest_day",
        "created_at": "2026-03-08T12:00:00Z",
        "retention_score": 78
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
    ],
    "sampleRows": [
      {
        "risk_id": "cr_001",
        "booking_id": "bk_001",
        "member_id": "mbr_001",
        "course_id": "crs_001",
        "risk_score": 0.08,
        "risk_level": "low",
        "primary_driver": "weather_clear",
        "recommended_action": "none",
        "computed_at": "2026-03-07T22:00:00Z",
        "booking_date": "2026-03-08"
      },
      {
        "risk_id": "cr_002",
        "booking_id": "bk_003",
        "member_id": "mbr_005",
        "course_id": "crs_002",
        "risk_score": 0.72,
        "risk_level": "high",
        "primary_driver": "low_engagement_trend",
        "recommended_action": "personal_outreach",
        "computed_at": "2026-03-08T06:00:00Z",
        "booking_date": "2026-03-09"
      },
      {
        "risk_id": "cr_003",
        "booking_id": "bk_002",
        "member_id": "mbr_012",
        "course_id": "crs_001",
        "risk_score": 0.15,
        "risk_level": "low",
        "primary_driver": "consistent_player",
        "recommended_action": "none",
        "computed_at": "2026-03-07T22:00:00Z",
        "booking_date": "2026-03-08"
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
    ],
    "sampleRows": [
      {
        "heatmap_id": "dh_001",
        "club_id": "club_001",
        "course_id": "crs_001",
        "day_of_week": "Saturday",
        "time_block": "07:00-09:00",
        "fill_rate": 0.96,
        "unmet_rounds": 12,
        "demand_level": "peak",
        "computed_for_month": "2026-03"
      },
      {
        "heatmap_id": "dh_002",
        "club_id": "club_001",
        "course_id": "crs_001",
        "day_of_week": "Wednesday",
        "time_block": "07:00-09:00",
        "fill_rate": 0.72,
        "unmet_rounds": 4,
        "demand_level": "moderate",
        "computed_for_month": "2026-03"
      },
      {
        "heatmap_id": "dh_003",
        "club_id": "club_001",
        "course_id": "crs_001",
        "day_of_week": "Monday",
        "time_block": "14:00-16:00",
        "fill_rate": 0.35,
        "unmet_rounds": 0,
        "demand_level": "low",
        "computed_for_month": "2026-03"
      }
    ]
  }
]
};

export default vercelPostgresSchema;
