import { Pressable } from 'react-native';
import { Text } from './text';

type Props = { label: string; selected: boolean; onPress: () => void };

export function Chip({ label, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className={`min-h-[44px] justify-center rounded-full px-4 ${selected ? 'bg-accent' : 'bg-fill'}`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text className={`text-[15px] ${selected ? 'font-semibold text-on-accent' : ''}`}>
        {label}
      </Text>
    </Pressable>
  );
}
