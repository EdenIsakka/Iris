import { useState } from 'react';
import { Linking, Pressable } from 'react-native';
import { Button, FieldLabel, Form, FormError, inputClassName } from '@/components/ui/form';
import { Text, TextInput } from '@/components/ui/text';
import { usePriceKey, useSavePriceKey } from '../api';

/**
 * Explica qué cuenta crear para los precios automáticos y guarda la llave. Sale al abrir la app
 * por primera vez y desde Inversiones.
 */
export function PriceKeyForm({ onDone }: { onDone: () => void }) {
  const saved = usePriceKey();
  const save = useSavePriceKey();
  const [key, setKey] = useState('');

  return (
    <Form>
      <Text className="text-[22px] font-bold">Precios automáticos</Text>
      <Text className="text-[15px]">
        La app puede actualizar sola el valor de tus inversiones. Bitcoin funciona sin hacer nada.
        Para los fondos de EE. UU. (VOO, SPY, IVV) crea una llave gratis en Twelve Data y pégala
        aquí:
      </Text>
      <Text className="text-[15px]">1. Crea una cuenta gratis en Twelve Data.</Text>
      <Pressable
        className="min-h-[44px] justify-center active:opacity-60"
        accessibilityRole="link"
        onPress={() => Linking.openURL('https://twelvedata.com/register')}
      >
        <Text className="text-[17px] text-accent">Abrir twelvedata.com</Text>
      </Pressable>
      <Text className="text-[15px]">2. En tu panel, copia la «API key».</Text>
      <Text className="text-[15px]">3. Pégala aquí:</Text>

      <FieldLabel nativeID="price-key-label">Llave de Twelve Data</FieldLabel>
      <TextInput
        className={`${inputClassName} text-[17px]`}
        value={key}
        onChangeText={(t) => setKey(t.trim())}
        placeholder={saved.data ? 'Ya tienes una guardada' : 'Pega la llave'}
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabelledBy="price-key-label"
      />
      <Text className="text-[13px] text-secondary">
        Se guarda cifrada solo en este celular y solo se usa para pedir precios a Twelve Data.
      </Text>

      <FormError message={save.error?.message} />
      <Button
        label={save.isPending ? 'Revisando la llave…' : 'Guardar llave'}
        onPress={() => save.mutate(key, { onSuccess: onDone })}
        disabled={!key || save.isPending}
      />
      {saved.data ? (
        <Button
          destructive
          label="Quitar llave"
          onPress={() => save.mutate(null, { onSuccess: onDone })}
          disabled={save.isPending}
        />
      ) : null}
      <Pressable
        className="min-h-[44px] items-center justify-center active:opacity-60"
        accessibilityRole="button"
        onPress={onDone}
      >
        <Text className="text-[17px] text-accent">Ahora no</Text>
      </Pressable>
    </Form>
  );
}
