import { promises as fs } from 'fs';
import path from 'path';
import { Trip } from './types';

const DATA_FILE = process.env.DATA_FILE || path.join(process.cwd(), 'data', 'trip.json');

async function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
}

export async function loadTrip(): Promise<Trip> {
  try {
    const buf = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(buf) as Trip;
  } catch (e: any) {
    if (e.code === 'ENOENT') {
      throw Object.assign(new Error('Not initialized'), { code: 'ENOENT' });
    }
    throw e;
  }
}

export async function saveTrip(trip: Trip): Promise<void> {
  await ensureDir(DATA_FILE);
  const tmp = DATA_FILE + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(trip, null, 2), 'utf-8');
  await fs.rename(tmp, DATA_FILE);
}

export { DATA_FILE };
