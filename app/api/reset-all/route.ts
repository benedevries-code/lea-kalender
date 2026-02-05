import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

const DATA_KEY = 'bruno-kalender-data';
const USERS_KEY = 'bruno-kalender-users';

// Check if Redis is configured
const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const hasRedis = redisUrl && redisToken;

const redis = hasRedis ? new Redis({
  url: redisUrl!,
  token: redisToken!,
}) : null;

export async function GET() {
  if (!redis) {
    return NextResponse.json({ success: false, message: 'Redis nicht konfiguriert' });
  }
  
  try {
    // Lösche alle Kalendereinträge
    await redis.set(DATA_KEY, JSON.stringify({ dates: [], leaRequests: [], betreuungEntries: [] }));
    
    // Lösche alle Passwörter
    await redis.set(USERS_KEY, JSON.stringify({}));
    
    return NextResponse.json({ 
      success: true, 
      message: 'Alle Daten und Passwoerter geloescht!' 
    });
  } catch (error) {
    console.error('Reset All Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to reset' }, { status: 500 });
  }
}
