import { LinkButton } from '@/components/ui/link-button';
import { Screen } from '@/components/ui/screen';
import { GoalList } from '@/features/goals/components/goal-list';

export default function GoalsScreen() {
  return (
    <Screen title="Metas">
      <LinkButton href="/goals/new" label="+ Nueva meta" />
      <GoalList />
    </Screen>
  );
}
