import { NextResponse } from 'next/server';
import { loadTrip, saveTrip } from '@/lib/storage';
import { Trip } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const trip = await loadTrip();
    return NextResponse.json({ ok: true, trip });
  } catch (e: any) {
    if (e.code === 'ENOENT') {
      return NextResponse.json({ ok: false, error: 'Not initialized' }, { status: 404 });
    }
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const trip = body?.trip as Trip;
    if (!trip) return NextResponse.json({ ok: false, error: 'Missing trip' }, { status: 400 });
    console.log('trip', trip.days[0]);
    await saveTrip(trip);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
