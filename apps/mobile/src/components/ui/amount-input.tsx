import { type Currency, formatMoney } from '@finanzas/shared';
import { FieldLabel, inputClassName } from '@/components/ui/form';
import { Text, TextInput } from '@/components/ui/text';

type Props = {
  label: string;
  value: string;
  onChangeValue: (digits: string) => void;
  autoFocus?: boolean;
  currency?: Currency;
};

/**
 * Monto en unidad mínima: solo dígitos, sin ceros iniciales y hasta 15 dígitos, como pide
 * `amountMinor`. En USD se escriben centavos (1234 = US$12,34); debajo se ve cómo queda.
 */
export function AmountInput({ label, value, onChangeValue, autoFocus, currency = 'COP' }: Props) {
  return (
    <>
      <FieldLabel>{label}</FieldLabel>
      <TextInput
        className={`${inputClassName} text-[20px] font-semibold`}
        value={value}
        onChangeText={(t) => onChangeValue(t.replace(/\D/g, '').replace(/^0+/, ''))}
        keyboardType="number-pad"
        maxLength={15}
        placeholder="0"
        accessibilityLabel={label}
        autoFocus={autoFocus}
      />
      {value ? (
        <Text className="text-secondary">{formatMoney(BigInt(value), currency)}</Text>
      ) : null}
    </>
  );
}
