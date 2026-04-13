import {
  Circle,
  Users,
  UsersRound,
  UserRound,
  Calendar,
  Utensils,
  DollarSign,
  Radar,
  RefreshCw,
  ChefHat,
  LineChart,
  Check,
  X,
  Plus,
  Minus,
  ArrowRight,
  Radio,
  Headphones,
  CloudRain,
  Handshake,
  Compass,
  Lock,
  Star,
  Rocket,
  Database,
  Plug,
  Zap,
} from 'lucide-react';
import { theme } from '@/config/theme';

const registry = {
  Circle,
  Users,
  UsersRound,
  UserRound,
  Calendar,
  Utensils,
  DollarSign,
  Radar,
  RefreshCw,
  ChefHat,
  LineChart,
  Check,
  X,
  Plus,
  Minus,
  ArrowRight,
  Radio,
  Headphones,
  CloudRain,
  Handshake,
  Compass,
  Lock,
  Star,
  Rocket,
  Database,
  Plug,
  Zap,
};

export default function Icon({ name, size = 20, color, strokeWidth = 2, style, ...rest }) {
  const LucideIcon = registry[name] || Circle;
  return (
    <LucideIcon
      size={size}
      color={color || theme.colors.accent}
      strokeWidth={strokeWidth}
      style={style}
      {...rest}
    />
  );
}

export function IconBadge({ name, tone = 'orange', size = 22 }) {
  const tones = {
    orange: { bg: 'rgba(243,146,45,0.12)', fg: theme.colors.accent },
    ink: { bg: 'rgba(17,17,17,0.08)', fg: theme.neutrals.ink },
    paper: { bg: '#FFFFFF', fg: theme.colors.accent },
  };
  const t = tones[tone] || tones.orange;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 48,
        height: 48,
        borderRadius: 12,
        background: t.bg,
        flexShrink: 0,
      }}
    >
      <Icon name={name} size={size} color={t.fg} />
    </span>
  );
}
