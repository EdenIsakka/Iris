import type { ReactNode } from 'react';
import { Pressable } from 'react-native';
import { Text } from './text';

type Props = { label: string; selected: boolean; onPress: () => void; icon?: ReactNode };

export function Chip({ label, selected, onPress, icon }: Props) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      className={`min-h-[36px] flex-row items-center gap-2 rounded-full ${icon ? 'pl-1.5 pr-4' : 'px-4'} ${
        selected ? 'bg-accent' : 'bg-fill'
      }`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      {icon}
      <Text className={`text-[15px] ${selected ? 'font-semibold text-on-accent' : ''}`}>
        {label}
      </Text>
    </Pressable>
  );
}
