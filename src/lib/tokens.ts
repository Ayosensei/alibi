// src/lib/tokens.ts
// Generated from DESIGN.md — Single source of truth for design tokens.

export const colors = {
  background: '#0A0908',
  'surface-1': '#110F0D',
  'surface-2': '#181513',
  'surface-3': '#211D1A',
  border: '#2B2622',
  'border-strong': '#3A332D',
  'text-primary': '#F3EEE6',
  'text-secondary': '#B3AA9E',
  'text-tertiary': '#968D81',
  primary: '#D13636',
  'primary-hover': '#E24A4A',
  'primary-pressed': '#B82C2C',
  'on-primary': '#FFFFFF',
  thread: '#FF7A70',
  brass: '#C9A45C',
  'on-brass': '#1A1405',
  paper: '#E9E1D3',
  ink: '#1B1713',
  inspector: '#86B6C9',
  danger: '#F2555A',
  success: '#5CCB8B',
  'status-contradiction': '#FF7A70',
  'status-rehearsed': '#C9A45C',
  'status-impossible': '#E58F3A',
  'status-cleared': '#5CCB8B',
  'status-inferred': '#86B6C9',
} as const;

export type ColorToken = keyof typeof colors;

export const typography = {
  'display-xl': {
    fontFamily: 'Playfair Display',
    fontSize: '56px',
    fontWeight: 600,
    lineHeight: '60px',
    letterSpacing: '-0.02em',
  },
  'display-lg': {
    fontFamily: 'Playfair Display',
    fontSize: '40px',
    fontWeight: 600,
    lineHeight: '44px',
    letterSpacing: '-0.015em',
  },
  'display-md': {
    fontFamily: 'Playfair Display',
    fontSize: '28px',
    fontWeight: 600,
    lineHeight: '34px',
  },
  headline: {
    fontFamily: 'Inter',
    fontSize: '18px',
    fontWeight: 600,
    lineHeight: '26px',
    letterSpacing: '-0.01em',
  },
  'body-lg': {
    fontFamily: 'Inter',
    fontSize: '16px',
    fontWeight: 400,
    lineHeight: '24px',
  },
  'body-md': {
    fontFamily: 'Inter',
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: '20px',
  },
  label: {
    fontFamily: 'Inter',
    fontSize: '13px',
    fontWeight: 500,
    lineHeight: '16px',
    letterSpacing: '0.01em',
  },
  caption: {
    fontFamily: 'Inter',
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: '16px',
  },
  typewriter: {
    fontFamily: 'IBM Plex Mono',
    fontSize: '12px',
    fontWeight: 500,
    lineHeight: '16px',
    letterSpacing: '0.08em',
  },
  'mono-md': {
    fontFamily: 'IBM Plex Mono',
    fontSize: '13px',
    fontWeight: 400,
    lineHeight: '20px',
  },
} as const;

export const rounded = {
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '20px',
  full: '9999px',
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
  '4xl': '64px',
} as const;

export const shadows = {
  card: '0 0 0 1px rgba(243,238,230,0.06), 0 1px 1px rgba(0,0,0,0.5), 0 12px 32px -12px rgba(0,0,0,0.75), inset 0 1px 0 rgba(243,238,230,0.04)',
  polaroid: '0 0 0 1px rgba(243,238,230,0.06), 0 1px 1px rgba(0,0,0,0.5), 0 18px 28px -14px rgba(0,0,0,0.8), inset 0 1px 0 rgba(243,238,230,0.04)',
  floating: '0 0 0 1px rgba(243,238,230,0.10), 0 8px 24px -4px rgba(0,0,0,0.8)',
  threadGlow: '0 0 0 1px rgba(255,122,112,0.4), 0 0 32px -6px rgba(255,122,112,0.35)',
} as const;

export const motion = {
  durations: {
    fast: '120ms',
    normal: '200ms',
    panel: '320ms',
  },
  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
} as const;
