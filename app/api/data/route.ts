import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

const DATA_KEY = 'bruno-kalender-data';

// Check if Redis is configured
const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const hasRedis = redisUrl && redisToken;

const redis = hasRedis ? new Redis({
  url: redisUrl!,
  token: redisToken!,
}) : null;

export async function GET() {
  try {
    if (!redis) {
      return NextResponse.json({ dates: [], leaRequests: [], betreuungEntries: [] });
    }
    const data = await redis.get(DATA_KEY);
    return NextResponse.json(data || { dates: [], leaRequests: [], betreuungEntries: [] });
  } catch (error) {
    console.error('Redis GET Error:', error);
    return NextResponse.json({ dates: [], leaRequests: [], betreuungEntries: [] });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!redis) {
      return NextResponse.json({ success: true }); // Pretend success for local dev
    }
    await redis.set(DATA_KEY, JSON.stringify(data));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Redis POST Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to save' }, { status: 500 });
  }
}
