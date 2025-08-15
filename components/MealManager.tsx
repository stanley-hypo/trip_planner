'use client';

import { useState, useEffect } from 'react';
import { 
  Modal, 
  Stack, 
  TextInput, 
  Textarea, 
  Button, 
  Group, 
  Checkbox, 
  Divider, 
  ActionIcon, 
  Text, 
  Badge, 
  Card, 
  Select,
  Switch,
  NumberInput,
  ThemeIcon,
  Tooltip
} from '@mantine/core';
import { TimeInput } from '@mantine/dates';
import { 
  IconPlus, 
  IconTrash, 
  IconEdit, 
  IconDeviceFloppy, 
  IconX, 
  IconClock, 
  IconUsers, 
  IconMapPin, 
  IconCurrencyDollar, 
  IconPhone, 
  IconWorld, 
  IconNotes,
  IconArrowsMove
} from '@tabler/icons-react';
import { Meal, Booking, Day, Trip } from '@/lib/types';
import { MealMover } from './MealMover';

interface MealManagerProps {
  trip: Trip;
  day: Day;
  opened: boolean;
  onClose: () => void;
  onSave: (day: Day) => void;
  onTripUpdate?: (updatedTrip: Trip) => Promise<void>; // 新增：用於更新整個行程
}

export function MealManager({ trip, day, opened, onClose, onSave, onTripUpdate }: MealManagerProps) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [showMealForm, setShowMealForm] = useState(false);
  const [movingMeal, setMovingMeal] = useState<Meal | null>(null);

  // 初始化餐點數據
  useEffect(() => {
    if (opened) {
      console.log('MealManager useEffect 被調用，day:', day);
      if (day.meals) {
        console.log('使用 day.meals:', day.meals);
        setMeals(day.meals);
      } else {
        console.log('沒有餐點數據，設置為空陣列');
        setMeals([]);
      }
    }
  }, [opened, day.meals]); // 直接依賴 day.meals 而不是整個 day 對象

  // 當 trip 或 day 變化時，同步更新本地狀態
  useEffect(() => {
    if (opened && day.meals) {
      console.log('同步更新本地狀態，day.meals:', day.meals);
      setMeals(day.meals);
    }
  }, [trip, day, opened]);

  const addMeal = () => {
    console.log('addMeal 被調用');
    // 新增餐點時，設置 editingMeal 為 null，讓 MealForm 進入新增模式
    setEditingMeal(null);
    setShowMealForm(true);
  };

  const editMeal = (meal: Meal) => {
    setEditingMeal(meal);
    setShowMealForm(true);
  };

  const deleteMeal = async (mealId: string) => {
    if (window.confirm('確定要刪除這個餐點嗎？')) {
      const updatedMeals = meals.filter(m => m.id !== mealId);
      
      // 更新本地狀態
      setMeals(updatedMeals);
      
      // 立即保存到服務器
      const updatedDay: Day = {
        ...day,
        meals: updatedMeals,
      };
      
      try {
        await onSave(updatedDay);
        console.log('餐點刪除成功');
        // 確保本地狀態與服務器狀態同步
        setMeals(updatedMeals);
      } catch (error) {
        console.error('餐點刪除失敗:', error);
        // 如果保存失敗，回滾本地狀態
        setMeals(meals);
        alert('刪除失敗，請重試');
      }
    }
  };

  const startMoveMeal = (meal: Meal) => {
    setMovingMeal(meal);
  };

  const moveMeal = async (meal: Meal, targetDate: string) => {
    if (!onTripUpdate) {
      alert('無法移動餐點：缺少行程更新功能');
      return;
    }

    try {
      // 從當前日期移除餐點
      const updatedCurrentDay: Day = {
        ...day,
        meals: meals.filter(m => m.id !== meal.id)
      };

      // 找到目標日期
      const targetDay = trip.days.find(d => d.date === targetDate);
      if (!targetDay) {
        alert(`找不到目標日期 ${targetDate}`);
        return;
      }

      // 創建新的餐點對象，保持原有ID但更新日期相關信息
      const movedMeal: Meal = {
        ...meal,
        // 可以根據需要調整餐點信息，比如時間槽等
      };

      // 更新目標日期的餐點
      const updatedTargetDay: Day = {
        ...targetDay,
        meals: [...targetDay.meals, movedMeal]
      };

      // 更新整個行程
      const updatedDays = trip.days.map(d => {
        if (d.date === day.date) return updatedCurrentDay;
        if (d.date === targetDate) return updatedTargetDay;
        return d;
      });

      const updatedTrip: Trip = {
        ...trip,
        days: updatedDays
      };

      // 保存更新後的行程
      await onTripUpdate(updatedTrip);

      // 更新本地狀態
      setMeals(updatedCurrentDay.meals);

      // 關閉移動模式
      setMovingMeal(null);

      console.log(`餐點已成功移動到 ${targetDate}`);
      alert(`餐點已成功移動到 ${targetDate}！`);
    } catch (error) {
      console.error('餐點移動失敗:', error);
      alert('移動失敗，請重試');
    }
  };

  const saveMeal = async (meal: Meal) => {
    console.log('saveMeal 被調用，meal:', meal);
    console.log('editingMeal:', editingMeal);
    console.log('當前 meals:', meals);
    
    let updatedMeals: Meal[];
    
    if (editingMeal) {
      // 編輯現有餐點
      updatedMeals = meals.map(m => m.id === editingMeal.id ? meal : m);
      console.log('編輯模式，更新後的 meals:', updatedMeals);
    } else {
      // 新增餐點
      updatedMeals = [...meals, meal];
      console.log('新增模式，更新後的 meals:', updatedMeals);
    }

    console.log('updatedMeals', updatedMeals);
    
    // 更新本地狀態
    setMeals(updatedMeals);
    console.log('本地狀態已更新，新的 meals 狀態:', updatedMeals);
    
    // 立即保存到服務器
    const updatedDay: Day = {
      ...day,
      meals: updatedMeals,
    };
    
    console.log('準備保存的 updatedDay:', updatedDay);
    
    try {
      // 等待保存完成
      const result = await onSave(updatedDay);
      console.log('餐點保存成功:', meal, '結果:', result);
      
      // 保存成功後清理狀態
      setEditingMeal(null);
      setShowMealForm(false);
      
      // 強制更新本地狀態以確保顯示最新數據
      setMeals(updatedMeals);
      
      // 返回成功結果
      return result;
    } catch (error) {
      console.error('餐點保存失敗:', error);
      // 如果保存失敗，回滾本地狀態
      setMeals(meals);
      alert('保存失敗，請重試');
      throw error; // 將錯誤向上拋出，以便在 MealForm 中捕獲
    }
  };

  const saveAll = async () => {
    // 創建新的 day 對象，包含 meals 陣列
    const updatedDay: Day = {
      ...day,
      meals: meals,
    };
    
    try {
      console.log('saveAll 被調用，準備保存更新後的 day:', updatedDay);
      await onSave(updatedDay);
      console.log('saveAll 保存成功');
      onClose();
    } catch (error) {
      console.error('saveAll 保存失敗:', error);
      alert('保存失敗，請重試');
    }
  };

  const getTimeSlotColor = (timeSlot: string) => {
    const hour = parseInt(timeSlot.split(':')[0]);
    if (hour < 12) return 'blue';
    if (hour < 17) return 'orange';
    return 'violet';
  };

  const getMealTypeIcon = (type: 'lunch' | 'dinner') => {
    return type === 'lunch' ? '🍽️' : '🍷';
  };

  return (
    <>
      <Modal 
        opened={opened} 
        onClose={onClose} 
        title={`${day.date} ${day.weekday} · 餐點管理`} 
        size="xl"
      >
        <Stack gap="lg">
          {/* 餐點列表 */}
          <Stack gap="md">
            <Group justify="space-between">
              <Text size="lg" fw={500}>當前餐點 ({meals.length})</Text>
              <Button 
                leftSection={<IconPlus size={16} />} 
                onClick={addMeal}
                color="green"
              >
                新增餐點
              </Button>
            </Group>

            {meals.length === 0 ? (
              <Card padding="lg" withBorder style={{ textAlign: 'center' }}>
                <Text c="dimmed">還沒有安排任何餐點</Text>
              </Card>
            ) : (
              <Stack gap="sm">
                {meals
                  .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot))
                  .map((meal) => (
                    <Card key={meal.id} padding="md" withBorder>
                      <Group justify="space-between" align="flex-start">
                        <Stack gap="xs" style={{ flex: 1 }}>
                          <Group gap="xs">
                            <Badge 
                              color={getTimeSlotColor(meal.timeSlot)} 
                              variant="light"
                              leftSection={<IconClock size={12} />}
                            >
                              {meal.timeSlot}
                            </Badge>
                            <Badge 
                              color={meal.type === 'lunch' ? 'orange' : 'violet'}
                              variant="light"
                            >
                              {getMealTypeIcon(meal.type)} {meal.type === 'lunch' ? '午餐' : '晚餐'}
                            </Badge>
                            {meal.booking?.isBooked && (
                              <Badge color="green" variant="light">已訂位</Badge>
                            )}
                          </Group>
                          
                          {meal.note && (
                            <Text size="sm">{meal.note}</Text>
                          )}
                          
                          {meal.participants.length > 0 && (
                            <Group gap="xs">
                              <ThemeIcon size="sm" color="blue" variant="light">
                                <IconUsers size={12} />
                              </ThemeIcon>
                              <Text size="xs">{meal.participants.join('、')}</Text>
                            </Group>
                          )}
                          
                          {meal.booking?.place && (
                            <Group gap="xs">
                              <ThemeIcon size="sm" color="green" variant="light">
                                <IconMapPin size={12} />
                              </ThemeIcon>
                              <Text size="xs">{meal.booking.place}</Text>
                            </Group>
                          )}
                        </Stack>
                        
                        <Group gap="xs">
                          <Tooltip label="編輯餐點">
                            <ActionIcon
                              variant="light"
                              color="blue"
                              onClick={() => editMeal(meal)}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                          </Tooltip>
                          
                          <Tooltip label="移動到其他日期">
                            <ActionIcon
                              variant="light"
                              color="yellow"
                              onClick={() => startMoveMeal(meal)}
                            >
                              <IconArrowsMove size={16} />
                            </ActionIcon>
                          </Tooltip>
                          
                          <Tooltip label="刪除餐點">
                            <ActionIcon
                              variant="light"
                              color="red"
                              onClick={() => deleteMeal(meal.id)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Group>
                    </Card>
                  ))
                }
              </Stack>
            )}
          </Stack>

          <Divider />
          
          {/* 操作按鈕 */}
          <Group justify="flex-end">
            <Button variant="light" onClick={onClose}>取消</Button>
            <Button 
              leftSection={<IconDeviceFloppy size={16} />} 
              onClick={saveAll}
              color="blue"
            >
              儲存所有變更
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* 餐點編輯表單 */}
      <MealForm
        opened={showMealForm}
        onClose={() => {
          setShowMealForm(false);
          setEditingMeal(null);
        }}
        meal={editingMeal}
        trip={trip}
        onSave={saveMeal}
        onCloseAndRefresh={() => {
          setShowMealForm(false);
          setEditingMeal(null);
          // 強制重新渲染餐點列表
          console.log('onCloseAndRefresh 被調用，當前 meals:', meals);
          // 觸發重新渲染 - 使用函數式更新確保狀態正確
          setMeals(prevMeals => [...prevMeals]);
        }}
      />

      {/* 餐點移動器 */}
      <MealMover
        opened={!!movingMeal}
        onClose={() => setMovingMeal(null)}
        meal={movingMeal}
        trip={trip}
        currentDate={day.date}
        onMove={moveMeal}
      />
    </>
  );
}

interface MealFormProps {
  opened: boolean;
  onClose: () => void;
  meal: Meal | null;
  trip: Trip;
  onSave: (meal: Meal) => void;
  onCloseAndRefresh: () => void;
}

function MealForm({ opened, onClose, meal, trip, onSave, onCloseAndRefresh }: MealFormProps) {
  const [formData, setFormData] = useState<Meal>({
    id: '',
    note: '',
    participants: [],
    booking: null,
    timeSlot: '12:00',
    type: 'lunch'
  });
  const [booking, setBooking] = useState<Booking>({});
  const [isBooked, setIsBooked] = useState(false);

  useEffect(() => {
    console.log('MealForm useEffect 被調用，meal:', meal, 'opened:', opened);
    
    if (meal) {
      console.log('設置編輯模式，meal:', meal);
      setFormData(meal);
      setBooking(meal.booking || {});
      setIsBooked(Boolean(meal.booking?.isBooked));
    } else {
      console.log('設置新增模式');
      setFormData({
        id: `meal-${Date.now()}`,
        note: '',
        participants: [],
        booking: null,
        timeSlot: '12:00',
        type: 'lunch'
      });
      setBooking({});
      setIsBooked(false);
    }
  }, [meal, opened]);

  const handleSave = async () => {
    const finalMeal: Meal = {
      ...formData,
      id: meal?.id || `meal-${Date.now()}`,
      booking: Object.keys(booking).length > 0 ? { ...booking, isBooked } : null
    };
    
    console.log('MealForm handleSave 被調用，準備保存餐點:', finalMeal);
    
    try {
      const result = await onSave(finalMeal);
      console.log('MealForm 保存結果:', result);
      // 保存成功後關閉表單並刷新餐點列表
      onCloseAndRefresh();
    } catch (error) {
      console.error('保存餐點失敗:', error);
      alert('保存失敗，請重試');
    }
  };

  const handleSelectAll = () => {
    if (formData.participants.length === trip.meta.participants.length) {
      setFormData({ ...formData, participants: [] });
    } else {
      setFormData({ ...formData, participants: [...trip.meta.participants] });
    }
  };

  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      title={meal ? "編輯餐點" : "新增餐點"} 
      size="lg"
    >
      <Stack gap="md">
        <Group grow>
          <Select
            label="餐點類型"
            data={[
              { value: 'lunch', label: '🍽️ 午餐' },
              { value: 'dinner', label: '🍷 晚餐' }
            ]}
            value={formData.type}
            onChange={(value) => value && setFormData({ ...formData, type: value as 'lunch' | 'dinner' })}
          />
                  <TimeInput
            label="時間槽"
            value={formData.timeSlot}
            onChange={(e) => setFormData({ ...formData, timeSlot: e.currentTarget.value })}
            leftSection={<IconClock size={16} />}
          />
        </Group>

        <Textarea 
          label="備註 / 計劃" 
          value={formData.note} 
          onChange={(e) => setFormData({ ...formData, note: e.currentTarget.value })} 
          autosize 
          minRows={2} 
        />

        <Group justify="space-between" align="center">
          <Text size="md" fw={500}>出席成員</Text>
          <Button 
            size="xs" 
            variant="light" 
            onClick={handleSelectAll}
            leftSection={<IconUsers size={14} />}
          >
            {formData.participants.length === trip.meta.participants.length ? '取消全選' : '全選成員'}
          </Button>
        </Group>

        <Checkbox.Group
          value={formData.participants}
          onChange={(value) => setFormData({ ...formData, participants: value as string[] })}
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

        <Divider label="餐廳資訊" />

        <TextInput 
          label="餐廳/地點" 
          value={booking?.place || ''} 
          onChange={(e) => setBooking({ ...booking, place: e.currentTarget.value })} 
        />
        
        <TimeInput 
          label="用餐時間" 
          value={booking?.time ? booking.time.split(' ')[1] : ''} 
          onChange={(e) => {
            const timeValue = e.currentTarget.value;
            setBooking({ 
              ...booking, 
              time: timeValue ? `${new Date().toISOString().split('T')[0]} ${timeValue}` : undefined 
            });
          }} 
          leftSection={<IconClock size={16} />}
          placeholder="選擇時間 (如: 19:30)"
        />
        
        <NumberInput 
          label="人數" 
          value={booking?.people ?? undefined} 
          onChange={(v) => setBooking({ ...booking, people: v ? Number(v) : undefined })} 
          min={1} 
        />

        <Group justify="space-between" align="center">
          <Text size="md" fw={500}>訂位狀態</Text>
          <Switch
            label="已訂位"
            checked={isBooked}
            onChange={(event) => setIsBooked(event.currentTarget.checked)}
            size="md"
          />
        </Group>

        <Group grow>
          <TextInput 
            label="預約編號" 
            value={booking?.ref || ''} 
            onChange={(e) => setBooking({ ...booking, ref: e.currentTarget.value })} 
          />
          <TextInput 
            label="聯絡方式" 
            value={booking?.contact || ''} 
            onChange={(e) => setBooking({ ...booking, contact: e.currentTarget.value })} 
          />
        </Group>
        
        <Group grow>
          <NumberInput 
            label="預算 / 價格" 
            value={booking?.price ?? undefined} 
            onChange={(v) => setBooking({ ...booking, price: v ? Number(v) : undefined })} 
            min={0} 
          />
          <TextInput 
            label="連結" 
            value={booking?.url || ''} 
            onChange={(e) => setBooking({ ...booking, url: e.currentTarget.value })} 
          />
        </Group>

        <TextInput 
          label="Google Maps 連結" 
          value={booking?.googleMaps || ''} 
          onChange={(e) => setBooking({ ...booking, googleMaps: e.currentTarget.value })} 
          leftSection={<IconMapPin size={16} />}
          placeholder="貼上 Google Maps 連結"
        />

        <Textarea 
          label="備註" 
          value={booking?.notes || ''} 
          onChange={(e) => setBooking({ ...booking, notes: e.currentTarget.value })} 
          autosize 
          minRows={2} 
        />

        <Group justify="space-between">
          <Button 
            variant="light" 
            color="red" 
            leftSection={<IconTrash size={16} />} 
            onClick={() => { 
              setBooking({}); 
              setIsBooked(false); 
            }}
          >
            清除餐廳資料
          </Button>
        </Group>

        <Group justify="flex-end">
          <Button variant="light" onClick={onClose}>取消</Button>
          <Button 
            leftSection={<IconDeviceFloppy size={16} />} 
            onClick={handleSave}
          >
            儲存
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
