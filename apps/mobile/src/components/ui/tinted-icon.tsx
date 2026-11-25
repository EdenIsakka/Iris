import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { useColorScheme, View } from 'react-native';

export type IconName = ComponentProps<typeof Ionicons>['name'];

/**
 * Cada tono: [fondo claro, ícono claro, fondo oscuro, ícono oscuro, tono medio para barras].
 * En claro el fondo es un paso más fuerte que el más pálido para que no se pierda sobre blanco.
 */
const RAMPS = {
  purple: ['#CECBF6', '#26215C', '#3C3489', '#CECBF6', '#7F77DD'],
  teal: ['#9FE1CB', '#04342C', '#085041', '#9FE1CB', '#1D9E75'],
  coral: ['#F5C4B3', '#4A1B0C', '#712B13', '#F5C4B3', '#D85A30'],
  pink: ['#F4C0D1', '#4B1528', '#72243E', '#F4C0D1', '#D4537E'],
  blue: ['#B5D4F4', '#042C53', '#0C447C', '#B5D4F4', '#378ADD'],
  amber: ['#FAC775', '#412402', '#633806', '#FAC775', '#BA7517'],
  red: ['#F7C1C1', '#501313', '#791F1F', '#F7C1C1', '#E24B4A'],
  green: ['#C0DD97', '#173404', '#27500A', '#C0DD97', '#639922'],
  gray: ['#D3D1C7', '#2C2C2A', '#444441', '#D3D1C7', '#888780'],
} as const;

export type Ramp = keyof typeof RAMPS;

/** Tono medio del color, para barras y leyendas. */
export const rampColor = (ramp: Ramp) => RAMPS[ramp][4];

type Props = { icon: IconName; ramp: Ramp; size?: 'sm' | 'md' | 'lg' };

const SIZES = { sm: ['h-8 w-8', 15], md: ['h-10 w-10', 19], lg: ['h-12 w-12', 22] } as const;

/** Círculo de fondo suave con el ícono en el tono oscuro del mismo color. */
export function TintedIcon({ icon, ramp, size = 'md' }: Props) {
  const dark = useColorScheme() === 'dark';
  const [lightBg, lightFg, darkBg, darkFg] = RAMPS[ramp];
  const [box, iconSize] = SIZES[size];
  return (
    <View
      className={`items-center justify-center rounded-full ${box}`}
      style={{ backgroundColor: dark ? darkBg : lightBg }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Ionicons name={icon} size={iconSize} color={dark ? darkFg : lightFg} />
    </View>
  );
}
