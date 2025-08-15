'use client';

import { useState } from 'react';
import { 
  Modal, 
  Stack, 
  Button, 
  Group, 
  Text, 
  Badge, 
  Card, 
  Select,
  ActionIcon,
  Tooltip
} from '@mantine/core';
import { 
  IconArrowsMove, 
  IconX, 
  IconDeviceFloppy 
} from '@tabler/icons-react';
import { Meal, Day, Trip } from '@/lib/types';

interface MealMoverProps {
  opened: boolean;
  onClose: () => void;
  meal: Meal | null;
  trip: Trip;
  currentDate: string; // 新增：當前日期
  onMove: (meal: Meal, targetDate: string) => void;
}

export function MealMover({ opened, onClose, meal, trip, currentDate, onMove }: MealMoverProps) {
  const [targetDate, setTargetDate] = useState<string>('');

  if (!meal) return null;

  const availableDates = trip.days
    .filter(day => day.date !== currentDate) // 排除當前日期
    .map(day => ({
      value: day.date,
      label: `${day.date} (${day.weekday})`
    }));

  const handleMove = () => {
    if (targetDate) {
      onMove(meal, targetDate);
      onClose();
      setTargetDate('');
    }
  };

  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      title="移動餐點到其他日期" 
      size="md"
    >
      <Stack gap="lg">
        {/* 顯示要移動的餐點信息 */}
        <Card padding="md" withBorder style={{ backgroundColor: '#f8f9fa' }}>
          <Stack gap="xs">
            <Text size="lg" fw={500}>要移動的餐點：</Text>
            <Group gap="xs">
              <Badge 
                color={meal.type === 'lunch' ? 'orange' : 'violet'} 
                variant="light"
              >
                {meal.type === 'lunch' ? '🍽️ 午餐' : '🍷 晚餐'}
              </Badge>
              <Badge color="blue" variant="light">
                {meal.timeSlot}
              </Badge>
              {meal.booking?.isBooked && (
                <Badge color="green" variant="light">已訂位</Badge>
              )}
            </Group>
            
            {meal.note && (
              <Text size="sm">{meal.note}</Text>
            )}
            
            {meal.booking?.place && (
              <Text size="sm" fw={500}>📍 {meal.booking.place}</Text>
            )}
            
            {meal.participants.length > 0 && (
              <Text size="sm">👥 {meal.participants.join('、')}</Text>
            )}
          </Stack>
        </Card>

        {/* 選擇目標日期 */}
        <Stack gap="xs">
          <Text size="md" fw={500}>選擇目標日期：</Text>
          <Select
            data={availableDates}
            value={targetDate}
            onChange={(value) => setTargetDate(value || '')}
            placeholder="選擇要移動到的日期"
            searchable
          />
        </Stack>

        {/* 操作按鈕 */}
        <Group justify="flex-end">
          <Button variant="light" onClick={onClose}>
            取消
          </Button>
          <Button
            leftSection={<IconArrowsMove size={16} />}
            onClick={handleMove}
            disabled={!targetDate}
            color="blue"
          >
            移動餐點
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
