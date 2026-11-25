import * as LocalAuthentication from 'expo-local-authentication';
import * as ScreenCapture from 'expo-screen-capture';
import * as SecureStore from 'expo-secure-store';

const KEY = 'lock';

/**
 * Con el bloqueo, Android no guarda la foto de Iris para Recientes (ni deja tomar capturas):
 * si no, los saldos se verían ahí sin poner la huella.
 */
export const guardScreen = (on: boolean) =>
  (on ? ScreenCapture.preventScreenCaptureAsync() : ScreenCapture.allowScreenCaptureAsync()).catch(
    () => {},
  );

export const isLockOn = async () =>
  (await SecureStore.getItemAsync(KEY).catch(() => null)) === 'on';

/** true si la persona se identificó con huella, cara o, si no, el PIN del celular. */
export async function unlock(promptMessage = 'Desbloquea Iris') {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: 'Cancelar',
    // La cara con la cámara normal se engaña con una foto: solo huella o cara segura; si no, PIN.
    biometricsSecurityLevel: 'strong',
  });
  return result.success;
}

/**
 * Prende o apaga el bloqueo. Para prenderlo pide identificarse una vez: así nadie queda por fuera
 * de su propia app por un celular sin huella ni PIN. Devuelve el estado que quedó.
 */
export async function setLock(on: boolean) {
  if (on) {
    const secured =
      (await LocalAuthentication.getEnrolledLevelAsync()) !==
      LocalAuthentication.SecurityLevel.NONE;
    if (!secured) throw new Error('Primero ponle huella o PIN al celular en sus ajustes.');
    if (!(await unlock('Confirma que eres tú'))) return false;
  }
  await SecureStore.setItemAsync(KEY, on ? 'on' : 'off');
  await guardScreen(on);
  return on;
}
