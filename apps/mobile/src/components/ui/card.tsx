import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Text } from './text';

type Props = { title?: string; children: ReactNode };

/** Bloque agrupado al estilo de Ajustes de iOS: título pequeño afuera y tarjeta redondeada. */
export function Card({ title, children }: Props) {
  return (
    <View className="gap-2">
      {title ? (
        <Text
          className="px-4 text-[13px] font-medium uppercase tracking-wide text-secondary"
          accessibilityRole="header"
        >
          {title}
        </Text>
      ) : null}
      <View className="gap-1 rounded-2xl bg-card px-4 py-3">{children}</View>
    </View>
  );
}

/** Fila etiqueta–valor con línea fina debajo, como una celda de iOS. */
export function Row({
  label,
  value,
  strong,
  valueClassName,
}: {
  label: string;
  value: string;
  strong?: boolean;
  valueClassName?: string;
}) {
  const weight = strong ? 'font-semibold' : '';
  return (
    <View className="min-h-[36px] flex-row items-center justify-between gap-2">
      <Text className={`text-[15px] ${weight}`}>{label}</Text>
      <Text className={`text-[15px] ${weight} ${valueClassName ?? ''}`}>{value}</Text>
    </View>
  );
}

/** Enlace de texto en color de acento, para acciones dentro de una tarjeta. */
export function CardAction({ label }: { label: string }) {
  return <Text className="text-[15px] font-medium text-accent">{label}</Text>;
}
