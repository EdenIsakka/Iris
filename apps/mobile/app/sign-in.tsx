import { SafeAreaView } from 'react-native-safe-area-context';
import { SignInForm } from '@/features/auth/components/sign-in-form';

export default function SignInScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <SignInForm />
    </SafeAreaView>
  );
}
