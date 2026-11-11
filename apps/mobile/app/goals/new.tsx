import { router } from 'expo-router';
import { GoalForm } from '@/features/goals/components/goal-form';

export default function NewGoalScreen() {
  return <GoalForm onSaved={() => router.back()} />;
}
