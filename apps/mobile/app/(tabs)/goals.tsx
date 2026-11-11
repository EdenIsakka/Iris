import { Screen } from '@/components/ui/screen';
import { AddGoalButton } from '@/features/goals/components/add-goal-button';
import { GoalList } from '@/features/goals/components/goal-list';

export default function GoalsScreen() {
  return (
    <Screen title="Metas">
      <AddGoalButton />
      <GoalList />
    </Screen>
  );
}
