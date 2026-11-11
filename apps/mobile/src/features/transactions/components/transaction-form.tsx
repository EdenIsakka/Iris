import { createTransactionSchema } from '@finanzas/shared';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AmountInput } from '@/components/ui/amount-input';
import { useCategories, useCreateCategory, useCreateTransaction, useWallets } from '../api';

type Kind = 'expense' | 'income';

type Props = { onSaved: () => void };

export function TransactionForm({ onSaved }: Props) {
  const wallets = useWallets();
  const categories = useCategories();
  const create = useCreateTransaction();
  const createCategory = useCreateCategory();

  const [kind, setKind] = useState<Kind>('expense');
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState<string | null>(null);

  if (wallets.isLoading || categories.isLoading) return <Text>Cargando…</Text>;
  if (wallets.error) return <Text>{wallets.error.message}</Text>;
  if (categories.error) return <Text>{categories.error.message}</Text>;
  if (!wallets.data?.length) return <Text>Primero necesitas una billetera.</Text>;

  const selectedWallet = walletId ?? wallets.data[0]?.id ?? '';
  const kindCategories = (categories.data ?? []).filter((c) => c.kind === kind);

  function submit() {
    const parsed = createTransactionSchema.safeParse({
      walletId: selectedWallet,
      categoryId,
      kind,
      amountMinor: amount,
      currency: 'COP',
      occurredAt: new Date().toISOString(),
      note: note.trim() || undefined,
    });
    if (!parsed.success) {
      const field = parsed.error.issues[0]?.path[0];
      setError(field === 'amountMinor' ? 'Escribe un monto mayor que 0.' : 'Revisa los datos.');
      return;
    }
    setError(null);
    create.mutate(parsed.data, { onSuccess: onSaved });
  }

  function addCategory() {
    const name = newCategory?.trim();
    if (!name) return;
    createCategory.mutate(
      { name, kind },
      {
        onSuccess: (c) => {
          setCategoryId(c.id);
          setNewCategory(null);
        },
      },
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
      <View style={styles.row}>
        <Chip
          label="Gasto"
          selected={kind === 'expense'}
          onPress={() => {
            setKind('expense');
            setCategoryId(null);
          }}
        />
        <Chip
          label="Ingreso"
          selected={kind === 'income'}
          onPress={() => {
            setKind('income');
            setCategoryId(null);
          }}
        />
      </View>

      <AmountInput label="Monto (COP)" value={amount} onChangeValue={setAmount} autoFocus />

      {wallets.data.length > 1 ? (
        <>
          <Text style={styles.label}>Billetera</Text>
          <View style={styles.row}>
            {wallets.data.map((w) => (
              <Chip
                key={w.id}
                label={w.name}
                selected={w.id === selectedWallet}
                onPress={() => setWalletId(w.id)}
              />
            ))}
          </View>
        </>
      ) : null}

      <Text style={styles.label}>Categoría (opcional)</Text>
      <View style={styles.row}>
        {kindCategories.map((c) => (
          <Chip
            key={c.id}
            label={c.name}
            selected={c.id === categoryId}
            onPress={() => setCategoryId(c.id === categoryId ? null : c.id)}
          />
        ))}
        {newCategory === null ? (
          <Chip label="+ Nueva" selected={false} onPress={() => setNewCategory('')} />
        ) : null}
      </View>
      {newCategory !== null ? (
        <View style={styles.newCategory}>
          <TextInput
            style={[styles.input, styles.newCategoryInput]}
            value={newCategory}
            onChangeText={setNewCategory}
            maxLength={40}
            placeholder={kind === 'expense' ? 'Ej: Mascotas' : 'Ej: Arriendos'}
            accessibilityLabel="Nombre de la nueva categoría"
            autoFocus
            onSubmitEditing={addCategory}
            returnKeyType="done"
          />
          <Chip label={createCategory.isPending ? '…' : 'Agregar'} selected onPress={addCategory} />
          <Chip label="Cancelar" selected={false} onPress={() => setNewCategory(null)} />
        </View>
      ) : null}
      {createCategory.error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {createCategory.error.message}
        </Text>
      ) : null}

      <Text style={styles.label} nativeID="note-label">
        Nota (opcional)
      </Text>
      <TextInput
        style={styles.input}
        value={note}
        onChangeText={setNote}
        maxLength={280}
        placeholder="Ej: Mercado de la semana"
        accessibilityLabelledBy="note-label"
      />

      {error || create.error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error ?? create.error?.message}
        </Text>
      ) : null}

      <Pressable
        style={[styles.button, create.isPending && styles.buttonDisabled]}
        onPress={submit}
        disabled={create.isPending}
        accessibilityRole="button"
        accessibilityState={{ disabled: create.isPending }}
      >
        <Text style={styles.buttonText}>{create.isPending ? 'Guardando…' : 'Guardar'}</Text>
      </Pressable>
    </ScrollView>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={selected ? styles.chipTextSelected : undefined}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  form: { padding: 16, gap: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  label: { fontWeight: '600', marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#999', borderRadius: 8, padding: 12, fontSize: 18 },
  newCategory: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  newCategoryInput: { flex: 1, fontSize: 16 },
  error: { color: '#b00020' },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#999',
  },
  chipSelected: { backgroundColor: '#1b5e20', borderColor: '#1b5e20' },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
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
