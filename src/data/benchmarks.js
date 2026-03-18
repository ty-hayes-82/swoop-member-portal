// Industry benchmark data — private club averages for competitive comparison
// Sources: CMAA National Club Trends, PGA/NGCOA Industry Report, club management surveys

export const industryBenchmarks = {
  responseTime: {
    yourClub: 4.2,
    industry: 18.5,
    unit: 'hrs',
    label: 'Avg Response Time',
    comparison: '4.4x faster',
    direction: 'lower-better',
  },
  complaintResolution: {
    yourClub: 94,
    industry: 62,
    unit: '%',
    label: 'Complaint Resolution Rate',
    comparison: '+32pp',
    direction: 'higher-better',
  },
  boardConfidence: {
    yourClub: 94,
    industry: 61,
    unit: '%',
    label: 'Board Confidence Score',
    comparison: '+33pp',
    direction: 'higher-better',
  },
  memberRetention: {
    yourClub: 96,
    industry: 88,
    unit: '%',
    label: 'Member Retention Rate',
    comparison: '+8pp',
    direction: 'higher-better',
  },
  duesRecovery: {
    yourClub: 168000,
    industry: 42000,
    unit: '$',
    label: 'Annual Dues Protected',
    comparison: '4x more',
    direction: 'higher-better',
  },
  serviceFailureDetection: {
    yourClub: 23,
    industry: 6,
    unit: '',
    label: 'Service Failures Caught (90d)',
    comparison: '3.8x more',
    direction: 'higher-better',
  },
};
