'use client';

import { useState } from 'react';
import { Container, Paper, Title, TextInput, Button, Stack, Alert, Text } from '@mantine/core';
import { IconLock, IconKey } from '@tabler/icons-react';

interface LoginFormProps {
  onLogin: () => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (data.ok) {
        onLogin();
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={40}>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <Title ta="center" order={2} mb="lg">
          <IconLock size={24} style={{ marginRight: 8 }} />
          旅行餐飲安排
        </Title>
        
        <Text c="dimmed" size="sm" ta="center" mb="lg">
          請輸入密碼以查看內容
        </Text>

        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput
              label="密碼"
              placeholder="請輸入密碼"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              required
              leftSection={<IconKey size={16} />}
            />

            {error && (
              <Alert color="red" variant="light">
                {error}
              </Alert>
            )}

            <Button 
              type="submit" 
              fullWidth 
              loading={loading}
              leftSection={<IconLock size={16} />}
            >
              登入
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
