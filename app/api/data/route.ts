import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

const DATA_KEY = 'bruno-kalender-data';

export async function GET() {
  try {
    const data = await kv.get(DATA_KEY);
    return NextResponse.json(data || { dates: [], participants: [] });
  } catch (error) {
    console.error('KV GET Error:', error);
    return NextResponse.json({ dates: [], participants: [] });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    await kv.set(DATA_KEY, data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('KV POST Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to save' }, { status: 500 });
  }
}
