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

        if (!data) {
            return NextResponse.json({ message: 'No data found in Redis' });
        }

        const result = {
            deletedBetreuung: 0,
            clearedLeaHelpers: 0
        };

        // 1. Lösche Betreuungseinträge von Mareike (enthält "Mareike")
        if (data.betreuungEntries) {
            const originalLength = data.betreuungEntries.length;
            data.betreuungEntries = data.betreuungEntries.filter((e: any) => !e.name.includes('Mareike'));
            result.deletedBetreuung = originalLength - data.betreuungEntries.length;
        }

        // 2. Entferne Mareike als Helper bei Lea-Anfragen
        if (data.leaRequests) {
            let clearedCount = 0;
            data.leaRequests = data.leaRequests.map((r: any) => {
                if (r.helper && r.helper.includes('Mareike')) {
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
