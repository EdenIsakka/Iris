import { Link } from 'expo-router';
import { Pressable, SectionList, StyleSheet, Text } from 'react-native';
import { useCategories } from '../api';

export function CategoryList() {
  const { data, isLoading, error } = useCategories();

  if (isLoading) return <Text style={styles.pad}>Cargando…</Text>;
  if (error) return <Text style={styles.pad}>{error.message}</Text>;

  const all = data ?? [];
  const sections = [
    { title: 'Gastos', data: all.filter((c) => c.kind === 'expense') },
    { title: 'Ingresos', data: all.filter((c) => c.kind === 'income') },
  ];

  return (
    <SectionList
      contentContainerStyle={styles.pad}
      sections={sections}
      keyExtractor={(c) => c.id}
      renderSectionHeader={({ section }) => (
        <Text style={styles.header} accessibilityRole="header">
          {section.title}
        </Text>
      )}
      renderItem={({ item }) => (
        <Link href={{ pathname: '/categories/[id]', params: { id: item.id } }} asChild>
          <Pressable
            style={styles.row}
            accessibilityRole="button"
            accessibilityHint="Abre la categoría para renombrarla o borrarla"
          >
            <Text>{item.name}</Text>
          </Pressable>
        </Link>
      )}
    />
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16 },
  header: { fontWeight: '700', marginTop: 16, marginBottom: 4, color: '#555' },
  row: { minHeight: 44, justifyContent: 'center' },
});
