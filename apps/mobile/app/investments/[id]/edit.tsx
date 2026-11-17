import { router, useLocalSearchParams } from 'expo-router';
import { EditInvestment } from '@/features/investments/components/edit-investment';

export default function EditInvestmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // Al borrar, cierra también el detalle, que ya no tendría inversión.
  return (
    <EditInvestment id={id} onSaved={() => router.back()} onDeleted={() => router.dismissAll()} />
  );
}
