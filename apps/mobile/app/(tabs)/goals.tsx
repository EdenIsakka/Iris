import { Screen } from '@/components/ui/screen';
import { GoalList } from '@/features/goals/components/goal-list';

export default function GoalsScreen() {
  return (
    <Screen title="Metas">
      <GoalList />
    </Screen>
  );
}
