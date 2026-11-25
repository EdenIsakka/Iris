import { createTransactionSchema } from '@finanzas/shared';
import { Link } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { Pressable, View } from 'react-native';
import { AmountInput } from '@/components/ui/amount-input';
import { Chip } from '@/components/ui/chip';
import { DateField } from '@/components/ui/date-field';
import {
  Button,
  FieldLabel,
  Form,
  FormError,
  inputClassName,
  Segmented,
} from '@/components/ui/form';
import { Text, TextInput } from '@/components/ui/text';
import { TransferForm } from '@/features/transfers/components/transfer-form';
import { useWallets } from '@/features/wallets/api';
import {
  categoryForNote,
  type Transaction,
  useCategories,
  useCreateCategory,
  useCreateTransaction,
  useUpdateTransaction,
} from '../api';
import { CategoryIcon } from './category-icon';

type Kind = 'expense' | 'income';

type Props = {
  onSaved: () => void;
  /** Si viene, el formulario edita este movimiento en vez de crear uno nuevo. */
  transaction?: Transaction;
  footer?: ReactNode;
  /** Tipo con el que arranca un movimiento nuevo. */
  kind?: Kind;
};

export function TransactionForm({ onSaved, transaction, footer, kind: initialKind }: Props) {
  const wallets = useWallets();
  const categories = useCategories();
  const createTx = useCreateTransaction();
  const updateTx = useUpdateTransaction(transaction?.id ?? '');
  const create = transaction ? updateTx : createTx;
  const createCategory = useCreateCategory();

  const [kind, setKind] = useState<Kind | 'transfer'>(
    transaction?.kind ?? initialKind ?? 'expense',
  );
  const [amount, setAmount] = useState(transaction?.amountMinor.toString() ?? '');
  const [walletId, setWalletId] = useState<string | null>(transaction?.walletId ?? null);
  const [categoryId, setCategoryId] = useState<string | null>(transaction?.categoryId ?? null);
  const [note, setNote] = useState(transaction?.note ?? '');
  const [error, setError] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState<string | null>(null);
  const [date, setDate] = useState(() => transaction?.occurredAt ?? new Date());

  if (wallets.isLoading || categories.isLoading) {
    return <Text className="p-4 text-secondary">Cargando…</Text>;
  }
  if (wallets.error) return <Text className="p-4">{wallets.error.message}</Text>;
  if (categories.error) return <Text className="p-4">{categories.error.message}</Text>;
  if (!wallets.data?.length) return <Text className="p-4">Primero necesitas una billetera.</Text>;

  const selectedWallet = walletId ?? wallets.data[0]?.id ?? '';
  const currency = wallets.data.find((w) => w.id === selectedWallet)?.currency ?? 'COP';
  const chooseKind = (k: Kind | 'transfer') => {
    setKind(k);
    setCategoryId(null);
  };
  // Transferir solo al crear y con dos billeteras o más; editar una es otra pantalla.
  const kindPicker = (
    <Segmented
      options={[
        { value: 'expense', label: 'Gasto' },
        { value: 'income', label: 'Ingreso' },
        ...(!transaction && wallets.data.length > 1
          ? [{ value: 'transfer' as const, label: 'Transferir' }]
          : []),
      ]}
      value={kind}
      onChange={chooseKind}
    />
  );
  if (kind === 'transfer') return <TransferForm onSaved={onSaved} header={kindPicker} />;
  // Ya sin transferencia: las funciones de abajo no heredan el descarte del if.
  const moveKind: Kind = kind;

  const kindCategories = (categories.data ?? []).filter((c) => c.kind === kind);

  // Movimiento nuevo sin categoría elegida: la de la última vez con esta nota ("Rappi" → Comida).
  const suggested = () => categoryId ?? (transaction ? null : categoryForNote(note, kind));

  function submit() {
    const chosen = suggested();
    const parsed = createTransactionSchema.safeParse({
      walletId: selectedWallet,
      // Si la categoría elegida se borró en "Administrar", el movimiento queda sin categoría.
      categoryId: kindCategories.some((c) => c.id === chosen) ? chosen : null,
      kind,
      amountMinor: amount,
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
      { name, kind: moveKind },
      {
        onSuccess: (c) => {
          setCategoryId(c.id);
          setNewCategory(null);
        },
      },
    );
  }

  return (
    <Form>
      {kindPicker}

      <AmountInput
        label={`Monto (${currency})`}
        value={amount}
        onChangeValue={setAmount}
        currency={currency}
        autoFocus
      />

      <DateField value={date} onChange={setDate} />

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
            icon={<CategoryIcon name={c.name} income={kind === 'income'} small />}
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
        onEndEditing={() => setCategoryId(suggested())}
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
