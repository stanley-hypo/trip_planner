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
};

export type Meal = {
  note: string;
  participants: string[];
  booking?: Booking | null;
};

export type Day = {
  date: string;     // YYYY-MM-DD
  weekday: string;  // 星期三
  lunch: Meal;
  dinner: Meal;
  special: string;
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
