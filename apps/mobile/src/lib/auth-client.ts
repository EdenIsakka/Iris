import { expoClient } from '@better-auth/expo/client';
import { createAuthClient } from 'better-auth/react';
import * as SecureStore from 'expo-secure-store';

/** Cliente de Better Auth: guarda la sesión cifrada en el teléfono (ADR-0006). */
export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000',
  plugins: [expoClient({ scheme: 'finanzas', storagePrefix: 'finanzas', storage: SecureStore })],
});
