import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Modal, Pressable, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getColorScheme, type SchemeChoice, setColorScheme } from '@/lib/color-scheme';
import { palette, themeVars } from '@/lib/theme';
import { Text } from './text';

const OPTIONS = [
  { value: 'system', label: 'Automático', icon: 'phone-portrait-outline' },
  { value: 'light', label: 'Claro', icon: 'sunny-outline' },
  { value: 'dark', label: 'Oscuro', icon: 'moon-outline' },
] as const satisfies { value: SchemeChoice; label: string; icon: string }[];

/** Botón pequeño junto al título que abre un menú para elegir claro, oscuro o el del teléfono. */
export function ThemeMenu() {
  const [open, setOpen] = useState(false);
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colors = palette[scheme];
  const insets = useSafeAreaInsets();
  const choice = getColorScheme();

  return (
    <>
      <Pressable
        className="h-11 w-11 items-center justify-center rounded-full active:opacity-60"
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Apariencia"
        accessibilityHint="Elige modo claro, oscuro o el del teléfono"
      >
        <Ionicons name="contrast-outline" size={22} color={colors.secondary} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        {/* El Modal se pinta fuera de la vista raíz: necesita sus propias variables de color. */}
        <Pressable
          style={themeVars[scheme]}
          className="flex-1 bg-black/20"
          onPress={() => setOpen(false)}
          accessibilityLabel="Cerrar menú"
        >
          <View
            className="absolute w-52 overflow-hidden rounded-2xl bg-card"
            style={{ top: insets.top + 52, right: 16, elevation: 8 }}
            accessibilityRole="menu"
          >
            {OPTIONS.map((o, i) => {
              const selected = o.value === choice;
              return (
                <Pressable
                  key={o.value}
                  className={`min-h-[48px] flex-row items-center gap-3 px-4 active:bg-fill ${
                    i > 0 ? 'border-t border-separator' : ''
                  }`}
                  onPress={() => {
                    setColorScheme(o.value);
                    setOpen(false);
                  }}
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected }}
                >
                  <Ionicons name={o.icon} size={20} color={colors.label} />
                  <Text className="flex-1 text-[17px]">{o.label}</Text>
                  {selected ? <Ionicons name="checkmark" size={20} color={colors.accent} /> : null}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
