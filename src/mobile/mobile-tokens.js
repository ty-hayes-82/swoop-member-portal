import { theme } from '@/config/theme';

export const mobile = {
  ...theme,
  spacing: { ...theme.spacing, page: '16px', card: '14px', gap: '12px' },
  fontSize: { ...theme.fontSize, body: '16px', heading: '20px', caption: '13px', badge: '11px' },
  radius: { ...theme.radius, card: '16px', pill: '24px' },
  tabBar: { height: '64px' },
  touchTarget: '44px',
  safeArea: 'env(safe-area-inset-bottom, 0px)',
};

export const mobileColors = {
  ...theme.colors,
  mobileBg: '#F8F9FA',
  mobileCard: '#FFFFFF',
  mobileBorder: '#E5E7EB',
  urgentBanner: '#FEE2E2',
  urgentText: '#991B1B',
  successBanner: '#DCFCE7',
  successText: '#166534',
};
