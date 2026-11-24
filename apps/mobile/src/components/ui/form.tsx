import type { ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from './text';

/** Contenedor de formulario: scroll, márgenes y el teclado no se come los toques. */
export function Form({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-2 p-4 pb-8"
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

/** Caja de un campo de texto: tarjeta redondeada sobre el fondo gris, sin borde. El tamaño de letra lo pone
 * cada campo: dos tamaños en el mismo className no se sabe cuál gana. */
export const inputClassName = 'rounded-2xl bg-card px-4 py-3';

export function FieldLabel({ children, nativeID }: { children: ReactNode; nativeID?: string }) {
  return (
    <Text className="mt-2 text-[15px] font-medium text-secondary" nativeID={nativeID}>
      {children}
    </Text>
  );
}

export function FormError({ message }: { message: string | null | undefined }) {
  if (!message) return null;
  return (
    <Text className="text-[15px] text-negative" accessibilityRole="alert">
      {message}
    </Text>
  );
}

type SegmentedProps<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

/** Selector de opciones excluyentes, como el control segmentado de iOS. */
export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  return (
    <View className="flex-row rounded-2xl bg-fill p-1" accessibilityRole="tablist">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            className={`min-h-[40px] flex-1 items-center justify-center rounded-xl ${
              selected ? 'bg-card' : ''
            }`}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
          >
            <Text className={`text-[15px] ${selected ? 'font-semibold' : ''}`}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** Botón destructivo: texto rojo sobre la tarjeta, como "Borrar" en iOS. */
  destructive?: boolean;
};

export function Button({ label, onPress, disabled, destructive }: ButtonProps) {
  return (
    <Pressable
      className={`min-h-[52px] items-center justify-center rounded-2xl active:opacity-80 ${
        destructive ? 'mt-1 bg-card' : 'mt-4 bg-accent'
      } ${disabled ? 'opacity-50' : ''}`}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
    >
      <Text
        className={`text-[17px] font-semibold ${destructive ? 'text-negative' : 'text-on-accent'}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
