import { createWalletSchema, type WalletType, walletType } from '@finanzas/shared';
import { type ReactNode, useState } from 'react';
import { View } from 'react-native';
import { AmountInput } from '@/components/ui/amount-input';
import { Chip } from '@/components/ui/chip';
import { Button, FieldLabel, Form, FormError, inputClassName } from '@/components/ui/form';
import { TextInput } from '@/components/ui/text';
import { useSaveWallet, type Wallet } from '../api';
import { TYPE_LABELS } from '../labels';

type Props = {
  onSaved: () => void;
  /** Si viene, el formulario edita esta billetera en vez de crear una nueva. */
  wallet?: Wallet;
  footer?: ReactNode;
};

export function WalletForm({ onSaved, wallet, footer }: Props) {
  const save = useSaveWallet(wallet?.id);
  const [name, setName] = useState(wallet?.name ?? '');
  const [type, setType] = useState<WalletType>(wallet?.type ?? 'cash');
  // AmountInput deja '' para 0.
  const [opening, setOpening] = useState(
    wallet && wallet.openingBalanceMinor !== 0n ? wallet.openingBalanceMinor.toString() : '',
  );
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const parsed = createWalletSchema.safeParse({
      name,
      type,
      openingBalanceMinor: opening || '0',
    });
    if (!parsed.success) return setError('Escribe un nombre.');
    setError(null);
    save.mutate(parsed.data, { onSuccess: onSaved });
  }

  return (
    <Form>
      <FieldLabel nativeID="wallet-name-label">Nombre</FieldLabel>
      <TextInput
        className={`${inputClassName} text-[17px]`}
        value={name}
        onChangeText={setName}
        placeholder="Ej. Efectivo, Nequi, Visa"
        maxLength={40}
        accessibilityLabelledBy="wallet-name-label"
        autoFocus={!wallet}
      />

      <FieldLabel>Tipo</FieldLabel>
      <View className="flex-row flex-wrap gap-2">
        {walletType.options.map((t) => (
          <Chip key={t} label={TYPE_LABELS[t]} selected={t === type} onPress={() => setType(t)} />
        ))}
      </View>

      <AmountInput
        label="¿Cuánto tenía antes de usar la app? (COP)"
        value={opening}
        onChangeValue={setOpening}
      />

      <FormError message={error ?? save.error?.message} />
      <Button
        label={save.isPending ? 'Guardando…' : wallet ? 'Guardar' : 'Crear billetera'}
        onPress={submit}
        disabled={save.isPending}
      />
      {footer}
    </Form>
  );
}
