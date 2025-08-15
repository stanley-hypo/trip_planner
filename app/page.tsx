'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { AppShell, Button, Container, Group, Modal, Stack, Title, Text, Badge, Table, Textarea, LoadingOverlay, Notification, ActionIcon, Tooltip, Divider, Chip, MultiSelect, NumberInput, TextInput, Anchor, TagsInput, Checkbox, Card, List, ThemeIcon, Switch } from '@mantine/core';
import { DatePickerInput, TimeInput } from '@mantine/dates';
import { IconCalendar, IconPencil, IconPlus, IconDeviceFloppy, IconTrash, IconExternalLink, IconLogout, IconClock, IconMapPin, IconUsers, IconCurrencyDollar, IconPhone, IconWorld, IconNotes, IconX, IconCalendarPlus, IconRefresh, IconEdit } from '@tabler/icons-react';
import { LoginForm } from '@/components/LoginForm';
import { ResetConfirmModal } from '@/components/ResetConfirmModal';
import { SpecialEventsModal } from '@/components/SpecialEventsModal';
import { MealManager } from '@/components/MealManager';
import { Navigation } from '@/components/Navigation';
import dayjs from 'dayjs';
import { Trip, Day, Booking, SpecialEvent, Meal } from '@/lib/types';

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

type SpecialEditState = {
  open: boolean;
  date?: string;
};

type MealManagerState = {
  open: boolean;
  date?: string;
};

export default function Page() {
  const { isAuthenticated, authLoading, checkAuth } = useAuth();
  const { trip, isLoading, mutate, error } = useTrip();
  const [initOpen, setInitOpen] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [specialEdit, setSpecialEdit] = useState<SpecialEditState>({ open: false });
  const [mealManager, setMealManager] = useState<MealManagerState>({ open: false });
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

  const onMealManagerSave = async (updatedDay: Day) => {
    if (!trip) return;
    try {
      console.log('onMealManagerSave 被調用，updatedDay:', updatedDay);
      const days = trip.days.map((d) => (d.date === updatedDay.date ? updatedDay : d));
      const updatedTrip = { ...trip, days };
      console.log('準備保存的 updatedTrip:', updatedTrip);
      await saveTrip(updatedTrip);
      console.log('saveTrip 完成，準備刷新數據');
      await mutate(); // 重新獲取數據以更新界面
      console.log('餐點保存成功:', updatedDay.meals);
      return true; // 返回成功標誌
    } catch (error) {
      console.error('餐點保存失敗:', error);
      throw error; // 將錯誤向上拋出，以便在 MealManager 中捕獲
    }
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
      meals: [],
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

  // 渲染餐點顯示
  const renderMeals = (day: Day) => {
    const meals = day.meals || [];
    
    if (meals.length === 0) {
      return (
        <Card padding="sm" radius="md" withBorder style={{ backgroundColor: '#f8f9fa' }}>
          <Stack gap="xs" align="center">
            <IconPencil size={24} color="#adb5bd" />
            <Text size="sm" c="dimmed">無餐點安排</Text>
            <Button 
              size="xs" 
              variant="light" 
              color="blue"
              leftSection={<IconPlus size={12} />}
              onClick={() => setMealManager({ open: true, date: day.date })}
            >
              新增餐點
            </Button>
          </Stack>
        </Card>
      );
    }

    return (
      <Stack gap="xs">
        {meals
          .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot))
          .map((meal) => (
            <Card key={meal.id} padding="sm" radius="md" withBorder 
                  style={{ 
                    backgroundColor: meal.type === 'lunch' ? '#fef7ed' : '#f5f3ff',
                    borderLeft: `4px solid ${meal.type === 'lunch' ? '#fd7e14' : '#7950f2'}`
                  }}>
              <Stack gap="xs">
                <Group justify="space-between" align="center">
                  <Group gap="xs">
                    <Badge 
                      color={meal.type === 'lunch' ? 'orange' : 'violet'} 
                      variant="light"
                      size="sm"
                    >
                      {meal.type === 'lunch' ? '🍽️ 午餐' : '🍷 晚餐'}
                    </Badge>
                    <Badge 
                      color="blue" 
                      variant="light"
                      size="sm"
                      leftSection={<IconClock size={10} />}
                    >
                      {meal.timeSlot}
                    </Badge>
                    {meal.booking?.isBooked && (
                      <Badge color="green" variant="light" size="sm">已訂位</Badge>
                    )}
                  </Group>
                  
                  <Group gap="xs">
                    <ActionIcon
                      size="xs"
                      variant="light"
                      color="blue"
                      onClick={() => setMealManager({ open: true, date: day.date })}
                    >
                      <IconEdit size={12} />
                    </ActionIcon>
                  </Group>
                </Group>

                {meal.note && (
                  <Text size="sm">{meal.note}</Text>
                )}

                {/* 參與者和人數信息 */}
                {(meal.participants.length > 0 || meal.booking?.people) && (
                  <Group gap="md">
                    {meal.participants.length > 0 && (
                      <Group gap="xs">
                        <ThemeIcon size="sm" color="blue" variant="light">
                          <IconUsers size={10} />
                        </ThemeIcon>
                        <Text size="xs">{meal.participants.join('、')}</Text>
                      </Group>
                    )}
                    {meal.booking?.people && (
                      <Group gap="xs">
                        <ThemeIcon size="sm" color="teal" variant="light">
                          <IconUsers size={10} />
                        </ThemeIcon>
                        <Text size="xs">{meal.booking.people} 人</Text>
                      </Group>
                    )}
                  </Group>
                )}

                {/* 餐廳和時間信息 */}
                {(meal.booking?.place || meal.booking?.time) && (
                  <Group gap="md">
                    {meal.booking?.place && (
                      <Group gap="xs">
                        <ThemeIcon size="sm" color="green" variant="light">
                          <IconMapPin size={10} />
                        </ThemeIcon>
                        <Text size="xs" fw={500}>{meal.booking.place}</Text>
                      </Group>
                    )}
                    {meal.booking?.time && (
                      <Group gap="xs">
                        <ThemeIcon size="sm" color="orange" variant="light">
                          <IconClock size={10} />
                        </ThemeIcon>
                        <Text size="xs" c="dimmed">
                          {meal.booking.time.split(' ')[1]}
                        </Text>
                      </Group>
                    )}
                  </Group>
                )}
                
                {/* 連結和價格信息 */}
                {(meal.booking?.googleMaps || meal.booking?.url || meal.booking?.price) && (
                  <Group gap="md">
                    {meal.booking?.googleMaps && (
                      <Group gap="xs">
                        <Tooltip label="在 Google Maps 中查看">
                          <ActionIcon
                            size="sm"
                            variant="filled"
                            color="red"
                            onClick={() => window.open(meal.booking!.googleMaps, '_blank')}
                            style={{ 
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <IconMapPin size={12} />
                          </ActionIcon>
                        </Tooltip>
                        <Text size="xs" fw={500} c="red"> Google Maps</Text>
                      </Group>
                    )}
                    {meal.booking?.url && (
                      <Group gap="xs">
                        <Tooltip label="查看餐廳網頁">
                          <ActionIcon
                            size="sm"
                            variant="filled"
                            color="blue"
                            onClick={() => window.open(meal.booking!.url, '_blank')}
                            style={{ 
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <IconWorld size={12} />
                          </ActionIcon>
                        </Tooltip>
                        <Text size="xs" fw={500} c="blue">網頁</Text>
                      </Group>
                    )}
                    {meal.booking?.price && (
                      <Group gap="xs">
                        <ThemeIcon size="sm" color="green" variant="light">
                          <IconCurrencyDollar size={10} />
                        </ThemeIcon>
                        <Text size="xs">${meal.booking.price}</Text>
                      </Group>
                    )}
                  </Group>
                )}
                
                {/* 餐廳備註 - 保持單獨一行 */}
                {meal.booking?.notes && (
                  <Group gap="xs">
                    <ThemeIcon size="sm" color="gray" variant="light">
                      <IconNotes size={10} />
                    </ThemeIcon>
                    <Text size="xs" c="dimmed">{meal.booking.notes}</Text>
                  </Group>
                )}
                
                {/* 預約編號和聯絡方式 */}
                {(meal.booking?.ref || meal.booking?.contact) && (
                  <Group gap="md">
                    {meal.booking?.ref && (
                      <Group gap="xs">
                        <ThemeIcon size="sm" color="indigo" variant="light">
                          <IconNotes size={10} />
                        </ThemeIcon>
                        <Text size="xs" c="dimmed">#{meal.booking.ref}</Text>
                      </Group>
                    )}
                    {meal.booking?.contact && (
                      <Group gap="xs">
                        <ThemeIcon size="sm" color="cyan" variant="light">
                          <IconPhone size={10} />
                        </ThemeIcon>
                        <Text size="xs" c="dimmed">{meal.booking.contact}</Text>
                      </Group>
                    )}
                  </Group>
                )}
              </Stack>
            </Card>
          ))}
        
        <Button 
          size="xs" 
          variant="light" 
          color="blue"
          leftSection={<IconPlus size={12} />}
          onClick={() => setMealManager({ open: true, date: day.date })}
          fullWidth
        >
          管理餐點
        </Button>
      </Stack>
    );
  };

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
                <Table.Th>餐點安排</Table.Th>
                <Table.Th style={{ width: 240 }}>特別行程</Table.Th>
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

                  <Table.Td>
                    {renderMeals(d)}
                  </Table.Td>

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

      {specialEdit.open && (
        <SpecialEventsModal
          day={trip.days.find((x) => x.date === specialEdit.date)!}
          opened={specialEdit.open}
          onClose={() => setSpecialEdit({ open: false })}
          onSave={onSpecialSave}
        />
      )}

              {mealManager.open && (
          <MealManager
            trip={trip}
            day={trip.days.find((x) => x.date === mealManager.date)!}
            opened={mealManager.open}
            onClose={() => setMealManager({ open: false })}
            onSave={onMealManagerSave}
            onTripUpdate={saveTrip}
            key={`${mealManager.date}-${trip.days.length}`} // 強制重新渲染當 trip 更新時
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
