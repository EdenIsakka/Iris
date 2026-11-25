import { backupService } from '@finanzas/db';
import { Directory } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import { db } from '@/lib/db';

const backup = backupService(db);
const FOLDER = 'backup-folder';
const LAST = 'backup-last';
const WEEK_MS = 7 * 86_400_000;

/** Escribe todos los datos en `iris-AAAA-MM-DD.json` dentro de la carpeta. Devuelve el nombre. */
export async function writeBackup(folder: Directory, now = new Date()) {
  const file = folder.createFile(`iris-${now.toISOString().slice(0, 10)}.json`, 'application/json');
  await file.write(JSON.stringify(backup.exportData()));
  return file.name;
}

export type AutoBackup = { folder: string; last: string | null } | null;

/** La carpeta de la copia automática y la fecha de la última, o null si está apagada. */
export async function getAutoBackup(): Promise<AutoBackup> {
  // shortcut: SecureStore porque ya está instalado; con más preferencias, AsyncStorage.
  const folder = await SecureStore.getItemAsync(FOLDER).catch(() => null);
  if (!folder) return null;
  return { folder, last: await SecureStore.getItemAsync(LAST).catch(() => null) };
}

/** Elige la carpeta (el permiso queda guardado) y hace la primera copia. false si cancela. */
export async function enableAutoBackup(now = new Date()) {
  const folder = await Directory.pickDirectoryAsync().catch(() => null);
  if (!folder) return false;
  await writeBackup(folder, now);
  await SecureStore.setItemAsync(FOLDER, folder.uri);
  await SecureStore.setItemAsync(LAST, now.toISOString());
  return true;
}

export async function disableAutoBackup() {
  await SecureStore.deleteItemAsync(FOLDER);
  await SecureStore.deleteItemAsync(LAST);
}

/**
 * Al abrir la app: si pasó una semana desde la última copia, guarda otra. Como Cashew, sin tareas
 * en segundo plano. Si falla (se borró la carpeta, se quitó el permiso), lo intenta la próxima vez.
 */
export async function runAutoBackupIfDue(now = new Date()) {
  const state = await getAutoBackup();
  if (!state) return;
  if (state.last && now.getTime() - new Date(state.last).getTime() < WEEK_MS) return;
  await writeBackup(new Directory(state.folder), now);
  await SecureStore.setItemAsync(LAST, now.toISOString());
}
