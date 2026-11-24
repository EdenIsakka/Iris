import { Fab } from '@/components/ui/fab';
import { Screen } from '@/components/ui/screen';
import { GoalList } from '@/features/goals/components/goal-list';

export default function GoalsScreen() {
  return (
    <Screen title="Metas">
      <GoalList />
      <Fab href="/goals/new" label="Nueva meta" />
    </Screen>
  );
}
