import '@/global.css';
import { Platform } from 'react-native';

const tintColorLight = '#D4AF37'; // Metallic Gold
const tintColorDark = '#D4AF37';

export const Colors = {
  light: {
    text: '#111111',
    textSecondary: '#666666',
    background: '#FAFAFA',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#F0F0F0',
    primary: tintColorLight,
    border: '#EAEAEA',
  },
  dark: {
    text: '#FFFFFF',
    textSecondary: '#888888',
    background: '#000000', // True OLED Black
    backgroundElement: '#111111', // Matte dark gray
    backgroundSelected: '#222222',
    primary: tintColorDark,
    border: '#222222',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 4,
  one: 8,
  two: 12,
  three: 16,
  four: 24,
  five: 32,
  six: 48,
  seven: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
