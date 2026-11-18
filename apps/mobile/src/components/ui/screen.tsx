import type { ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from './text';
import { ThemeMenu } from './theme-menu';

type Props = { title: string; children: ReactNode };

/** Pantalla de pestaña con título grande, como en iOS. */
export function Screen({ title, children }: Props) {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-1 gap-3 px-4 pt-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-[34px] font-bold tracking-tight" accessibilityRole="header">
            {title}
          </Text>
          <ThemeMenu />
        </View>
        {children}
      </View>
    </SafeAreaView>
  );
}
