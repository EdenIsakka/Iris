import { formatMoney } from '@finanzas/shared';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { useWallets } from '../api';

/** Saldo total y de cada billetera; tocar una abre su edición. Va en Resumen. */
export function WalletsSummary() {
  const { data, isLoading, error } = useWallets();
  if (isLoading) return <Text>Cargando…</Text>;
  if (error) return <Text>{error.message}</Text>;
  const wallets = data ?? [];
  const total = wallets.reduce((acc, w) => acc + BigInt(w.balanceMinor), 0n);

  return (
    <View style={styles.block}>
      <View style={styles.row}>
        <Text style={styles.caption} accessibilityRole="header">
          Saldo total
        </Text>
        <Text style={styles.total}>{formatMoney(total)}</Text>
      </View>
      {wallets.map((w) => (
        <Link key={w.id} href={{ pathname: '/wallets/[id]', params: { id: w.id } }} asChild>
          <Pressable
            style={styles.row}
            accessibilityRole="button"
            accessibilityHint="Abre la billetera para editarla o borrarla"
          >
            <Text>{w.name}</Text>
            <Text>{formatMoney(BigInt(w.balanceMinor))}</Text>
          </Pressable>
        </Link>
      ))}
      <Link href="/wallets/new" asChild>
        <Pressable style={styles.link} accessibilityRole="button">
          <Text style={styles.linkText}>+ Nueva billetera</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 2 },
  caption: { color: '#555', fontWeight: '600' },
  total: { fontSize: 20, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
  },
  link: { minHeight: 44, justifyContent: 'center' },
  linkText: { color: '#1b5e20', fontWeight: '600' },
});
