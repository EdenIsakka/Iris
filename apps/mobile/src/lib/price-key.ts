import * as SecureStore from 'expo-secure-store';

// La llave es de cada persona y vive cifrada en su celular; nunca sale salvo hacia Twelve Data.
const KEY = 'twelve-data-key';
const INTRO = 'price-intro-seen';

export const getPriceKey = () => SecureStore.getItemAsync(KEY).catch(() => null);

export const setPriceKey = (key: string | null) =>
  key ? SecureStore.setItemAsync(KEY, key) : SecureStore.deleteItemAsync(KEY);

/** true la primera vez que se abre la app; después, false. */
export async function isFirstLaunch() {
  const seen = await SecureStore.getItemAsync(INTRO).catch(() => 'error');
  if (seen) return false;
  await SecureStore.setItemAsync(INTRO, '1').catch(() => {});
  return true;
}
