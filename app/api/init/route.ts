import { NextResponse } from 'next/server';
import { emptyTrip } from '@/lib/trip';
import { saveTrip, loadTrip } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { start, end, participants = [], force = false } = body || {};
  if (!start || !end) {
    return NextResponse.json({ error: 'start and end are required (YYYY-MM-DD)' }, { status: 400 });
  }
  try {
    if (!force) {
      // If already exists, return current trip
      const trip = await loadTrip();
      return NextResponse.json({ ok: true, trip, already: true });
    }
  } catch {}

  const trip = emptyTrip(start, end, participants);
  await saveTrip(trip);
  return NextResponse.json({ ok: true, trip });
}
