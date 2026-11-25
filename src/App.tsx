import React, { useEffect, useState } from 'react';
import { Pencil, Check, UserPlus, MessageCircle, Eye } from 'lucide-react';
import {
  BusinessCardData,
  DEFAULT_AVATAR_URL,
  DEFAULT_CARD_DATA,
  Language,
  StoredBusinessCard,
} from './types/card';
import { COPY } from './utils/i18n';
import {
  buildWhatsAppUrl,
  createNewCard,
  decodeCardFromHash,
  deleteCardById,
  downloadVCard,
  fetchAllCards,
  fetchCardById,
} from './utils/vcard';
import { BusinessCardView } from './components/BusinessCardView';
import { CardEditorPanel } from './components/CardEditorPanel';
import { QrCodeModal } from './components/QrCodeModal';

const DRAFT_STORAGE_KEY = 'cardfolio_card_v1';
const GENERATED_CACHE_KEY = 'cardfolio_generated_cards_v1';
const LANG_STORAGE_KEY = 'cardfolio_lang_v1';

function getUrlCardId(): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    return id && id.trim() ? id.trim() : null;
  } catch {
    return null;
  }
}

function loadDraftCard(): BusinessCardData {
  const fromHash = decodeCardFromHash();
  if (fromHash) {
    return { ...DEFAULT_CARD_DATA, ...fromHash };
  }
  try {
    const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<BusinessCardData>;
      return { ...DEFAULT_CARD_DATA, ...parsed };
    }
  } catch {
    // Ignore storage read errors
  }
  return DEFAULT_CARD_DATA;
}

function loadCachedGeneratedCards(): StoredBusinessCard[] {
  try {
    const raw = localStorage.getItem(GENERATED_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as StoredBusinessCard[];
    }
  } catch {
    // Ignore
  }
  return [];
}

export default function App() {
  const [urlCardId, setUrlCardId] = useState<string | null>(() => getUrlCardId());
  const [card, setCard] = useState<BusinessCardData>(() => loadDraftCard());
  const [activeCardId, setActiveCardId] = useState<string | null>(() => getUrlCardId());
  const [generatedCards, setGeneratedCards] = useState<StoredBusinessCard[]>(() =>
    loadCachedGeneratedCards()
  );
  const [customerMode, setCustomerMode] = useState<boolean>(
    () => Boolean(getUrlCardId()) || Boolean(decodeCardFromHash())
  );
  const [loadingRemoteCard, setLoadingRemoteCard] = useState<boolean>(() =>
    Boolean(getUrlCardId())
  );
  const [cardNotFound, setCardNotFound] = useState<boolean>(false);

  const [mobileEditorOpen, setMobileEditorOpen] = useState<boolean>(false);
  const [qrOpen, setQrOpen] = useState<boolean>(false);
  const [stickySaving, setStickySaving] = useState<boolean>(false);
  const [stickySavedNotice, setStickySavedNotice] = useState<boolean>(false);

  const [generating, setGenerating] = useState<boolean>(false);
  const [lastGeneratedCard, setLastGeneratedCard] = useState<StoredBusinessCard | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const [lang, setLang] = useState<Language>(() => {
    try {
      const savedLang = localStorage.getItem(LANG_STORAGE_KEY);
      if (savedLang === 'en' || savedLang === 'zh') return savedLang;
    } catch {
      // Ignore
    }
    return 'zh';
  });

  const copy = COPY[lang];

  // Fetch card by ?id=... when opening a generated customer link
  useEffect(() => {
    if (!urlCardId) {
      setLoadingRemoteCard(false);
      setCardNotFound(false);
      return;
    }

    let cancelled = false;
    setLoadingRemoteCard(true);
    setCardNotFound(false);

    fetchCardById(urlCardId)
      .then((remote) => {
        if (cancelled) return;
        if (remote) {
          setCard({
            avatarUrl: remote.avatarUrl || DEFAULT_AVATAR_URL,
            fullName: remote.fullName,
            title: remote.title,
            company: remote.company,
            phone: remote.phone,
            email: remote.email,
            website: remote.website,
            location: remote.location,
            bio: remote.bio,
            theme: remote.theme,
          });
          setActiveCardId(remote.id);
          setCustomerMode(true);
        } else {
          const cached = loadCachedGeneratedCards().find((c) => c.id === urlCardId);
          if (cached) {
            setCard(cached);
            setActiveCardId(cached.id);
            setCustomerMode(true);
          } else {
            setCardNotFound(true);
          }
        }
      })
      .catch(() => {
        if (cancelled) return;
        const cached = loadCachedGeneratedCards().find((c) => c.id === urlCardId);
        if (cached) {
          setCard(cached);
          setActiveCardId(cached.id);
          setCustomerMode(true);
        } else {
          setCardNotFound(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingRemoteCard(false);
      });

    return () => {
      cancelled = true;
    };
  }, [urlCardId]);

  // Load directory of generated cards from backend
  useEffect(() => {
    let cancelled = false;
    fetchAllCards()
      .then((cards) => {
        if (cancelled) return;
        setGeneratedCards(cards);
        try {
          localStorage.setItem(GENERATED_CACHE_KEY, JSON.stringify(cards));
        } catch {
          // Ignore quota errors
        }
      })
      .catch(() => {
        // Keep cached cards if offline
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist draft in localStorage only when editing locally (not on a specific ?id= customer view)
  useEffect(() => {
    if (urlCardId) return;
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(card));
    } catch {
      // Ignore quota errors
    }
  }, [card, urlCardId]);

  useEffect(() => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // Ignore
    }
  }, [lang]);

  useEffect(() => {
    const onPopState = () => {
      const nextId = getUrlCardId();
      setUrlCardId(nextId);
      setActiveCardId(nextId);
      if (nextId) {
        setCustomerMode(true);
      } else {
        setCustomerMode(Boolean(decodeCardFromHash()));
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const enterStudioMode = () => {
    setCustomerMode(false);
    setCardNotFound(false);
    if (urlCardId) {
      setUrlCardId(null);
      window.history.pushState(null, '', window.location.pathname);
    }
  };

  const handleGenerateNewCard = async () => {
    if (generating) return;
    setGenerating(true);
    setGenerateError(null);
    try {
      const created = await createNewCard(card);
      const nextList = [created, ...generatedCards];
      setGeneratedCards(nextList);
      setLastGeneratedCard(created);
      setActiveCardId(created.id);
      try {
        localStorage.setItem(GENERATED_CACHE_KEY, JSON.stringify(nextList));
      } catch {
        // Ignore quota errors
      }
    } catch (err) {
      setGenerateError(
        err instanceof Error ? err.message : 'Unable to generate card link.'
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteCard = async (id: string) => {
    try {
      await deleteCardById(id);
    } catch {
      // Proceed updating UI list cleanly
    }
    const nextList = generatedCards.filter((item) => item.id !== id);
    setGeneratedCards(nextList);
    if (lastGeneratedCard?.id === id) setLastGeneratedCard(null);
    if (activeCardId === id) setActiveCardId(null);
    try {
      localStorage.setItem(GENERATED_CACHE_KEY, JSON.stringify(nextList));
    } catch {
      // Ignore
    }
  };

  const handleOpenCustomerCard = (item: StoredBusinessCard) => {
    const nextUrl = new URL(window.location.href);
    nextUrl.hash = '';
    nextUrl.searchParams.set('id', item.id);
    window.history.pushState(null, '', nextUrl.toString());
    setUrlCardId(item.id);
    setActiveCardId(item.id);
    setCard({
      avatarUrl: item.avatarUrl || DEFAULT_AVATAR_URL,
      fullName: item.fullName,
      title: item.title,
      company: item.company,
      phone: item.phone,
      email: item.email,
      website: item.website,
      location: item.location,
      bio: item.bio,
      theme: item.theme,
    });
    setCustomerMode(true);
    setMobileEditorOpen(false);
  };

  const handleLoadIntoEditor = (item: StoredBusinessCard) => {
    enterStudioMode();
    setCard({
      avatarUrl: item.avatarUrl || DEFAULT_AVATAR_URL,
      fullName: item.fullName,
      title: item.title,
      company: item.company,
      phone: item.phone,
      email: item.email,
      website: item.website,
      location: item.location,
      bio: item.bio,
      theme: item.theme,
    });
    setActiveCardId(null);
    setLastGeneratedCard(null);
  };

  const handleClearDraft = () => {
    setCard({
      avatarUrl: DEFAULT_AVATAR_URL,
      fullName: '',
      title: '',
      company: '',
      phone: '',
      email: '',
      website: '',
      location: '',
      bio: '',
      theme: card.theme,
    });
    setActiveCardId(null);
    setLastGeneratedCard(null);
  };

  const handleResetSample = () => {
    setCard(DEFAULT_CARD_DATA);
    setActiveCardId(null);
    setLastGeneratedCard(null);
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  const handleStickySaveContact = async () => {
    if (stickySaving) return;
    setStickySaving(true);
    try {
      await downloadVCard(card);
      setStickySavedNotice(true);
      setTimeout(() => setStickySavedNotice(false), 3800);
    } finally {
      setStickySaving(false);
    }
  };

  const whatsappHref = buildWhatsAppUrl(card.phone);

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F4F2] text-[#141619]">
      {/* Compact Top Bar */}
      <header className="w-full border-b border-black/[0.06] bg-[#F4F4F2]/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto h-14 px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Zone 1: Brand Wordmark */}
          <span className="font-display text-base sm:text-lg font-bold tracking-tight text-[#141619] whitespace-nowrap shrink-0">
            {copy.brand}
          </span>

          {/* Zone 2: Desktop View Mode Toggle */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#68707D]">
            <button
              type="button"
              onClick={enterStudioMode}
              className={`py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                !customerMode
                  ? 'text-[#141619] underline underline-offset-8 decoration-2 decoration-[#0F4C45]'
                  : 'hover:text-[#141619]'
              }`}
            >
              {copy.studioView}
            </button>
            <button
              type="button"
              onClick={() => setCustomerMode(true)}
              className={`py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                customerMode
                  ? 'text-[#141619] underline underline-offset-8 decoration-2 decoration-[#0F4C45]'
                  : 'hover:text-[#141619]'
              }`}
            >
              {copy.customerView}
            </button>
          </nav>

          {/* Zone 3: Language + Mobile Builder Trigger */}
          <div className="flex items-center gap-2 shrink-0">
            <div
              className="flex items-center p-0.5 bg-black/[0.05] rounded-lg"
              role="group"
              aria-label="Language"
            >
              <button
                type="button"
                onClick={() => setLang('zh')}
                className={`min-h-[34px] px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                  lang === 'zh'
                    ? 'bg-white text-[#141619] shadow-xs'
                    : 'text-[#68707D] hover:text-[#141619]'
                }`}
              >
                中文
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`min-h-[34px] px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                  lang === 'en'
                    ? 'bg-white text-[#141619] shadow-xs'
                    : 'text-[#68707D] hover:text-[#141619]'
                }`}
              >
                EN
              </button>
            </div>

            {/* Mobile Builder Drawer Button */}
            <button
              type="button"
              onClick={() => setMobileEditorOpen(true)}
              className="lg:hidden min-h-[40px] px-3 py-1.5 rounded-xl bg-white border border-black/[0.09] text-xs font-medium text-[#141619] flex items-center gap-1.5 whitespace-nowrap shrink-0 active:scale-[0.98] transition-transform cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>{copy.editCard}</span>
            </button>

            {/* Desktop Quick Mode Action */}
            <button
              type="button"
              onClick={() => {
                if (customerMode) {
                  enterStudioMode();
                } else {
                  setCustomerMode(true);
                }
              }}
              className="hidden lg:inline-flex min-h-[38px] px-3.5 py-1.5 rounded-xl bg-white border border-black/[0.09] hover:bg-[#FAF9F7] text-xs font-medium text-[#141619] items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              {customerMode ? (
                <>
                  <Pencil className="h-3.5 w-3.5" />
                  <span>{copy.editCard}</span>
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  <span>{copy.customerView}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 pt-5 pb-28 sm:px-6 sm:pt-8 lg:pb-12">
        {loadingRemoteCard ? (
          <div className="max-w-[430px] mx-auto bg-white rounded-3xl border border-black/[0.08] p-8 text-center text-sm text-[#68707D]">
            Loading card...
          </div>
        ) : cardNotFound ? (
          <div className="max-w-[430px] mx-auto bg-white rounded-3xl border border-black/[0.08] p-8 text-center">
            <h1 className="font-display text-lg font-semibold text-[#141619]">
              {copy.cardNotFoundTitle}
            </h1>
            <p className="mt-2 text-sm text-[#68707D]">{copy.cardNotFoundDesc}</p>
            <button
              type="button"
              onClick={enterStudioMode}
              className="mt-5 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#0F4C45] text-white text-sm font-medium cursor-pointer"
            >
              {copy.backToStudio}
            </button>
          </div>
        ) : customerMode ? (
          <div className="max-w-[430px] mx-auto">
            <div className="hidden lg:block">
              <BusinessCardView
                card={card}
                cardId={activeCardId}
                copy={copy}
                onOpenQr={() => setQrOpen(true)}
                showInlineSaveButton={true}
              />
            </div>
            <div className="lg:hidden">
              <BusinessCardView
                card={card}
                cardId={activeCardId}
                copy={copy}
                onOpenQr={() => setQrOpen(true)}
                showInlineSaveButton={false}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Card Preview Column */}
            <div className="lg:col-span-5 lg:sticky lg:top-8 max-w-[430px] w-full mx-auto lg:max-w-none">
              <div className="hidden lg:block">
                <BusinessCardView
                  card={card}
                  cardId={activeCardId}
                  copy={copy}
                  onOpenQr={() => setQrOpen(true)}
                  showInlineSaveButton={true}
                />
              </div>
              <div className="lg:hidden">
                <BusinessCardView
                  card={card}
                  cardId={activeCardId}
                  copy={copy}
                  onOpenQr={() => setQrOpen(true)}
                  showInlineSaveButton={false}
                />
              </div>
            </div>

            {/* Desktop Backend Builder Studio Column */}
            <div className="hidden lg:block lg:col-span-7">
              <CardEditorPanel
                card={card}
                generatedCards={generatedCards}
                copy={copy}
                generating={generating}
                lastGeneratedCard={lastGeneratedCard}
                generateError={generateError}
                onChange={(updated) => {
                  setCard(updated);
                  setActiveCardId(null);
                }}
                onGenerateNewCard={handleGenerateNewCard}
                onDeleteCard={handleDeleteCard}
                onOpenCustomerCard={handleOpenCustomerCard}
                onLoadIntoEditor={handleLoadIntoEditor}
                onClearDraft={handleClearDraft}
                onResetSample={handleResetSample}
              />
            </div>
          </div>
        )}
      </main>

      {/* Mobile Thumb-Zone Sticky Save Contact + WhatsApp Now Bar */}
      {!mobileEditorOpen && !loadingRemoteCard && !cardNotFound && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 px-4 pt-3 pb-safe bg-gradient-to-t from-[#F4F4F2] via-[#F4F4F2]/95 to-transparent pointer-events-none">
          <div className="max-w-[430px] mx-auto pointer-events-auto">
            {stickySavedNotice && (
              <div
                role="status"
                className="mb-2 rounded-xl bg-[#141619] text-white px-3.5 py-2 text-xs text-center shadow-md"
              >
                {copy.contactSavedHint}
              </div>
            )}
            <div className={whatsappHref ? 'grid grid-cols-2 gap-2.5' : 'grid grid-cols-1'}>
              <button
                type="button"
                onClick={handleStickySaveContact}
                disabled={stickySaving}
                className="w-full min-h-[50px] px-3.5 rounded-2xl bg-[#0F4C45] hover:bg-[#0B3B35] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_10px_24px_-6px_rgba(15,76,69,0.4)] active:scale-[0.98] transition-transform cursor-pointer whitespace-nowrap"
              >
                <UserPlus className="h-4 w-4 shrink-0" strokeWidth={2} />
                <span className="truncate">
                  {stickySaving ? copy.savingContact : copy.saveContact}
                </span>
              </button>

              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[50px] px-3.5 rounded-2xl bg-[#128C7E] hover:bg-[#0E7468] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_10px_24px_-6px_rgba(18,140,126,0.4)] active:scale-[0.98] transition-transform whitespace-nowrap"
                >
                  <MessageCircle className="h-4 w-4 shrink-0" strokeWidth={2} />
                  <span className="truncate">{copy.whatsappNow}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Slide-Up Backend Studio Sheet */}
      {mobileEditorOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/45 backdrop-blur-xs"
          onClick={() => setMobileEditorOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={copy.editorTitle}
        >
          <div
            className="w-full max-h-[90dvh] bg-[#F4F4F2] rounded-t-3xl flex flex-col overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Drag Handle + Header */}
            <div className="bg-white border-b border-black/[0.07] px-5 pt-3 pb-3 shrink-0">
              <div className="w-10 h-1 rounded-full bg-black/15 mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <span className="font-display text-base font-semibold text-[#141619]">
                  {copy.editorTitle}
                </span>
                <button
                  type="button"
                  onClick={() => setMobileEditorOpen(false)}
                  className="min-h-[40px] px-4 py-1.5 rounded-xl bg-[#0F4C45] text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>{copy.doneEditing}</span>
                </button>
              </div>
            </div>

            {/* Scrollable Builder Form + Generated Directory */}
            <div className="flex-1 overflow-y-auto p-4 pb-safe">
              <CardEditorPanel
                card={card}
                generatedCards={generatedCards}
                copy={copy}
                generating={generating}
                lastGeneratedCard={lastGeneratedCard}
                generateError={generateError}
                onChange={(updated) => {
                  setCard(updated);
                  setActiveCardId(null);
                }}
                onGenerateNewCard={handleGenerateNewCard}
                onDeleteCard={handleDeleteCard}
                onOpenCustomerCard={handleOpenCustomerCard}
                onLoadIntoEditor={handleLoadIntoEditor}
                onClearDraft={handleClearDraft}
                onResetSample={handleResetSample}
              />
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      <QrCodeModal
        open={qrOpen}
        card={card}
        cardId={activeCardId}
        copy={copy}
        onClose={() => setQrOpen(false)}
      />
    </div>
  );
}
