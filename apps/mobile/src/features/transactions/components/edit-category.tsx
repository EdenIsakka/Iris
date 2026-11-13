import { createCategorySchema } from '@finanzas/shared';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useCategories, useDeleteCategory, useRenameCategory } from '../api';

type Props = { id: string; onDone: () => void };

export function EditCategory({ id, onDone }: Props) {
  const { data, isLoading, error } = useCategories();
  const category = data?.find((c) => c.id === id);
  // Se monta con el nombre ya cargado: el formulario va en un componente aparte.
  if (isLoading) return <Text style={styles.pad}>Cargando…</Text>;
  if (error) return <Text style={styles.pad}>{error.message}</Text>;
  if (!category) return <Text style={styles.pad}>No encontramos esta categoría.</Text>;
  return <CategoryForm id={id} initialName={category.name} onDone={onDone} />;
}

function CategoryForm({ id, initialName, onDone }: Props & { initialName: string }) {
  const rename = useRenameCategory(id);
  const remove = useDeleteCategory();
  const [name, setName] = useState(initialName);
  const [formError, setFormError] = useState<string | null>(null);

  function submit() {
    const parsed = createCategorySchema.shape.name.safeParse(name);
    if (!parsed.success) {
      setFormError('Escribe un nombre.');
      return;
    }
    setFormError(null);
    rename.mutate(parsed.data, { onSuccess: onDone });
  }

  function confirmDelete() {
    Alert.alert(
      '¿Borrar esta categoría?',
      'Sus movimientos se conservan y quedan sin categoría. No se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: () =>
            remove.mutate(id, {
              onSuccess: onDone,
              onError: (e) => Alert.alert('No se pudo borrar', e.message),
            }),
        },
      ],
    );
  }

  const busy = rename.isPending || remove.isPending;
  const message = formError ?? rename.error?.message;

  return (
    <View style={styles.form}>
      <Text style={styles.label}>Nombre</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        maxLength={40}
        accessibilityLabel="Nombre de la categoría"
      />
      {message ? (
        <Text style={styles.error} accessibilityRole="alert">
          {message}
        </Text>
      ) : null}

      <Pressable
        style={[styles.button, busy && styles.disabled]}
        onPress={submit}
        disabled={busy}
        accessibilityRole="button"
        accessibilityState={{ disabled: busy }}
      >
        <Text style={styles.buttonText}>{rename.isPending ? 'Guardando…' : 'Guardar'}</Text>
      </Pressable>
      <Pressable
        style={[styles.delete, busy && styles.disabled]}
        onPress={confirmDelete}
        disabled={busy}
        accessibilityRole="button"
        accessibilityState={{ disabled: busy }}
      >
        <Text style={styles.deleteText}>{remove.isPending ? 'Borrando…' : 'Borrar categoría'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16 },
  form: { padding: 16, gap: 8 },
  label: { fontWeight: '600', marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#999', borderRadius: 8, padding: 12, fontSize: 18 },
  error: { color: '#b00020' },
  button: {
    marginTop: 16,
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: '#1b5e20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  delete: {
    marginTop: 8,
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#b00020',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: { color: '#b00020', fontWeight: '700', fontSize: 16 },
});
