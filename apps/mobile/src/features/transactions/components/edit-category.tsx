import { createCategorySchema } from '@finanzas/shared';
import { useState } from 'react';
import { Alert } from 'react-native';
import { Button, FieldLabel, Form, FormError, inputClassName } from '@/components/ui/form';
import { Text, TextInput } from '@/components/ui/text';
import { useCategories, useDeleteCategory, useRenameCategory } from '../api';

type Props = { id: string; onDone: () => void };

export function EditCategory({ id, onDone }: Props) {
  const { data, isLoading, error } = useCategories();
  const category = data?.find((c) => c.id === id);
  // Se monta con el nombre ya cargado: el formulario va en un componente aparte.
  if (isLoading) return <Text className="p-4 text-secondary">Cargando…</Text>;
  if (error) return <Text className="p-4">{error.message}</Text>;
  if (!category) return <Text className="p-4">No encontramos esta categoría.</Text>;
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
    <Form>
      <FieldLabel nativeID="category-name-label">Nombre</FieldLabel>
      <TextInput
        className={`${inputClassName} text-[17px]`}
        value={name}
        onChangeText={setName}
        maxLength={40}
        accessibilityLabelledBy="category-name-label"
      />
      <FormError message={message} />

      <Button
        label={rename.isPending ? 'Guardando…' : 'Guardar'}
        onPress={submit}
        disabled={busy}
      />
      <Button
        destructive
        label={remove.isPending ? 'Borrando…' : 'Borrar categoría'}
        onPress={confirmDelete}
        disabled={busy}
      />
    </Form>
  );
}
