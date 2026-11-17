import { useQueryClient } from '@tanstack/react-query';
import { Pressable, StyleSheet, Text } from 'react-native';
import { authClient } from '@/lib/auth-client';

export function SignOutButton() {
  const queryClient = useQueryClient();
  return (
    <Pressable
      style={styles.button}
      accessibilityRole="button"
      onPress={async () => {
        await authClient.signOut();
        // Que la próxima cuenta no vea datos en caché de esta.
        queryClient.clear();
      }}
    >
      <Text style={styles.text}>Cerrar sesión</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  text: { color: '#b00020', fontWeight: '600' },
});
