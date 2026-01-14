import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const DATA_KEY = 'bruno-kalender-data';

export async function GET() {
  try {
    const data = await redis.get(DATA_KEY);
    return NextResponse.json(data || { dates: [], participants: [] });
  } catch (error) {
    console.error('Redis GET Error:', error);
    return NextResponse.json({ dates: [], participants: [] });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    await redis.set(DATA_KEY, JSON.stringify(data));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Redis POST Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to save' }, { status: 500 });
  }
}
