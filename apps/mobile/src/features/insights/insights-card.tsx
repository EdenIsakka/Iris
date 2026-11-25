import { insightsService } from '@finanzas/db';
import { useQuery } from '@tanstack/react-query';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { TintedIcon } from '@/components/ui/tinted-icon';
import { budgetKeys } from '@/features/budgets/api';
import { db } from '@/lib/db';

const insights = insightsService(db);

/** Frases sobre cómo va el mes. Cuelga de budgetKeys: cambia con gastos y con topes. */
export function InsightsCard() {
  const { data } = useQuery({
    queryKey: [...budgetKeys.all, 'insights'],
    queryFn: () => insights.list(),
  });
  if (!data?.length) return null;
  return (
    <View className="gap-1 rounded-3xl bg-card px-4 py-2">
      {data.map((i) => (
        <View key={i.text} className="min-h-[48px] flex-row items-center gap-3 py-1">
          <TintedIcon
            icon={i.tone === 'good' ? 'checkmark' : 'alert'}
            ramp={i.tone === 'good' ? 'green' : 'amber'}
            size="sm"
          />
          <Text className="flex-1 text-[15px]">{i.text}</Text>
        </View>
      ))}
    </View>
  );
}
