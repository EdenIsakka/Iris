import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Button, FieldLabel, FormError, inputClassName } from '@/components/ui/form';
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
    <View className="flex-1 justify-center gap-2 p-6">
      <Text className="mb-4 text-[34px] font-bold tracking-tight" accessibilityRole="header">
        {signingUp ? 'Crea tu cuenta' : 'Inicia sesión'}
      </Text>

      {signingUp ? (
        <>
          <FieldLabel nativeID="name-label">Nombre</FieldLabel>
          <TextInput
            className={`${inputClassName} text-[17px]`}
            value={name}
            onChangeText={setName}
            autoComplete="name"
            accessibilityLabelledBy="name-label"
          />
        </>
      ) : null}

      <FieldLabel nativeID="email-label">Correo</FieldLabel>
      <TextInput
        className={`${inputClassName} text-[17px]`}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        accessibilityLabelledBy="email-label"
      />

      <FieldLabel nativeID="password-label">Contraseña</FieldLabel>
      <TextInput
        className={`${inputClassName} text-[17px]`}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete={signingUp ? 'new-password' : 'current-password'}
        accessibilityLabelledBy="password-label"
      />
      {signingUp ? <Text className="text-[13px] text-secondary">Mínimo 8 caracteres.</Text> : null}

      <FormError message={error} />
      <Button
        label={pending ? 'Un momento…' : signingUp ? 'Crear cuenta' : 'Entrar'}
        onPress={submit}
        disabled={pending}
      />

      <Pressable
        className="min-h-[44px] items-center justify-center"
        onPress={() => {
          setMode(signingUp ? 'sign-in' : 'sign-up');
          setError(null);
        }}
        accessibilityRole="button"
      >
        <Text className="text-[15px] text-accent">
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
