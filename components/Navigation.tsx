'use client';

import { AppShell, Group, Title, Button, Badge } from '@mantine/core';
import { IconCalendar, IconShare, IconLogout } from '@tabler/icons-react';
import { useRouter, usePathname } from 'next/navigation';

export function Navigation() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    window.location.href = '/';
  };

  return (
    <AppShell.Header>
      <Group h="100%" px="md" justify="space-between">
        <Group>
          <Title order={3}>🧳 旅行餐飲安排</Title>
        </Group>
        
        <Group gap="xs">
          <Button 
            variant={pathname === '/' ? 'filled' : 'light'}
            leftSection={<IconCalendar size={16} />}
            onClick={() => router.push('/')}
          >
            行程管理
          </Button>
          <Button 
            variant={pathname === '/share' ? 'filled' : 'light'}
            leftSection={<IconShare size={16} />}
            onClick={() => router.push('/share')}
          >
            旅行分享
          </Button>
          <Button 
            variant="light" 
            color="red" 
            leftSection={<IconLogout size={16} />} 
            onClick={handleLogout}
          >
            登出
          </Button>
        </Group>
      </Group>
    </AppShell.Header>
  );
}
