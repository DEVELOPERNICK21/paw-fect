import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Input } from '../../../../shared/components/Input';
import { Button } from '../../../../shared/components/Button';
import { useTheme } from '../../../../shared/hooks/useTheme';

export const SignupForm: React.FC = () => {
  const { colors, space, textStyles } = useTheme();
  const signup = useAuthStore(s => s.signup);
  const loading = useAuthStore(s => s.loading);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!email || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      await signup(email, password);
    } catch (e) {
      setError('Failed to create account. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text
        style={[
          textStyles.title,
          { color: colors.text.primary, marginBottom: space('md') },
        ]}
      >
        Create account
      </Text>
      <Input
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={email}
        onChangeText={setEmail}
        containerStyle={styles.field}
      />
      <Input
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        containerStyle={styles.field}
      />
      <Input
        placeholder="Confirm Password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        containerStyle={styles.field}
      />
      {error ? (
        <Text style={[styles.error, { color: colors.danger }]}>
          {error}
        </Text>
      ) : null}
      <Button
        title="Sign up"
        onPress={handleSubmit}
        loading={loading}
        style={{ marginTop: space('md') }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  field: {
    marginBottom: 12,
  },
  error: {
    marginTop: 4,
  },
});

