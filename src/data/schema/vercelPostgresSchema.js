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
      },
      {
        "name": "logo_url",
        "type": "text",
        "nullable": true
      },
      {
        "name": "brand_voice",
        "type": "text",
        "nullable": true
      },
      {
        "name": "timezone",
        "type": "text",
        "nullable": true
      },
      {
        "name": "created_at",
        "type": "timestamptz",
        "nullable": true
      },
      {
        "name": "updated_at",
        "type": "timestamptz",
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
        "outlet_count": 4,
        "logo_url": null,
        "brand_voice": "professional",
        "timezone": "America/New_York",
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-01-01T00:00:00Z"
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
        "outlet_count": 3,
        "logo_url": null,
        "brand_voice": "professional",
        "timezone": "America/Phoenix",
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-01-01T00:00:00Z"
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
        "outlet_count": 5,
        "logo_url": null,
        "brand_voice": "professional",
        "timezone": "America/Phoenix",
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-01-01T00:00:00Z"
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
      },
      {
        "name": "club_id",
        "type": "text",
        "nullable": true
      },
      {
        "name": "external_id",
        "type": "text",
        "nullable": true
      },
      {
        "name": "health_score",
        "type": "real",
        "nullable": true
      },
      {
        "name": "health_tier",
        "type": "text",
        "nullable": true
      },
      {
        "name": "last_health_update",
        "type": "timestamptz",
        "nullable": true
      },
      {
        "name": "preferred_channel",
        "type": "text",
        "nullable": true
      },
      {
        "name": "data_source",
        "type": "text",
        "nullable": true
      },
      {
        "name": "created_at",
        "type": "timestamptz",
        "nullable": true
      },
      {
        "name": "updated_at",
        "type": "timestamptz",
        "nullable": true
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
      },
      {
        "fromColumn": "club_id",
        "toTable": "club",
        "toColumn": "club_id"
      }
    ],
    "sampleRows": [
      {
        "member_id": "mbr_001",
        "member_number": "1001",
        "club_id": "oakmont",
        "external_id": null,
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
        "health_score": 92,
        "health_tier": "healthy",
        "last_health_update": "2026-01-15T08:00:00Z",
        "preferred_channel": "email",
        "data_source": "manual",
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-01-15T08:00:00Z"
      },
      {
        "member_id": "mbr_005",
        "member_number": "1005",
        "club_id": "oakmont",
        "external_id": null,
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
        "health_score": 78,
        "health_tier": "watch",
        "last_health_update": "2026-01-15T08:00:00Z",
        "preferred_channel": "email",
        "data_source": "manual",
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-01-15T08:00:00Z"
      },
      {
        "member_id": "mbr_012",
        "member_number": "1012",
        "club_id": "oakmont",
        "external_id": null,
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
        "health_score": 85,
        "health_tier": "healthy",
        "last_health_update": "2026-01-15T08:00:00Z",
        "preferred_channel": "email",
        "data_source": "manual",
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-01-15T08:00:00Z"
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
  },
  {
    "name": "board_report_snapshots",
    "description": "",
    "columns": [
      { "name": "snapshot_id", "type": "integer", "nullable": false },
      { "name": "snapshot_date", "type": "text", "nullable": false },
      { "name": "members_saved", "type": "integer", "nullable": true },
      { "name": "dues_protected", "type": "real", "nullable": true },
      { "name": "ltv_protected", "type": "real", "nullable": true },
      { "name": "revenue_recovered", "type": "real", "nullable": true },
      { "name": "service_failures_caught", "type": "integer", "nullable": true },
      { "name": "avg_response_time_hrs", "type": "real", "nullable": true },
      { "name": "board_confidence_pct", "type": "integer", "nullable": true }
    ],
    "relationships": [],
    "sampleRows": [
      { "snapshot_id": 1, "snapshot_date": "2026-01-31", "members_saved": 12, "dues_protected": 187200.00, "ltv_protected": 624000.00, "revenue_recovered": 43500.00, "service_failures_caught": 8, "avg_response_time_hrs": 2.3, "board_confidence_pct": 88 },
      { "snapshot_id": 2, "snapshot_date": "2026-02-28", "members_saved": 15, "dues_protected": 234000.00, "ltv_protected": 780000.00, "revenue_recovered": 51200.00, "service_failures_caught": 11, "avg_response_time_hrs": 1.9, "board_confidence_pct": 91 },
      { "snapshot_id": 3, "snapshot_date": "2026-03-31", "members_saved": 9, "dues_protected": 140400.00, "ltv_protected": 468000.00, "revenue_recovered": 38700.00, "service_failures_caught": 6, "avg_response_time_hrs": 2.1, "board_confidence_pct": 89 }
    ]
  },
  {
    "name": "member_interventions",
    "description": "",
    "columns": [
      { "name": "intervention_id", "type": "integer", "nullable": false },
      { "name": "member_id", "type": "text", "nullable": false },
      { "name": "trigger_type", "type": "text", "nullable": true },
      { "name": "trigger_detail", "type": "text", "nullable": true },
      { "name": "action_taken", "type": "text", "nullable": true },
      { "name": "outcome", "type": "text", "nullable": true },
      { "name": "health_before", "type": "integer", "nullable": true },
      { "name": "health_after", "type": "integer", "nullable": true },
      { "name": "dues_at_risk", "type": "real", "nullable": true },
      { "name": "intervention_date", "type": "text", "nullable": true },
      { "name": "resolved_date", "type": "text", "nullable": true }
    ],
    "relationships": [
      { "fromColumn": "member_id", "toTable": "members", "toColumn": "member_id" }
    ],
    "sampleRows": [
      { "intervention_id": 1, "member_id": "mbr_001", "trigger_type": "declining_usage", "trigger_detail": "Golf rounds dropped 60% over 3 months", "action_taken": "GM personal outreach call", "outcome": "retained", "health_before": 38, "health_after": 72, "dues_at_risk": 15600.00, "intervention_date": "2026-02-10", "resolved_date": "2026-02-18" },
      { "intervention_id": 2, "member_id": "mbr_014", "trigger_type": "complaint_escalation", "trigger_detail": "Multiple dining complaints in 30 days", "action_taken": "Chef meeting and complimentary dinner", "outcome": "retained", "health_before": 45, "health_after": 68, "dues_at_risk": 15600.00, "intervention_date": "2026-03-01", "resolved_date": "2026-03-12" },
      { "intervention_id": 3, "member_id": "mbr_027", "trigger_type": "payment_risk", "trigger_detail": "Invoice 60 days past due", "action_taken": "Membership director meeting", "outcome": "pending", "health_before": 29, "health_after": null, "dues_at_risk": 15600.00, "intervention_date": "2026-03-15", "resolved_date": null }
    ]
  },
  {
    "name": "operational_interventions",
    "description": "",
    "columns": [
      { "name": "intervention_id", "type": "integer", "nullable": false },
      { "name": "event_type", "type": "text", "nullable": true },
      { "name": "event_date", "type": "text", "nullable": true },
      { "name": "detection_method", "type": "text", "nullable": true },
      { "name": "action_taken", "type": "text", "nullable": true },
      { "name": "outcome", "type": "text", "nullable": true },
      { "name": "revenue_protected", "type": "real", "nullable": true },
      { "name": "members_affected", "type": "integer", "nullable": true }
    ],
    "relationships": [],
    "sampleRows": [
      { "intervention_id": 1, "event_type": "tee_sheet_gap", "event_date": "2026-03-08", "detection_method": "automated_scan", "action_taken": "Backfilled 6 slots via waitlist outreach", "outcome": "resolved", "revenue_protected": 1800.00, "members_affected": 6 },
      { "intervention_id": 2, "event_type": "dining_overbook", "event_date": "2026-03-14", "detection_method": "capacity_alert", "action_taken": "Opened patio seating and added server", "outcome": "resolved", "revenue_protected": 4200.00, "members_affected": 24 }
    ]
  },
  {
    "name": "user_sessions",
    "description": "",
    "columns": [
      { "name": "session_id", "type": "integer", "nullable": false },
      { "name": "user_id", "type": "text", "nullable": true },
      { "name": "login_at", "type": "timestamptz", "nullable": true },
      { "name": "snapshot", "type": "text", "nullable": true }
    ],
    "relationships": [],
    "sampleRows": [
      { "session_id": 1, "user_id": "usr_gm_01", "login_at": "2026-03-28T08:15:00Z", "snapshot": "{\"role\":\"gm\",\"club\":\"club_001\"}" },
      { "session_id": 2, "user_id": "usr_mem_dir", "login_at": "2026-03-28T09:02:00Z", "snapshot": "{\"role\":\"membership_director\",\"club\":\"club_001\"}" }
    ]
  },
  {
    "name": "experience_correlations",
    "description": "",
    "columns": [
      { "name": "correlation_id", "type": "integer", "nullable": false },
      { "name": "touchpoint", "type": "text", "nullable": true },
      { "name": "retention_impact", "type": "real", "nullable": true },
      { "name": "category", "type": "text", "nullable": true },
      { "name": "description", "type": "text", "nullable": true },
      { "name": "segment", "type": "text", "nullable": true },
      { "name": "archetype", "type": "text", "nullable": true },
      { "name": "trend_data", "type": "text", "nullable": true },
      { "name": "delta", "type": "text", "nullable": true },
      { "name": "delta_direction", "type": "text", "nullable": true }
    ],
    "relationships": [],
    "sampleRows": [
      { "correlation_id": 1, "touchpoint": "Post-round dining visit", "retention_impact": 0.34, "category": "dining", "description": "Members who dine after rounds retain at 34% higher rate", "segment": "active_golfers", "archetype": "social_golfer", "trend_data": "[0.28,0.30,0.32,0.34]", "delta": "+2%", "delta_direction": "up" },
      { "correlation_id": 2, "touchpoint": "Event attendance (2+ per quarter)", "retention_impact": 0.27, "category": "events", "description": "Quarterly event attendees show 27% higher retention", "segment": "all_members", "archetype": "community_connector", "trend_data": "[0.22,0.24,0.26,0.27]", "delta": "+1%", "delta_direction": "up" }
    ]
  },
  {
    "name": "correlation_insights",
    "description": "",
    "columns": [
      { "name": "insight_id", "type": "text", "nullable": false },
      { "name": "headline", "type": "text", "nullable": true },
      { "name": "detail", "type": "text", "nullable": true },
      { "name": "domains", "type": "text", "nullable": true },
      { "name": "impact", "type": "text", "nullable": true },
      { "name": "metric_value", "type": "text", "nullable": true },
      { "name": "metric_label", "type": "text", "nullable": true },
      { "name": "trend_data", "type": "text", "nullable": true },
      { "name": "delta", "type": "text", "nullable": true },
      { "name": "delta_direction", "type": "text", "nullable": true },
      { "name": "archetype", "type": "text", "nullable": true }
    ],
    "relationships": [],
    "sampleRows": [
      { "insight_id": "ci_001", "headline": "Dining frequency predicts retention", "detail": "Members dining 3+ times/month have 92% retention vs 71% for non-diners", "domains": "dining,retention", "impact": "high", "metric_value": "92%", "metric_label": "Retention rate", "trend_data": "[88,89,91,92]", "delta": "+1%", "delta_direction": "up", "archetype": "social_golfer" },
      { "insight_id": "ci_002", "headline": "New member onboarding gap", "detail": "Members not playing within 30 days of joining have 3x churn risk", "domains": "golf,onboarding", "impact": "critical", "metric_value": "3x", "metric_label": "Churn multiplier", "trend_data": "[3.2,3.1,3.0,3.0]", "delta": "0%", "delta_direction": "flat", "archetype": null }
    ]
  },
  {
    "name": "event_roi_metrics",
    "description": "",
    "columns": [
      { "name": "event_type", "type": "text", "nullable": false },
      { "name": "attendance_avg", "type": "integer", "nullable": true },
      { "name": "retention_rate", "type": "real", "nullable": true },
      { "name": "avg_spend", "type": "real", "nullable": true },
      { "name": "roi_score", "type": "real", "nullable": true },
      { "name": "frequency", "type": "text", "nullable": true }
    ],
    "relationships": [],
    "sampleRows": [
      { "event_type": "Member-Guest Tournament", "attendance_avg": 72, "retention_rate": 0.96, "avg_spend": 285.00, "roi_score": 9.2, "frequency": "quarterly" },
      { "event_type": "Wine Dinner", "attendance_avg": 48, "retention_rate": 0.94, "avg_spend": 175.00, "roi_score": 8.5, "frequency": "monthly" },
      { "event_type": "Family Pool Party", "attendance_avg": 120, "retention_rate": 0.91, "avg_spend": 65.00, "roi_score": 7.8, "frequency": "bi-weekly" }
    ]
  },
  {
    "name": "archetype_spend_gaps",
    "description": "",
    "columns": [
      { "name": "archetype", "type": "text", "nullable": false },
      { "name": "member_count", "type": "integer", "nullable": true },
      { "name": "current_dining", "type": "integer", "nullable": true },
      { "name": "potential_dining", "type": "integer", "nullable": true },
      { "name": "current_events", "type": "integer", "nullable": true },
      { "name": "potential_events", "type": "integer", "nullable": true },
      { "name": "avg_annual_spend", "type": "real", "nullable": true },
      { "name": "untapped_dining", "type": "real", "nullable": true },
      { "name": "untapped_events", "type": "real", "nullable": true },
      { "name": "total_untapped", "type": "real", "nullable": true },
      { "name": "campaign", "type": "text", "nullable": true }
    ],
    "relationships": [],
    "sampleRows": [
      { "archetype": "social_golfer", "member_count": 145, "current_dining": 2400, "potential_dining": 4200, "current_events": 1800, "potential_events": 3100, "avg_annual_spend": 18200.00, "untapped_dining": 1800.00, "untapped_events": 1300.00, "total_untapped": 3100.00, "campaign": "Post-round happy hour invitation" },
      { "archetype": "fitness_focused", "member_count": 82, "current_dining": 800, "potential_dining": 2600, "current_events": 400, "potential_events": 1500, "avg_annual_spend": 9400.00, "untapped_dining": 1800.00, "untapped_events": 1100.00, "total_untapped": 2900.00, "campaign": "Healthy menu spotlight series" },
      { "archetype": "family_oriented", "member_count": 110, "current_dining": 3200, "potential_dining": 4800, "current_events": 2200, "potential_events": 3600, "avg_annual_spend": 22500.00, "untapped_dining": 1600.00, "untapped_events": 1400.00, "total_untapped": 3000.00, "campaign": "Kids eat free weeknight promotion" }
    ]
  },
  {
    "name": "agent_definitions",
    "description": "",
    "columns": [
      { "name": "agent_id", "type": "text", "nullable": false },
      { "name": "name", "type": "text", "nullable": true },
      { "name": "description", "type": "text", "nullable": true },
      { "name": "status", "type": "text", "nullable": true },
      { "name": "model", "type": "text", "nullable": true },
      { "name": "avatar", "type": "text", "nullable": true },
      { "name": "source_systems", "type": "text", "nullable": true },
      { "name": "last_run", "type": "timestamptz", "nullable": true }
    ],
    "relationships": [],
    "sampleRows": [
      { "agent_id": "agt_retention", "name": "Retention Sentinel", "description": "Monitors member health scores and triggers proactive outreach for at-risk members", "status": "active", "model": "swoop-retention-v2", "avatar": "shield", "source_systems": "health_scores,rounds,transactions,complaints", "last_run": "2026-03-28T06:00:00Z" },
      { "agent_id": "agt_teesheet", "name": "Tee Sheet Optimizer", "description": "Analyzes booking patterns to maximize utilization and minimize no-shows", "status": "active", "model": "swoop-teesheet-v1", "avatar": "calendar", "source_systems": "rounds,booking_confirmations,demand_heatmap", "last_run": "2026-03-28T05:30:00Z" }
    ]
  },
  {
    "name": "agent_actions",
    "description": "",
    "columns": [
      { "name": "action_id", "type": "text", "nullable": false },
      { "name": "agent_id", "type": "text", "nullable": true },
      { "name": "action_type", "type": "text", "nullable": true },
      { "name": "priority", "type": "text", "nullable": true },
      { "name": "source", "type": "text", "nullable": true },
      { "name": "description", "type": "text", "nullable": true },
      { "name": "impact_metric", "type": "text", "nullable": true },
      { "name": "member_id", "type": "text", "nullable": true },
      { "name": "status", "type": "text", "nullable": true },
      { "name": "approval_action", "type": "text", "nullable": true },
      { "name": "dismissal_reason", "type": "text", "nullable": true },
      { "name": "timestamp", "type": "timestamptz", "nullable": true },
      { "name": "approved_at", "type": "timestamptz", "nullable": true },
      { "name": "dismissed_at", "type": "timestamptz", "nullable": true }
    ],
    "relationships": [
      { "fromColumn": "agent_id", "toTable": "agent_definitions", "toColumn": "agent_id" }
    ],
    "sampleRows": [
      { "action_id": "aa_001", "agent_id": "agt_retention", "action_type": "outreach", "priority": "high", "source": "health_score_drop", "description": "Schedule GM call with Thompson family - health score dropped 25 pts in 2 weeks", "impact_metric": "$15,600 dues at risk", "member_id": "mbr_001", "status": "pending", "approval_action": null, "dismissal_reason": null, "timestamp": "2026-03-28T06:05:00Z", "approved_at": null, "dismissed_at": null },
      { "action_id": "aa_002", "agent_id": "agt_teesheet", "action_type": "slot_fill", "priority": "medium", "source": "cancellation_detected", "description": "Offer Saturday 8:30 AM slot to 3 waitlisted members", "impact_metric": "$450 green fees", "member_id": null, "status": "approved", "approval_action": "auto", "dismissal_reason": null, "timestamp": "2026-03-28T05:35:00Z", "approved_at": "2026-03-28T05:35:00Z", "dismissed_at": null }
    ]
  },
  {
    "name": "member_location_current",
    "description": "",
    "columns": [
      { "name": "member_id", "type": "text", "nullable": false },
      { "name": "zone", "type": "text", "nullable": true },
      { "name": "sub_location", "type": "text", "nullable": true },
      { "name": "check_in_time", "type": "timestamptz", "nullable": true },
      { "name": "health_status", "type": "text", "nullable": true },
      { "name": "activity_type", "type": "text", "nullable": true }
    ],
    "relationships": [
      { "fromColumn": "member_id", "toTable": "members", "toColumn": "member_id" }
    ],
    "sampleRows": [
      { "member_id": "mbr_001", "zone": "golf_course", "sub_location": "Hole 7 Fairway", "check_in_time": "2026-03-28T08:12:00Z", "health_status": "healthy", "activity_type": "round_in_progress" },
      { "member_id": "mbr_014", "zone": "clubhouse", "sub_location": "Main Dining Room", "check_in_time": "2026-03-28T12:30:00Z", "health_status": "at_risk", "activity_type": "dining" },
      { "member_id": "mbr_027", "zone": "fitness_center", "sub_location": "Weight Room", "check_in_time": "2026-03-28T06:45:00Z", "health_status": "healthy", "activity_type": "workout" }
    ]
  },
  {
    "name": "staff_location_current",
    "description": "",
    "columns": [
      { "name": "staff_id", "type": "text", "nullable": false },
      { "name": "name", "type": "text", "nullable": true },
      { "name": "zone", "type": "text", "nullable": true },
      { "name": "status", "type": "text", "nullable": true },
      { "name": "eta_minutes", "type": "integer", "nullable": true },
      { "name": "department", "type": "text", "nullable": true }
    ],
    "relationships": [],
    "sampleRows": [
      { "staff_id": "stf_001", "name": "Mike Reynolds", "zone": "golf_course", "status": "on_duty", "eta_minutes": null, "department": "golf_operations" },
      { "staff_id": "stf_002", "name": "Sarah Chen", "zone": "clubhouse", "status": "on_duty", "eta_minutes": null, "department": "food_and_beverage" },
      { "staff_id": "stf_003", "name": "James Whitfield", "zone": "pro_shop", "status": "available", "eta_minutes": 5, "department": "membership" }
    ]
  },
  {
    "name": "service_recovery_alerts",
    "description": "",
    "columns": [
      { "name": "alert_id", "type": "integer", "nullable": false },
      { "name": "member_id", "type": "text", "nullable": true },
      { "name": "member_name", "type": "text", "nullable": true },
      { "name": "severity", "type": "text", "nullable": true },
      { "name": "zone", "type": "text", "nullable": true },
      { "name": "detail", "type": "text", "nullable": true },
      { "name": "recommended_action", "type": "text", "nullable": true },
      { "name": "created_at", "type": "timestamptz", "nullable": true },
      { "name": "resolved_at", "type": "timestamptz", "nullable": true }
    ],
    "relationships": [],
    "sampleRows": [
      { "alert_id": 1, "member_id": "mbr_014", "member_name": "Patricia Langford", "severity": "high", "zone": "clubhouse", "detail": "30-minute wait for table despite reservation", "recommended_action": "Manager visit with complimentary appetizer", "created_at": "2026-03-28T12:45:00Z", "resolved_at": null },
      { "alert_id": 2, "member_id": "mbr_008", "member_name": "Robert Chen", "severity": "medium", "zone": "golf_course", "detail": "Pace of play complaint - group ahead 20 min behind", "recommended_action": "Ranger intervention and pro shop credit", "created_at": "2026-03-28T10:20:00Z", "resolved_at": "2026-03-28T10:45:00Z" }
    ]
  },
  {
    "name": "booking_confirmations",
    "description": "",
    "columns": [
      { "name": "confirmation_id", "type": "text", "nullable": false },
      { "name": "booking_id", "type": "text", "nullable": true },
      { "name": "member_id", "type": "text", "nullable": true },
      { "name": "member_name", "type": "text", "nullable": true },
      { "name": "tee_time", "type": "text", "nullable": true },
      { "name": "cancel_probability", "type": "real", "nullable": true },
      { "name": "outreach_status", "type": "text", "nullable": true },
      { "name": "outreach_channel", "type": "text", "nullable": true },
      { "name": "staff_notes", "type": "text", "nullable": true },
      { "name": "contacted_at", "type": "timestamptz", "nullable": true },
      { "name": "responded_at", "type": "timestamptz", "nullable": true },
      { "name": "created_at", "type": "timestamptz", "nullable": true }
    ],
    "relationships": [],
    "sampleRows": [
      { "confirmation_id": "bc_001", "booking_id": "bk_2045", "member_id": "mbr_019", "member_name": "David Mitchell", "tee_time": "2026-03-29T07:30:00", "cancel_probability": 0.72, "outreach_status": "contacted", "outreach_channel": "sms", "staff_notes": "Has cancelled last 3 Saturday bookings", "contacted_at": "2026-03-28T16:00:00Z", "responded_at": null, "created_at": "2026-03-28T15:30:00Z" },
      { "confirmation_id": "bc_002", "booking_id": "bk_2048", "member_id": "mbr_005", "member_name": "Jennifer Walsh", "tee_time": "2026-03-29T09:00:00", "cancel_probability": 0.15, "outreach_status": "confirmed", "outreach_channel": "email", "staff_notes": null, "contacted_at": "2026-03-28T14:00:00Z", "responded_at": "2026-03-28T14:22:00Z", "created_at": "2026-03-28T13:00:00Z" }
    ]
  },
  {
    "name": "slot_reassignments",
    "description": "",
    "columns": [
      { "name": "reassignment_id", "type": "text", "nullable": false },
      { "name": "source_booking_id", "type": "text", "nullable": true },
      { "name": "source_slot", "type": "text", "nullable": true },
      { "name": "source_member_id", "type": "text", "nullable": true },
      { "name": "source_member_name", "type": "text", "nullable": true },
      { "name": "recommended_fill_member_id", "type": "text", "nullable": true },
      { "name": "recommended_fill_member_name", "type": "text", "nullable": true },
      { "name": "status", "type": "text", "nullable": true },
      { "name": "staff_decision", "type": "text", "nullable": true },
      { "name": "revenue_recovered", "type": "real", "nullable": true },
      { "name": "health_before", "type": "integer", "nullable": true },
      { "name": "health_after", "type": "integer", "nullable": true },
      { "name": "decided_at", "type": "timestamptz", "nullable": true },
      { "name": "audit_trail", "type": "text", "nullable": true }
    ],
    "relationships": [],
    "sampleRows": [
      { "reassignment_id": "sr_001", "source_booking_id": "bk_2045", "source_slot": "2026-03-29T07:30:00", "source_member_id": "mbr_019", "source_member_name": "David Mitchell", "recommended_fill_member_id": "mbr_033", "recommended_fill_member_name": "Alan Foster", "status": "offered", "staff_decision": null, "revenue_recovered": null, "health_before": 64, "health_after": null, "decided_at": null, "audit_trail": null },
      { "reassignment_id": "sr_002", "source_booking_id": "bk_2031", "source_slot": "2026-03-28T14:00:00", "source_member_id": "mbr_011", "source_member_name": "Karen Brooks", "recommended_fill_member_id": "mbr_042", "recommended_fill_member_name": "Tom Henderson", "status": "accepted", "staff_decision": "approved", "revenue_recovered": 150.00, "health_before": 55, "health_after": 62, "decided_at": "2026-03-28T10:15:00Z", "audit_trail": "Auto-offered via waitlist; accepted within 12 min" }
    ]
  },
  {
    "name": "waitlist_config",
    "description": "",
    "columns": [
      { "name": "club_id", "type": "text", "nullable": false },
      { "name": "hold_time_minutes", "type": "integer", "nullable": true },
      { "name": "auto_offer_threshold", "type": "real", "nullable": true },
      { "name": "max_offers", "type": "integer", "nullable": true },
      { "name": "notification_limit", "type": "integer", "nullable": true }
    ],
    "relationships": [],
    "sampleRows": [
      { "club_id": "club_001", "hold_time_minutes": 30, "auto_offer_threshold": 0.65, "max_offers": 3, "notification_limit": 5 }
    ]
  },
  {
    "name": "connected_systems",
    "description": "",
    "columns": [
      { "name": "system_id", "type": "text", "nullable": false },
      { "name": "vendor_name", "type": "text", "nullable": true },
      { "name": "category", "type": "text", "nullable": true },
      { "name": "status", "type": "text", "nullable": true },
      { "name": "last_sync", "type": "timestamptz", "nullable": true },
      { "name": "data_points_synced", "type": "integer", "nullable": true },
      { "name": "config", "type": "text", "nullable": true }
    ],
    "relationships": [],
    "sampleRows": [
      { "system_id": "sys_001", "vendor_name": "ForeTees", "category": "tee_sheet", "status": "connected", "last_sync": "2026-03-28T06:00:00Z", "data_points_synced": 14520, "config": "{\"api_version\":\"v3\",\"sync_interval\":\"hourly\"}" },
      { "system_id": "sys_002", "vendor_name": "Jonas Club Software", "category": "pms", "status": "connected", "last_sync": "2026-03-28T05:45:00Z", "data_points_synced": 82340, "config": "{\"modules\":[\"billing\",\"membership\",\"dining\"]}" },
      { "system_id": "sys_003", "vendor_name": "Club Caddie", "category": "pos", "status": "degraded", "last_sync": "2026-03-27T22:00:00Z", "data_points_synced": 31200, "config": "{\"sync_interval\":\"daily\"}" }
    ]
  },
  {
    "name": "industry_benchmarks",
    "description": "",
    "columns": [
      { "name": "metric_key", "type": "text", "nullable": false },
      { "name": "club_value", "type": "real", "nullable": true },
      { "name": "industry_value", "type": "real", "nullable": true },
      { "name": "unit", "type": "text", "nullable": true },
      { "name": "label", "type": "text", "nullable": true },
      { "name": "comparison_text", "type": "text", "nullable": true },
      { "name": "direction", "type": "text", "nullable": true }
    ],
    "relationships": [],
    "sampleRows": [
      { "metric_key": "member_retention_rate", "club_value": 94.2, "industry_value": 88.5, "unit": "percent", "label": "Member Retention Rate", "comparison_text": "5.7% above industry average", "direction": "better" },
      { "metric_key": "avg_dues_per_member", "club_value": 15600.00, "industry_value": 12800.00, "unit": "dollars", "label": "Average Annual Dues", "comparison_text": "$2,800 above industry average", "direction": "higher" },
      { "metric_key": "food_min_spend_compliance", "club_value": 78.0, "industry_value": 71.0, "unit": "percent", "label": "F&B Minimum Compliance", "comparison_text": "7% above industry average", "direction": "better" }
    ]
  },
  {
    "name": "activity_log",
    "description": "",
    "columns": [
      { "name": "id", "type": "integer", "nullable": false },
      { "name": "action_type", "type": "text", "nullable": true },
      { "name": "action_subtype", "type": "text", "nullable": true },
      { "name": "actor", "type": "text", "nullable": true },
      { "name": "member_id", "type": "text", "nullable": true },
      { "name": "member_name", "type": "text", "nullable": true },
      { "name": "agent_id", "type": "text", "nullable": true },
      { "name": "reference_id", "type": "text", "nullable": true },
      { "name": "reference_type", "type": "text", "nullable": true },
      { "name": "description", "type": "text", "nullable": true },
      { "name": "meta", "type": "text", "nullable": true },
      { "name": "status", "type": "text", "nullable": true },
      { "name": "created_at", "type": "timestamptz", "nullable": true }
    ],
    "relationships": [],
    "sampleRows": [
      { "id": 1, "action_type": "intervention", "action_subtype": "outreach_call", "actor": "usr_gm_01", "member_id": "mbr_001", "member_name": "James Thompson", "agent_id": "agt_retention", "reference_id": "int_001", "reference_type": "intervention", "description": "GM called member regarding declining engagement", "meta": "{\"duration_min\":12,\"outcome\":\"positive\"}", "status": "completed", "created_at": "2026-03-28T10:30:00Z" },
      { "id": 2, "action_type": "agent_action", "action_subtype": "slot_fill", "actor": "system", "member_id": null, "member_name": null, "agent_id": "agt_teesheet", "reference_id": "aa_002", "reference_type": "agent_action", "description": "Auto-offered cancelled slot to waitlisted members", "meta": "{\"slots_offered\":3}", "status": "completed", "created_at": "2026-03-28T05:35:00Z" }
    ]
  },
  {
    "name": "member_invoices",
    "description": "",
    "columns": [
      { "name": "invoice_id", "type": "text", "nullable": false },
      { "name": "member_id", "type": "text", "nullable": false },
      { "name": "invoice_date", "type": "text", "nullable": true },
      { "name": "due_date", "type": "text", "nullable": true },
      { "name": "amount", "type": "real", "nullable": true },
      { "name": "type", "type": "text", "nullable": true },
      { "name": "description", "type": "text", "nullable": true },
      { "name": "status", "type": "text", "nullable": true },
      { "name": "paid_date", "type": "text", "nullable": true },
      { "name": "paid_amount", "type": "real", "nullable": true },
      { "name": "days_past_due", "type": "integer", "nullable": true },
      { "name": "late_fee", "type": "real", "nullable": true },
      { "name": "collection_status", "type": "text", "nullable": true }
    ],
    "relationships": [
      { "fromColumn": "member_id", "toTable": "members", "toColumn": "member_id" }
    ],
    "sampleRows": [
      { "invoice_id": "inv_001", "member_id": "mbr_001", "invoice_date": "2026-03-01", "due_date": "2026-03-15", "amount": 1300.00, "type": "monthly_dues", "description": "March 2026 Monthly Dues", "status": "paid", "paid_date": "2026-03-12", "paid_amount": 1300.00, "days_past_due": 0, "late_fee": 0.00, "collection_status": null },
      { "invoice_id": "inv_002", "member_id": "mbr_027", "invoice_date": "2026-01-01", "due_date": "2026-01-15", "amount": 1300.00, "type": "monthly_dues", "description": "January 2026 Monthly Dues", "status": "overdue", "paid_date": null, "paid_amount": 0.00, "days_past_due": 72, "late_fee": 65.00, "collection_status": "second_notice" },
      { "invoice_id": "inv_003", "member_id": "mbr_014", "invoice_date": "2026-03-01", "due_date": "2026-03-15", "amount": 425.00, "type": "dining_minimum", "description": "Q1 2026 F&B Minimum Shortfall", "status": "pending", "paid_date": null, "paid_amount": 0.00, "days_past_due": 0, "late_fee": 0.00, "collection_status": null }
    ]
  },
  {
    "name": "health_scores",
    "description": "",
    "columns": [
      { "name": "id", "type": "text", "nullable": false },
      { "name": "member_id", "type": "text", "nullable": false },
      { "name": "club_id", "type": "text", "nullable": true },
      { "name": "score", "type": "real", "nullable": true },
      { "name": "tier", "type": "text", "nullable": true },
      { "name": "golf_score", "type": "real", "nullable": true },
      { "name": "dining_score", "type": "real", "nullable": true },
      { "name": "email_score", "type": "real", "nullable": true },
      { "name": "event_score", "type": "real", "nullable": true },
      { "name": "computed_at", "type": "timestamptz", "nullable": true },
      { "name": "archetype", "type": "text", "nullable": true },
      { "name": "score_delta", "type": "real", "nullable": true }
    ],
    "relationships": [
      { "fromColumn": "member_id", "toTable": "members", "toColumn": "member_id" }
    ],
    "sampleRows": [
      { "id": "hs_001", "member_id": "mbr_001", "club_id": "club_001", "score": 82.5, "tier": "healthy", "golf_score": 91.0, "dining_score": 74.0, "email_score": 88.0, "event_score": 65.0, "computed_at": "2026-03-28T06:00:00Z", "archetype": "social_golfer", "score_delta": -3.2 },
      { "id": "hs_002", "member_id": "mbr_014", "club_id": "club_001", "score": 47.0, "tier": "at_risk", "golf_score": 22.0, "dining_score": 58.0, "email_score": 45.0, "event_score": 71.0, "computed_at": "2026-03-28T06:00:00Z", "archetype": "community_connector", "score_delta": -12.5 },
      { "id": "hs_003", "member_id": "mbr_027", "club_id": "club_001", "score": 29.0, "tier": "critical", "golf_score": 15.0, "dining_score": 32.0, "email_score": 12.0, "event_score": 40.0, "computed_at": "2026-03-28T06:00:00Z", "archetype": "fitness_focused", "score_delta": -8.0 }
    ]
  },
  {
    "name": "rounds",
    "description": "",
    "columns": [
      { "name": "round_id", "type": "text", "nullable": false },
      { "name": "club_id", "type": "text", "nullable": true },
      { "name": "member_id", "type": "text", "nullable": false },
      { "name": "booking_id", "type": "text", "nullable": true },
      { "name": "round_date", "type": "text", "nullable": true },
      { "name": "tee_time", "type": "text", "nullable": true },
      { "name": "course_id", "type": "text", "nullable": true },
      { "name": "duration_minutes", "type": "integer", "nullable": true },
      { "name": "pace_rating", "type": "text", "nullable": true },
      { "name": "players", "type": "integer", "nullable": true },
      { "name": "cancelled", "type": "boolean", "nullable": true },
      { "name": "no_show", "type": "boolean", "nullable": true },
      { "name": "data_source", "type": "text", "nullable": true },
      { "name": "created_at", "type": "timestamptz", "nullable": true }
    ],
    "relationships": [
      { "fromColumn": "member_id", "toTable": "members", "toColumn": "member_id" }
    ],
    "sampleRows": [
      { "round_id": "rnd_001", "club_id": "club_001", "member_id": "mbr_001", "booking_id": "bk_2020", "round_date": "2026-03-27", "tee_time": "07:30", "course_id": "crs_001", "duration_minutes": 252, "pace_rating": "good", "players": 4, "cancelled": false, "no_show": false, "data_source": "foretees", "created_at": "2026-03-27T07:30:00Z" },
      { "round_id": "rnd_002", "club_id": "club_001", "member_id": "mbr_019", "booking_id": "bk_2025", "round_date": "2026-03-26", "tee_time": "09:00", "course_id": "crs_001", "duration_minutes": null, "pace_rating": null, "players": 2, "cancelled": true, "no_show": false, "data_source": "foretees", "created_at": "2026-03-25T10:00:00Z" },
      { "round_id": "rnd_003", "club_id": "club_001", "member_id": "mbr_005", "booking_id": "bk_2030", "round_date": "2026-03-28", "tee_time": "08:00", "course_id": "crs_001", "duration_minutes": 240, "pace_rating": "excellent", "players": 4, "cancelled": false, "no_show": false, "data_source": "foretees", "created_at": "2026-03-28T08:00:00Z" }
    ]
  },
  {
    "name": "transactions",
    "description": "",
    "columns": [
      { "name": "transaction_id", "type": "text", "nullable": false },
      { "name": "club_id", "type": "text", "nullable": true },
      { "name": "member_id", "type": "text", "nullable": false },
      { "name": "outlet_id", "type": "text", "nullable": true },
      { "name": "outlet_name", "type": "text", "nullable": true },
      { "name": "transaction_date", "type": "timestamptz", "nullable": true },
      { "name": "total_amount", "type": "real", "nullable": true },
      { "name": "item_count", "type": "integer", "nullable": true },
      { "name": "category", "type": "text", "nullable": true },
      { "name": "is_post_round", "type": "boolean", "nullable": true },
      { "name": "data_source", "type": "text", "nullable": true },
      { "name": "created_at", "type": "timestamptz", "nullable": true }
    ],
    "relationships": [
      { "fromColumn": "member_id", "toTable": "members", "toColumn": "member_id" }
    ],
    "sampleRows": [
      { "transaction_id": "txn_001", "club_id": "club_001", "member_id": "mbr_001", "outlet_id": "out_grill", "outlet_name": "19th Hole Grill", "transaction_date": "2026-03-27T12:45:00Z", "total_amount": 68.50, "item_count": 3, "category": "dining", "is_post_round": true, "data_source": "jonas", "created_at": "2026-03-27T12:45:00Z" },
      { "transaction_id": "txn_002", "club_id": "club_001", "member_id": "mbr_014", "outlet_id": "out_main", "outlet_name": "Main Dining Room", "transaction_date": "2026-03-26T19:00:00Z", "total_amount": 142.00, "item_count": 5, "category": "dining", "is_post_round": false, "data_source": "jonas", "created_at": "2026-03-26T19:00:00Z" },
      { "transaction_id": "txn_003", "club_id": "club_001", "member_id": "mbr_005", "outlet_id": "out_pro", "outlet_name": "Pro Shop", "transaction_date": "2026-03-28T07:50:00Z", "total_amount": 89.99, "item_count": 1, "category": "retail", "is_post_round": false, "data_source": "club_caddie", "created_at": "2026-03-28T07:50:00Z" }
    ]
  },
  {
    "name": "complaints",
    "description": "",
    "columns": [
      { "name": "complaint_id", "type": "text", "nullable": false },
      { "name": "club_id", "type": "text", "nullable": true },
      { "name": "member_id", "type": "text", "nullable": false },
      { "name": "category", "type": "text", "nullable": true },
      { "name": "description", "type": "text", "nullable": true },
      { "name": "status", "type": "text", "nullable": true },
      { "name": "priority", "type": "text", "nullable": true },
      { "name": "reported_at", "type": "timestamptz", "nullable": true },
      { "name": "resolved_at", "type": "timestamptz", "nullable": true },
      { "name": "resolved_by", "type": "text", "nullable": true },
      { "name": "resolution_notes", "type": "text", "nullable": true },
      { "name": "sla_hours", "type": "integer", "nullable": true },
      { "name": "data_source", "type": "text", "nullable": true }
    ],
    "relationships": [
      { "fromColumn": "member_id", "toTable": "members", "toColumn": "member_id" }
    ],
    "sampleRows": [
      { "complaint_id": "cmp_001", "club_id": "club_001", "member_id": "mbr_014", "category": "dining", "description": "Cold food served at main dining room, waited 40 minutes for entree", "status": "resolved", "priority": "high", "reported_at": "2026-03-20T20:15:00Z", "resolved_at": "2026-03-21T10:00:00Z", "resolved_by": "F&B Director", "resolution_notes": "Personal apology and complimentary dinner for two", "sla_hours": 24, "data_source": "manual" },
      { "complaint_id": "cmp_002", "club_id": "club_001", "member_id": "mbr_008", "category": "course_conditions", "description": "Bunkers on holes 5 and 12 not maintained properly", "status": "in_progress", "priority": "medium", "reported_at": "2026-03-27T15:30:00Z", "resolved_at": null, "resolved_by": null, "resolution_notes": null, "sla_hours": 48, "data_source": "manual" }
    ]
  },
  {
    "name": "member_sentiment_ratings",
    "description": "",
    "columns": [
      { "name": "rating_id", "type": "text", "nullable": false },
      { "name": "club_id", "type": "text", "nullable": true },
      { "name": "member_id", "type": "text", "nullable": false },
      { "name": "rating_type", "type": "text", "nullable": true },
      { "name": "score", "type": "real", "nullable": true },
      { "name": "comment", "type": "text", "nullable": true },
      { "name": "context_id", "type": "text", "nullable": true },
      { "name": "submitted_at", "type": "timestamptz", "nullable": true },
      { "name": "source", "type": "text", "nullable": true },
      { "name": "archived", "type": "boolean", "nullable": true }
    ],
    "relationships": [
      { "fromColumn": "member_id", "toTable": "members", "toColumn": "member_id" }
    ],
    "sampleRows": [
      { "rating_id": "rat_001", "club_id": "club_001", "member_id": "mbr_001", "rating_type": "nps", "score": 9.0, "comment": "Love the new practice facility improvements", "context_id": null, "submitted_at": "2026-03-15T14:00:00Z", "source": "quarterly_survey", "archived": false },
      { "rating_id": "rat_002", "club_id": "club_001", "member_id": "mbr_014", "rating_type": "dining_experience", "score": 3.0, "comment": "Service has declined noticeably in the past month", "context_id": "txn_002", "submitted_at": "2026-03-26T20:00:00Z", "source": "post_visit", "archived": false }
    ]
  },
  {
    "name": "churn_predictions",
    "description": "",
    "columns": [
      { "name": "prediction_id", "type": "text", "nullable": false },
      { "name": "club_id", "type": "text", "nullable": true },
      { "name": "member_id", "type": "text", "nullable": false },
      { "name": "prob_30d", "type": "real", "nullable": true },
      { "name": "prob_60d", "type": "real", "nullable": true },
      { "name": "prob_90d", "type": "real", "nullable": true },
      { "name": "confidence", "type": "real", "nullable": true },
      { "name": "risk_factors", "type": "text", "nullable": true },
      { "name": "model_version", "type": "text", "nullable": true },
      { "name": "computed_at", "type": "timestamptz", "nullable": true }
    ],
    "relationships": [
      { "fromColumn": "member_id", "toTable": "members", "toColumn": "member_id" }
    ],
    "sampleRows": [
      { "prediction_id": "cp_001", "club_id": "club_001", "member_id": "mbr_027", "prob_30d": 0.42, "prob_60d": 0.61, "prob_90d": 0.78, "confidence": 0.87, "risk_factors": "payment_delinquent,usage_decline,no_event_attendance", "model_version": "churn-v3.1", "computed_at": "2026-03-28T06:00:00Z" },
      { "prediction_id": "cp_002", "club_id": "club_001", "member_id": "mbr_014", "prob_30d": 0.18, "prob_60d": 0.29, "prob_90d": 0.41, "confidence": 0.82, "risk_factors": "dining_complaints,declining_satisfaction", "model_version": "churn-v3.1", "computed_at": "2026-03-28T06:00:00Z" },
      { "prediction_id": "cp_003", "club_id": "club_001", "member_id": "mbr_001", "prob_30d": 0.03, "prob_60d": 0.05, "prob_90d": 0.08, "confidence": 0.91, "risk_factors": null, "model_version": "churn-v3.1", "computed_at": "2026-03-28T06:00:00Z" }
    ]
  },
  {
    "name": "actions",
    "description": "",
    "columns": [
      { "name": "action_id", "type": "text", "nullable": false },
      { "name": "club_id", "type": "text", "nullable": true },
      { "name": "member_id", "type": "text", "nullable": true },
      { "name": "action_type", "type": "text", "nullable": true },
      { "name": "description", "type": "text", "nullable": true },
      { "name": "status", "type": "text", "nullable": true },
      { "name": "priority", "type": "text", "nullable": true },
      { "name": "assigned_to", "type": "text", "nullable": true },
      { "name": "source", "type": "text", "nullable": true },
      { "name": "impact_metric", "type": "text", "nullable": true },
      { "name": "approved_at", "type": "timestamptz", "nullable": true },
      { "name": "approved_by", "type": "text", "nullable": true },
      { "name": "executed_at", "type": "timestamptz", "nullable": true },
      { "name": "dismissed_at", "type": "timestamptz", "nullable": true },
      { "name": "dismiss_reason", "type": "text", "nullable": true },
      { "name": "created_at", "type": "timestamptz", "nullable": true }
    ],
    "relationships": [],
    "sampleRows": [
      { "action_id": "act_001", "club_id": "club_001", "member_id": "mbr_027", "action_type": "payment_followup", "description": "Contact member regarding overdue January invoice", "status": "in_progress", "priority": "high", "assigned_to": "Membership Director", "source": "agent_retention", "impact_metric": "$15,600 annual dues", "approved_at": "2026-03-20T09:00:00Z", "approved_by": "usr_gm_01", "executed_at": null, "dismissed_at": null, "dismiss_reason": null, "created_at": "2026-03-19T06:00:00Z" },
      { "action_id": "act_002", "club_id": "club_001", "member_id": "mbr_014", "action_type": "service_recovery", "description": "Schedule F&B director meeting to address dining concerns", "status": "completed", "priority": "medium", "assigned_to": "F&B Director", "source": "agent_retention", "impact_metric": "$15,600 annual dues", "approved_at": "2026-03-22T08:30:00Z", "approved_by": "usr_gm_01", "executed_at": "2026-03-23T11:00:00Z", "dismissed_at": null, "dismiss_reason": null, "created_at": "2026-03-21T06:00:00Z" }
    ]
  },
  {
    "name": "interventions",
    "description": "",
    "columns": [
      { "name": "intervention_id", "type": "text", "nullable": false },
      { "name": "club_id", "type": "text", "nullable": true },
      { "name": "member_id", "type": "text", "nullable": false },
      { "name": "action_id", "type": "text", "nullable": true },
      { "name": "intervention_type", "type": "text", "nullable": true },
      { "name": "description", "type": "text", "nullable": true },
      { "name": "initiated_by", "type": "text", "nullable": true },
      { "name": "initiated_at", "type": "timestamptz", "nullable": true },
      { "name": "health_score_before", "type": "real", "nullable": true },
      { "name": "health_score_after", "type": "real", "nullable": true },
      { "name": "outcome", "type": "text", "nullable": true },
      { "name": "outcome_measured_at", "type": "timestamptz", "nullable": true },
      { "name": "dues_protected", "type": "real", "nullable": true },
      { "name": "revenue_recovered", "type": "real", "nullable": true },
      { "name": "is_member_save", "type": "boolean", "nullable": true }
    ],
    "relationships": [
      { "fromColumn": "member_id", "toTable": "members", "toColumn": "member_id" }
    ],
    "sampleRows": [
      { "intervention_id": "int_001", "club_id": "club_001", "member_id": "mbr_001", "action_id": "act_003", "intervention_type": "personal_outreach", "description": "GM lunch meeting to discuss club experience and gather feedback", "initiated_by": "usr_gm_01", "initiated_at": "2026-02-10T12:00:00Z", "health_score_before": 38.0, "health_score_after": 72.0, "outcome": "retained", "outcome_measured_at": "2026-03-10T06:00:00Z", "dues_protected": 15600.00, "revenue_recovered": 0.00, "is_member_save": true },
      { "intervention_id": "int_002", "club_id": "club_001", "member_id": "mbr_014", "action_id": "act_002", "intervention_type": "service_recovery", "description": "F&B director hosted complimentary dinner and discussed improvements", "initiated_by": "usr_fbd_01", "initiated_at": "2026-03-23T18:30:00Z", "health_score_before": 45.0, "health_score_after": 58.0, "outcome": "improving", "outcome_measured_at": "2026-03-28T06:00:00Z", "dues_protected": 15600.00, "revenue_recovered": 0.00, "is_member_save": false }
    ]
  },
  {
    "name": "correlations",
    "description": "",
    "columns": [
      { "name": "correlation_id", "type": "text", "nullable": false },
      { "name": "club_id", "type": "text", "nullable": true },
      { "name": "correlation_key", "type": "text", "nullable": true },
      { "name": "headline", "type": "text", "nullable": true },
      { "name": "detail", "type": "text", "nullable": true },
      { "name": "domains", "type": "text", "nullable": true },
      { "name": "impact", "type": "text", "nullable": true },
      { "name": "metric_value", "type": "text", "nullable": true },
      { "name": "metric_label", "type": "text", "nullable": true },
      { "name": "trend", "type": "text", "nullable": true },
      { "name": "delta", "type": "text", "nullable": true },
      { "name": "delta_direction", "type": "text", "nullable": true },
      { "name": "computed_at", "type": "timestamptz", "nullable": true }
    ],
    "relationships": [],
    "sampleRows": [
      { "correlation_id": "cor_001", "club_id": "club_001", "correlation_key": "dining_frequency_retention", "headline": "Dining frequency strongly predicts retention", "detail": "Members averaging 3+ dining visits per month retain at 92% vs 71% for non-diners", "domains": "dining,retention", "impact": "high", "metric_value": "92%", "metric_label": "Diner retention rate", "trend": "[88,89,91,92]", "delta": "+1%", "delta_direction": "up", "computed_at": "2026-03-28T06:00:00Z" },
      { "correlation_id": "cor_002", "club_id": "club_001", "correlation_key": "round_frequency_spend", "headline": "Round frequency drives ancillary spend", "detail": "Each additional round per month correlates with $120 incremental F&B spend", "domains": "golf,dining,revenue", "impact": "medium", "metric_value": "$120", "metric_label": "Incremental F&B per round", "trend": "[105,110,115,120]", "delta": "+$5", "delta_direction": "up", "computed_at": "2026-03-28T06:00:00Z" }
    ]
  },
  {
    "name": "users",
    "description": "",
    "columns": [
      { "name": "user_id", "type": "text", "nullable": false },
      { "name": "club_id", "type": "text", "nullable": true },
      { "name": "email", "type": "text", "nullable": true },
      { "name": "name", "type": "text", "nullable": true },
      { "name": "role", "type": "text", "nullable": true },
      { "name": "title", "type": "text", "nullable": true },
      { "name": "active", "type": "boolean", "nullable": true },
      { "name": "password_hash", "type": "text", "nullable": true },
      { "name": "password_salt", "type": "text", "nullable": true },
      { "name": "last_login", "type": "timestamptz", "nullable": true },
      { "name": "created_at", "type": "timestamptz", "nullable": true }
    ],
    "relationships": [],
    "sampleRows": [
      { "user_id": "usr_gm_01", "club_id": "club_001", "email": "jmartin@oakridgecc.com", "name": "John Martin", "role": "gm", "title": "General Manager", "active": true, "password_hash": null, "password_salt": null, "last_login": "2026-03-28T08:15:00Z", "created_at": "2025-06-01T00:00:00Z" },
      { "user_id": "usr_mem_dir", "club_id": "club_001", "email": "sthompson@oakridgecc.com", "name": "Susan Thompson", "role": "membership_director", "title": "Director of Membership", "active": true, "password_hash": null, "password_salt": null, "last_login": "2026-03-28T09:02:00Z", "created_at": "2025-06-01T00:00:00Z" },
      { "user_id": "usr_fbd_01", "club_id": "club_001", "email": "mgarcia@oakridgecc.com", "name": "Maria Garcia", "role": "fb_director", "title": "Food & Beverage Director", "active": true, "password_hash": null, "password_salt": null, "last_login": "2026-03-27T16:30:00Z", "created_at": "2025-07-15T00:00:00Z" }
    ]
  },
  {
    "name": "sessions",
    "description": "",
    "columns": [
      { "name": "token", "type": "text", "nullable": false },
      { "name": "user_id", "type": "text", "nullable": true },
      { "name": "club_id", "type": "text", "nullable": true },
      { "name": "role", "type": "text", "nullable": true },
      { "name": "expires_at", "type": "timestamptz", "nullable": true },
      { "name": "created_at", "type": "timestamptz", "nullable": true }
    ],
    "relationships": [],
    "sampleRows": [
      { "token": "tok_abc123def456", "user_id": "usr_gm_01", "club_id": "club_001", "role": "gm", "expires_at": "2026-03-29T08:15:00Z", "created_at": "2026-03-28T08:15:00Z" },
      { "token": "tok_xyz789ghi012", "user_id": "usr_mem_dir", "club_id": "club_001", "role": "membership_director", "expires_at": "2026-03-29T09:02:00Z", "created_at": "2026-03-28T09:02:00Z" }
    ]
  },
  {
    "name": "notifications",
    "description": "",
    "columns": [
      { "name": "notification_id", "type": "text", "nullable": false },
      { "name": "club_id", "type": "text", "nullable": true },
      { "name": "user_id", "type": "text", "nullable": true },
      { "name": "channel", "type": "text", "nullable": true },
      { "name": "type", "type": "text", "nullable": true },
      { "name": "title", "type": "text", "nullable": true },
      { "name": "body", "type": "text", "nullable": true },
      { "name": "priority", "type": "text", "nullable": true },
      { "name": "related_member_id", "type": "text", "nullable": true },
      { "name": "related_action_id", "type": "text", "nullable": true },
      { "name": "read_at", "type": "timestamptz", "nullable": true },
      { "name": "sent_at", "type": "timestamptz", "nullable": true },
      { "name": "created_at", "type": "timestamptz", "nullable": true }
    ],
    "relationships": [],
    "sampleRows": [
      { "notification_id": "ntf_001", "club_id": "club_001", "user_id": "usr_gm_01", "channel": "in_app", "type": "health_alert", "title": "Critical: Member Health Score Drop", "body": "William Hayes (mbr_027) health score dropped to 29 - payment delinquency detected", "priority": "high", "related_member_id": "mbr_027", "related_action_id": "act_001", "read_at": "2026-03-28T08:20:00Z", "sent_at": "2026-03-28T06:05:00Z", "created_at": "2026-03-28T06:05:00Z" },
      { "notification_id": "ntf_002", "club_id": "club_001", "user_id": "usr_mem_dir", "channel": "email", "type": "digest", "title": "Morning Digest - March 28", "body": "3 members require attention, 2 pending actions, 1 new complaint", "priority": "normal", "related_member_id": null, "related_action_id": null, "read_at": null, "sent_at": "2026-03-28T07:00:00Z", "created_at": "2026-03-28T07:00:00Z" }
    ]
  },
  {
    "name": "notification_preferences",
    "description": "",
    "columns": [
      { "name": "user_id", "type": "text", "nullable": false },
      { "name": "club_id", "type": "text", "nullable": false },
      { "name": "morning_digest", "type": "boolean", "nullable": true },
      { "name": "digest_time", "type": "text", "nullable": true },
      { "name": "digest_channel", "type": "text", "nullable": true },
      { "name": "high_priority_alerts", "type": "boolean", "nullable": true },
      { "name": "alert_channel", "type": "text", "nullable": true },
      { "name": "escalation_alerts", "type": "boolean", "nullable": true },
      { "name": "slack_webhook", "type": "text", "nullable": true }
    ],
    "relationships": [],
    "sampleRows": [
      { "user_id": "usr_gm_01", "club_id": "club_001", "morning_digest": true, "digest_time": "07:00", "digest_channel": "email", "high_priority_alerts": true, "alert_channel": "in_app", "escalation_alerts": true, "slack_webhook": null },
      { "user_id": "usr_mem_dir", "club_id": "club_001", "morning_digest": true, "digest_time": "06:30", "digest_channel": "email", "high_priority_alerts": true, "alert_channel": "email", "escalation_alerts": false, "slack_webhook": null }
    ]
  },
  {
    "name": "playbook_runs",
    "description": "",
    "columns": [
      { "name": "run_id", "type": "text", "nullable": false },
      { "name": "club_id", "type": "text", "nullable": true },
      { "name": "playbook_id", "type": "text", "nullable": true },
      { "name": "playbook_name", "type": "text", "nullable": true },
      { "name": "member_id", "type": "text", "nullable": true },
      { "name": "triggered_by", "type": "text", "nullable": true },
      { "name": "trigger_reason", "type": "text", "nullable": true },
      { "name": "status", "type": "text", "nullable": true },
      { "name": "started_at", "type": "timestamptz", "nullable": true },
      { "name": "completed_at", "type": "timestamptz", "nullable": true },
      { "name": "health_score_at_start", "type": "real", "nullable": true },
      { "name": "health_score_at_end", "type": "real", "nullable": true },
      { "name": "outcome", "type": "text", "nullable": true }
    ],
    "relationships": [
      { "fromColumn": "member_id", "toTable": "members", "toColumn": "member_id" }
    ],
    "sampleRows": [
      { "run_id": "pr_001", "club_id": "club_001", "playbook_id": "pb_at_risk", "playbook_name": "At-Risk Member Recovery", "member_id": "mbr_014", "triggered_by": "agt_retention", "trigger_reason": "Health score below 50 for 14+ days", "status": "in_progress", "started_at": "2026-03-21T06:00:00Z", "completed_at": null, "health_score_at_start": 45.0, "health_score_at_end": null, "outcome": null },
      { "run_id": "pr_002", "club_id": "club_001", "playbook_id": "pb_new_member", "playbook_name": "New Member Onboarding", "member_id": "mbr_050", "triggered_by": "system", "trigger_reason": "New membership activated", "status": "completed", "started_at": "2026-02-15T06:00:00Z", "completed_at": "2026-03-15T06:00:00Z", "health_score_at_start": 50.0, "health_score_at_end": 74.0, "outcome": "successfully_onboarded" }
    ]
  },
  {
    "name": "playbook_steps",
    "description": "",
    "columns": [
      { "name": "step_id", "type": "text", "nullable": false },
      { "name": "run_id", "type": "text", "nullable": false },
      { "name": "club_id", "type": "text", "nullable": true },
      { "name": "step_number", "type": "integer", "nullable": true },
      { "name": "title", "type": "text", "nullable": true },
      { "name": "description", "type": "text", "nullable": true },
      { "name": "assigned_to", "type": "text", "nullable": true },
      { "name": "due_date", "type": "timestamptz", "nullable": true },
      { "name": "status", "type": "text", "nullable": true },
      { "name": "completed_at", "type": "timestamptz", "nullable": true },
      { "name": "completed_by", "type": "text", "nullable": true },
      { "name": "notes", "type": "text", "nullable": true }
    ],
    "relationships": [
      { "fromColumn": "run_id", "toTable": "playbook_runs", "toColumn": "run_id" }
    ],
    "sampleRows": [
      { "step_id": "ps_001", "run_id": "pr_001", "club_id": "club_001", "step_number": 1, "title": "Review member profile and complaint history", "description": "Pull up full member profile, recent complaints, and health score trend", "assigned_to": "Membership Director", "due_date": "2026-03-22T17:00:00Z", "status": "completed", "completed_at": "2026-03-22T10:30:00Z", "completed_by": "usr_mem_dir", "notes": "Multiple dining complaints identified" },
      { "step_id": "ps_002", "run_id": "pr_001", "club_id": "club_001", "step_number": 2, "title": "Schedule F&B recovery meeting", "description": "Coordinate with F&B director for complimentary dining experience", "assigned_to": "F&B Director", "due_date": "2026-03-25T17:00:00Z", "status": "completed", "completed_at": "2026-03-23T11:00:00Z", "completed_by": "usr_fbd_01", "notes": "Dinner scheduled for March 23" },
      { "step_id": "ps_003", "run_id": "pr_001", "club_id": "club_001", "step_number": 3, "title": "Follow-up satisfaction check", "description": "Call member one week after recovery dinner to gauge satisfaction", "assigned_to": "Membership Director", "due_date": "2026-03-30T17:00:00Z", "status": "pending", "completed_at": null, "completed_by": null, "notes": null }
    ]
  },
  {
    "name": "onboarding_progress",
    "description": "",
    "columns": [
      { "name": "club_id", "type": "text", "nullable": false },
      { "name": "step_key", "type": "text", "nullable": false },
      { "name": "completed", "type": "boolean", "nullable": true },
      { "name": "completed_at", "type": "timestamptz", "nullable": true },
      { "name": "notes", "type": "text", "nullable": true }
    ],
    "relationships": [],
    "sampleRows": [
      { "club_id": "club_001", "step_key": "import_members", "completed": true, "completed_at": "2025-06-01T10:00:00Z", "notes": "Imported 342 active members from Jonas" },
      { "club_id": "club_001", "step_key": "connect_teesheet", "completed": true, "completed_at": "2025-06-02T14:00:00Z", "notes": "ForeTees API connected successfully" },
      { "club_id": "club_001", "step_key": "configure_agents", "completed": true, "completed_at": "2025-06-05T09:00:00Z", "notes": "Retention and Tee Sheet agents activated" }
    ]
  },
  {
    "name": "feature_dependency",
    "description": "",
    "columns": [
      { "name": "dependency_id", "type": "text", "nullable": false },
      { "name": "feature_type", "type": "text", "nullable": true },
      { "name": "feature_key", "type": "text", "nullable": true },
      { "name": "domain_code", "type": "text", "nullable": true },
      { "name": "dependency_type", "type": "text", "nullable": true },
      { "name": "fallback_mode", "type": "text", "nullable": true },
      { "name": "user_message", "type": "text", "nullable": true },
      { "name": "created_at", "type": "timestamptz", "nullable": true }
    ],
    "relationships": [],
    "sampleRows": [
      { "dependency_id": "fd_001", "feature_type": "widget", "feature_key": "health_score_trend", "domain_code": "golf", "dependency_type": "required", "fallback_mode": "hidden", "user_message": "Connect your tee sheet system to enable health score trends", "created_at": "2025-06-01T00:00:00Z" },
      { "dependency_id": "fd_002", "feature_type": "page", "feature_key": "dining_analytics", "domain_code": "dining", "dependency_type": "required", "fallback_mode": "placeholder", "user_message": "Connect your POS system to view dining analytics", "created_at": "2025-06-01T00:00:00Z" }
    ]
  },
  {
    "name": "feature_state_log",
    "description": "",
    "columns": [
      { "name": "log_id", "type": "text", "nullable": false },
      { "name": "club_id", "type": "text", "nullable": true },
      { "name": "feature_type", "type": "text", "nullable": true },
      { "name": "feature_key", "type": "text", "nullable": true },
      { "name": "previous_state", "type": "text", "nullable": true },
      { "name": "new_state", "type": "text", "nullable": true },
      { "name": "reason", "type": "text", "nullable": true },
      { "name": "changed_at", "type": "timestamptz", "nullable": true }
    ],
    "relationships": [],
    "sampleRows": [
      { "log_id": "fsl_001", "club_id": "club_001", "feature_type": "widget", "feature_key": "health_score_trend", "previous_state": "disabled", "new_state": "enabled", "reason": "Golf data source connected", "changed_at": "2025-06-02T14:05:00Z" },
      { "log_id": "fsl_002", "club_id": "club_001", "feature_type": "page", "feature_key": "dining_analytics", "previous_state": "placeholder", "new_state": "enabled", "reason": "POS data source connected", "changed_at": "2025-06-03T09:30:00Z" }
    ]
  },
  {
    "name": "pause_state",
    "description": "",
    "columns": [
      { "name": "club_id", "type": "text", "nullable": false },
      { "name": "target_type", "type": "text", "nullable": false },
      { "name": "target_id", "type": "text", "nullable": false },
      { "name": "paused", "type": "boolean", "nullable": true },
      { "name": "paused_at", "type": "timestamptz", "nullable": true },
      { "name": "resume_at", "type": "timestamptz", "nullable": true },
      { "name": "paused_by", "type": "text", "nullable": true }
    ],
    "relationships": [],
    "sampleRows": [
      { "club_id": "club_001", "target_type": "agent", "target_id": "agt_teesheet", "paused": false, "paused_at": null, "resume_at": null, "paused_by": null },
      { "club_id": "club_001", "target_type": "notification", "target_id": "digest_email", "paused": true, "paused_at": "2026-03-25T08:00:00Z", "resume_at": "2026-04-01T08:00:00Z", "paused_by": "usr_gm_01" }
    ]
  },
  {
    "name": "agent_activity",
    "description": "",
    "columns": [
      { "name": "activity_id", "type": "text", "nullable": false },
      { "name": "club_id", "type": "text", "nullable": true },
      { "name": "agent_id", "type": "text", "nullable": true },
      { "name": "action_type", "type": "text", "nullable": true },
      { "name": "description", "type": "text", "nullable": true },
      { "name": "member_id", "type": "text", "nullable": true },
      { "name": "confidence", "type": "real", "nullable": true },
      { "name": "auto_executed", "type": "boolean", "nullable": true },
      { "name": "reasoning", "type": "text", "nullable": true },
      { "name": "created_at", "type": "timestamptz", "nullable": true }
    ],
    "relationships": [
      { "fromColumn": "agent_id", "toTable": "agent_definitions", "toColumn": "agent_id" }
    ],
    "sampleRows": [
      { "activity_id": "aact_001", "club_id": "club_001", "agent_id": "agt_retention", "action_type": "health_alert", "description": "Flagged mbr_027 for critical health score decline", "member_id": "mbr_027", "confidence": 0.92, "auto_executed": false, "reasoning": "Health score dropped 15 pts in 7 days; payment delinquency detected; no club visits in 45 days", "created_at": "2026-03-28T06:01:00Z" },
      { "activity_id": "aact_002", "club_id": "club_001", "agent_id": "agt_teesheet", "action_type": "slot_optimization", "description": "Identified 4 high-probability cancellations for Saturday morning", "member_id": null, "confidence": 0.85, "auto_executed": true, "reasoning": "Pattern analysis shows 72% cancel probability for 3 bookings based on historical no-show data", "created_at": "2026-03-28T05:30:00Z" }
    ]
  },
  {
    "name": "agent_configs",
    "description": "",
    "columns": [
      { "name": "club_id", "type": "text", "nullable": false },
      { "name": "agent_id", "type": "text", "nullable": false },
      { "name": "enabled", "type": "boolean", "nullable": true },
      { "name": "auto_approve_threshold", "type": "real", "nullable": true },
      { "name": "auto_approve_enabled", "type": "boolean", "nullable": true },
      { "name": "last_run", "type": "timestamptz", "nullable": true },
      { "name": "total_proposals", "type": "integer", "nullable": true },
      { "name": "total_auto_executed", "type": "integer", "nullable": true },
      { "name": "accuracy_score", "type": "real", "nullable": true }
    ],
    "relationships": [],
    "sampleRows": [
      { "club_id": "club_001", "agent_id": "agt_retention", "enabled": true, "auto_approve_threshold": 0.90, "auto_approve_enabled": false, "last_run": "2026-03-28T06:00:00Z", "total_proposals": 156, "total_auto_executed": 0, "accuracy_score": 0.89 },
      { "club_id": "club_001", "agent_id": "agt_teesheet", "enabled": true, "auto_approve_threshold": 0.80, "auto_approve_enabled": true, "last_run": "2026-03-28T05:30:00Z", "total_proposals": 342, "total_auto_executed": 187, "accuracy_score": 0.94 }
    ]
  },
  {
    "name": "data_syncs",
    "description": "",
    "columns": [
      { "name": "sync_id", "type": "text", "nullable": false },
      { "name": "club_id", "type": "text", "nullable": true },
      { "name": "source_type", "type": "text", "nullable": true },
      { "name": "status", "type": "text", "nullable": true },
      { "name": "records_processed", "type": "integer", "nullable": true },
      { "name": "records_failed", "type": "integer", "nullable": true },
      { "name": "error_message", "type": "text", "nullable": true },
      { "name": "started_at", "type": "timestamptz", "nullable": true },
      { "name": "completed_at", "type": "timestamptz", "nullable": true }
    ],
    "relationships": [],
    "sampleRows": [
      { "sync_id": "sync_001", "club_id": "club_001", "source_type": "tee_sheet", "status": "completed", "records_processed": 1240, "records_failed": 0, "error_message": null, "started_at": "2026-03-28T06:00:00Z", "completed_at": "2026-03-28T06:02:30Z" },
      { "sync_id": "sync_002", "club_id": "club_001", "source_type": "pos", "status": "failed", "records_processed": 830, "records_failed": 12, "error_message": "Connection timeout after 30s - Club Caddie API unreachable", "started_at": "2026-03-28T05:00:00Z", "completed_at": "2026-03-28T05:00:32Z" },
      { "sync_id": "sync_003", "club_id": "club_001", "source_type": "pms", "status": "completed", "records_processed": 4520, "records_failed": 3, "error_message": null, "started_at": "2026-03-28T05:45:00Z", "completed_at": "2026-03-28T05:48:15Z" }
    ]
  },
  {
    "name": "csv_imports",
    "description": "",
    "columns": [
      { "name": "import_id", "type": "text", "nullable": false },
      { "name": "club_id", "type": "text", "nullable": true },
      { "name": "uploaded_by", "type": "text", "nullable": true },
      { "name": "file_name", "type": "text", "nullable": true },
      { "name": "import_type", "type": "text", "nullable": true },
      { "name": "status", "type": "text", "nullable": true },
      { "name": "total_rows", "type": "integer", "nullable": true },
      { "name": "success_rows", "type": "integer", "nullable": true },
      { "name": "error_rows", "type": "integer", "nullable": true },
      { "name": "errors", "type": "text", "nullable": true },
      { "name": "started_at", "type": "timestamptz", "nullable": true },
      { "name": "completed_at", "type": "timestamptz", "nullable": true }
    ],
    "relationships": [],
    "sampleRows": [
      { "import_id": "imp_001", "club_id": "club_001", "uploaded_by": "usr_gm_01", "file_name": "members_update_march.csv", "import_type": "member_update", "status": "completed", "total_rows": 342, "success_rows": 340, "error_rows": 2, "errors": "[{\"row\":118,\"error\":\"invalid email\"},{\"row\":256,\"error\":\"duplicate member_id\"}]", "started_at": "2026-03-15T10:00:00Z", "completed_at": "2026-03-15T10:01:45Z" },
      { "import_id": "imp_002", "club_id": "club_001", "uploaded_by": "usr_mem_dir", "file_name": "event_registrations_q1.csv", "import_type": "event_data", "status": "completed", "total_rows": 890, "success_rows": 890, "error_rows": 0, "errors": null, "started_at": "2026-03-20T14:30:00Z", "completed_at": "2026-03-20T14:32:10Z" }
    ]
  },
  {
    "name": "data_source_status",
    "description": "",
    "columns": [
      { "name": "status_id", "type": "text", "nullable": false },
      { "name": "club_id", "type": "text", "nullable": true },
      { "name": "domain_code", "type": "text", "nullable": true },
      { "name": "is_connected", "type": "boolean", "nullable": true },
      { "name": "source_vendor", "type": "text", "nullable": true },
      { "name": "last_sync_at", "type": "timestamptz", "nullable": true },
      { "name": "row_count", "type": "integer", "nullable": true },
      { "name": "staleness_hours", "type": "integer", "nullable": true },
      { "name": "health_status", "type": "text", "nullable": true },
      { "name": "updated_at", "type": "timestamptz", "nullable": true }
    ],
    "relationships": [],
    "sampleRows": [
      { "status_id": "dss_001", "club_id": "club_001", "domain_code": "golf", "is_connected": true, "source_vendor": "ForeTees", "last_sync_at": "2026-03-28T06:00:00Z", "row_count": 14520, "staleness_hours": 2, "health_status": "healthy", "updated_at": "2026-03-28T06:02:30Z" },
      { "status_id": "dss_002", "club_id": "club_001", "domain_code": "dining", "is_connected": true, "source_vendor": "Club Caddie", "last_sync_at": "2026-03-27T22:00:00Z", "row_count": 31200, "staleness_hours": 10, "health_status": "degraded", "updated_at": "2026-03-28T06:00:00Z" },
      { "status_id": "dss_003", "club_id": "club_001", "domain_code": "billing", "is_connected": true, "source_vendor": "Jonas Club Software", "last_sync_at": "2026-03-28T05:45:00Z", "row_count": 82340, "staleness_hours": 2, "health_status": "healthy", "updated_at": "2026-03-28T05:48:15Z" }
    ]
  }
]
};

export default vercelPostgresSchema;
