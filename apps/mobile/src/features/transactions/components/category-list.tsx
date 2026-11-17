import { Link } from 'expo-router';
import { Pressable, SectionList } from 'react-native';
import { Text } from '@/components/ui/text';
import { useCategories } from '../api';

export function CategoryList() {
  const { data, isLoading, error } = useCategories();

  if (isLoading) return <Text className="p-4 text-secondary">Cargando…</Text>;
  if (error) return <Text className="p-4">{error.message}</Text>;

  const all = data ?? [];
  const sections = [
    { title: 'Gastos', data: all.filter((c) => c.kind === 'expense') },
    { title: 'Ingresos', data: all.filter((c) => c.kind === 'income') },
  ];

  return (
    <SectionList
      className="flex-1 bg-background"
      contentContainerClassName="px-4 pb-8"
      sections={sections}
      keyExtractor={(c) => c.id}
      stickySectionHeadersEnabled={false}
      renderSectionHeader={({ section }) => (
        <Text
          className="px-4 pb-2 pt-6 text-[13px] font-medium uppercase tracking-wide text-secondary"
          accessibilityRole="header"
        >
          {section.title}
        </Text>
      )}
      // Cada sección es una tarjeta: la primera fila redondea arriba y la última abajo.
      renderItem={({ item, index, section }) => (
        <Link href={{ pathname: '/categories/[id]', params: { id: item.id } }} asChild>
          <Pressable
            className={`min-h-[48px] justify-center bg-card px-4 active:opacity-60 ${
              index === 0 ? 'rounded-t-2xl' : 'border-t border-separator'
            } ${index === section.data.length - 1 ? 'rounded-b-2xl' : ''}`}
            accessibilityRole="button"
            accessibilityHint="Abre la categoría para renombrarla o borrarla"
          >
            <Text className="text-[17px]">{item.name}</Text>
          </Pressable>
        </Link>
      )}
    />
  );
}
