import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const DATA_KEY = 'bruno-kalender-data';

export async function DELETE() {
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
  try {
    await redis.set(DATA_KEY, JSON.stringify({ dates: [], leaRequests: [], betreuungEntries: [] }));
    return NextResponse.json({ success: true, message: 'Kalender geleert' });
  } catch (error) {
    console.error('Redis GET Reset Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to reset' }, { status: 500 });
  }
}
