'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { AppShell, Button, Container, Group, Modal, Stack, Title, Text, Badge, Table, Textarea, LoadingOverlay, Notification, ActionIcon, Tooltip, Divider, Chip, MultiSelect, NumberInput, TextInput, Anchor, TagsInput, Checkbox, Card, List, ThemeIcon, Switch } from '@mantine/core';
import { DatePickerInput, TimeInput } from '@mantine/dates';
import { IconCalendar, IconPencil, IconPlus, IconDeviceFloppy, IconTrash, IconExternalLink, IconLogout, IconClock, IconMapPin, IconUsers, IconCurrencyDollar, IconPhone, IconWorld, IconNotes } from '@tabler/icons-react';
import { LoginForm } from '@/components/LoginForm';
import { ResetConfirmModal } from '@/components/ResetConfirmModal';
import { SpecialEventModal } from '@/components/SpecialEventModal';
import dayjs from 'dayjs';
import { Trip, Day, Booking } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then(async (r) => {
  if (!r.ok) throw new Error((await r.json()).error || 'Request failed');
  return r.json();
});

function useTrip() {
  const { data, error, isLoading, mutate } = useSWR<{ ok: boolean; trip: Trip }>(`/api/trip`, fetcher);
  return { trip: data?.trip, error, isLoading, mutate };
}

function useAuth() {
  const { data, error, isLoading, mutate } = useSWR<{ ok: boolean; authenticated: boolean }>(`/api/auth`, fetcher);
  return { 
    isAuthenticated: data?.authenticated || false, 
    authError: error, 
    authLoading: isLoading, 
    checkAuth: mutate 
  };
}

function InitForm({ onDone, isReset = false }: { onDone: () => void; isReset?: boolean }) {
  const [range, setRange] = useState<[Date | null, Date | null]>([new Date('2026-02-04'), new Date('2026-02-09')]);
  const [participants, setParticipants] = useState<string[]>(['Alex', 'Ben', 'Cathy']);
  const [creating, setCreating] = useState(false);

  const submit = async () => {
    if (!range[0] || !range[1]) return;
    setCreating(true);
    try {
      const response = await fetch('/api/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start: dayjs(range[0]).format('YYYY-MM-DD'),
          end: dayjs(range[1]).format('YYYY-MM-DD'),
          participants,
          force: isReset // 當是重設模式時，強制創建新行程
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create trip');
      }
      
      setCreating(false);
      onDone();
    } catch (error) {
      console.error('Error creating trip:', error);
      setCreating(false);
      // 可以添加錯誤處理
    }
  };

  return (
    <Stack gap="md" p="lg">
      <Title order={3}>建立行程</Title>
      <DatePickerInput
        type="range"
        label="旅行日期範圍"
        leftSection={<IconCalendar size={16} />}
        value={range}
        onChange={setRange}
        styles={{
          input: {
            borderColor: '#e9ecef',
            '&:focus': {
              borderColor: '#339af0',
            }
          }
        }}
      />
      <TagsInput
        label="成員（可新增）"
        value={participants}
        onChange={setParticipants}
        placeholder="輸入成員名稱後按Enter"
      />
      <Group>
        <Button onClick={submit} leftSection={<IconPlus size={16} />} loading={creating}>建立</Button>
      </Group>
    </Stack>
  );
}

type EditState = {
  open: boolean;
  date?: string;
  meal?: 'lunch' | 'dinner';
};

type SpecialEditState = {
  open: boolean;
  date?: string;
};

function MealModal({ trip, day, meal, opened, onClose, onSave } : {
  trip: Trip;
  day: Day;
  meal: 'lunch' | 'dinner';
  opened: boolean;
  onClose: () => void;
  onSave: (day: Day) => void;
}) {
  const m = day[meal];
  const [note, setNote] = useState(m.note);
  const [selected, setSelected] = useState<string[]>(m.participants);
  const [booking, setBooking] = useState<Booking>(m.booking || {} as Booking);
  const [hasBooking, setHasBooking] = useState(Boolean(m.booking && Object.keys(m.booking).length > 0));

  useEffect(() => {
    setNote(m.note);
    setSelected(m.participants);
    setBooking(m.booking || {});
    setHasBooking(Boolean(m.booking && Object.keys(m.booking).length > 0));
  }, [day.date, meal, opened]);

  const save = () => {
    const updated: Day = {
      ...day,
      [meal]: {
        note,
        participants: selected,
        booking: hasBooking && Object.keys(booking || {}).length ? booking : null
      }
    };
    onSave(updated);
    onClose();
  };

  const handleSelectAll = () => {
    if (selected.length === trip.meta.participants.length) {
      // 如果已全選，則取消全選
      setSelected([]);
    } else {
      // 否則全選
      setSelected([...trip.meta.participants]);
    }
  };

  const isAllSelected = selected.length === trip.meta.participants.length;

  const partOptions = trip.meta.participants.map((p) => ({ value: p, label: p }));

  return (
    <Modal opened={opened} onClose={onClose} title={`${day.date} ${day.weekday} · ${meal === 'lunch' ? '午餐' : '晚餐'}`} size="lg">
      <Stack>
        <Textarea label="備註 / 計劃" value={note} onChange={(e) => setNote(e.currentTarget.value)} autosize minRows={2} />
        
        <Group justify="space-between" align="center">
          <Text size="md" fw={500}>出席成員</Text>
          <Button 
            size="xs" 
            variant="light" 
            onClick={handleSelectAll}
            leftSection={<IconUsers size={14} />}
          >
            {isAllSelected ? '取消全選' : '全選成員'}
          </Button>
        </Group>
        
        <Checkbox.Group
          value={selected}
          onChange={setSelected}
        >
          <Stack gap="xs">
            {trip.meta.participants.map((participant) => (
              <Checkbox 
                key={participant} 
                value={participant} 
                label={participant}
                size="md"
              />
            ))}
          </Stack>
        </Checkbox.Group>
        
        <Text size="sm" c="dimmed">
          💡 提示：如需新增成員，請在初始設定中使用成員標籤輸入功能
        </Text>
        
        <Group justify="space-between" align="center">
          <Text size="md" fw={500}>訂位狀態</Text>
          <Switch
            label="已訂位"
            checked={hasBooking}
            onChange={(event) => setHasBooking(event.currentTarget.checked)}
            size="md"
          />
        </Group>
        
        {hasBooking && (
          <>
            <Divider my="xs" label="訂位資訊" />
          </>
        )}
        <TextInput label="餐廳/地點" value={booking?.place || ''} onChange={(e) => setBooking({ ...booking, place: e.currentTarget.value })} />
        <TimeInput 
          label="用餐時間" 
          value={booking?.time ? booking.time.split(' ')[1] : ''} 
          onChange={(e) => {
            const timeValue = e.currentTarget.value;
            const dateValue = day.date;
            setBooking({ 
              ...booking, 
              time: timeValue ? `${dateValue} ${timeValue}` : undefined 
            });
          }} 
          leftSection={<IconClock size={16} />}
          placeholder="選擇時間 (如: 19:30)"
          styles={{
            input: {
              borderColor: '#e9ecef',
              '&:focus': {
                borderColor: '#339af0',
              }
            }
          }}
        />
        <NumberInput label="人數" value={booking?.people ?? undefined} onChange={(v) => setBooking({ ...booking, people: Number(v) || undefined })} min={1} />
        <Group grow>
          <TextInput label="預約編號" value={booking?.ref || ''} onChange={(e) => setBooking({ ...booking, ref: e.currentTarget.value })} />
          <TextInput label="聯絡方式" value={booking?.contact || ''} onChange={(e) => setBooking({ ...booking, contact: e.currentTarget.value })} />
        </Group>
        <Group grow>
          <NumberInput label="預算 / 價格" value={booking?.price ?? undefined} onChange={(v) => setBooking({ ...booking, price: Number(v) || undefined })} min={0} />
          <TextInput label="連結" value={booking?.url || ''} onChange={(e) => setBooking({ ...booking, url: e.currentTarget.value })} />
        </Group>
        
        <Group grow>
          <TextInput 
            label="Google Maps 連結" 
            value={booking?.googleMaps || ''} 
            onChange={(e) => setBooking({ ...booking, googleMaps: e.currentTarget.value })} 
            leftSection={<IconMapPin size={16} />}
            placeholder="貼上 Google Maps 連結"
          />
          {booking?.googleMaps && (
            <Button 
              variant="light" 
              leftSection={<IconExternalLink size={16} />} 
              onClick={() => window.open(booking.googleMaps, '_blank')}
              style={{ alignSelf: 'flex-end' }}
            >
              打開地圖
            </Button>
          )}
        </Group>
        <Textarea label="備註" value={booking?.notes || ''} onChange={(e) => setBooking({ ...booking, notes: e.currentTarget.value })} autosize minRows={2} />
        <Group justify="space-between" mt="sm">
          <Button variant="light" color="red" leftSection={<IconTrash size={16} />} onClick={() => { setBooking({}); }}>
            清除訂位資料
          </Button>
          <Button leftSection={<IconDeviceFloppy size={16} />} onClick={save}>儲存</Button>
        </Group>
      </Stack>
    </Modal>
  );
}

export default function Page() {
  const { isAuthenticated, authLoading, checkAuth } = useAuth();
  const { trip, isLoading, mutate, error } = useTrip();
  const [initOpen, setInitOpen] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [edit, setEdit] = useState<EditState>({ open: false });
  const [specialEdit, setSpecialEdit] = useState<SpecialEditState>({ open: false });

  useEffect(() => {
    if (error) {
      setIsResetMode(false); // 首次錯誤時不是重設模式
      setInitOpen(true);
    }
  }, [error]);

  const handleLogin = async () => {
    await checkAuth(); // Refresh auth status after login
  };

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    await checkAuth(); // Refresh auth status after logout
  };

  const handleResetConfirm = () => {
    setResetConfirmOpen(false);
    setIsResetMode(true);
    setInitOpen(true);
  };

  // Show loading while checking authentication
  if (authLoading) {
    return <Container pos="relative" mih={200}><LoadingOverlay visible /></Container>;
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  const saveTrip = async (t: Trip) => {
    await fetch('/api/trip', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trip: t }) });
    await mutate();
  };

  const onEditSave = async (updatedDay: Day) => {
    if (!trip) return;
    const days = trip.days.map((d) => (d.date === updatedDay.date ? updatedDay : d));
    await saveTrip({ ...trip, days });
  };

  const onSpecialSave = async (updatedDay: Day) => {
    if (!trip) return;
    const days = trip.days.map((d) => (d.date === updatedDay.date ? updatedDay : d));
    await saveTrip({ ...trip, days });
  };

  if (isLoading) {
    return <Container pos="relative" mih={200}><LoadingOverlay visible /></Container>;
  }

  if (!trip) {
    return (
      <Container size="md" py="xl">
        <InitForm onDone={() => { setInitOpen(false); location.reload(); }} isReset={false} />
      </Container>
    );
  }

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Title order={3}>旅行餐飲安排</Title>
            <Badge variant="light">{trip.meta.startDate} → {trip.meta.endDate}</Badge>
          </Group>
          <Group gap="xs">
            <Button variant="light" leftSection={<IconPlus size={16} />} onClick={() => setResetConfirmOpen(true)}>重設 / 新行程</Button>
            <Button variant="light" color="red" leftSection={<IconLogout size={16} />} onClick={handleLogout}>登出</Button>
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        <Container size="xl">

          <Table striped highlightOnHover withTableBorder withColumnBorders mt="md">
            <Table.Thead>
              <Table.Tr>

                <Table.Th style={{ width: 130 }}>日期</Table.Th>

                <Table.Th style={{ width: 90 }}>星期</Table.Th>

                <Table.Th>午餐</Table.Th>

                <Table.Th>晚餐</Table.Th>

                <Table.Th style={{ width: 240 }}>特別行程</Table.Th>

              </Table.Tr>

            </Table.Thead>

            <Table.Tbody>

              {trip.days.map((d) => (

                <Table.Tr key={d.date}>

                  <Table.Td>{d.date}</Table.Td>

                  <Table.Td>{d.weekday}</Table.Td>

                  {["lunch","dinner"].map((mealKey) => {

                    const meal = (d as any)[mealKey];
                    const hasBooking = meal?.booking && Object.keys(meal.booking).length > 0;
                    const isLunch = mealKey === 'lunch';
                    const mealColor = isLunch ? 'orange' : 'violet';

                    return (

                      <Table.Td key={mealKey}>

                        <Card padding="sm" radius="md" withBorder style={{ backgroundColor: isLunch ? '#fef7ed' : '#f5f3ff' }}>
                          
                          {/* 餐別標題 */}
                          <Group justify="space-between" mb="sm">
                            <Text size="lg" fw={600} c={isLunch ? 'orange' : 'violet'}>
                              {isLunch ? '🍽️ 午餐' : '🍷 晚餐'}
                            </Text>
                            {hasBooking && (
                              <Text size="xs" c="green" fw={500}>● 已訂位</Text>
                            )}
                          </Group>

                          {/* 參與成員 */}
                          <Group mb="xs">
                            <ThemeIcon size="sm" color={mealColor} variant="light">
                              <IconUsers size={12} />
                            </ThemeIcon>
                            <Text size="md" fw={500}>
                              {meal.participants.length > 0 
                                ? meal.participants.join('、') 
                                : '無參與者'
                              }
                            </Text>
                          </Group>

                          {/* 備註內容 */}
                          {meal.note && (
                            <Group align="flex-start" mb="sm">
                              <ThemeIcon size="sm" color="gray" variant="light">
                                <IconNotes size={12} />
                              </ThemeIcon>
                              <Text size="md" style={{ flex: 1 }}>
                                {meal.note}
                              </Text>
                            </Group>
                          )}

                          {/* 訂位信息 */}
                          {hasBooking && (
                            <Stack gap="xs" mt="sm" pt="sm" style={{ borderTop: '1px solid #e9ecef' }}>
                              
                              {meal.booking.place && (
                                <Group>
                                  <ThemeIcon size="sm" color="blue" variant="light">
                                    <IconMapPin size={12} />
                                  </ThemeIcon>
                                  <Text size="md" fw={500}>{meal.booking.place}</Text>
                                </Group>
                              )}
                              
                              {meal.booking.time && (
                                <Group>
                                  <ThemeIcon size="sm" color="indigo" variant="light">
                                    <IconClock size={12} />
                                  </ThemeIcon>
                                  <Text size="md">{meal.booking.time.split(' ')[1] || meal.booking.time}</Text>
                                </Group>
                              )}
                              
                              {meal.booking.people && (
                                <Group>
                                  <ThemeIcon size="sm" color="teal" variant="light">
                                    <IconUsers size={12} />
                                  </ThemeIcon>
                                  <Text size="md">{meal.booking.people} 人</Text>
                                </Group>
                              )}

                              {meal.booking.price && (
                                <Group>
                                  <ThemeIcon size="sm" color="green" variant="light">
                                    <IconCurrencyDollar size={12} />
                                  </ThemeIcon>
                                  <Text size="md">${meal.booking.price}</Text>
                                </Group>
                              )}
                              
                              {meal.booking.ref && (
                                <Group>
                                  <ThemeIcon size="sm" color="purple" variant="light">
                                    <IconPhone size={12} />
                                  </ThemeIcon>
                                  <Text size="md">{meal.booking.ref}</Text>
                                </Group>
                              )}

                              {/* 連結按鈕 */}
                              <Group gap="xs" mt="xs">
                                {meal.booking.url && (
                                  <Button
                                    size="sm"
                                    variant="light"
                                    color="cyan"
                                    leftSection={<IconWorld size={14} />}
                                    onClick={() => window.open(meal.booking.url, '_blank')}
                                  >
                                    網站
                                  </Button>
                                )}
                                
                                {meal.booking.googleMaps && (
                                  <Button
                                    size="sm"
                                    variant="light"
                                    color="blue"
                                    leftSection={<IconMapPin size={14} />}
                                    onClick={() => window.open(meal.booking.googleMaps, '_blank')}
                                  >
                                    地圖
                                  </Button>
                                )}
                              </Group>

                              {meal.booking.notes && (
                                <Text size="sm" c="dimmed" style={{ 
                                  fontStyle: 'italic',
                                  marginTop: '8px',
                                  padding: '8px',
                                  backgroundColor: '#f8f9fa',
                                  borderRadius: '4px'
                                }}>
                                  {meal.booking.notes}
                                </Text>
                              )}
                            </Stack>
                          )}

                          {/* 編輯按鈕 */}
                          <Group justify="flex-end" mt="sm">
                            <Button 
                              size="sm" 
                              variant="light" 
                              color={mealColor}
                              leftSection={<IconPencil size={14} />} 
                              onClick={() => setEdit({ open: true, date: d.date, meal: mealKey as any })}
                            >
                              編輯
                            </Button>
                          </Group>

                        </Card>

                      </Table.Td>

                    );

                  })}

                  <Table.Td>

                    <Stack gap={6}>
                      {d.special && <Text size="sm">{d.special}</Text>}
                      {!d.special && <Text c="dimmed" size="sm">無特別行程</Text>}
                      
                      <Group>
                        <Button 
                          size="xs" 
                          variant="light" 
                          leftSection={<IconPencil size={14} />} 
                          onClick={() => setSpecialEdit({ open: true, date: d.date })}
                        >
                          編輯
                        </Button>
                      </Group>
                    </Stack>

                  </Table.Td>

                </Table.Tr>

              ))}

            </Table.Tbody>

          </Table>

        </Container>

      </AppShell.Main>



      <Modal opened={initOpen} onClose={() => { setInitOpen(false); setIsResetMode(false); }} title={isResetMode ? "重設行程" : "開始新行程"}>

        <InitForm onDone={() => { setInitOpen(false); setIsResetMode(false); location.reload(); }} isReset={isResetMode} />

      </Modal>



      {edit.open && (

        <MealModal

          trip={trip}

          day={trip.days.find((x) => x.date === edit.date)!}

          meal={edit.meal!}

          opened={edit.open}

          onClose={() => setEdit({ open: false })}

          onSave={onEditSave}

        />

      )}

      {specialEdit.open && (

        <SpecialEventModal

          day={trip.days.find((x) => x.date === specialEdit.date)!}

          opened={specialEdit.open}

          onClose={() => setSpecialEdit({ open: false })}

          onSave={onSpecialSave}

        />

      )}

      <ResetConfirmModal
        opened={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={handleResetConfirm}
      />

    </AppShell>

  );

}

