import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { View } from 'react-native';
import { Text } from './text';

export const tabular = { fontVariant: ['tabular-nums' as const] };

type Props = { label: string; value: string; children?: ReactNode };

/** Tarjeta violeta con la cifra principal de la pantalla; debajo van sus cuadros. */
export function Hero({ label, value, children }: Props) {
  return (
    <View className="gap-3 rounded-3xl bg-hero p-5">
      <View>
        <Text className="text-[13px] text-on-hero-muted">{label}</Text>
        <Text
          className="text-[34px] font-bold tracking-tight text-on-hero"
          style={tabular}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {value}
        </Text>
      </View>
      {children}
    </View>
  );
}

type TileProps = { icon: ComponentProps<typeof Ionicons>['name']; label: string; value: string };

/** Cuadro dentro de la tarjeta violeta: un dato secundario con su ícono. */
export function HeroTile({ icon, label, value }: TileProps) {
  return (
    <View className="flex-1 gap-0.5 rounded-2xl bg-hero-tile px-3 py-2">
      <View className="flex-row items-center gap-1">
        <Ionicons name={icon} size={12} color="#CECBF6" />
        <Text className="text-[12px] text-on-hero-muted">{label}</Text>
      </View>
      <Text
        className="text-[17px] font-semibold text-on-hero"
        style={tabular}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
    </View>
  );
}
