import { SafeAreaView } from 'react-native-safe-area-context';
import { SignInForm } from '@/features/auth/components/sign-in-form';

export default function SignInScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <SignInForm />
    </SafeAreaView>
  );
}
