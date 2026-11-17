import { formatMoney } from '@finanzas/shared';
import { FieldLabel, inputClassName } from '@/components/ui/form';
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
      <FieldLabel>{label}</FieldLabel>
      <TextInput
        className={`${inputClassName} text-[20px] font-semibold`}
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
