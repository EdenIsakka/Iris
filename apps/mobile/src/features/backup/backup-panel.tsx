import { backupService } from '@finanzas/db';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Directory, File } from 'expo-file-system';
import { Alert } from 'react-native';
import { Button, Form, FormError } from '@/components/ui/form';
import { Text } from '@/components/ui/text';
import { db } from '@/lib/db';
import { formatDate } from '@/lib/format-date';
import { isLockOn, setLock } from '@/lib/lock';
import { disableAutoBackup, enableAutoBackup, getAutoBackup, writeBackup } from './auto-backup';

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
      return writeBackup(folder);
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
        throw new Error('Este archivo no es una copia de Iris, o está dañado.');
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

      <AutoBackupSection />
      <LockSection />

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

/** "content://…/tree/primary%3ADocuments%2FIris" → "Iris". */
const folderName = (uri: string) => decodeURIComponent(uri).split(/[:/]/).pop() || uri;

/** Copia cada semana, sola, al abrir la app, en una carpeta que se elige una vez. */
function AutoBackupSection() {
  const queryClient = useQueryClient();
  const state = useQuery({ queryKey: ['auto-backup'], queryFn: getAutoBackup });
  const toggle = useMutation({
    mutationFn: async (on: boolean) => (on ? enableAutoBackup() : disableAutoBackup()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['auto-backup'] }),
  });
  const auto = state.data;

  return (
    <>
      <Text className="mt-6 text-[17px] font-semibold">Copia automática</Text>
      {auto ? (
        <Text className="text-[15px] text-secondary">
          Cada semana, al abrir Iris, se guarda una copia en «{folderName(auto.folder)}».
          {auto.last ? ` Última: ${formatDate(new Date(auto.last))}.` : ''}
        </Text>
      ) : (
        <Text className="text-[15px] text-secondary">
          Elige una carpeta una vez y cada semana, al abrir Iris, se guarda una copia sola.
        </Text>
      )}
      <Button
        secondary
        label={
          toggle.isPending
            ? 'Guardando…'
            : auto
              ? 'Apagar copia automática'
              : 'Activar copia semanal'
        }
        onPress={() => toggle.mutate(!auto)}
        disabled={toggle.isPending || state.isLoading}
      />
      <FormError message={toggle.error?.message} />
    </>
  );
}

/** Pedir huella o PIN al abrir Iris. Apagado por defecto. */
function LockSection() {
  const queryClient = useQueryClient();
  const state = useQuery({ queryKey: ['lock'], queryFn: isLockOn });
  const toggle = useMutation({
    mutationFn: setLock,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lock'] }),
  });
  const on = state.data === true;

  return (
    <>
      <Text className="mt-6 text-[17px] font-semibold">Bloqueo con huella</Text>
      <Text className="text-[15px] text-secondary">
        {on
          ? 'Iris pide tu huella o el PIN del celular al abrirla.'
          : 'Si prestas el celular, Iris puede pedir tu huella o el PIN antes de mostrar tus datos.'}
      </Text>
      <Button
        secondary
        label={toggle.isPending ? 'Esperando…' : on ? 'Apagar bloqueo' : 'Prender bloqueo'}
        onPress={() => toggle.mutate(!on)}
        disabled={toggle.isPending || state.isLoading}
      />
      <FormError message={toggle.error?.message} />
    </>
  );
}
