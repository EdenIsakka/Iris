import '../global.css';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, View } from 'react-native';
import { loadColorScheme } from '@/lib/color-scheme';
import { queryClient } from '@/lib/query-client';
import { navigationTheme, themeVars } from '@/lib/theme';

loadColorScheme();

const modal = (title: string) => ({ presentation: 'modal' as const, headerShown: true, title });

export default function RootLayout() {
  // Claro u oscuro según el teléfono, o lo que se eligió en el menú de apariencia.
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';

  return (
    <View style={themeVars[scheme]} className="flex-1 bg-background">
      <ThemeProvider value={navigationTheme(scheme)}>
        <QueryClientProvider client={queryClient}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="transactions/new" options={modal('Nuevo movimiento')} />
            <Stack.Screen name="transactions/[id]" options={modal('Editar movimiento')} />
            <Stack.Screen name="categories" options={modal('Categorías')} />
            <Stack.Screen name="categories/[id]" options={modal('Editar categoría')} />
            <Stack.Screen name="goals/new" options={modal('Nueva meta')} />
            <Stack.Screen name="goals/[id]/contribute" options={modal('Aportar a la meta')} />
            <Stack.Screen name="goals/[id]/edit" options={modal('Editar meta')} />
            <Stack.Screen name="budgets" options={modal('Topes de gasto')} />
            <Stack.Screen name="budgets/[id]" options={modal('Tope de gasto')} />
            <Stack.Screen name="wallets/new" options={modal('Nueva billetera')} />
            <Stack.Screen name="wallets/[id]" options={modal('Editar billetera')} />
            <Stack.Screen name="investments/new" options={modal('Nueva inversión')} />
            <Stack.Screen name="investments/[id]/index" options={modal('Inversión')} />
            <Stack.Screen name="investments/[id]/edit" options={modal('Editar inversión')} />
            <Stack.Screen name="price-key" options={modal('Precios automáticos')} />
            <Stack.Screen name="backup" options={modal('Copia de seguridad')} />
          </Stack>
        </QueryClientProvider>
      </ThemeProvider>
      <StatusBar style="auto" />
    </View>
  );
}
