import { createWalletSchema, type WalletType, walletType } from '@finanzas/shared';
import { type ReactNode, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AmountInput } from '@/components/ui/amount-input';
import { Chip } from '@/components/ui/chip';
import { Text, TextInput } from '@/components/ui/text';
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
    wallet && wallet.openingBalanceMinor !== '0' ? wallet.openingBalanceMinor : '',
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
    <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
      <Text style={styles.label} nativeID="wallet-name-label">
        Nombre
      </Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Ej. Efectivo, Nequi, Visa"
        maxLength={40}
        accessibilityLabelledBy="wallet-name-label"
        autoFocus={!wallet}
      />

      <Text style={styles.label}>Tipo</Text>
      <View style={styles.row}>
        {walletType.options.map((t) => (
          <Chip key={t} label={TYPE_LABELS[t]} selected={t === type} onPress={() => setType(t)} />
        ))}
      </View>

      <AmountInput
        label="¿Cuánto tenía antes de usar la app? (COP)"
        value={opening}
        onChangeValue={setOpening}
      />

      {error || save.error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error ?? save.error?.message}
        </Text>
      ) : null}

      <Pressable
        style={[styles.button, save.isPending && styles.buttonDisabled]}
        onPress={submit}
        disabled={save.isPending}
        accessibilityRole="button"
        accessibilityState={{ disabled: save.isPending }}
      >
        <Text style={styles.buttonText}>
          {save.isPending ? 'Guardando…' : wallet ? 'Guardar' : 'Crear billetera'}
        </Text>
      </Pressable>
      {footer}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  form: { padding: 16, gap: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  label: { fontWeight: '600', marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#999', borderRadius: 8, padding: 12, fontSize: 18 },
  error: { color: '#b00020' },
  button: {
    marginTop: 16,
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: '#1b5e20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
