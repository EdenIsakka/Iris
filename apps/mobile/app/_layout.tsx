import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { queryClient } from '@/lib/query-client';

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="transactions/new"
          options={{ presentation: 'modal', headerShown: true, title: 'Nuevo movimiento' }}
        />
        <Stack.Screen
          name="transactions/[id]"
          options={{ presentation: 'modal', headerShown: true, title: 'Editar movimiento' }}
        />
        <Stack.Screen
          name="goals/new"
          options={{ presentation: 'modal', headerShown: true, title: 'Nueva meta' }}
        />
        <Stack.Screen
          name="goals/[id]/contribute"
          options={{ presentation: 'modal', headerShown: true, title: 'Aportar a la meta' }}
        />
      </Stack>
      <StatusBar style="auto" />
    </QueryClientProvider>
  );
}
