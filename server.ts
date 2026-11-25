import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';

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

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'cards.json');
const ID_PATTERN = /^[a-zA-Z0-9_-]{4,32}$/;
const ALLOWED_THEMES = new Set(['porcelain', 'obsidian', 'spruce']);

function sanitizeString(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

function sanitizeAvatarUrl(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.length > 450_000) return '';
  if (trimmed.startsWith('/src/assets/')) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed.slice(0, 500);
  if (/^data:image\/(jpeg|jpg|png|webp|gif);base64,[a-zA-Z0-9+/=]+$/i.test(trimmed)) {
    return trimmed;
  }
  return '';
}

function sanitizeWebsiteUrl(value: unknown): string {
  const raw = sanitizeString(value, 300);
  if (!raw) return '';
  if (/^(javascript|data|vbscript):/i.test(raw)) return '';
  return raw;
}

function sanitizeCardPayload(body: Record<string, unknown>): CardPayload {
  const rawTheme = typeof body.theme === 'string' ? body.theme : 'porcelain';
  const theme = ALLOWED_THEMES.has(rawTheme)
    ? (rawTheme as CardPayload['theme'])
    : 'porcelain';

  return {
    avatarUrl: sanitizeAvatarUrl(body.avatarUrl),
    fullName: sanitizeString(body.fullName, 120),
    title: sanitizeString(body.title, 120),
    company: sanitizeString(body.company, 120),
    phone: sanitizeString(body.phone, 40),
    email: sanitizeString(body.email, 160),
    website: sanitizeWebsiteUrl(body.website),
    location: sanitizeString(body.location, 200),
    bio: sanitizeString(body.bio, 600),
    theme,
  };
}

function loadCardsStore(): Map<string, StoredCard> {
  const store = new Map<string, StoredCard>();
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && typeof item.id === 'string' && ID_PATTERN.test(item.id)) {
            store.set(item.id, item as StoredCard);
          }
        }
      }
    }
  } catch (err) {
    console.error('Failed to load cards store:', err);
  }
  return store;
}

function persistCardsStore(store: Map<string, StoredCard>): void {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const list = Array.from(store.values());
    const tmpFile = `${DATA_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(list, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DATA_FILE);
  } catch (err) {
    console.error('Failed to persist cards store:', err);
  }
}

function generateUniqueId(store: Map<string, StoredCard>): string {
  for (let i = 0; i < 8; i++) {
    const candidate = crypto.randomBytes(6).toString('base64url').slice(0, 8);
    if (!store.has(candidate)) return candidate;
  }
  return crypto.randomUUID().slice(0, 12);
}

async function startServer() {
  const app = express();
  const cardsStore = loadCardsStore();

  app.use(express.json({ limit: '1mb' }));

  app.get('/api/cards', (_req: Request, res: Response) => {
    const cards = Array.from(cardsStore.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json({ cards });
  });

  app.get('/api/cards/:id', (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id || !ID_PATTERN.test(id)) {
      res.status(400).json({ error: 'Invalid card ID' });
      return;
    }
    const card = cardsStore.get(id);
    if (!card) {
      res.status(404).json({ error: 'Card not found' });
      return;
    }
    res.json({ card });
  });

  app.post('/api/cards', (req: Request, res: Response) => {
    const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<
      string,
      unknown
    >;
    const payload = sanitizeCardPayload(body);
    if (!payload.fullName && !payload.phone && !payload.email) {
      res.status(400).json({ error: 'At least a name, phone, or email is required.' });
      return;
    }

    const now = new Date().toISOString();
    const id = generateUniqueId(cardsStore);
    const created: StoredCard = {
      id,
      ...payload,
      createdAt: now,
      updatedAt: now,
    };

    cardsStore.set(id, created);
    persistCardsStore(cardsStore);
    res.status(201).json({ card: created });
  });

  app.put('/api/cards/:id', (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id || !ID_PATTERN.test(id)) {
      res.status(400).json({ error: 'Invalid card ID' });
      return;
    }
    const existing = cardsStore.get(id);
    if (!existing) {
      res.status(404).json({ error: 'Card not found' });
      return;
    }

    const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<
      string,
      unknown
    >;
    const payload = sanitizeCardPayload(body);
    const updated: StoredCard = {
      ...existing,
      ...payload,
      updatedAt: new Date().toISOString(),
    };
    cardsStore.set(id, updated);
    persistCardsStore(cardsStore);
    res.json({ card: updated });
  });

  app.delete('/api/cards/:id', (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id || !ID_PATTERN.test(id)) {
      res.status(400).json({ error: 'Invalid card ID' });
      return;
    }
    if (!cardsStore.has(id)) {
      res.status(404).json({ error: 'Card not found' });
      return;
    }
    cardsStore.delete(id);
    persistCardsStore(cardsStore);
    res.json({ deleted: true });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
