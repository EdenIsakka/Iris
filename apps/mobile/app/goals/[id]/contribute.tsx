import { router, useLocalSearchParams } from 'expo-router';
import { ContributionForm } from '@/features/goals/components/contribution-form';

export default function ContributeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ContributionForm goalId={id} onSaved={() => router.back()} />;
}
