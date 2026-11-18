import { backupService } from '@finanzas/db';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Directory, File } from 'expo-file-system';
import { Alert } from 'react-native';
import { Button, Form, FormError } from '@/components/ui/form';
import { Text } from '@/components/ui/text';
import { db } from '@/lib/db';

const backup = backupService(db);

/** Pide confirmación antes de borrar lo actual; false si la persona cancela. */
const confirmReplace = () =>
  new Promise<boolean>((resolve) =>
    Alert.alert(
      '¿Reemplazar tus datos?',
      'Todo lo que hay ahora en la app se cambia por lo de la copia. No se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Reemplazar', style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    ),
  );

/** Guarda todos los datos en un archivo y los recupera desde uno. */
export function BackupPanel() {
  const queryClient = useQueryClient();

  const save = useMutation({
    mutationFn: async () => {
      // Sin carpeta elegida (cancelar) no hay nada que guardar.
      const folder = await Directory.pickDirectoryAsync().catch(() => null);
      if (!folder) return null;
      const date = new Date().toISOString().slice(0, 10);
      const file = folder.createFile(`finanzas-${date}.json`, 'application/json');
      await file.write(JSON.stringify(backup.exportData()));
      return file.name;
    },
  });

  const restore = useMutation({
    mutationFn: async () => {
      const picked = await File.pickFileAsync();
      if (picked.canceled || !(await confirmReplace())) return null;
      let data: unknown;
      try {
        data = JSON.parse(await picked.result.text());
      } catch {
        throw new Error('Este archivo no es una copia de Finanzas, o está dañado.');
      }
      const rows = backup.importData(data);
      await queryClient.invalidateQueries();
      return rows;
    },
  });

  return (
    <Form>
      <Text className="text-[15px]">
        Tus datos viven solo en este celular: si lo pierdes o borras la app, se pierden. Guarda una
        copia de vez en cuando en Drive, en el correo o donde prefieras.
      </Text>

      <Button
        label={save.isPending ? 'Guardando…' : 'Guardar copia'}
        onPress={() => save.mutate()}
        disabled={save.isPending}
      />
      <FormError message={save.error?.message} />
      {save.data ? (
        <Text className="text-secondary">
          Listo: se guardó «{save.data}» en la carpeta elegida.
        </Text>
      ) : null}

      <Text className="mt-6 text-[15px]">
        Para pasar tus datos a otro celular, instala la app allí y abre la copia.
      </Text>
      <Button
        destructive
        label={restore.isPending ? 'Cargando…' : 'Abrir una copia'}
        onPress={() => restore.mutate()}
        disabled={restore.isPending}
      />
      <FormError message={restore.error?.message} />
      {restore.data !== undefined && restore.data !== null ? (
        <Text className="text-secondary">Listo: se cargaron los datos de la copia.</Text>
      ) : null}
    </Form>
  );
}
