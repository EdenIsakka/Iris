import { formatMoney } from '@finanzas/shared';
import { StyleSheet, Text, TextInput } from 'react-native';

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
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={(t) => onChangeValue(t.replace(/\D/g, '').replace(/^0+/, ''))}
        keyboardType="number-pad"
        maxLength={18}
        placeholder="0"
        accessibilityLabel={label}
        autoFocus={autoFocus}
      />
      {value ? <Text style={styles.hint}>{formatMoney(BigInt(value))}</Text> : null}
    </>
  );
}

const styles = StyleSheet.create({
  label: { fontWeight: '600', marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#999', borderRadius: 8, padding: 12, fontSize: 18 },
  hint: { color: '#555' },
});
