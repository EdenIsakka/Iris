import { DarkTheme, DefaultTheme, type Theme } from 'expo-router';
import { vars } from 'nativewind';

/**
 * Colores de la app, claro y oscuro, al estilo de iOS. Única fuente: las clases de Tailwind
 * (bg-card, text-secondary…) leen estas variables y lo que no usa className (gráfica,
 * navegación) lee el objeto. Los tonos de verde, rojo y naranja son las versiones
 * accesibles de Apple: pasan contraste AA sobre su fondo.
 */
export const palette = {
  light: {
    background: '#F2F2F7',
    card: '#FFFFFF',
    label: '#000000',
    secondary: '#6C6C70',
    separator: '#E5E5EA',
    fill: '#E9E9EE',
    accent: '#248A3D',
    'on-accent': '#FFFFFF',
    positive: '#248A3D',
    negative: '#D70015',
    warning: '#C93400',
  },
  dark: {
    background: '#000000',
    card: '#1C1C1E',
    label: '#FFFFFF',
    secondary: '#98989F',
    separator: '#38383A',
    fill: '#2C2C2E',
    accent: '#30D158',
    'on-accent': '#000000',
    positive: '#30D158',
    negative: '#FF453A',
    warning: '#FF9F0A',
  },
} as const;

export type Scheme = keyof typeof palette;
export type Colors = (typeof palette)[Scheme];

/** Variables CSS para NativeWind, una por color: `--card`, `--label`… */
export const themeVars = {
  light: vars(Object.fromEntries(Object.entries(palette.light).map(([k, v]) => [`--${k}`, v]))),
  dark: vars(Object.fromEntries(Object.entries(palette.dark).map(([k, v]) => [`--${k}`, v]))),
};

/** Tema de React Navigation: barra de pestañas, encabezados y fondo de los modales. */
export function navigationTheme(scheme: Scheme): Theme {
  const c = palette[scheme];
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: c.accent,
      background: c.background,
      card: c.card,
      text: c.label,
      border: c.separator,
    },
  };
}
