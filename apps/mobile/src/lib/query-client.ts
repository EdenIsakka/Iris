import { MutationCache, QueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

// Todo lo que se guarda pasa por una mutación: una vibración corta confirma o avisa el error.
const buzz = (type: Haptics.NotificationFeedbackType) =>
  Haptics.notificationAsync(type).catch(() => {});

export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
  mutationCache: new MutationCache({
    onSuccess: () => buzz(Haptics.NotificationFeedbackType.Success),
    onError: () => buzz(Haptics.NotificationFeedbackType.Error),
  }),
});
