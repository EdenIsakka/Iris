import { createTransactionSchema } from '@finanzas/shared';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Link } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AmountInput } from '@/components/ui/amount-input';
import { Chip } from '@/components/ui/chip';
import { Text, TextInput } from '@/components/ui/text';
import { useWallets } from '@/features/wallets/api';
import { formatDate } from '@/lib/format-date';
import {
  type Transaction,
  useCategories,
  useCreateCategory,
  useCreateTransaction,
  useUpdateTransaction,
} from '../api';

type Kind = 'expense' | 'income';

type Props = {
  onSaved: () => void;
  /** Si viene, el formulario edita este movimiento en vez de crear uno nuevo. */
  transaction?: Transaction;
  footer?: ReactNode;
};

export function TransactionForm({ onSaved, transaction, footer }: Props) {
  const wallets = useWallets();
  const categories = useCategories();
  const createTx = useCreateTransaction();
  const updateTx = useUpdateTransaction(transaction?.id ?? '');
  const create = transaction ? updateTx : createTx;
  const createCategory = useCreateCategory();

  const [kind, setKind] = useState<Kind>(transaction?.kind ?? 'expense');
  const [amount, setAmount] = useState(transaction?.amountMinor ?? '');
  const [walletId, setWalletId] = useState<string | null>(transaction?.walletId ?? null);
  const [categoryId, setCategoryId] = useState<string | null>(transaction?.categoryId ?? null);
  const [note, setNote] = useState(transaction?.note ?? '');
  const [error, setError] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState<string | null>(null);
  const [date, setDate] = useState(() =>
    transaction ? new Date(transaction.occurredAt) : new Date(),
  );
  const [pickingDate, setPickingDate] = useState(false);

  if (wallets.isLoading || categories.isLoading) return <Text>Cargando…</Text>;
  if (wallets.error) return <Text>{wallets.error.message}</Text>;
  if (categories.error) return <Text>{categories.error.message}</Text>;
  if (!wallets.data?.length) return <Text>Primero necesitas una billetera.</Text>;

  const selectedWallet = walletId ?? wallets.data[0]?.id ?? '';
  const kindCategories = (categories.data ?? []).filter((c) => c.kind === kind);

  function submit() {
    const parsed = createTransactionSchema.safeParse({
      walletId: selectedWallet,
      // Si la categoría elegida se borró en "Administrar", el movimiento queda sin categoría.
      categoryId: kindCategories.some((c) => c.id === categoryId) ? categoryId : null,
      kind,
      amountMinor: amount,
      currency: 'COP',
      occurredAt: date.toISOString(),
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

      <Text style={styles.label}>Fecha</Text>
      <View style={styles.row}>
        <Chip label="Hoy" selected={isSameDay(date, 0)} onPress={() => setDate(daysAgo(0))} />
        <Chip label="Ayer" selected={isSameDay(date, 1)} onPress={() => setDate(daysAgo(1))} />
        <Chip
          label={isSameDay(date, 0) || isSameDay(date, 1) ? 'Otra fecha' : formatDate(date)}
          selected={!isSameDay(date, 0) && !isSameDay(date, 1)}
          onPress={() => setPickingDate(true)}
        />
      </View>
      {pickingDate ? (
        <DateTimePicker
          value={date}
          mode="date"
          maximumDate={new Date()}
          onChange={(event, picked) => {
            setPickingDate(false);
            if (event.type === 'set' && picked) setDate(picked);
          }}
        />
      ) : null}

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

      <View style={styles.labelRow}>
        <Text style={styles.label}>Categoría (opcional)</Text>
        <Link href="/categories" asChild>
          <Pressable style={styles.manage} accessibilityRole="button">
            <Text style={styles.manageText}>Administrar</Text>
          </Pressable>
        </Link>
      </View>
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
      {footer}
    </ScrollView>
  );
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function isSameDay(date: Date, nDaysAgo: number) {
  return date.toDateString() === daysAgo(nDaysAgo).toDateString();
}

const styles = StyleSheet.create({
  form: { padding: 16, gap: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  label: { fontWeight: '600', marginTop: 8 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  manage: { minHeight: 44, justifyContent: 'flex-end', paddingHorizontal: 4 },
  manageText: { color: '#1b5e20', fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#999', borderRadius: 8, padding: 12, fontSize: 18 },
  newCategory: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  newCategoryInput: { flex: 1, fontSize: 16 },
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
