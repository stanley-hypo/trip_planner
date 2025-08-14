'use client';

import { useState, useEffect } from 'react';
import { Modal, Stack, Title, Textarea, Button, Group, Text } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconCalendar, IconDeviceFloppy, IconX } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { Day } from '@/lib/types';

interface SpecialEventModalProps {
  day: Day;
  opened: boolean;
  onClose: () => void;
  onSave: (day: Day) => void;
}

export function SpecialEventModal({ day, opened, onClose, onSave }: SpecialEventModalProps) {
  const [special, setSpecial] = useState(day.special);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date(day.date + 'T00:00:00'));

  useEffect(() => {
    setSpecial(day.special);
    setSelectedDate(new Date(day.date + 'T00:00:00'));
  }, [day.date, opened]);

  const save = () => {
    const updatedDay: Day = {
      ...day,
      special
    };
    onSave(updatedDay);
    onClose();
  };

  const handleClose = () => {
    setSpecial(day.special); // 重置為原始值
    onClose();
  };

  return (
    <Modal 
      opened={opened} 
      onClose={handleClose} 
      title={
        <Group gap="xs">
          <IconCalendar size={20} />
          <Title order={4}>{day.date} {day.weekday} · 特別行程</Title>
        </Group>
      } 
      size="md"
    >
      <Stack gap="md">
        <DatePickerInput
          label="日期參考"
          value={selectedDate}
          onChange={setSelectedDate}
          leftSection={<IconCalendar size={16} />}
          disabled // 顯示用，不允許更改
          styles={{
            input: {
              backgroundColor: '#f8f9fa',
              color: '#6c757d',
              cursor: 'not-allowed'
            },
            section: {
              color: '#6c757d'
            }
          }}
          description="此日期僅供參考，特別行程內容將保存到當前選擇的日期"
        />
        
        <Textarea 
          label="特別行程內容" 
          placeholder="例如：由雪場回東京 / Omakase (要預約) / 購物行程"
          value={special} 
          onChange={(e) => setSpecial(e.currentTarget.value)} 
          autosize 
          minRows={3}
          maxRows={8}
        />
        
        <Text size="sm" c="dimmed">
          💡 提示：可以記錄交通安排、特殊活動、購物計劃等
        </Text>
        
        <Group justify="space-between" mt="md">
          <Button
            variant="light"
            leftSection={<IconX size={16} />}
            onClick={handleClose}
          >
            取消
          </Button>
          <Button
            leftSection={<IconDeviceFloppy size={16} />}
            onClick={save}
          >
            儲存
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
