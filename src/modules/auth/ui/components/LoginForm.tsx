import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Input } from '../../../../shared/components/Input';
import { Button } from '../../../../shared/components/Button';
import { useTheme } from '../../../../shared/hooks/useTheme';

export const LoginForm: React.FC = () => {
  const { colors, space, textStyles } = useTheme();
  const { login, loading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    try {
      await login(email, password);
    } catch (e) {
      setError('Failed to login. Please try again.');
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
        Welcome back
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
      {error ? (
        <Text style={[styles.error, { color: colors.danger }]}>
          {error}
        </Text>
      ) : null}
      <Button
        title="Login"
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

