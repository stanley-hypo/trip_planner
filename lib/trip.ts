import dayjs from 'dayjs';
import { Trip, Day } from './types';

const zhWeekday = (d: Date) => {
  const map = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
  return map[d.getDay()];
};

export function enumerateDates(start: string, end: string): string[] {
  const s = dayjs(start);
  const e = dayjs(end);
  const out: string[] = [];
  let cur = s;
  while (cur.isBefore(e) || cur.isSame(e, 'day')) {
    out.push(cur.format('YYYY-MM-DD'));
    cur = cur.add(1, 'day');
  }
  return out;
}

export function emptyTrip(start: string, end: string, participants: string[] = []): Trip {
  const days: Day[] = enumerateDates(start, end).map((ds) => ({
    date: ds,
    weekday: zhWeekday(new Date(ds + 'T00:00:00')),
    lunch: { note: '', participants: [], booking: null },
    dinner: { note: '', participants: [], booking: null },
    special: '',
    specialEvents: []
  }));

  return {
    meta: {
      startDate: start,
      endDate: end,
      createdAt: new Date().toISOString(),
      participants
    },
    days
  };
}
