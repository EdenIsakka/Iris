import { Text } from 'react-native';
import { Screen } from '@/components/ui/screen';

// TODO(dashboard): saldo total, gastos del mes vs topes y gráfica con Victory Native.
export default function DashboardScreen() {
  return (
    <Screen title="Resumen">
      <Text>Aquí irán las gráficas de tu dinero.</Text>
    </Screen>
  );
}
