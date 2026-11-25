import React, { useEffect, useState } from 'react';
import {
  Phone,
  Mail,
  Globe,
  MapPin,
  UserPlus,
  MessageCircle,
  QrCode,
  Share2,
  Copy,
  Check,
  ArrowUpRight,
} from 'lucide-react';
import { BusinessCardData, CardTheme } from '../types/card';
import { CopyBundle } from '../utils/i18n';
import {
  buildCardUrl,
  buildWhatsAppUrl,
  downloadVCard,
} from '../utils/vcard';

interface BusinessCardViewProps {
  card: BusinessCardData;
  cardId?: string | null;
  copy: CopyBundle;
  onOpenQr: () => void;
  showInlineSaveButton?: boolean;
}

interface ThemeStyles {
  surface: string;
  divider: string;
  heading: string;
  subtitle: string;
  muted: string;
  rowHover: string;
  iconWell: string;
  primaryBtn: string;
  secondaryBtn: string;
  avatarRing: string;
  fallbackBg: string;
  noticeBox: string;
}

const THEME_MAP: Record<CardTheme, ThemeStyles> = {
  porcelain: {
    surface: 'bg-white text-[#141619] border border-black/[0.08] shadow-[0_14px_36px_-12px_rgba(15,23,42,0.08)]',
    divider: 'border-black/[0.07]',
    heading: 'text-[#141619]',
    subtitle: 'text-[#3F4550]',
    muted: 'text-[#68707D]',
    rowHover: 'hover:bg-[#F7F7F5] active:bg-[#EFEFED]',
    iconWell: 'bg-[#F4F4F2] text-[#141619]',
    primaryBtn: 'bg-[#0F4C45] text-white hover:bg-[#0B3B35] shadow-sm',
    secondaryBtn: 'bg-[#F4F4F2] text-[#141619] hover:bg-[#E9E9E5]',
    avatarRing: 'ring-1 ring-black/[0.08]',
    fallbackBg: 'bg-[#E8ECEB] text-[#0F4C45]',
    noticeBox: 'bg-[#0F4C45]/[0.07] text-[#0F4C45]',
  },
  obsidian: {
    surface: 'bg-[#16181D] text-[#F5F6F8] border border-white/[0.10] shadow-[0_18px_42px_-12px_rgba(0,0,0,0.45)]',
    divider: 'border-white/[0.09]',
    heading: 'text-[#F8F9FA] tracking-[0.01em]',
    subtitle: 'text-[#C8CDD6]',
    muted: 'text-[#8F96A3]',
    rowHover: 'hover:bg-white/[0.05] active:bg-white/[0.09]',
    iconWell: 'bg-white/[0.08] text-[#F5F6F8]',
    primaryBtn: 'bg-[#F5F6F8] text-[#141619] hover:bg-white shadow-sm',
    secondaryBtn: 'bg-white/[0.08] text-[#F5F6F8] hover:bg-white/[0.14]',
    avatarRing: 'ring-1 ring-white/[0.15]',
    fallbackBg: 'bg-[#262A33] text-[#F5F6F8]',
    noticeBox: 'bg-white/[0.08] text-[#E2E6ED]',
  },
  spruce: {
    surface: 'bg-[#0F3833] text-[#F4F7F6] border border-white/[0.12] shadow-[0_18px_42px_-12px_rgba(10,38,34,0.4)]',
    divider: 'border-white/[0.11]',
    heading: 'text-white tracking-[0.01em]',
    subtitle: 'text-[#C9DDD9]',
    muted: 'text-[#96B5AF]',
    rowHover: 'hover:bg-white/[0.06] active:bg-white/[0.10]',
    iconWell: 'bg-white/[0.10] text-white',
    primaryBtn: 'bg-[#F2EFE9] text-[#0F3833] hover:bg-white shadow-sm',
    secondaryBtn: 'bg-white/[0.10] text-white hover:bg-white/[0.16]',
    avatarRing: 'ring-1 ring-white/[0.18]',
    fallbackBg: 'bg-[#194D46] text-[#F2EFE9]',
    noticeBox: 'bg-white/[0.10] text-[#E7F2EF]',
  },
};

function getInitials(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) return 'EC';
  const words = cleaned.split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
}

export const BusinessCardView: React.FC<BusinessCardViewProps> = ({
  card,
  cardId,
  copy,
  onOpenQr,
  showInlineSaveButton = true,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [sharedNotice, setSharedNotice] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [card.avatarUrl]);

  const styles = THEME_MAP[card.theme];

  const handleCopy = async (field: string, value: string) => {
    if (!value.trim()) return;
    try {
      await navigator.clipboard.writeText(value.trim());
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1800);
    } catch {
      // Clipboard API fallback ignored safely
    }
  };

  const handleSaveContact = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await downloadVCard(card);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = buildCardUrl(cardId, card);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${card.fullName} — ${card.company}`,
          text: `${card.fullName} · ${card.title}${card.company ? ` @ ${card.company}` : ''}`,
          url: shareUrl,
        });
        return;
      } catch {
        // User cancelled or share unsupported, fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setSharedNotice(true);
      setTimeout(() => setSharedNotice(false), 2200);
    } catch {
      // Ignore safely
    }
  };

  const cleanedTel = card.phone.replace(/[^\d+]/g, '');
  const whatsappHref = buildWhatsAppUrl(card.phone);
  const websiteHref = card.website
    ? /^https?:\/\//i.test(card.website)
      ? card.website
      : `https://${card.website}`
    : '';

  return (
    <article
      className={`w-full rounded-3xl overflow-hidden transition-colors duration-200 ${styles.surface}`}
      aria-label="Digital Business Card"
    >
      {/* Header / Identity Block */}
      <div className="px-6 pt-7 pb-6 sm:px-8 sm:pt-8">
        <div className="flex items-center gap-5">
          <div
            className={`relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-2xl overflow-hidden ${styles.avatarRing}`}
          >
            {card.avatarUrl && !imgFailed ? (
              <img
                src={card.avatarUrl}
                alt={card.fullName || 'Profile Avatar'}
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className={`h-full w-full flex items-center justify-center font-display text-xl font-semibold ${styles.fallbackBg}`}
                aria-hidden="true"
              >
                {getInitials(card.fullName)}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1
              className={`font-display text-2xl sm:text-[26px] font-bold leading-tight text-balance ${styles.heading}`}
            >
              {card.fullName || 'Your Name'}
            </h1>

            {(card.title || card.company) && (
              <div className="mt-1.5 space-y-0.5 leading-snug">
                {card.title && (
                  <p className={`text-sm sm:text-[15px] font-medium ${styles.subtitle}`}>
                    {card.title}
                  </p>
                )}
                {card.company && (
                  <p className={`text-sm sm:text-[15px] ${styles.muted}`}>
                    {card.company}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {card.bio.trim() && (
          <p className={`mt-5 text-sm leading-relaxed ${styles.muted}`}>{card.bio}</p>
        )}

        {/* Quick 4-Action Touch Row */}
        <div className="mt-6 grid grid-cols-4 gap-2">
          <a
            href={cleanedTel ? `tel:${cleanedTel}` : undefined}
            className={`min-h-[48px] flex flex-col items-center justify-center gap-1 rounded-2xl py-2 px-1 text-xs font-medium transition-transform active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F4C45] ${styles.secondaryBtn} ${
              !cleanedTel ? 'opacity-40 pointer-events-none' : ''
            }`}
          >
            <Phone className="h-4 w-4" strokeWidth={1.8} />
            <span className="whitespace-nowrap truncate max-w-full">{copy.callNow}</span>
          </a>

          <a
            href={card.email.trim() ? `mailto:${card.email.trim()}` : undefined}
            className={`min-h-[48px] flex flex-col items-center justify-center gap-1 rounded-2xl py-2 px-1 text-xs font-medium transition-transform active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F4C45] ${styles.secondaryBtn} ${
              !card.email.trim() ? 'opacity-40 pointer-events-none' : ''
            }`}
          >
            <Mail className="h-4 w-4" strokeWidth={1.8} />
            <span className="whitespace-nowrap truncate max-w-full">{copy.sendEmail}</span>
          </a>

          <button
            type="button"
            onClick={onOpenQr}
            className={`min-h-[48px] flex flex-col items-center justify-center gap-1 rounded-2xl py-2 px-1 text-xs font-medium transition-transform active:scale-[0.97] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F4C45] ${styles.secondaryBtn}`}
          >
            <QrCode className="h-4 w-4" strokeWidth={1.8} />
            <span className="whitespace-nowrap truncate max-w-full">{copy.qrCode}</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className={`min-h-[48px] flex flex-col items-center justify-center gap-1 rounded-2xl py-2 px-1 text-xs font-medium transition-transform active:scale-[0.97] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F4C45] ${styles.secondaryBtn}`}
          >
            {sharedNotice ? (
              <Check className="h-4 w-4" strokeWidth={2} />
            ) : (
              <Share2 className="h-4 w-4" strokeWidth={1.8} />
            )}
            <span className="whitespace-nowrap truncate max-w-full">
              {sharedNotice ? copy.copied : copy.shareCard}
            </span>
          </button>
        </div>
      </div>

      {/* Contact Details List */}
      <div className={`border-t ${styles.divider}`}>
        {/* Phone Row */}
        {card.phone.trim() && (
          <div className={`flex items-center justify-between px-4 sm:px-6 border-b ${styles.divider} ${styles.rowHover} transition-colors`}>
            <a
              href={`tel:${cleanedTel}`}
              className="flex items-center gap-3.5 py-3.5 min-h-[60px] flex-1 min-w-0 focus-visible:outline-none"
            >
              <span className={`h-9 w-9 shrink-0 rounded-xl flex items-center justify-center ${styles.iconWell}`}>
                <Phone className="h-4 w-4" strokeWidth={1.8} />
              </span>
              <div className="min-w-0 flex-1">
                <div className={`text-xs ${styles.muted}`}>{copy.phoneLabel}</div>
                <div className="text-[15px] font-medium tabular-nums truncate mt-0.5">
                  {card.phone}
                </div>
              </div>
            </a>
            <button
              type="button"
              onClick={() => handleCopy('phone', card.phone)}
              aria-label={`${copy.copy} ${copy.phoneLabel}`}
              className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-colors cursor-pointer ${styles.muted} hover:opacity-100`}
            >
              {copiedField === 'phone' ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4" strokeWidth={1.75} />
              )}
            </button>
          </div>
        )}

        {/* Email Row */}
        {card.email.trim() && (
          <div className={`flex items-center justify-between px-4 sm:px-6 border-b ${styles.divider} ${styles.rowHover} transition-colors`}>
            <a
              href={`mailto:${card.email.trim()}`}
              className="flex items-center gap-3.5 py-3.5 min-h-[60px] flex-1 min-w-0 focus-visible:outline-none"
            >
              <span className={`h-9 w-9 shrink-0 rounded-xl flex items-center justify-center ${styles.iconWell}`}>
                <Mail className="h-4 w-4" strokeWidth={1.8} />
              </span>
              <div className="min-w-0 flex-1">
                <div className={`text-xs ${styles.muted}`}>{copy.emailLabel}</div>
                <div className="text-[15px] font-medium truncate mt-0.5">{card.email}</div>
              </div>
            </a>
            <button
              type="button"
              onClick={() => handleCopy('email', card.email)}
              aria-label={`${copy.copy} ${copy.emailLabel}`}
              className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-colors cursor-pointer ${styles.muted} hover:opacity-100`}
            >
              {copiedField === 'email' ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4" strokeWidth={1.75} />
              )}
            </button>
          </div>
        )}

        {/* Website Row (optional) */}
        {websiteHref && (
          <div className={`flex items-center justify-between px-4 sm:px-6 border-b ${styles.divider} ${styles.rowHover} transition-colors`}>
            <a
              href={websiteHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3.5 py-3.5 min-h-[60px] flex-1 min-w-0 focus-visible:outline-none"
            >
              <span className={`h-9 w-9 shrink-0 rounded-xl flex items-center justify-center ${styles.iconWell}`}>
                <Globe className="h-4 w-4" strokeWidth={1.8} />
              </span>
              <div className="min-w-0 flex-1">
                <div className={`text-xs ${styles.muted}`}>{copy.websiteLabel}</div>
                <div className="text-[15px] font-medium truncate mt-0.5">
                  {card.website.replace(/^https?:\/\//i, '')}
                </div>
              </div>
              <span className={`min-h-[44px] min-w-[44px] flex items-center justify-center ${styles.muted}`}>
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </a>
          </div>
        )}

        {/* Location Row (optional) */}
        {card.location.trim() && (
          <div className={`flex items-center px-4 sm:px-6 ${showInlineSaveButton ? `border-b ${styles.divider}` : ''}`}>
            <div className="flex items-center gap-3.5 py-3.5 min-h-[60px] flex-1 min-w-0">
              <span className={`h-9 w-9 shrink-0 rounded-xl flex items-center justify-center ${styles.iconWell}`}>
                <MapPin className="h-4 w-4" strokeWidth={1.8} />
              </span>
              <div className="min-w-0 flex-1">
                <div className={`text-xs ${styles.muted}`}>{copy.locationLabel}</div>
                <div className="text-[15px] font-medium truncate mt-0.5">{card.location}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Inline Primary CTAs (visible on desktop or when sticky footer isn't covering) */}
      {showInlineSaveButton && (
        <div className="px-6 py-5 sm:px-8 sm:py-6">
          <div className={whatsappHref ? 'grid grid-cols-2 gap-2.5' : 'grid grid-cols-1'}>
            <button
              type="button"
              onClick={handleSaveContact}
              disabled={saving}
              className={`w-full min-h-[50px] rounded-2xl px-4 py-3 flex items-center justify-center gap-2 text-sm font-semibold whitespace-nowrap transition-all active:scale-[0.98] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F4C45] ${styles.primaryBtn}`}
            >
              <UserPlus className="h-4 w-4 shrink-0" strokeWidth={2} />
              <span className="truncate">{saving ? copy.savingContact : copy.saveContact}</span>
            </button>

            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[50px] rounded-2xl px-4 py-3 bg-[#128C7E] hover:bg-[#0E7468] text-white text-sm font-semibold flex items-center justify-center gap-2 whitespace-nowrap shadow-sm transition-all active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#128C7E]"
              >
                <MessageCircle className="h-4 w-4 shrink-0" strokeWidth={2} />
                <span className="truncate">{copy.whatsappNow}</span>
              </a>
            )}
          </div>

          {savedNotice && (
            <p
              role="status"
              className={`mt-3 rounded-xl px-3.5 py-2.5 text-xs leading-relaxed text-center ${styles.noticeBox}`}
            >
              {copy.contactSavedHint}
            </p>
          )}
        </div>
      )}
    </article>
  );
};
