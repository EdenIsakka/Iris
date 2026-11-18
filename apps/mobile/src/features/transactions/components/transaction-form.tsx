import { createTransactionSchema } from '@finanzas/shared';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Link } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { Pressable, View } from 'react-native';
import { AmountInput } from '@/components/ui/amount-input';
import { Chip } from '@/components/ui/chip';
import {
  Button,
  FieldLabel,
  Form,
  FormError,
  inputClassName,
  Segmented,
} from '@/components/ui/form';
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
  const [amount, setAmount] = useState(transaction?.amountMinor.toString() ?? '');
  const [walletId, setWalletId] = useState<string | null>(transaction?.walletId ?? null);
  const [categoryId, setCategoryId] = useState<string | null>(transaction?.categoryId ?? null);
  const [note, setNote] = useState(transaction?.note ?? '');
  const [error, setError] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState<string | null>(null);
  const [date, setDate] = useState(() => transaction?.occurredAt ?? new Date());
  const [pickingDate, setPickingDate] = useState(false);

  if (wallets.isLoading || categories.isLoading) {
    return <Text className="p-4 text-secondary">Cargando…</Text>;
  }
  if (wallets.error) return <Text className="p-4">{wallets.error.message}</Text>;
  if (categories.error) return <Text className="p-4">{categories.error.message}</Text>;
  if (!wallets.data?.length) return <Text className="p-4">Primero necesitas una billetera.</Text>;

  const selectedWallet = walletId ?? wallets.data[0]?.id ?? '';
  const currency = wallets.data.find((w) => w.id === selectedWallet)?.currency ?? 'COP';
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

  const chooseKind = (k: Kind) => {
    setKind(k);
    setCategoryId(null);
  };
  const otherDay = !isSameDay(date, 0) && !isSameDay(date, 1);

  return (
    <Form>
      <Segmented
        options={[
          { value: 'expense', label: 'Gasto' },
          { value: 'income', label: 'Ingreso' },
        ]}
        value={kind}
        onChange={chooseKind}
      />

      <AmountInput
        label={`Monto (${currency})`}
        value={amount}
        onChangeValue={setAmount}
        currency={currency}
        autoFocus
      />

      <FieldLabel>Fecha</FieldLabel>
      <View className="flex-row flex-wrap gap-2">
        <Chip label="Hoy" selected={isSameDay(date, 0)} onPress={() => setDate(daysAgo(0))} />
        <Chip label="Ayer" selected={isSameDay(date, 1)} onPress={() => setDate(daysAgo(1))} />
        <Chip
          label={otherDay ? formatDate(date) : 'Otra fecha'}
          selected={otherDay}
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
          <FieldLabel>Billetera</FieldLabel>
          <View className="flex-row flex-wrap gap-2">
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

      <View className="flex-row items-end justify-between">
        <FieldLabel>Categoría (opcional)</FieldLabel>
        <Link href="/categories" asChild>
          <Pressable className="min-h-[44px] justify-end px-1" accessibilityRole="button">
            <Text className="text-[15px] font-medium text-accent">Administrar</Text>
          </Pressable>
        </Link>
      </View>
      <View className="flex-row flex-wrap gap-2">
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
        <View className="flex-row items-center gap-2">
          <TextInput
            className={`${inputClassName} flex-1 text-[17px]`}
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
      <FormError message={createCategory.error?.message} />

      <FieldLabel nativeID="note-label">Nota (opcional)</FieldLabel>
      <TextInput
        className={`${inputClassName} text-[17px]`}
        value={note}
        onChangeText={setNote}
        maxLength={280}
        placeholder="Ej: Mercado de la semana"
        accessibilityLabelledBy="note-label"
      />

      <FormError message={error ?? create.error?.message} />
      <Button
        label={create.isPending ? 'Guardando…' : 'Guardar'}
        onPress={submit}
        disabled={create.isPending}
      />
      {footer}
    </Form>
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
