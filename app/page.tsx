'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { AppShell, Button, Container, Group, Modal, Stack, Title, Text, Badge, Table, Textarea, LoadingOverlay, Notification, ActionIcon, Tooltip, Divider, Chip, MultiSelect, NumberInput, TextInput, Anchor, TagsInput } from '@mantine/core';
import { DatePickerInput, DateTimePicker } from '@mantine/dates';
import { IconCalendar, IconPencil, IconPlus, IconDeviceFloppy, IconTrash, IconExternalLink, IconLogout } from '@tabler/icons-react';
import { LoginForm } from '@/components/LoginForm';
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

function InitForm({ onDone }: { onDone: () => void }) {
  const [range, setRange] = useState<[Date | null, Date | null]>([new Date('2026-02-04'), new Date('2026-02-09')]);
  const [participants, setParticipants] = useState<string[]>(['Alex', 'Ben', 'Cathy']);
  const [creating, setCreating] = useState(false);

  const submit = async () => {
    if (!range[0] || !range[1]) return;
    setCreating(true);
    await fetch('/api/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        start: dayjs(range[0]).format('YYYY-MM-DD'),
        end: dayjs(range[1]).format('YYYY-MM-DD'),
        participants
      })
    });
    setCreating(false);
    onDone();
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
  const [booking, setBooking] = useState<Booking>(m.booking || {});

  useEffect(() => {
    setNote(m.note);
    setSelected(m.participants);
    setBooking(m.booking || {});
  }, [day.date, meal, opened]);

  const save = () => {
    const updated: Day = {
      ...day,
      [meal]: {
        note,
        participants: selected,
        booking: Object.keys(booking || {}).length ? booking : null
      }
    };
    onSave(updated);
    onClose();
  };

  const partOptions = trip.meta.participants.map((p) => ({ value: p, label: p }));

  return (
    <Modal opened={opened} onClose={onClose} title={`${day.date} ${day.weekday} · ${meal === 'lunch' ? '午餐' : '晚餐'}`} size="lg">
      <Stack>
        <Textarea label="備註 / 計劃" value={note} onChange={(e) => setNote(e.currentTarget.value)} autosize minRows={2} />
        <MultiSelect
          label="出席成員"
          data={partOptions}
          value={selected}
          onChange={setSelected}
          searchable
        />
        <Text size="sm" c="dimmed">
          提示：如需新增成員，請在初始設定中使用成員標籤輸入功能
        </Text>
        <Divider my="xs" label="訂位資訊（可選）" />
        <TextInput label="餐廳/地點" value={booking?.place || ''} onChange={(e) => setBooking({ ...booking, place: e.currentTarget.value })} />
        <DateTimePicker label="日期時間" value={booking?.time ? new Date(booking.time) : null} onChange={(v) => setBooking({ ...booking, time: v ? dayjs(v).format('YYYY-MM-DD HH:mm') : undefined })} />
        <NumberInput label="人數" value={booking?.people ?? undefined} onChange={(v) => setBooking({ ...booking, people: Number(v) || undefined })} min={1} />
        <Group grow>
          <TextInput label="預約編號" value={booking?.ref || ''} onChange={(e) => setBooking({ ...booking, ref: e.currentTarget.value })} />
          <TextInput label="聯絡方式" value={booking?.contact || ''} onChange={(e) => setBooking({ ...booking, contact: e.currentTarget.value })} />
        </Group>
        <Group grow>
          <NumberInput label="預算 / 價格" value={booking?.price ?? undefined} onChange={(v) => setBooking({ ...booking, price: Number(v) || undefined })} min={0} />
          <TextInput label="連結" value={booking?.url || ''} onChange={(e) => setBooking({ ...booking, url: e.currentTarget.value })} />
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
  const [edit, setEdit] = useState<EditState>({ open: false });

  useEffect(() => {
    if (error) setInitOpen(true);
  }, [error]);

  const handleLogin = async () => {
    await checkAuth(); // Refresh auth status after login
  };

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    await checkAuth(); // Refresh auth status after logout
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

  if (isLoading) {
    return <Container pos="relative" mih={200}><LoadingOverlay visible /></Container>;
  }

  if (!trip) {
    return (
      <Container size="md" py="xl">
        <InitForm onDone={() => { setInitOpen(false); location.reload(); }} />
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
            <Button variant="light" leftSection={<IconPlus size={16} />} onClick={() => setInitOpen(true)}>重設 / 新行程</Button>
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

                    return (

                      <Table.Td key={mealKey}>

                        <Stack gap={6}>

                          <Group gap="xs" wrap="wrap">

                            {meal.participants.map((p: string) => (<Badge key={p} variant="light">{p}</Badge>))}

                            {meal.participants.length === 0 && <Text c="dimmed" size="sm">無成員</Text>}

                          </Group>

                          {meal.note && <Text size="sm">{meal.note}</Text>}

                          {hasBooking && (

                            <Group gap="xs" wrap="wrap">

                              {meal.booking.place && <Badge>{meal.booking.place}</Badge>}

                              {meal.booking.time && <Badge variant="light">{meal.booking.time}</Badge>}

                              {meal.booking.people && <Badge variant="outline">{meal.booking.people}人</Badge>}

                              {meal.booking.url && <Anchor href={meal.booking.url} target="_blank" size="sm">連結</Anchor>}

                            </Group>

                          )}

                          <Group>

                            <Button size="xs" variant="light" leftSection={<IconPencil size={14} />} onClick={() => setEdit({ open: true, date: d.date, meal: mealKey as any })}>編輯</Button>

                          </Group>

                        </Stack>

                      </Table.Td>

                    );

                  })}

                  <Table.Td>

                    <Textarea

                      placeholder="例如：由雪場回東京 / Omakase (要預約)"

                      autosize

                      minRows={1}

                      value={d.special}

                      onChange={async (e) => {

                        const updated = trip.days.map((x) => x.date === d.date ? { ...x, special: e.currentTarget.value } : x);

                        await saveTrip({ ...trip, days: updated });

                      }}

                    />

                  </Table.Td>

                </Table.Tr>

              ))}

            </Table.Tbody>

          </Table>

        </Container>

      </AppShell.Main>



      <Modal opened={initOpen} onClose={() => setInitOpen(false)} title="開始新行程">

        <InitForm onDone={() => { setInitOpen(false); location.reload(); }} />

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

    </AppShell>

  );

}

