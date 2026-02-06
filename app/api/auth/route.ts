import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const USERS_KEY = 'bruno-kalender-users';
const LOGINS_KEY = 'bruno-kalender-logins';
const LOCAL_FILE = path.join(process.cwd(), 'users-local.json');
const LOCAL_LOGINS_FILE = path.join(process.cwd(), 'logins-local.json');

interface UserData {
  name: string;
  password: string;
  createdAt: string;
}

interface UsersStore {
  [key: string]: UserData;
}

interface LoginEntry {
  name: string;
  timestamp: string;
  type: 'login' | 'password_set';
}

// Check if Redis is configured
const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const hasRedis = redisUrl && redisToken;

const redis = hasRedis ? new Redis({
  url: redisUrl!,
  token: redisToken!,
}) : null;

// Helper functions for local file storage (fallback when no Redis)
async function getLocalUsers(): Promise<UsersStore> {
  try {
    const data = await fs.readFile(LOCAL_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function setLocalUsers(users: UsersStore): Promise<boolean> {
  try {
    await fs.writeFile(LOCAL_FILE, JSON.stringify(users, null, 2));
    return true;
  } catch {
    return false;
  }
}

// Helper functions for Redis operations
async function getUsers(): Promise<UsersStore> {
  if (!redis) {
    return getLocalUsers();
  }
  try {
    const data = await redis.get<UsersStore>(USERS_KEY);
    return data || {};
  } catch {
    return {};
  }
}

async function setUsers(users: UsersStore): Promise<boolean> {
  if (!redis) {
    return setLocalUsers(users);
  }
  try {
    await redis.set(USERS_KEY, JSON.stringify(users));
    return true;
  } catch {
    return false;
  }
}

// Helper functions for login history
async function getLocalLogins(): Promise<LoginEntry[]> {
  try {
    const data = await fs.readFile(LOCAL_LOGINS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function setLocalLogins(logins: LoginEntry[]): Promise<boolean> {
  try {
    await fs.writeFile(LOCAL_LOGINS_FILE, JSON.stringify(logins, null, 2));
    return true;
  } catch {
    return false;
  }
}

async function getLogins(): Promise<LoginEntry[]> {
  if (!redis) {
    return getLocalLogins();
  }
  try {
    const data = await redis.get<LoginEntry[]>(LOGINS_KEY);
    return data || [];
  } catch {
    return [];
  }
}

async function addLogin(entry: LoginEntry): Promise<boolean> {
  const logins = await getLogins();
  // Behalte nur die letzten 100 Einträge
  const updatedLogins = [...logins, entry].slice(-100);
  
  if (!redis) {
    return setLocalLogins(updatedLogins);
  }
  try {
    await redis.set(LOGINS_KEY, JSON.stringify(updatedLogins));
    return true;
  } catch {
    return false;
  }
}

// GET: Prüfen ob ein Benutzer bereits ein Passwort hat oder Login-Historie abrufen
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const action = searchParams.get('action');

    // Admin: Login-Historie abrufen
    if (action === 'logins') {
      const logins = await getLogins();
      return NextResponse.json({ logins });
    }

    if (!name) {
      return NextResponse.json({ error: 'Name erforderlich' }, { status: 400 });
    }

    const users = await getUsers();
    const hasPassword = !!users[name]?.password;

    return NextResponse.json({ hasPassword });
  } catch (error) {
    console.error('Auth GET Error:', error);
    // Return hasPassword: false so users can still set a password
    return NextResponse.json({ hasPassword: false });
  }
}

// POST: Passwort setzen oder verifizieren
export async function POST(request: Request) {
  try {
    const { name, password, isFirstTime } = await request.json();

    if (!name || !password) {
      return NextResponse.json({ error: 'Name und Passwort erforderlich' }, { status: 400 });
    }

    const users = await getUsers();

    if (isFirstTime) {
      // Erstes Mal: Passwort setzen
      if (users[name]?.password) {
        return NextResponse.json({ error: 'Passwort bereits gesetzt', success: false }, { status: 400 });
      }

      users[name] = {
        name,
        password,
        createdAt: new Date().toISOString()
      };

      const success = await setUsers(users);
      if (!success) {
        return NextResponse.json({ error: 'Fehler beim Speichern' }, { status: 500 });
      }
      
      // Login-Event speichern
      await addLogin({
        name,
        timestamp: new Date().toISOString(),
        type: 'password_set'
      });
      
      return NextResponse.json({ success: true, message: 'Passwort gesetzt' });
    } else {
      // Login: Passwort verifizieren
      if (!users[name]?.password) {
        return NextResponse.json({ error: 'Kein Passwort gesetzt', needsSetup: true }, { status: 400 });
      }

      if (users[name].password !== password) {
        return NextResponse.json({ error: 'Falsches Passwort', success: false }, { status: 401 });
      }

      // Login-Event speichern
      await addLogin({
        name,
        timestamp: new Date().toISOString(),
        type: 'login'
      });

      return NextResponse.json({ success: true, message: 'Login erfolgreich' });
    }
  } catch (error) {
    console.error('Auth POST Error:', error);
    return NextResponse.json({ error: 'Fehler beim Speichern' }, { status: 500 });
  }
}
