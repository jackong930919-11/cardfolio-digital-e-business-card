interface Env {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
  DB: {
    prepare(query: string): {
      bind(...values: unknown[]): {
        first<T>(): Promise<T | null>;
        run(): Promise<unknown>;
        all<T>(): Promise<{ results: T[] }>;
      };
      all<T>(): Promise<{ results: T[] }>;
      run(): Promise<unknown>;
    };
  };
}

interface CardPayload {
  avatarUrl: string;
  fullName: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  location: string;
  bio: string;
  theme: 'porcelain' | 'obsidian' | 'spruce';
}

interface StoredCard extends CardPayload {
  id: string;
  createdAt: string;
  updatedAt: string;
}

interface CardRow {
  id: string;
  data: string;
  created_at: string;
  updated_at: string;
}

const ID_PATTERN = /^[a-zA-Z0-9_-]{4,32}$/;
const ALLOWED_THEMES = new Set(['porcelain', 'obsidian', 'spruce']);

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

function sanitizeString(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function sanitizeAvatarUrl(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 450_000) return '';
  if (trimmed.startsWith('/src/assets/')) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed.slice(0, 500);
  if (/^data:image\/(jpeg|jpg|png|webp|gif);base64,[a-zA-Z0-9+/=]+$/i.test(trimmed)) {
    return trimmed;
  }
  return '';
}

function sanitizeCardPayload(value: unknown): CardPayload {
  const body =
    value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const rawTheme = typeof body.theme === 'string' ? body.theme : 'porcelain';
  const theme = ALLOWED_THEMES.has(rawTheme)
    ? (rawTheme as CardPayload['theme'])
    : 'porcelain';
  const website = sanitizeString(body.website, 300);

  return {
    avatarUrl: sanitizeAvatarUrl(body.avatarUrl),
    fullName: sanitizeString(body.fullName, 120),
    title: sanitizeString(body.title, 120),
    company: sanitizeString(body.company, 120),
    phone: sanitizeString(body.phone, 40),
    email: sanitizeString(body.email, 160),
    website: /^(javascript|data|vbscript):/i.test(website) ? '' : website,
    location: sanitizeString(body.location, 200),
    bio: sanitizeString(body.bio, 600),
    theme,
  };
}

function rowToCard(row: CardRow): StoredCard {
  return {
    ...(JSON.parse(row.data) as CardPayload),
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function readBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

async function handleCards(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const match = url.pathname.match(/^\/api\/cards(?:\/([^/]+))?$/);
  if (!match) return json({ error: 'Not found' }, 404);

  const id = match[1] ? decodeURIComponent(match[1]) : null;
  if (id && !ID_PATTERN.test(id)) {
    return json({ error: 'Invalid card ID' }, 400);
  }

  if (request.method === 'GET' && !id) {
    const result = await env.DB.prepare(
      'SELECT id, data, created_at, updated_at FROM cards ORDER BY created_at DESC',
    ).all<CardRow>();
    return json({ cards: result.results.map(rowToCard) });
  }

  if (request.method === 'GET' && id) {
    const row = await env.DB.prepare(
      'SELECT id, data, created_at, updated_at FROM cards WHERE id = ?',
    )
      .bind(id)
      .first<CardRow>();
    return row ? json({ card: rowToCard(row) }) : json({ error: 'Card not found' }, 404);
  }

  if (request.method === 'POST' && !id) {
    const payload = sanitizeCardPayload(await readBody(request));
    if (!payload.fullName && !payload.phone && !payload.email) {
      return json({ error: 'At least a name, phone, or email is required.' }, 400);
    }
    const newId = crypto.randomUUID().replaceAll('-', '').slice(0, 8);
    const now = new Date().toISOString();
    await env.DB.prepare(
      'INSERT INTO cards (id, data, created_at, updated_at) VALUES (?, ?, ?, ?)',
    )
      .bind(newId, JSON.stringify(payload), now, now)
      .run();
    return json({ card: { id: newId, ...payload, createdAt: now, updatedAt: now } }, 201);
  }

  if (request.method === 'PUT' && id) {
    const existing = await env.DB.prepare(
      'SELECT id, data, created_at, updated_at FROM cards WHERE id = ?',
    )
      .bind(id)
      .first<CardRow>();
    if (!existing) return json({ error: 'Card not found' }, 404);

    const payload = sanitizeCardPayload(await readBody(request));
    const updatedAt = new Date().toISOString();
    await env.DB.prepare('UPDATE cards SET data = ?, updated_at = ? WHERE id = ?')
      .bind(JSON.stringify(payload), updatedAt, id)
      .run();
    return json({ card: rowToCard({ ...existing, data: JSON.stringify(payload), updated_at: updatedAt }) });
  }

  if (request.method === 'DELETE' && id) {
    const result = await env.DB.prepare('DELETE FROM cards WHERE id = ?').bind(id).run();
    const deleted = Boolean((result as { meta?: { changes?: number } }).meta?.changes);
    return deleted ? json({ deleted: true }) : json({ error: 'Card not found' }, 404);
  }

  return json({ error: 'Method not allowed' }, 405);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/cards')) {
      try {
        return await handleCards(request, env);
      } catch (error) {
        console.error('Card API request failed:', error);
        return json({ error: 'Internal server error' }, 500);
      }
    }
    return env.ASSETS.fetch(request);
  },
};
