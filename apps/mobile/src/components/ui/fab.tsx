import Ionicons from '@expo/vector-icons/Ionicons';
import { type Href, Link } from 'expo-router';
import { Pressable } from 'react-native';

/** Botón flotante "+" abajo a la derecha de una pestaña; la lista deja espacio con pb-24. */
export function Fab({ href, label }: { href: Href; label: string }) {
  return (
    <Link href={href} asChild>
      <Pressable
        className="absolute bottom-5 right-5 h-14 w-14 items-center justify-center rounded-2xl bg-hero active:opacity-80"
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </Pressable>
    </Link>
  );
}
