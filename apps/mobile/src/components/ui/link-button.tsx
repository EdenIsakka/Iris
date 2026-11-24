import { type Href, Link } from 'expo-router';
import { Pressable } from 'react-native';
import { Text } from './text';

export function LinkButton({ href, label }: { href: Href; label: string }) {
  return (
    <Link href={href} asChild>
      <Pressable
        className="min-h-[50px] items-center justify-center rounded-2xl bg-accent active:opacity-80"
        accessibilityRole="button"
      >
        <Text className="text-[17px] font-semibold text-on-accent">{label}</Text>
      </Pressable>
    </Link>
  );
}
