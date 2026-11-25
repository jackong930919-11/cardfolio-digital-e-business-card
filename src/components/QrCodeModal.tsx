import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Download } from 'lucide-react';
import { BusinessCardData } from '../types/card';
import { CopyBundle } from '../utils/i18n';
import { buildCardUrl, generateVCardString } from '../utils/vcard';

interface QrCodeModalProps {
  open: boolean;
  card: BusinessCardData;
  cardId?: string | null;
  copy: CopyBundle;
  onClose: () => void;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  open,
  card,
  cardId,
  copy,
  onClose,
}) => {
  const [mode, setMode] = useState<'vcard' | 'link'>('vcard');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const payload =
      mode === 'vcard'
        ? generateVCardString(card, null)
        : buildCardUrl(cardId, card);

    QRCode.toDataURL(payload, {
      width: 560,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#141619',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl('');
      });

    return () => {
      cancelled = true;
    };
  }, [open, mode, card]);

  if (!open) return null;

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const anchor = document.createElement('a');
    anchor.href = qrDataUrl;
    const safeName =
      card.fullName.trim().replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_') || 'card';
    anchor.download = `${safeName}_${mode}_qr.png`;
    anchor.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/45 backdrop-blur-xs p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
    >
      <div
        className="w-full sm:max-w-sm bg-white text-[#141619] rounded-t-3xl sm:rounded-3xl border border-black/[0.08] shadow-2xl overflow-hidden pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile grab handle */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1 rounded-full bg-black/15" />
        </div>

        <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-black/[0.06]">
          <h2 id="qr-modal-title" className="font-display text-base font-semibold">
            {copy.qrModalTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={copy.close}
            className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center rounded-xl text-[#68707D] hover:text-[#141619] hover:bg-black/[0.04] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Segmented Mode Control */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#F4F4F2] rounded-xl">
            <button
              type="button"
              onClick={() => setMode('vcard')}
              className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                mode === 'vcard'
                  ? 'bg-white text-[#141619] shadow-xs'
                  : 'text-[#68707D] hover:text-[#141619]'
              }`}
            >
              {copy.qrTabVcard}
            </button>
            <button
              type="button"
              onClick={() => setMode('link')}
              className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                mode === 'link'
                  ? 'bg-white text-[#141619] shadow-xs'
                  : 'text-[#68707D] hover:text-[#141619]'
              }`}
            >
              {copy.qrTabLink}
            </button>
          </div>

          {/* QR Display */}
          <div className="mt-5 flex flex-col items-center">
            <div className="w-56 h-56 rounded-2xl border border-black/[0.08] bg-white p-3 flex items-center justify-center">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={mode === 'vcard' ? copy.qrTabVcard : copy.qrTabLink}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-xs text-[#68707D]">Generating...</div>
              )}
            </div>

            <p className="mt-4 text-xs text-center text-[#68707D] leading-relaxed max-w-[26ch]">
              {mode === 'vcard' ? copy.qrVcardHint : copy.qrLinkHint}
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadQr}
            disabled={!qrDataUrl}
            className="mt-5 w-full min-h-[46px] rounded-xl bg-[#141619] text-white hover:bg-[#272B30] text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            <span>{copy.downloadQr}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
