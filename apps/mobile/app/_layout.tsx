import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { authClient } from '@/lib/auth-client';
import { queryClient } from '@/lib/query-client';

const modal = (title: string) => ({ presentation: 'modal' as const, headerShown: true, title });

export default function RootLayout() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator accessibilityLabel="Cargando" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Sin sesión solo existe la pantalla de entrar; con sesión, todo lo demás. */}
        <Stack.Protected guard={!session}>
          <Stack.Screen name="sign-in" />
        </Stack.Protected>
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="transactions/new" options={modal('Nuevo movimiento')} />
          <Stack.Screen name="transactions/[id]" options={modal('Editar movimiento')} />
          <Stack.Screen name="categories" options={modal('Categorías')} />
          <Stack.Screen name="categories/[id]" options={modal('Editar categoría')} />
          <Stack.Screen name="goals/new" options={modal('Nueva meta')} />
          <Stack.Screen name="goals/[id]/contribute" options={modal('Aportar a la meta')} />
          <Stack.Screen name="goals/[id]/edit" options={modal('Editar meta')} />
          <Stack.Screen name="investments/new" options={modal('Nueva inversión')} />
          <Stack.Screen name="investments/[id]/index" options={modal('Inversión')} />
          <Stack.Screen name="investments/[id]/edit" options={modal('Editar inversión')} />
        </Stack.Protected>
      </Stack>
      <StatusBar style="auto" />
    </QueryClientProvider>
  );
}
