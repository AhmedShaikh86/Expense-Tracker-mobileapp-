import { zodResolver } from '@hookform/resolvers/zod';

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { z } from 'zod';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { EmptyState } from '@/components/StateViews';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { isSupabaseConfigured } from '@/services/supabase';
import { useAuthStore } from '@/store/auth';
import { Alert } from '@/utils/alert';
import { goBack } from '@/utils/navigation';

const schema = z.object({
  email: z.string().trim().min(1, 'Enter your email').email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormValues = z.infer<typeof schema>;
type Mode = 'signIn' | 'signUp';

/** Email + password login and sign-up (Supabase). */
export default function AuthScreen() {
  const { colors } = useTheme();
  const { signIn, signUp } = useAuthStore();
  const [mode, setMode] = useState<Mode>('signIn');
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  if (!isSupabaseConfigured) {
    return (
      <EmptyState
        icon="cloud-offline-outline"
        title="Cloud sync is not set up"
        message="Add SUPABASE_URL and SUPABASE_ANON_KEY to the .env file to enable accounts."
      />
    );
  }

  const onSubmit = async ({ email, password }: FormValues) => {
    setServerError(null);
    try {
      if (mode === 'signIn') {
        await signIn(email, password);
        goBack();
      } else {
        const { needsConfirmation } = await signUp(email, password);
        if (needsConfirmation) {
          Alert.alert(
            'Check your email',
            'We sent you a confirmation link. Confirm your email, then sign in.',
          );
          setMode('signIn');
        } else {
          goBack();
        }
      }
    } catch (e) {
      setServerError(e instanceof Error ? e.message : 'Something went wrong');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <AppText variant="title">{mode === 'signIn' ? 'Welcome back' : 'Create account'}</AppText>
        <AppText muted>Your expenses are backed up and synced across your devices.</AppText>

        <SegmentedControl
          options={[
            { value: 'signIn', label: 'Sign in' },
            { value: 'signUp', label: 'Sign up' },
          ]}
          value={mode}
          onChange={(m) => {
            setMode(m);
            setServerError(null);
          }}
        />

        <Controller
          control={control}
          name="email"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="Email"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="you@example.com"
              error={errors.email?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="Password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry
              autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
              placeholder="At least 6 characters"
              error={errors.password?.message}
            />
          )}
        />

        {serverError && <AppText color={colors.danger}>{serverError}</AppText>}

        <Button
          title={mode === 'signIn' ? 'Sign in' : 'Create account'}
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          style={styles.submit}
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  submit: { marginTop: Spacing.sm },
});
