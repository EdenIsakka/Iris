import { router, useLocalSearchParams } from 'expo-router';
import { EditGoal } from '@/features/goals/components/edit-goal';

export default function EditGoalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // Al borrar, cierra también el modal de aportes, que ya no tendría meta.
  return <EditGoal id={id} onSaved={() => router.back()} onDeleted={() => router.dismissAll()} />;
}
