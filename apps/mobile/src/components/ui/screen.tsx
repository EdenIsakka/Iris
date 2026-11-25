import type { ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from './text';
import { ThemeMenu } from './theme-menu';

type Props = {
  title: string;
  children: ReactNode;
  /** Texto pequeño sobre el título. */
  eyebrow?: string;
  /** Saludo encima de todo, solo en Resumen. */
  greeting?: string;
};

/** Pantalla de pestaña con título grande, como en iOS. */
export function Screen({ title, children, eyebrow, greeting }: Props) {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-1 gap-3 px-4 pt-2">
        <View className="flex-row items-center justify-between">
          <View>
            {greeting ? <Text className="text-[17px] font-semibold">{greeting}</Text> : null}
            {eyebrow ? <Text className="text-[15px] text-secondary">{eyebrow}</Text> : null}
            <Text className="text-[34px] font-bold tracking-tight" accessibilityRole="header">
              {title}
            </Text>
          </View>
          <ThemeMenu />
        </View>
        {children}
      </View>
    </SafeAreaView>
  );
}
