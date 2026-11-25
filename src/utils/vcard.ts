import { BusinessCardData, DEFAULT_AVATAR_URL } from '../types/card';

function escapeVCardValue(val: string): string {
  return val
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .trim();
}

function foldVCardLine(line: string): string {
  if (line.length <= 74) return line;
  const chunks: string[] = [];
  let index = 0;
  chunks.push(line.slice(0, 74));
  index = 74;
  while (index < line.length) {
    chunks.push(' ' + line.slice(index, index + 73));
    index += 73;
  }
  return chunks.join('\r\n');
}

function parseNameParts(fullName: string): { first: string; last: string } {
  const trimmed = fullName.trim();
  if (!trimmed) return { first: 'Contact', last: '' };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { first: parts[0], last: '' };
  }
  const last = parts[parts.length - 1];
  const first = parts.slice(0, -1).join(' ');
  return { first, last };
}

export async function imageUrlToJpegBase64(url: string): Promise<string | null> {
  if (!url) return null;
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = url;
    });

    const size = 240;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const minDim = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - minDim) / 2;
    const sy = (img.naturalHeight - minDim) / 2;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
    const base64 = dataUrl.split(',')[1];
    return base64 || null;
  } catch {
    if (url.startsWith('data:image/')) {
      return url.split(',')[1] || null;
    }
    return null;
  }
}

export function generateVCardString(
  card: BusinessCardData,
  base64Photo?: string | null
): string {
  const { first, last } = parseNameParts(card.fullName);
  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN;CHARSET=UTF-8:${escapeVCardValue(card.fullName)}`,
    `N;CHARSET=UTF-8:${escapeVCardValue(last)};${escapeVCardValue(first)};;;`,
  ];

  if (card.company.trim()) {
    lines.push(`ORG;CHARSET=UTF-8:${escapeVCardValue(card.company)}`);
  }
  if (card.title.trim()) {
    lines.push(`TITLE;CHARSET=UTF-8:${escapeVCardValue(card.title)}`);
  }
  if (card.phone.trim()) {
    const cleanedPhone = card.phone.trim().replace(/[^\d+\-()\s]/g, '');
    lines.push(`TEL;TYPE=CELL,VOICE:${cleanedPhone}`);
  }
  if (card.email.trim()) {
    lines.push(`EMAIL;TYPE=WORK,INTERNET:${card.email.trim()}`);
  }
  if (card.website.trim()) {
    lines.push(`URL:${card.website.trim()}`);
  }
  if (card.location.trim()) {
    lines.push(`ADR;TYPE=WORK;CHARSET=UTF-8:;;${escapeVCardValue(card.location)};;;;`);
  }
  if (card.bio.trim()) {
    lines.push(`NOTE;CHARSET=UTF-8:${escapeVCardValue(card.bio)}`);
  }
  if (base64Photo) {
    lines.push(foldVCardLine(`PHOTO;ENCODING=b;TYPE=JPEG:${base64Photo}`));
  }

  lines.push(`REV:${new Date().toISOString()}`);
  lines.push('END:VCARD');

  return lines.join('\r\n');
}

export async function downloadVCard(card: BusinessCardData): Promise<void> {
  const base64Photo = await imageUrlToJpegBase64(card.avatarUrl);
  const vcfContent = generateVCardString(card, base64Photo);
  const blob = new Blob([vcfContent], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const safeFileBase =
    card.fullName
      .trim()
      .replace(/[\\/:*?"<>|]/g, '')
      .replace(/\s+/g, '_') || 'contact_card';

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${safeFileBase}.vcf`;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();

  setTimeout(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, 1500);
}

export function resizeAvatarFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const rawDataUrl = String(reader.result || '');
      if (!rawDataUrl.startsWith('data:')) {
        reject(new Error('Invalid image file'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        const size = 400;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx || img.naturalWidth === 0 || img.naturalHeight === 0) {
          resolve(rawDataUrl);
          return;
        }
        const minDim = Math.min(img.naturalWidth, img.naturalHeight);
        const sx = (img.naturalWidth - minDim) / 2;
        const sy = (img.naturalHeight - minDim) / 2;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.86));
      };
      img.onerror = () => {
        if (rawDataUrl.startsWith('data:image/')) {
          resolve(rawDataUrl);
        } else {
          reject(new Error('Invalid image file'));
        }
      };
      img.src = rawDataUrl;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function encodeCardToShareUrl(card: BusinessCardData): string {
  const sharePayload: Partial<BusinessCardData> = {
    fullName: card.fullName,
    title: card.title,
    company: card.company,
    phone: card.phone,
    email: card.email,
    website: card.website,
    location: card.location,
    bio: card.bio,
    theme: card.theme,
  };
  if (card.avatarUrl && !card.avatarUrl.startsWith('data:')) {
    sharePayload.avatarUrl = card.avatarUrl;
  }

  const json = JSON.stringify(sharePayload);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  const encoded = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const url = new URL(window.location.href);
  url.search = '';
  url.hash = `c=${encoded}`;
  return url.toString();
}

export function buildCardUrl(cardId?: string | null, fallbackCard?: BusinessCardData): string {
  if (cardId) {
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('id', cardId);
    return url.toString();
  }
  if (fallbackCard) {
    return encodeCardToShareUrl(fallbackCard);
  }
  return window.location.href;
}

export function buildWhatsAppUrl(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) return '';
  let digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';

  if (trimmed.startsWith('00')) {
    digits = digits.slice(2);
  } else if (!trimmed.startsWith('+') && /^01\d{8,9}$/.test(digits)) {
    // Common Malaysian local mobile format (e.g. 012-345 6789 -> 60123456789)
    digits = `6${digits}`;
  }

  return `https://wa.me/${digits}`;
}

export function decodeCardFromHash(): Partial<BusinessCardData> | null {
  try {
    const hash = window.location.hash;
    if (!hash.startsWith('#c=')) return null;
    const raw = hash.slice(3);
    const padded = raw.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json) as Partial<BusinessCardData>;
    return {
      ...parsed,
      avatarUrl: parsed.avatarUrl || DEFAULT_AVATAR_URL,
    };
  } catch {
    return null;
  }
}

export async function fetchAllCards(): Promise<import('../types/card').StoredBusinessCard[]> {
  const res = await fetch('/api/cards');
  if (!res.ok) throw new Error('Failed to load cards');
  const data = (await res.json()) as { cards?: import('../types/card').StoredBusinessCard[] };
  return Array.isArray(data.cards) ? data.cards : [];
}

export async function fetchCardById(
  id: string
): Promise<import('../types/card').StoredBusinessCard | null> {
  const res = await fetch(`/api/cards/${encodeURIComponent(id)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to load card');
  const data = (await res.json()) as { card?: import('../types/card').StoredBusinessCard };
  return data.card || null;
}

export async function createNewCard(
  card: BusinessCardData
): Promise<import('../types/card').StoredBusinessCard> {
  const res = await fetch('/api/cards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(card),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || 'Failed to create card link');
  }
  const data = (await res.json()) as { card: import('../types/card').StoredBusinessCard };
  return data.card;
}

export async function deleteCardById(id: string): Promise<void> {
  const res = await fetch(`/api/cards/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok && res.status !== 404) {
    throw new Error('Failed to delete card');
  }
}
