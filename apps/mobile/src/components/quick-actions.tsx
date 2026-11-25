import { type Href, Link } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Text } from './ui/text';
import { type IconName, TintedIcon } from './ui/tinted-icon';

const ACTIONS: { label: string; icon: IconName; href: Href }[] = [
  {
    label: 'Gasto',
    icon: 'remove',
    href: { pathname: '/transactions/new', params: { kind: 'expense' } },
  },
  {
    label: 'Ingreso',
    icon: 'add',
    href: { pathname: '/transactions/new', params: { kind: 'income' } },
  },
  { label: 'Movimientos', icon: 'list', href: '/transactions' },
  { label: 'Topes', icon: 'speedometer-outline', href: '/budgets' },
];

/** Atajos de Resumen a lo que más se usa. */
export function QuickActions() {
  return (
    <View className="flex-row justify-between">
      {ACTIONS.map((a) => (
        <Link key={a.label} href={a.href} asChild>
          <Pressable
            className="w-[80px] items-center gap-1.5 active:opacity-60"
            accessibilityRole="button"
            accessibilityLabel={a.label}
          >
            <TintedIcon icon={a.icon} ramp="purple" size="lg" />
            <Text className="text-[13px] text-secondary">{a.label}</Text>
          </Pressable>
        </Link>
      ))}
    </View>
  );
}
