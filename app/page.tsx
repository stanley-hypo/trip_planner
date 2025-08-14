'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { AppShell, Button, Container, Group, Modal, Stack, Title, Text, Badge, Table, Textarea, LoadingOverlay, Notification, ActionIcon, Tooltip, Divider, Chip, MultiSelect, NumberInput, TextInput, Anchor, TagsInput, Checkbox, Card, List, ThemeIcon, Switch } from '@mantine/core';
import { DatePickerInput, TimeInput } from '@mantine/dates';
import { IconCalendar, IconPencil, IconPlus, IconDeviceFloppy, IconTrash, IconExternalLink, IconLogout, IconClock, IconMapPin, IconUsers, IconCurrencyDollar, IconPhone, IconWorld, IconNotes, IconX, IconCalendarPlus, IconRefresh } from '@tabler/icons-react';
import { LoginForm } from '@/components/LoginForm';
import { ResetConfirmModal } from '@/components/ResetConfirmModal';
import { SpecialEventsModal } from '@/components/SpecialEventsModal';
import { Navigation } from '@/components/Navigation';
import dayjs from 'dayjs';
import { Trip, Day, Booking, SpecialEvent } from '@/lib/types';

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
  const [isBooked, setIsBooked] = useState(Boolean(m.booking?.isBooked));

  useEffect(() => {
    setNote(m.note);
    setSelected(m.participants);
    setBooking(m.booking || {});
    setIsBooked(Boolean(m.booking?.isBooked));
  }, [day.date, meal, opened]);

  const save = () => {
    const updated: Day = {
      ...day,
      [meal]: {
        note,
        participants: selected,
        booking: Object.keys(booking || {}).length ? { ...booking, isBooked } : null
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
        
        <Divider my="xs" label="餐廳資訊" />
        
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
        
        <Group justify="space-between" align="center" mt="md">
          <Text size="md" fw={500}>訂位狀態</Text>
          <Switch
            label="已訂位"
            checked={isBooked}
            onChange={(event) => setIsBooked(event.currentTarget.checked)}
            size="md"
          />
        </Group>
        
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
          <Button variant="light" color="red" leftSection={<IconTrash size={16} />} onClick={() => { setBooking({}); setIsBooked(false); }}>
            清除餐廳資料
          </Button>
        </Group>
        
        <Group justify="flex-end" mt="lg">
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
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

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
    try {
      const days = trip.days.map((d) => (d.date === updatedDay.date ? updatedDay : d));
      const updatedTrip = { ...trip, days };
      await saveTrip(updatedTrip);
      await mutate(); // 重新獲取數據
      console.log('Special events saved successfully:', updatedDay.specialEvents);
    } catch (error) {
      console.error('Error saving special events:', error);
    }
  };

  const addDay = async (position: 'before' | 'after') => {
    if (!trip) return;
    
    const currentDays = trip.days.sort((a, b) => a.date.localeCompare(b.date));
    let newDate: string;
    
    if (position === 'before') {
      const firstDate = dayjs(currentDays[0].date);
      newDate = firstDate.subtract(1, 'day').format('YYYY-MM-DD');
    } else {
      const lastDate = dayjs(currentDays[currentDays.length - 1].date);
      newDate = lastDate.add(1, 'day').format('YYYY-MM-DD');
    }
    
    const newDay: Day = {
      date: newDate,
      weekday: zhWeekday(new Date(newDate + 'T00:00:00')),
      lunch: { note: '', participants: [], booking: null },
      dinner: { note: '', participants: [], booking: null },
      special: '',
      specialEvents: []
    };
    
    const updatedDays = position === 'before' 
      ? [newDay, ...currentDays]
      : [...currentDays, newDay];
    
    const sortedDays = updatedDays.sort((a, b) => a.date.localeCompare(b.date));
    
    const updatedTrip: Trip = {
      ...trip,
      meta: {
        ...trip.meta,
        startDate: sortedDays[0].date,
        endDate: sortedDays[sortedDays.length - 1].date
      },
      days: sortedDays
    };
    
    await saveTrip(updatedTrip);
  };

  const removeDay = async (dateToRemove: string) => {
    if (!trip || trip.days.length <= 1) return; // 至少保留一天
    
    const updatedDays = trip.days.filter(d => d.date !== dateToRemove);
    const sortedDays = updatedDays.sort((a, b) => a.date.localeCompare(b.date));
    
    const updatedTrip: Trip = {
      ...trip,
      meta: {
        ...trip.meta,
        startDate: sortedDays[0].date,
        endDate: sortedDays[sortedDays.length - 1].date
      },
      days: sortedDays
    };
    
    await saveTrip(updatedTrip);
  };

  const zhWeekday = (d: Date) => {
    const map = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
    return map[d.getDay()];
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
      <Navigation />
      <Group justify="space-between" mb="md" px="md">
        <Group>
          <Badge variant="light" size="lg">{trip.meta.startDate} → {trip.meta.endDate}</Badge>
        </Group>
        <Group gap="xs">
          <Button 
            variant="light" 
            leftSection={<IconRefresh size={16} />} 
            onClick={() => mutate()}
          >
            重新整理
          </Button>
          <Button variant="light" leftSection={<IconPlus size={16} />} onClick={() => setResetConfirmOpen(true)}>重設 / 新行程</Button>
        </Group>
      </Group>
      <AppShell.Main>
        <Container size="xl">

          {/* 日子管理按鈕 */}
          <Group justify="space-between" mb="md">
            <Text size="lg" fw={500}>行程安排</Text>
            <Group gap="xs">
              <Button 
                size="sm" 
                variant="light" 
                color="blue"
                leftSection={<IconCalendarPlus size={16} />}
                onClick={() => addDay('before')}
              >
                前面加一天
              </Button>
              <Button 
                size="sm" 
                variant="light" 
                color="blue"
                leftSection={<IconCalendarPlus size={16} />}
                onClick={() => addDay('after')}
              >
                後面加一天
              </Button>
            </Group>
          </Group>

          <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ width: 160 }}>日期 / 星期</Table.Th>
                <Table.Th>午餐</Table.Th>
                <Table.Th>晚餐</Table.Th>
                <Table.Th style={{ width: 240 }}>特別行程</Table.Th>
                {/* 操作欄位已移除 */}
              </Table.Tr>
            </Table.Thead>

            <Table.Tbody>
              {trip.days.map((d) => (
                <Table.Tr
                  key={d.date}
                  onMouseEnter={() => setHoveredDate(d.date)}
                  onMouseLeave={() => setHoveredDate(null)}
                >
                  <Table.Td>
                    <Group justify="space-between" align="flex-start" gap={0}>
                      <Stack gap="xs">
                        <Text size="md" fw={500}>{d.date}</Text>
                        <Text size="sm" c="dimmed">{d.weekday}</Text>
                      </Stack>
                      {trip.days.length > 1 && hoveredDate === d.date && (
                        <Tooltip label="移除這一天">
                          <ActionIcon
                            size="sm"
                            variant="light"
                            color="red"
                            style={{ marginLeft: 8, marginTop: 2 }}
                            onClick={() => {
                              if (window.confirm(`確定要移除 ${d.date} ${d.weekday} 嗎？`)) {
                                removeDay(d.date);
                              }
                            }}
                          >
                            <IconX size={14} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </Group>
                  </Table.Td>

                  {["lunch","dinner"].map((mealKey) => {

                    const meal = (d as any)[mealKey];
                    const hasRestaurantData = meal?.booking && Object.keys(meal.booking).length > 0;
                    const isBooked = meal?.booking?.isBooked;
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
                            {hasRestaurantData && (
                              <Text size="xs" c={isBooked ? "green" : "orange"} fw={500}>
                                ● {isBooked ? '已訂位' : '未訂位'}
                              </Text>
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

                          {/* 餐廳信息 */}
                          {hasRestaurantData && (
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
                      {/* 顯示新的多項目特別行程 */}
                      {d.specialEvents && d.specialEvents.length > 0 ? (
                        <Stack gap={4}>
                          {d.specialEvents.slice(0, 3).map((event) => (
                            <Group key={event.id} gap="xs" wrap="nowrap">
                              <Text size="sm" fw={500}>
                                {event.category === '交通' ? '🚌' : 
                                 event.category === '購物' ? '🛍️' : 
                                 event.category === '預訂' ? '📝' : 
                                 event.category === '其他' ? '📌' : '🎯'} 
                                {event.title}
                              </Text>
                              {event.time && (
                                <Text size="sm" c="dimmed">
                                  {event.time}
                                </Text>
                              )}
                              {event.link && (
                                <ActionIcon
                                  size="xs"
                                  variant="light"
                                  color="blue"
                                  onClick={() => window.open(event.link, '_blank')}
                                >
                                  <IconExternalLink size={10} />
                                </ActionIcon>
                              )}
                            </Group>
                          ))}
                          {d.specialEvents.length > 3 && (
                            <Text size="sm" c="dimmed">
                              +{d.specialEvents.length - 3} 項活動...
                            </Text>
                          )}
                        </Stack>
                      ) : d.special ? (
                        // 顯示舊版單一特別行程
                        <Text size="sm">{d.special}</Text>
                      ) : (
                        <Text c="dimmed" size="sm">無特別行程</Text>
                      )}
                      
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
        <SpecialEventsModal
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
