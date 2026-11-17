import { useQueryClient } from '@tanstack/react-query';
import { Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { authClient } from '@/lib/auth-client';

export function SignOutButton() {
  const queryClient = useQueryClient();
  return (
    <Pressable
      className="min-h-[50px] items-center justify-center rounded-2xl bg-card active:opacity-80"
      accessibilityRole="button"
      onPress={async () => {
        await authClient.signOut();
        // Que la próxima cuenta no vea datos en caché de esta.
        queryClient.clear();
      }}
    >
      <Text className="text-[17px] text-negative">Cerrar sesión</Text>
    </Pressable>
  );
}
