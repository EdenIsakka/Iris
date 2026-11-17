import { Pressable, StyleSheet, Text } from 'react-native';

type Props = { label: string; selected: boolean; onPress: () => void };

export function Chip({ label, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.selected]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={selected ? styles.selectedText : undefined}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#999',
  },
  selected: { backgroundColor: '#1b5e20', borderColor: '#1b5e20' },
  selectedText: { color: '#fff', fontWeight: '600' },
});
