import { type Href, Link } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

export function LinkButton({ href, label }: { href: Href; label: string }) {
  return (
    <Link href={href} asChild>
      <Pressable style={styles.button} accessibilityRole="button">
        <Text style={styles.text}>{label}</Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: '#1b5e20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
