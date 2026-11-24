import Ionicons from '@expo/vector-icons/Ionicons';
import { type Href, Link } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, useColorScheme, View } from 'react-native';
import { palette } from '@/lib/theme';
import { Text } from './ui/text';

type IconName = ComponentProps<typeof Ionicons>['name'];

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
  { label: 'Pagos', icon: 'calendar-outline', href: '/payments' },
  { label: 'Topes', icon: 'speedometer-outline', href: '/budgets' },
];

/** Atajos de Resumen a lo que más se usa. */
export function QuickActions() {
  const colors = palette[useColorScheme() === 'dark' ? 'dark' : 'light'];
  return (
    <View className="flex-row justify-between">
      {ACTIONS.map((a) => (
        <Link key={a.label} href={a.href} asChild>
          <Pressable
            className="w-[72px] items-center gap-1 active:opacity-60"
            accessibilityRole="button"
          >
            <View className="h-12 w-12 items-center justify-center rounded-full bg-card">
              <Ionicons name={a.icon} size={22} color={colors.accent} />
            </View>
            <Text className="text-[13px] text-secondary">{a.label}</Text>
          </Pressable>
        </Link>
      ))}
    </View>
  );
}
