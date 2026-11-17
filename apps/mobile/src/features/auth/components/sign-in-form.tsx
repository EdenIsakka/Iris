import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '@/components/ui/text';
import { authClient } from '@/lib/auth-client';

/** Un solo formulario para entrar o crear cuenta con correo y contraseña. */
export function SignInForm() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const signingUp = mode === 'sign-up';

  async function submit() {
    if (!email.trim() || !password || (signingUp && !name.trim())) {
      setError('Completa todos los campos.');
      return;
    }
    setPending(true);
    setError(null);
    const result = signingUp
      ? await authClient.signUp.email({ name: name.trim(), email: email.trim(), password })
      : await authClient.signIn.email({ email: email.trim(), password });
    setPending(false);
    // Con sesión, el layout raíz cambia solo a las pestañas de la app.
    if (result.error) setError(messageFor(result.error.code));
  }

  return (
    <View style={styles.form}>
      <Text style={styles.title} accessibilityRole="header">
        {signingUp ? 'Crea tu cuenta' : 'Inicia sesión'}
      </Text>

      {signingUp ? (
        <>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            autoComplete="name"
            accessibilityLabel="Nombre"
          />
        </>
      ) : null}

      <Text style={styles.label}>Correo</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        accessibilityLabel="Correo"
      />

      <Text style={styles.label}>Contraseña</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete={signingUp ? 'new-password' : 'current-password'}
        accessibilityLabel="Contraseña"
      />
      {signingUp ? <Text style={styles.hint}>Mínimo 8 caracteres.</Text> : null}

      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}

      <Pressable
        style={[styles.button, pending && styles.disabled]}
        onPress={submit}
        disabled={pending}
        accessibilityRole="button"
        accessibilityState={{ disabled: pending }}
      >
        <Text style={styles.buttonText}>
          {pending ? 'Un momento…' : signingUp ? 'Crear cuenta' : 'Entrar'}
        </Text>
      </Pressable>

      <Pressable
        style={styles.switch}
        onPress={() => {
          setMode(signingUp ? 'sign-in' : 'sign-up');
          setError(null);
        }}
        accessibilityRole="button"
      >
        <Text style={styles.switchText}>
          {signingUp ? 'Ya tengo cuenta: iniciar sesión' : '¿No tienes cuenta? Crea una'}
        </Text>
      </Pressable>
    </View>
  );
}

function messageFor(code?: string) {
  switch (code) {
    case 'INVALID_EMAIL_OR_PASSWORD':
      return 'Correo o contraseña incorrectos.';
    case 'USER_ALREADY_EXISTS':
    case 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL':
      return 'Ya existe una cuenta con ese correo.';
    case 'PASSWORD_TOO_SHORT':
      return 'La contraseña debe tener al menos 8 caracteres.';
    case 'INVALID_EMAIL':
      return 'Revisa el correo.';
    default:
      return 'No se pudo continuar. Revisa tu conexión e intenta de nuevo.';
  }
}

const styles = StyleSheet.create({
  form: { flex: 1, justifyContent: 'center', padding: 24, gap: 8 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  label: { fontWeight: '600', marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#999', borderRadius: 8, padding: 12, fontSize: 18 },
  hint: { color: '#555' },
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
  switch: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  switchText: { color: '#1b5e20', fontWeight: '600' },
});
