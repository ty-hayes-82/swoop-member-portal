import { apiFetch } from './apiClient';
import { alertsFeed, locationMembers, staffOnDuty, zoneAnalytics } from '@/data/location';

const defaultMembers = locationMembers;
const defaultStaff = staffOnDuty;
const defaultAlerts = alertsFeed;
const defaultZones = zoneAnalytics;

let _d = null;

export const _init = async () => {
  try {
    const data = await apiFetch('/api/location');
    if (data) _d = data;
  } catch { /* static fallback */ }
};

const toNumber = (value, fallback = 0) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};

const normalizeStatus = (status) => {
  if (status === 'critical' || status === 'at-risk' || status === 'watch' || status === 'healthy') {
    return status;
  }
  return 'watch';
};

const normalizeMembers = (source) => {
  const list = Array.isArray(source) && source.length ? source : (defaultMembers);
  return list.map((member, index) => ({
    memberId: member?.memberId ?? `mbr_live_${index + 1}`,
    name: member?.name ?? `Member ${index + 1}`,
    lat: toNumber(member?.lat, 34.0401),
    lng: toNumber(member?.lng, -84.5981),
    zone: member?.zone ?? 'Clubhouse',
    zoneId: member?.zoneId ?? 'clubhouse',
    status: normalizeStatus(member?.status),
    healthScore: Math.max(0, Math.min(100, Math.round(toNumber(member?.healthScore, 62)))),
    timeInZone: member?.timeInZone ?? 'Unknown',
    needsAttention: Boolean(member?.needsAttention),
    recommendedAction: member?.recommendedAction ?? 'No action needed.',
  }));
};

const normalizeStaff = (source) => {
  const list = Array.isArray(source) && source.length ? source : (defaultStaff);
  return list.map((staff, index) => ({
    id: staff?.id ?? `staff_${index + 1}`,
    name: staff?.name ?? `Staff ${index + 1}`,
    role: staff?.role ?? 'Concierge',
    lat: toNumber(staff?.lat, 34.0398),
    lng: toNumber(staff?.lng, -84.5979),
    zone: staff?.zone ?? 'Clubhouse',
    status: staff?.status ?? 'Available',
    etaText: staff?.etaText ?? 'ETA 3 min',
  }));
};

export const getLiveMemberLocations = (payload = null) => {
  return normalizeMembers(payload?.members ?? _d?.members ?? payload?.locationMembers);
};
export const getStaffLocations = (payload = null) => {
  return normalizeStaff(payload?.staff ?? _d?.staff ?? payload?.staffOnDuty);
};

export const getServiceRecoveryAlerts = (payload = null) => {
  const source = payload?.alerts ?? _d?.alerts ?? payload?.alertsFeed;
  const list = Array.isArray(source) && source.length ? source : (defaultAlerts);
  return list.map((alert, index) => ({
    id: alert?.id ?? `alert_${index + 1}`,
    timestamp: alert?.timestamp ?? 'Now',
    severity: alert?.severity ?? 'info',
    title: alert?.title ?? 'Service signal detected',
    detail: alert?.detail ?? 'Review details in member timeline.',
    memberId: alert?.memberId ?? null,
  }));
};

export const locationSourceSystems = ['Swoop App', 'Member CRM', 'On-Property Sensors'];
