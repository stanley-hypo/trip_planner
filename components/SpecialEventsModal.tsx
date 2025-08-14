'use client';

import { useState, useEffect } from 'react';
import { Modal, Stack, Title, Button, Group, Text, Card, ActionIcon, TextInput, Textarea, Select, Divider } from '@mantine/core';
import { TimeInput } from '@mantine/dates';
import { IconPlus, IconX, IconClock, IconLink, IconDeviceFloppy, IconExternalLink, IconEdit } from '@tabler/icons-react';
import { Day, SpecialEvent } from '@/lib/types';

interface SpecialEventsModalProps {
  day: Day;
  opened: boolean;
  onClose: () => void;
  onSave: (day: Day) => void;
}

export function SpecialEventsModal({ day, opened, onClose, onSave }: SpecialEventsModalProps) {
  const [events, setEvents] = useState<SpecialEvent[]>(day.specialEvents || []);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newEvent, setNewEvent] = useState<Partial<SpecialEvent>>({});

  useEffect(() => {
    setEvents(day.specialEvents || []);
    setEditingIndex(null);
    setNewEvent({});
  }, [day.date, opened]);

  const save = () => {
    const updatedDay: Day = {
      ...day,
      specialEvents: events
    };
    onSave(updatedDay);
    onClose();
  };

  const handleClose = () => {
    setEvents(day.specialEvents || []);
    setEditingIndex(null);
    setNewEvent({});
    onClose();
  };

  const addEvent = () => {
    if (!newEvent.title?.trim()) return;
    
    const event: SpecialEvent = {
      id: Date.now().toString(),
      title: newEvent.title.trim(),
      description: newEvent.description?.trim() || '',
      time: newEvent.time || '',
      link: newEvent.link?.trim() || '',
      category: newEvent.category || '活動'
    };
    
    setEvents([...events, event]);
    setNewEvent({});
  };

  const updateEvent = (index: number, updatedEvent: Partial<SpecialEvent>) => {
    const updated = [...events];
    updated[index] = { ...updated[index], ...updatedEvent };
    setEvents(updated);
  };

  const removeEvent = (index: number) => {
    setEvents(events.filter((_, i) => i !== index));
    setEditingIndex(null);
  };

  const categories = [
    { value: '活動', label: '🎯 活動' },
    { value: '交通', label: '🚌 交通' },
    { value: '購物', label: '🛍️ 購物' },
    { value: '預訂', label: '📝 預訂' },
    { value: '其他', label: '📌 其他' }
  ];

  const getCategoryIcon = (category: string) => {
    const map: { [key: string]: string } = {
      '活動': '🎯',
      '交通': '🚌', 
      '購物': '🛍️',
      '預訂': '📝',
      '其他': '📌'
    };
    return map[category] || '📌';
  };

  return (
    <Modal 
      opened={opened} 
      onClose={handleClose} 
      title={
        <Group gap="xs">
          <Text fw={600}>{day.date} {day.weekday} · 特別行程</Text>
        </Group>
      } 
      size="lg"
    >
      <Stack gap="md">
        
        {/* 現有事件列表 */}
        {events.length > 0 && (
          <Stack gap="xs">
            <Text size="md" fw={500}>已安排的活動</Text>
            {events.map((event, index) => (
              <Card key={event.id} padding="sm" withBorder>
                {editingIndex === index ? (
                  <Stack gap="xs">
                    <TextInput
                      placeholder="活動標題"
                      value={event.title}
                      onChange={(e) => updateEvent(index, { title: e.currentTarget.value })}
                    />
                    <Textarea
                      placeholder="活動描述（可選）"
                      value={event.description || ''}
                      onChange={(e) => updateEvent(index, { description: e.currentTarget.value })}
                      autosize
                      minRows={2}
                    />
                    <Group grow>
                      <TimeInput
                        placeholder="時間（可選）"
                        value={event.time || ''}
                        onChange={(e) => updateEvent(index, { time: e.currentTarget.value })}
                        leftSection={<IconClock size={14} />}
                      />
                      <Select
                        data={categories}
                        value={event.category}
                        onChange={(value) => updateEvent(index, { category: value || '其他' })}
                      />
                    </Group>
                    <TextInput
                      placeholder="相關連結（預訂、官網等）"
                      value={event.link || ''}
                      onChange={(e) => updateEvent(index, { link: e.currentTarget.value })}
                      leftSection={<IconLink size={14} />}
                    />
                    <Group justify="flex-end">
                      <Button size="xs" variant="light" onClick={() => setEditingIndex(null)}>
                        完成
                      </Button>
                    </Group>
                  </Stack>
                ) : (
                  <Group justify="space-between" align="flex-start">
                    <Stack gap={4} style={{ flex: 1 }}>
                      <Group gap="xs">
                        <Text size="md" fw={500}>
                          {getCategoryIcon(event.category || '其他')} {event.title}
                        </Text>
                        {event.time && (
                          <Text size="xs" c="dimmed">
                            ⏰ {event.time}
                          </Text>
                        )}
                      </Group>
                      
                      {event.description && (
                        <Text size="sm" c="dimmed">
                          {event.description}
                        </Text>
                      )}
                      
                      {event.link && (
                        <Button
                          size="xs"
                          variant="light"
                          leftSection={<IconExternalLink size={12} />}
                          onClick={() => window.open(event.link, '_blank')}
                        >
                          開啟連結
                        </Button>
                      )}
                    </Stack>
                    
                    <Group gap="xs">
                      <ActionIcon
                        size="sm"
                        variant="light"
                        onClick={() => setEditingIndex(index)}
                      >
                        <IconEdit size={14} />
                      </ActionIcon>
                      <ActionIcon
                        size="sm"
                        variant="light"
                        color="red"
                        onClick={() => removeEvent(index)}
                      >
                        <IconX size={14} />
                      </ActionIcon>
                    </Group>
                  </Group>
                )}
              </Card>
            ))}
          </Stack>
        )}

        <Divider label="新增活動" />

        {/* 新增事件表單 */}
        <Stack gap="xs">
          <TextInput
            placeholder="活動標題"
            value={newEvent.title || ''}
            onChange={(e) => setNewEvent({ ...newEvent, title: e.currentTarget.value })}
          />
          <Textarea
            placeholder="活動描述（可選）"
            value={newEvent.description || ''}
            onChange={(e) => setNewEvent({ ...newEvent, description: e.currentTarget.value })}
            autosize
            minRows={2}
          />
          <Group grow>
            <TimeInput
              placeholder="時間（可選）"
              value={newEvent.time || ''}
              onChange={(e) => setNewEvent({ ...newEvent, time: e.currentTarget.value })}
              leftSection={<IconClock size={14} />}
            />
            <Select
              placeholder="活動類型"
              data={categories}
              value={newEvent.category || '活動'}
              onChange={(value) => setNewEvent({ ...newEvent, category: value || '活動' })}
            />
          </Group>
          <TextInput
            placeholder="相關連結（預訂用具、官網等）"
            value={newEvent.link || ''}
            onChange={(e) => setNewEvent({ ...newEvent, link: e.currentTarget.value })}
            leftSection={<IconLink size={14} />}
          />
          
          <Group justify="space-between" mt="xs">
            <Button
              variant="light"
              leftSection={<IconPlus size={16} />}
              onClick={addEvent}
              disabled={!newEvent.title?.trim()}
            >
              新增活動
            </Button>
          </Group>
        </Stack>

        <Group justify="flex-end" mt="lg">
          <Button variant="light" onClick={handleClose}>
            取消
          </Button>
          <Button leftSection={<IconDeviceFloppy size={16} />} onClick={save}>
            儲存
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
