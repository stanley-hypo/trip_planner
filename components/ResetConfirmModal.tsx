'use client';

import { useState } from 'react';
import { Modal, Stack, Title, TextInput, Button, Group, Alert, Text } from '@mantine/core';
import { IconLock, IconKey, IconRefresh, IconX } from '@tabler/icons-react';

interface ResetConfirmModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ResetConfirmModal({ opened, onClose, onConfirm }: ResetConfirmModalProps) {
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
        onConfirm();
        handleClose();
      } else {
        setError(data.error || 'Invalid password');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    setLoading(false);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="xs">
          <IconLock size={20} />
          <Title order={4}>確認重設行程</Title>
        </Group>
      }
      size="sm"
      centered
    >
      <Stack gap="md">
        <Alert color="orange" variant="light">
          <Text size="sm">
            ⚠️ 重設行程將會清除所有現有的行程資料，此操作無法復原。請輸入密碼確認。
          </Text>
        </Alert>

        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              label="請輸入密碼確認"
              placeholder="輸入應用程式密碼"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              required
              leftSection={<IconKey size={16} />}
              data-autofocus
            />

            {error && (
              <Alert color="red" variant="light">
                {error}
              </Alert>
            )}

            <Group justify="space-between" mt="md">
              <Button
                variant="light"
                leftSection={<IconX size={16} />}
                onClick={handleClose}
                disabled={loading}
              >
                取消
              </Button>
              <Button
                type="submit"
                color="orange"
                loading={loading}
                leftSection={<IconRefresh size={16} />}
              >
                確認重設
              </Button>
            </Group>
          </Stack>
        </form>
      </Stack>
    </Modal>
  );
}
