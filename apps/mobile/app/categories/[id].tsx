import { router, useLocalSearchParams } from 'expo-router';
import { EditCategory } from '@/features/transactions/components/edit-category';

export default function EditCategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EditCategory id={id} onDone={() => router.back()} />;
}
