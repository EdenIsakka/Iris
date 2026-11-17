import { formatMoney } from '@finanzas/shared';
import { Text, TextInput } from '@/components/ui/text';

type Props = {
  label: string;
  value: string;
  onChangeValue: (digits: string) => void;
  autoFocus?: boolean;
};

/** Monto en pesos: solo dígitos, sin ceros iniciales y hasta 18 dígitos, como pide `amountMinor`. */
export function AmountInput({ label, value, onChangeValue, autoFocus }: Props) {
  return (
    <>
      <Text className="mt-2 text-[15px] font-medium text-secondary">{label}</Text>
      <TextInput
        className="rounded-xl bg-fill px-4 py-3 text-[20px] font-semibold"
        value={value}
        onChangeText={(t) => onChangeValue(t.replace(/\D/g, '').replace(/^0+/, ''))}
        keyboardType="number-pad"
        maxLength={18}
        placeholder="0"
        accessibilityLabel={label}
        autoFocus={autoFocus}
      />
      {value ? <Text className="text-secondary">{formatMoney(BigInt(value))}</Text> : null}
    </>
  );
}
