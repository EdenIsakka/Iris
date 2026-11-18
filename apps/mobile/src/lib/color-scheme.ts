import * as SecureStore from 'expo-secure-store';
import { Appearance } from 'react-native';

export type SchemeChoice = 'system' | 'light' | 'dark';

const KEY = 'color-scheme';
let current: SchemeChoice = 'system';

// Appearance cambia lo que devuelve useColorScheme en toda la app: no hace falta un contexto.
const apply = (choice: SchemeChoice) =>
  Appearance.setColorScheme(choice === 'system' ? 'unspecified' : choice);

/** Aplica la apariencia guardada. Se llama una vez al arrancar. */
export async function loadColorScheme() {
  // shortcut: SecureStore porque ya está instalado; si guardamos más preferencias, AsyncStorage.
  const saved = await SecureStore.getItemAsync(KEY).catch(() => null);
  if (saved === 'light' || saved === 'dark') {
    current = saved;
    apply(saved);
  }
}

export const getColorScheme = () => current;

export function setColorScheme(choice: SchemeChoice) {
  current = choice;
  apply(choice);
  SecureStore.setItemAsync(KEY, choice).catch(() => {});
}
