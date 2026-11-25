import { useMutation } from '@tanstack/react-query';
import { Alert, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hideUndo, useUndo } from '@/lib/undo';
import { Text } from './text';

/** Barra abajo con el último borrado y "Deshacer". Va una vez, en el layout raíz. */
export function UndoBar() {
  const pending = useUndo();
  // Como mutación: vibra y, como todo lo guardado, recalcula los pagos y reprograma los avisos.
  const run = useMutation({
    mutationFn: async (undo: () => void) => undo(),
    onError: (e) => Alert.alert('No se pudo deshacer', e.message),
  });
  const insets = useSafeAreaInsets();
  if (!pending) return null;
  return (
    <View
      className="absolute left-4 right-4 flex-row items-center justify-between rounded-2xl bg-hero py-1 pl-4 pr-1"
      // Por encima del botón + (y de la barra de pestañas).
      style={{ bottom: insets.bottom + 124, elevation: 6 }}
      accessibilityLiveRegion="polite"
    >
      <Text className="flex-1 text-[15px] text-on-hero">{pending.message}</Text>
      <Pressable
        className="min-h-[44px] justify-center px-3 active:opacity-60"
        onPress={() => {
          run.mutate(pending.undo);
          hideUndo();
        }}
        accessibilityRole="button"
      >
        <Text className="text-[15px] font-semibold text-on-hero-muted">Deshacer</Text>
      </Pressable>
    </View>
  );
}
