import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

const redis = new Redis({
    url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const DATA_KEY = 'bruno-kalender-data';

export async function GET() {
    try {
        const data: any = await redis.get(DATA_KEY);

        // Debug: Return actual data to see names
        return NextResponse.json({
            currentData: data
        });

    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
