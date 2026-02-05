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
    if (!redis) {
        return NextResponse.json({ message: 'Redis nicht konfiguriert' });
    }
    
    try {
        const data: any = await redis.get(DATA_KEY);

        if (!data) {
            return NextResponse.json({ message: 'No data found in Redis' });
        }

        const result = {
            deletedBetreuung: 0,
            clearedLeaHelpers: 0
        };

        // 1. Lösche Betreuungseinträge von Mareike (case-insensitive)
        if (data.betreuungEntries) {
            const originalLength = data.betreuungEntries.length;
            data.betreuungEntries = data.betreuungEntries.filter((e: any) => !e.name.toLowerCase().includes('mareike'));
            result.deletedBetreuung = originalLength - data.betreuungEntries.length;
        }

        // 2. Entferne Mareike als Helper bei Lea-Anfragen
        if (data.leaRequests) {
            let clearedCount = 0;
            data.leaRequests = data.leaRequests.map((r: any) => {
                if (r.helper && r.helper.toLowerCase().includes('mareike')) {
                    clearedCount++;
                    return { ...r, helper: undefined };
                }
                return r;
            });
            result.clearedLeaHelpers = clearedCount;
        }

        // Speichern
        await redis.set(DATA_KEY, JSON.stringify(data));

        return NextResponse.json({
            success: true,
            result
        });
    } catch (error) {
        console.error('Cleanup Error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
