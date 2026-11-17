import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

type IconName = ComponentProps<typeof Ionicons>['name'];

// Ícono relleno en la pestaña activa y de contorno en las demás, como en iOS. La barra siempre
// pasa el color como string, aunque el tipo admita más.
const icon =
  (name: string) =>
  ({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) => (
    <Ionicons
      name={(focused ? name : `${name}-outline`) as IconName}
      color={color as string}
      size={size}
    />
  );

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Resumen', tabBarIcon: icon('pie-chart') }} />
      <Tabs.Screen
        name="transactions"
        options={{ title: 'Movimientos', tabBarIcon: icon('swap-vertical') }}
      />
      <Tabs.Screen name="goals" options={{ title: 'Metas', tabBarIcon: icon('flag') }} />
      <Tabs.Screen
        name="investments"
        options={{ title: 'Inversiones', tabBarIcon: icon('trending-up') }}
      />
    </Tabs>
  );
}
