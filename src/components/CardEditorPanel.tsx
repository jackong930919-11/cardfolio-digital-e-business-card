import React, { useState } from 'react';
import {
  Upload,
  RotateCcw,
  Plus,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  FileEdit,
  Eraser,
} from 'lucide-react';
import {
  BusinessCardData,
  CardTheme,
  DEFAULT_AVATAR_URL,
  StoredBusinessCard,
} from '../types/card';
import { CopyBundle } from '../utils/i18n';
import { buildCardUrl, resizeAvatarFile } from '../utils/vcard';

interface CardEditorPanelProps {
  card: BusinessCardData;
  generatedCards: StoredBusinessCard[];
  copy: CopyBundle;
  generating: boolean;
  lastGeneratedCard: StoredBusinessCard | null;
  generateError: string | null;
  onChange: (updated: BusinessCardData) => void;
  onGenerateNewCard: () => void;
  onDeleteCard: (id: string) => void;
  onOpenCustomerCard: (item: StoredBusinessCard) => void;
  onLoadIntoEditor: (item: StoredBusinessCard) => void;
  onClearDraft: () => void;
  onResetSample: () => void;
}

export const CardEditorPanel: React.FC<CardEditorPanelProps> = ({
  card,
  generatedCards,
  copy,
  generating,
  lastGeneratedCard,
  generateError,
  onChange,
  onGenerateNewCard,
  onDeleteCard,
  onOpenCustomerCard,
  onLoadIntoEditor,
  onClearDraft,
  onResetSample,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const updateField = <K extends keyof BusinessCardData>(
    key: K,
    value: BusinessCardData[K]
  ) => {
    onChange({ ...card, [key]: value });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    try {
      const resizedDataUrl = await resizeAvatarFile(file);
      updateField('avatarUrl', resizedDataUrl);
    } catch {
      setUploadError('Unable to process image file.');
    } finally {
      e.target.value = '';
    }
  };

  const handleCopyUrl = async (id: string) => {
    const url = buildCardUrl(id);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Ignore safely
    }
  };

  const themes: { id: CardTheme; label: string; swatch: string }[] = [
    { id: 'porcelain', label: copy.themes.porcelain, swatch: 'bg-white border-black/15' },
    { id: 'obsidian', label: copy.themes.obsidian, swatch: 'bg-[#16181D] border-black/20' },
    { id: 'spruce', label: copy.themes.spruce, swatch: 'bg-[#0F3833] border-black/20' },
  ];

  const latestUrl = lastGeneratedCard ? buildCardUrl(lastGeneratedCard.id) : '';

  return (
    <div className="space-y-6">
      <section
        className="bg-white rounded-3xl border border-black/[0.08] p-6 sm:p-7"
        aria-label={copy.editorTitle}
      >
        <div className="flex flex-wrap items-start justify-between gap-3 pb-5 border-b border-black/[0.06]">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-semibold text-[#141619]">
              {copy.editorTitle}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#68707D] leading-relaxed">
              {copy.editorSubtitle}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onClearDraft}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#F4F4F2] hover:bg-[#E8E8E4] text-xs font-medium text-[#3F4550] flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer"
            >
              <Eraser className="h-3.5 w-3.5" />
              <span>{copy.newBlankDraft}</span>
            </button>
            <button
              type="button"
              onClick={onResetSample}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#F4F4F2] hover:bg-[#E8E8E4] text-xs font-medium text-[#3F4550] whitespace-nowrap transition-colors cursor-pointer"
            >
              {copy.resetDefaults}
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          {/* Avatar Upload Row */}
          <div>
            <span className="block text-xs font-medium text-[#3F4550] mb-2">
              {copy.avatarLabel}
            </span>
            <div className="flex items-center gap-4">
              <img
                src={card.avatarUrl || DEFAULT_AVATAR_URL}
                alt={card.fullName || 'Avatar'}
                referrerPolicy="no-referrer"
                className="h-14 w-14 rounded-2xl object-cover ring-1 ring-black/[0.08] shrink-0"
              />
              <div className="flex flex-wrap items-center gap-2">
                <label className="relative min-h-[44px] px-4 py-2 rounded-xl bg-[#F4F4F2] hover:bg-[#E9E9E5] focus-within:ring-2 focus-within:ring-[#0F4C45] text-xs font-medium text-[#141619] flex items-center gap-2 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    aria-label={copy.uploadPhoto}
                    className="sr-only"
                  />
                  <Upload className="h-3.5 w-3.5" />
                  <span>{copy.uploadPhoto}</span>
                </label>
                {card.avatarUrl !== DEFAULT_AVATAR_URL && (
                  <button
                    type="button"
                    onClick={() => updateField('avatarUrl', DEFAULT_AVATAR_URL)}
                    className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-medium text-[#68707D] hover:text-[#141619] hover:bg-[#F4F4F2] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>{copy.resetPhoto}</span>
                  </button>
                )}
              </div>
            </div>
            {uploadError && <p className="mt-1.5 text-xs text-red-600">{uploadError}</p>}
          </div>

          {/* Core Identity Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block sm:col-span-2">
              <span className="block text-xs font-medium text-[#3F4550] mb-1.5">
                {copy.fullNameLabel}
              </span>
              <input
                type="text"
                value={card.fullName}
                onChange={(e) => updateField('fullName', e.target.value)}
                placeholder="e.g. Rachel Lin 林思敏"
                className="w-full min-h-[44px] rounded-xl border border-black/[0.12] bg-[#FAF9F7] px-3.5 py-2 text-sm text-[#141619] focus:bg-white focus:border-[#0F4C45] focus:outline-none transition-colors"
              />
            </label>

            <label className="block">
              <span className="block text-xs font-medium text-[#3F4550] mb-1.5">
                {copy.companyNameLabel}
              </span>
              <input
                type="text"
                value={card.company}
                onChange={(e) => updateField('company', e.target.value)}
                placeholder="e.g. Vanguard Advisory"
                className="w-full min-h-[44px] rounded-xl border border-black/[0.12] bg-[#FAF9F7] px-3.5 py-2 text-sm text-[#141619] focus:bg-white focus:border-[#0F4C45] focus:outline-none transition-colors"
              />
            </label>

            <label className="block">
              <span className="block text-xs font-medium text-[#3F4550] mb-1.5">
                {copy.titleLabel}
              </span>
              <input
                type="text"
                value={card.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="e.g. Senior Brand Consultant"
                className="w-full min-h-[44px] rounded-xl border border-black/[0.12] bg-[#FAF9F7] px-3.5 py-2 text-sm text-[#141619] focus:bg-white focus:border-[#0F4C45] focus:outline-none transition-colors"
              />
            </label>

            <label className="block">
              <span className="block text-xs font-medium text-[#3F4550] mb-1.5">
                {copy.phoneLabel}
              </span>
              <input
                type="tel"
                value={card.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="+60 12-345 6789"
                className="w-full min-h-[44px] rounded-xl border border-black/[0.12] bg-[#FAF9F7] px-3.5 py-2 text-sm tabular-nums text-[#141619] focus:bg-white focus:border-[#0F4C45] focus:outline-none transition-colors"
              />
            </label>

            <label className="block">
              <span className="block text-xs font-medium text-[#3F4550] mb-1.5">
                {copy.emailLabel}
              </span>
              <input
                type="email"
                value={card.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="name@company.com"
                className="w-full min-h-[44px] rounded-xl border border-black/[0.12] bg-[#FAF9F7] px-3.5 py-2 text-sm text-[#141619] focus:bg-white focus:border-[#0F4C45] focus:outline-none transition-colors"
              />
            </label>
          </div>

          {/* Optional Fields */}
          <div className="pt-4 border-t border-black/[0.06] space-y-4">
            <div className="text-xs font-medium text-[#68707D]">{copy.optionalSection}</div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-xs font-medium text-[#3F4550] mb-1.5">
                  {copy.websiteLabel}
                </span>
                <input
                  type="url"
                  value={card.website}
                  onChange={(e) => updateField('website', e.target.value)}
                  placeholder="https://company.com"
                  className="w-full min-h-[44px] rounded-xl border border-black/[0.12] bg-[#FAF9F7] px-3.5 py-2 text-sm text-[#141619] focus:bg-white focus:border-[#0F4C45] focus:outline-none transition-colors"
                />
              </label>

              <label className="block">
                <span className="block text-xs font-medium text-[#3F4550] mb-1.5">
                  {copy.locationLabel}
                </span>
                <input
                  type="text"
                  value={card.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  placeholder="Kuala Lumpur"
                  className="w-full min-h-[44px] rounded-xl border border-black/[0.12] bg-[#FAF9F7] px-3.5 py-2 text-sm text-[#141619] focus:bg-white focus:border-[#0F4C45] focus:outline-none transition-colors"
                />
              </label>
            </div>

            <label className="block">
              <span className="block text-xs font-medium text-[#3F4550] mb-1.5">
                {copy.bioLabel}
              </span>
              <textarea
                rows={2}
                value={card.bio}
                onChange={(e) => updateField('bio', e.target.value)}
                className="w-full rounded-xl border border-black/[0.12] bg-[#FAF9F7] px-3.5 py-2.5 text-sm text-[#141619] focus:bg-white focus:border-[#0F4C45] focus:outline-none transition-colors resize-none"
              />
            </label>
          </div>

          {/* Theme Finish Selector */}
          <div className="pt-4 border-t border-black/[0.06]">
            <span className="block text-xs font-medium text-[#3F4550] mb-2">
              {copy.themeLabel}
            </span>
            <div className="grid grid-cols-3 gap-2">
              {themes.map((t) => {
                const active = card.theme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => updateField('theme', t.id)}
                    className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      active
                        ? 'border-[#0F4C45] bg-[#0F4C45]/[0.06] text-[#0F4C45]'
                        : 'border-black/[0.10] bg-white text-[#3F4550] hover:bg-[#F7F7F5]'
                    }`}
                  >
                    <span className={`h-3.5 w-3.5 rounded-full border ${t.swatch}`} />
                    <span className="whitespace-nowrap truncate">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Generate Brand-New Link Primary CTA */}
          <div className="pt-4 border-t border-black/[0.06]">
            <button
              type="button"
              onClick={onGenerateNewCard}
              disabled={generating}
              className="w-full min-h-[48px] px-5 py-3 rounded-2xl bg-[#0F4C45] hover:bg-[#0B3B35] text-white text-sm font-semibold flex items-center justify-center gap-2 whitespace-nowrap transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span>{generating ? copy.generatingCard : copy.generateNewCard}</span>
            </button>

            {generateError && (
              <p className="mt-2.5 text-xs text-red-600 text-center">{generateError}</p>
            )}

            {lastGeneratedCard && (
              <div className="mt-4 rounded-2xl bg-[#0F4C45]/[0.06] border border-[#0F4C45]/15 p-3.5">
                <div className="text-xs font-medium text-[#0F4C45]">
                  {copy.generatedSuccess}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={latestUrl}
                    onFocus={(e) => e.target.select()}
                    className="flex-1 min-w-0 min-h-[40px] rounded-xl bg-white border border-black/[0.08] px-3 text-xs font-mono text-[#141619]"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(lastGeneratedCard.id)}
                    className="min-h-[40px] px-3.5 rounded-xl bg-[#141619] hover:bg-[#272B30] text-white text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {copiedId === lastGeneratedCard.id ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span>
                      {copiedId === lastGeneratedCard.id ? copy.linkCopied : copy.copyLink}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Generated Cards Directory */}
      <section
        className="bg-white rounded-3xl border border-black/[0.08] p-6 sm:p-7"
        aria-label={copy.generatedListTitle}
      >
        <div className="flex items-center justify-between pb-4 border-b border-black/[0.06]">
          <h3 className="font-display text-base font-semibold text-[#141619]">
            {copy.generatedListTitle}
          </h3>
          <span className="text-xs font-mono tabular-nums text-[#68707D]">
            {generatedCards.length}
          </span>
        </div>

        {generatedCards.length === 0 ? (
          <p className="mt-4 text-sm text-[#68707D] leading-relaxed">
            {copy.generatedListEmpty}
          </p>
        ) : (
          <div className="divide-y divide-black/[0.06]">
            {generatedCards.map((item) => {
              const itemUrl = buildCardUrl(item.id);
              const isCopied = copiedId === item.id;
              return (
                <div
                  key={item.id}
                  className="py-4 first:pt-4 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.avatarUrl || DEFAULT_AVATAR_URL}
                      alt={item.fullName || 'Avatar'}
                      referrerPolicy="no-referrer"
                      className="h-11 w-11 rounded-xl object-cover ring-1 ring-black/[0.08] shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-[#141619] truncate">
                        {item.fullName || 'Unnamed Card'}
                      </div>
                      <div className="text-xs text-[#68707D] truncate mt-0.5">
                        {[item.title, item.company].filter(Boolean).join(' · ') || item.phone || item.email}
                      </div>
                      <div className="text-[11px] font-mono text-[#68707D] truncate mt-0.5">
                        {itemUrl}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(item.id)}
                      className="min-h-[40px] px-3 rounded-xl bg-[#141619] hover:bg-[#272B30] text-white text-xs font-medium flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                    >
                      {isCopied ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span>{isCopied ? copy.linkCopied : copy.copyLink}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenCustomerCard(item)}
                      title={copy.openCustomerLink}
                      aria-label={copy.openCustomerLink}
                      className="min-h-[40px] min-w-[40px] px-2.5 rounded-xl bg-[#F4F4F2] hover:bg-[#E8E8E4] text-[#141619] flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onLoadIntoEditor(item)}
                      title={copy.loadIntoEditor}
                      aria-label={copy.loadIntoEditor}
                      className="min-h-[40px] min-w-[40px] px-2.5 rounded-xl bg-[#F4F4F2] hover:bg-[#E8E8E4] text-[#141619] flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <FileEdit className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteCard(item.id)}
                      title={copy.deleteCard}
                      aria-label={copy.deleteCard}
                      className="min-h-[40px] min-w-[40px] px-2.5 rounded-xl bg-[#F4F4F2] hover:bg-red-50 text-[#68707D] hover:text-red-600 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
