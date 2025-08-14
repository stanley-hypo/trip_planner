import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SHARING_FILE = path.join(process.cwd(), 'data', 'sharing.json');

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  likes: number;
}

interface TravelPost {
  id: string;
  title: string;
  author: string;
  content: string;
  trip?: any;
  category: string;
  timestamp: string;
  likes: number;
  comments: Comment[];
  views: number;
  tags: string[];
}

// 確保文件存在
function ensureFileExists() {
  if (!fs.existsSync(SHARING_FILE)) {
    const dir = path.dirname(SHARING_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SHARING_FILE, JSON.stringify([], null, 2));
  }
}

// GET - 獲取所有分享
export async function GET() {
  try {
    ensureFileExists();
    const data = fs.readFileSync(SHARING_FILE, 'utf8');
    const posts: TravelPost[] = JSON.parse(data);
    return NextResponse.json({ ok: true, posts });
  } catch (error) {
    console.error('Error reading sharing data:', error);
    return NextResponse.json({ ok: false, error: 'Failed to read sharing data' }, { status: 500 });
  }
}

// POST - 保存所有分享數據
export async function POST(request: NextRequest) {
  try {
    const { posts } = await request.json();
    
    if (!Array.isArray(posts)) {
      return NextResponse.json({ ok: false, error: 'Posts must be an array' }, { status: 400 });
    }

    ensureFileExists();
    fs.writeFileSync(SHARING_FILE, JSON.stringify(posts, null, 2));
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error saving sharing data:', error);
    return NextResponse.json({ ok: false, error: 'Failed to save sharing data' }, { status: 500 });
  }
}
