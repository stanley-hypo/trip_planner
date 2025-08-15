export type Booking = {
  place?: string;
  time?: string;   // e.g. "2026-02-05 19:30"
  people?: number;
  ref?: string;
  contact?: string;
  price?: number;
  url?: string;
  googleMaps?: string;
  notes?: string;
  isBooked?: boolean; // 標記是否已完成訂位
  timeSlot?: string; // 新增：時間槽，例如 "12:00", "19:30"
};

export type Meal = {
  id: string; // 新增：唯一標識符
  note: string;
  participants: string[];
  booking?: Booking | null;
  timeSlot: string; // 新增：時間槽，例如 "12:00", "19:30"
  type: 'lunch' | 'dinner'; // 新增：餐點類型
};

export type SpecialEvent = {
  id: string;
  title: string;
  description?: string;
  time?: string; // HH:mm format
  link?: string;
  category?: string; // 例如：交通、活動、購物、預訂
};

export type Day = {
  date: string;     // YYYY-MM-DD
  weekday: string;  // 星期三
  meals: Meal[];    // 餐點陣列
  special: string; // 保持向後兼容
  specialEvents?: SpecialEvent[]; // 新的多項目結構
};

export type Trip = {
  meta: {
    startDate: string;
    endDate: string;
    createdAt: string;
    participants: string[];
  };
  days: Day[];
};
