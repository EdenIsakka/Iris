import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState } from 'react';
import { AppState, Image, Pressable, StyleSheet, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isLockOn, unlock } from '@/lib/lock';
import { palette } from '@/lib/theme';
import { Text } from './text';

// Volver a pedir la huella solo tras un rato fuera: elegir un archivo o el PIN también sacan a Iris.
const AWAY_MS = 60_000;

const icon = require('../../../assets/icon.png');

/** Pide la huella y, si la persona se identifica, abre. */
const askUnlock = (open: () => void) =>
  unlock()
    .then((ok) => ok && open())
    .catch(() => {});

/** Con el bloqueo prendido tapa la app hasta que la persona toca Entrar y se identifica. */
export function LockGate() {
  const [state, setState] = useState<'checking' | 'locked' | 'open'>('checking');
  const leftAt = useRef<number | null>(null);
  const colors = palette[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();

  useEffect(() => {
    isLockOn().then((on) => {
      setState(on ? 'locked' : 'open');
    });
    const sub = AppState.addEventListener('change', async (next) => {
      if (next === 'background') leftAt.current = Date.now();
      if (next !== 'active' || leftAt.current === null) return;
      const away = Date.now() - leftAt.current;
      leftAt.current = null;
      if (away > AWAY_MS && (await isLockOn())) {
        setState('locked');
      }
    });
    return () => sub.remove();
  }, []);

  if (state === 'open') return null;
  // Mientras revisa, solo el fondo: no asoman los datos y quien no usa bloqueo no ve un destello.
  if (state === 'checking')
    return <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />;

  // La ventana del celular trae huella y PIN; los dos toques la abren.
  const enter = () => askUnlock(() => setState('open'));
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.hero }]}>
      <View style={[styles.brand, { paddingTop: insets.top }]}>
        <Image source={icon} style={styles.icon} accessibilityIgnoresInvertColors />
        <Text style={[styles.name, { color: colors['on-hero'] }]}>Iris</Text>
      </View>
      <View
        style={[
          styles.sheet,
          { backgroundColor: colors.background, paddingBottom: insets.bottom + 24 },
        ]}
      >
        <Text style={[styles.title, { color: colors.label }]}>Hola de nuevo</Text>
        <Text style={[styles.body, { color: colors.secondary }]}>Tus datos están bloqueados.</Text>
        <Pressable
          onPress={enter}
          accessibilityRole="button"
          accessibilityHint="Abre la ventana del celular para usar la huella o el PIN"
        >
          {({ pressed }) => (
            <View style={[styles.button, pressed && styles.pressed]}>
              <Ionicons name="finger-print" size={24} color={TEAL} />
              <Text style={styles.buttonLabel}>Entrar con huella</Text>
            </View>
          )}
        </Pressable>
        <Pressable onPress={enter} accessibilityRole="button" hitSlop={12}>
          <Text style={[styles.link, { color: colors.accent }]}>Usar el PIN del celular</Text>
        </Pressable>
      </View>
    </View>
  );
}

// Los colores del ícono: botón oscuro como su fondo, huella del color del iris.
const INK = '#0B1027';
const TEAL = '#22C3B1';

// Estilos fijos: aquí className no siempre llega (Image, Pressable con función).
const styles = StyleSheet.create({
  brand: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  icon: { width: 96, height: 96, borderRadius: 26 },
  name: { fontSize: 40, fontWeight: '700', letterSpacing: -0.5 },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 28,
    alignItems: 'stretch',
    gap: 8,
  },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  body: { fontSize: 15, textAlign: 'center', marginBottom: 16 },
  button: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 999,
    backgroundColor: INK,
  },
  pressed: { opacity: 0.85 },
  buttonLabel: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
  link: { fontSize: 15, fontWeight: '600', textAlign: 'center', paddingVertical: 12 },
});
