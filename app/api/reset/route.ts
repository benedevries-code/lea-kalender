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

export async function DELETE() {
  if (!redis) {
    return NextResponse.json({ success: true, message: 'Lokal - keine Aktion' });
  }
  try {
    await redis.set(DATA_KEY, JSON.stringify({ dates: [], leaRequests: [], betreuungEntries: [] }));
    return NextResponse.json({ success: true, message: 'Daten geloescht' });
  } catch (error) {
    console.error('Redis DELETE Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete' }, { status: 500 });
  }
}

// Automatisch leeren beim ersten GET nach Deployment
export async function GET() {
  if (!redis) {
    return NextResponse.json({ success: true, message: 'Lokal - keine Aktion' });
  }
  try {
    await redis.set(DATA_KEY, JSON.stringify({ dates: [], leaRequests: [], betreuungEntries: [] }));
    return NextResponse.json({ success: true, message: 'Kalender geleert' });
  } catch (error) {
    console.error('Redis GET Reset Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to reset' }, { status: 500 });
  }
}
