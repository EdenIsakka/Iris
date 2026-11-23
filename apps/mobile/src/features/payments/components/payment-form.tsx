import { type PaymentRepeat, savePaymentSchema } from '@finanzas/shared';
import DateTimePicker from '@react-native-community/datetimepicker';
import { type ReactNode, useState } from 'react';
import { Alert, View } from 'react-native';
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
import { useCategories } from '@/features/transactions/api';
import { useWallets } from '@/features/wallets/api';
import { formatDate, isoDate } from '@/lib/format-date';
import { type Payment, useDeletePayment, usePayments, usePayPayment, useSavePayment } from '../api';

type Props = {
  onDone: () => void;
  /** Si viene, el formulario edita este pago en vez de crear uno nuevo. */
  payment?: Payment;
  footer?: ReactNode;
};

export function PaymentForm({ onDone, payment, footer }: Props) {
  const wallets = useWallets();
  const categories = useCategories();
  const save = useSavePayment(payment?.id);
  const [name, setName] = useState(payment?.name ?? '');
  const [amount, setAmount] = useState(payment?.amountMinor.toString() ?? '');
  const [walletId, setWalletId] = useState(payment?.walletId ?? null);
  const [categoryId, setCategoryId] = useState(payment?.categoryId ?? null);
  const [date, setDate] = useState(() =>
    payment ? new Date(`${payment.dueDate}T12:00:00`) : new Date(),
  );
  const [pickingDate, setPickingDate] = useState(false);
  const [repeat, setRepeat] = useState<PaymentRepeat>(payment?.repeat ?? 'monthly');
  const [error, setError] = useState<string | null>(null);

  if (wallets.isLoading || categories.isLoading) {
    return <Text className="p-4 text-secondary">Cargando…</Text>;
  }
  const loadError = wallets.error ?? categories.error;
  if (loadError) return <Text className="p-4">{loadError.message}</Text>;
  const walletList = wallets.data ?? [];
  const selectedWallet = walletId ?? walletList[0]?.id ?? '';
  const currency = walletList.find((w) => w.id === selectedWallet)?.currency ?? 'COP';
  const expenses = (categories.data ?? []).filter((c) => c.kind === 'expense');

  function submit() {
    const parsed = savePaymentSchema.safeParse({
      name,
      amountMinor: amount,
      walletId: selectedWallet,
      categoryId: expenses.some((c) => c.id === categoryId) ? categoryId : null,
      dueDate: isoDate(date),
      repeat,
    });
    if (!parsed.success) {
      const field = parsed.error.issues[0]?.path[0];
      setError(field === 'name' ? 'Escribe un nombre.' : 'Escribe un monto mayor que 0.');
      return;
    }
    setError(null);
    save.mutate(parsed.data, { onSuccess: onDone });
  }

  return (
    <Form>
      <FieldLabel nativeID="payment-name-label">¿Qué tienes que pagar?</FieldLabel>
      <TextInput
        className={`${inputClassName} text-[17px]`}
        value={name}
        onChangeText={setName}
        placeholder="Ej. Arriendo, internet, tarjeta"
        maxLength={80}
        accessibilityLabelledBy="payment-name-label"
        autoFocus={!payment}
      />

      <AmountInput
        label={`Monto (${currency})`}
        value={amount}
        onChangeValue={setAmount}
        currency={currency}
      />

      <FieldLabel>Fecha</FieldLabel>
      <Chip label={formatDate(date)} selected onPress={() => setPickingDate(true)} />
      {pickingDate ? (
        <DateTimePicker
          value={date}
          mode="date"
          onChange={(event, picked) => {
            setPickingDate(false);
            if (event.type === 'set' && picked) setDate(picked);
          }}
        />
      ) : null}

      <FieldLabel>¿Se repite?</FieldLabel>
      <Segmented
        options={[
          { value: 'monthly', label: 'Cada mes' },
          { value: 'once', label: 'Una sola vez' },
        ]}
        value={repeat}
        onChange={setRepeat}
      />

      {walletList.length > 1 ? (
        <>
          <FieldLabel>Sale de</FieldLabel>
          <View className="flex-row flex-wrap gap-2">
            {walletList.map((w) => (
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

      <FieldLabel>Categoría (opcional)</FieldLabel>
      <View className="flex-row flex-wrap gap-2">
        {expenses.map((c) => (
          <Chip
            key={c.id}
            label={c.name}
            selected={c.id === categoryId}
            onPress={() => setCategoryId(c.id === categoryId ? null : c.id)}
          />
        ))}
      </View>

      <FormError message={error ?? save.error?.message} />
      <Button
        label={save.isPending ? 'Guardando…' : payment ? 'Guardar' : 'Agregar pago'}
        onPress={submit}
        disabled={save.isPending}
      />
      {footer}
    </Form>
  );
}

/** El pago con sus acciones: marcarlo como pagado o borrarlo. */
export function EditPayment({ id, onDone }: { id: string; onDone: () => void }) {
  const { data, isLoading, error } = usePayments();
  const pay = usePayPayment();
  const remove = useDeletePayment();

  if (isLoading) return <Text className="p-4 text-secondary">Cargando…</Text>;
  if (error) return <Text className="p-4">{error.message}</Text>;
  const payment = data?.find((p) => p.id === id);
  if (!payment) return <Text className="p-4">No encontramos este pago.</Text>;
  const busy = pay.isPending || remove.isPending;

  function confirmDelete() {
    Alert.alert('¿Borrar este pago?', 'Ya no te avisaré de él. Tus movimientos no cambian.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: () => remove.mutate(id, { onSuccess: onDone }),
      },
    ]);
  }

  return (
    <PaymentForm
      payment={payment}
      onDone={onDone}
      footer={
        <>
          <Text className="mt-6 text-[15px] text-secondary">
            {payment.repeat === 'monthly'
              ? 'Al marcarlo como pagado se guarda el gasto de hoy y pasa al mes siguiente.'
              : 'Al marcarlo como pagado se guarda el gasto de hoy y sale de la lista.'}
          </Text>
          <Button
            label={pay.isPending ? 'Guardando…' : 'Ya lo pagué'}
            onPress={() => pay.mutate(id, { onSuccess: onDone })}
            disabled={busy}
          />
          <FormError message={pay.error?.message ?? remove.error?.message} />
          <Button
            destructive
            label={remove.isPending ? 'Borrando…' : 'Borrar pago'}
            onPress={confirmDelete}
            disabled={busy}
          />
        </>
      }
    />
  );
}
