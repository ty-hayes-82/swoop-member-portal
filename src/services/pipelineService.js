// pipelineService.js
import { warmLeads } from '@/data/pipeline';

export const getWarmLeads = () => warmLeads;
export const getPipelineSummary = () => ({
  hot:  warmLeads.filter(l => l.tier === 'hot').length,
  warm: warmLeads.filter(l => l.tier === 'warm').length,
  cool: warmLeads.filter(l => l.tier === 'cool').length,
  cold: warmLeads.filter(l => l.tier === 'cold').length,
  totalGuests: warmLeads.length,
  hotRevenuePotential: warmLeads.filter(l => l.tier === 'hot').reduce((s, l) => s + l.potentialDues, 0),
  totalRevenuePotential: warmLeads.reduce((s, l) => s + l.potentialDues, 0),
});

// Data provenance — which vendor systems this service simulates
export const sourceSystems = ["ForeTees", "Club Prophet"];
