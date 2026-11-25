import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Tabs } from 'expo-router';
import { type ComponentProps, useEffect } from 'react';
import type { ColorValue } from 'react-native';
import { isFirstLaunch } from '@/lib/price-key';

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
  // La primera vez explica qué cuenta crear para los precios automáticos.
  useEffect(() => {
    isFirstLaunch().then((first) => first && router.push('/price-key'));
  }, []);

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Resumen', tabBarIcon: icon('pie-chart') }} />
      <Tabs.Screen name="payments" options={{ title: 'Pagos', tabBarIcon: icon('calendar') }} />
      <Tabs.Screen name="goals" options={{ title: 'Metas', tabBarIcon: icon('flag') }} />
      <Tabs.Screen
        name="investments"
        options={{ title: 'Inversiones', tabBarIcon: icon('trending-up') }}
      />
    </Tabs>
  );
}
