import React, { useState, useEffect, useId } from 'react';
import QRCode from 'qrcode';
import { siteConfig } from '../data/siteConfig';
import { 
  validateDonationAmount, 
  generateUPIUri, 
  PRESET_AMOUNTS, 
  MIN_AMOUNT, 
  MAX_AMOUNT,
  isMobileDevice 
} from '../utils/upi';
import { Copy, Check, QrCode as QrIcon, Smartphone, AlertCircle } from 'lucide-react';

export const DonationSection: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<number | 'custom'>(100);
  const [customAmountInput, setCustomAmountInput] = useState<string>('50');
  const [activeAmount, setActiveAmount] = useState<number>(100);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrError, setQrError] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  
  const customInputId = useId();
  const isMobile = isMobileDevice();

  // Recompute active amount and validation whenever selection changes
  useEffect(() => {
    if (selectedPreset === 'custom') {
      const res = validateDonationAmount(customAmountInput);
      if (res.isValid && res.amount !== null) {
        setActiveAmount(res.amount);
        setValidationError(null);
      } else {
        setValidationError(res.error || 'সঠিক পরিমাণ লিখুন');
      }
    } else {
      setActiveAmount(selectedPreset);
      setValidationError(null);
    }
  }, [selectedPreset, customAmountInput]);

  // Generate QR Code dynamically when activeAmount changes and valid
  useEffect(() => {
    if (validationError || !activeAmount || activeAmount <= 0) {
      setQrDataUrl('');
      return;
    }

    const upiUri = generateUPIUri(activeAmount);
    QRCode.toDataURL(upiUri, {
      width: 220,
      margin: 2,
      color: {
        dark: '#211F1C',
        light: '#F8F5EF',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        setQrDataUrl(url);
        setQrError(false);
      })
      .catch((err) => {
        console.error('QR code generation error:', err);
        setQrError(true);
      });
  }, [activeAmount, validationError]);

  const handleCopyUpiId = async () => {
    try {
      await navigator.clipboard.writeText(siteConfig.upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Could not copy UPI ID:', err);
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = siteConfig.upiId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const upiIntentUri = !validationError && activeAmount > 0 ? generateUPIUri(activeAmount) : '';

  return (
    <section 
      id="writing-donation-section" 
      aria-label="লেখককে ঐচ্ছিক অনুদান"
      className="my-16 pt-12 border-t border-[#DDD6CC]/80 bg-[#F1ECE4]/40 rounded-lg p-6 sm:p-8"
    >
      <div className="max-w-md mx-auto text-center">
        {/* Exact required sentence */}
        <h4 className="text-lg sm:text-xl font-serif font-medium text-[#211F1C] mb-6">
          লেখাটি ভালো লাগলে অনুদান দিয়ে পাশে থাকবেন
        </h4>

        {/* Amount Selector */}
        <div className="flex flex-wrap justify-center gap-2 mb-4" role="radiogroup" aria-label="অনুদানের পরিমাণ নির্বাচন করুন">
          {PRESET_AMOUNTS.map((amt) => {
            const isSelected = selectedPreset === amt;
            return (
              <button
                key={amt}
                id={`preset-amount-${amt}`}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelectedPreset(amt)}
                className={`px-4 py-2 text-sm sm:text-base font-medium rounded transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#7A3E2B] text-[#F8F5EF] shadow-xs'
                    : 'bg-[#F8F5EF] text-[#211F1C] border border-[#DDD6CC] hover:bg-[#DDD6CC]/40'
                }`}
              >
                ₹{amt}
              </button>
            );
          })}

          <button
            id="preset-amount-custom"
            type="button"
            role="radio"
            aria-checked={selectedPreset === 'custom'}
            onClick={() => setSelectedPreset('custom')}
            className={`px-4 py-2 text-sm sm:text-base font-medium rounded transition-all cursor-pointer ${
              selectedPreset === 'custom'
                ? 'bg-[#7A3E2B] text-[#F8F5EF] shadow-xs'
                : 'bg-[#F8F5EF] text-[#211F1C] border border-[#DDD6CC] hover:bg-[#DDD6CC]/40'
            }`}
          >
            অন্যান্য পরিমাণ
          </button>
        </div>

        {/* Custom Amount Input */}
        {selectedPreset === 'custom' && (
          <div className="mb-6 max-w-xs mx-auto text-left">
            <label htmlFor={customInputId} className="block text-xs text-[#6F6961] mb-1 font-medium">
              টাকার পরিমাণ লিখুন (ন্যূনতম ₹{MIN_AMOUNT}, সর্বোচ্চ ₹{MAX_AMOUNT}):
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6F6961] font-medium">₹</span>
              <input
                id={customInputId}
                type="number"
                min={MIN_AMOUNT}
                max={MAX_AMOUNT}
                step="1"
                value={customAmountInput}
                onChange={(e) => setCustomAmountInput(e.target.value)}
                placeholder="যেমন: 75"
                className="w-full pl-7 pr-3 py-2 bg-[#F8F5EF] border border-[#DDD6CC] rounded text-[#211F1C] text-sm focus:outline-hidden focus:border-[#7A3E2B]"
              />
            </div>
          </div>
        )}

        {/* Validation Error Message */}
        {validationError && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-[#7A3E2B] mb-4" role="alert">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* QR Code Presentation */}
        {!validationError && activeAmount > 0 && (
          <div className="mt-6 flex flex-col items-center">
            <div className="p-3 bg-[#F8F5EF] border border-[#DDD6CC] rounded shadow-2xs inline-block">
              {qrDataUrl && !qrError ? (
                <img
                  src={qrDataUrl}
                  alt={`UPI QR code for ₹${activeAmount}`}
                  className="w-44 h-44 sm:w-48 sm:h-48 object-contain"
                  width="192"
                  height="192"
                />
              ) : qrError ? (
                <div className="w-48 h-48 flex flex-col items-center justify-center text-xs text-[#6F6961] p-4 text-center">
                  <QrIcon className="w-8 h-8 opacity-40 mb-2" />
                  <span>QR কোড প্রদর্শনে সমস্যা হয়েছে। নিচে উল্লেখিত UPI আইডি ব্যবহার করুন।</span>
                </div>
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-xs text-[#6F6961]">
                  QR কোড তৈরি হচ্ছে...
                </div>
              )}
            </div>

            <div className="mt-3 text-xs text-[#6F6961]">
              নির্বাচিত অনুদান: <span className="font-semibold text-[#211F1C]">₹{activeAmount}</span>
            </div>

            {/* UPI Intent Button (Mobile & Desktop) */}
            <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-xs">
              <a
                id="pay-with-upi-btn"
                href={upiIntentUri}
                className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#211F1C] text-[#F8F5EF] hover:bg-[#7A3E2B] text-sm font-medium rounded transition-colors"
                title="UPI অ্যাপের মাধ্যমে সরাসরি প্রদান করুন"
              >
                <Smartphone className="w-4 h-4" />
                <span>Pay with UPI</span>
              </a>

              <button
                id="copy-upi-id-btn"
                type="button"
                onClick={handleCopyUpiId}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#F8F5EF] border border-[#DDD6CC] hover:bg-[#DDD6CC]/40 text-[#211F1C] text-sm rounded transition-colors cursor-pointer"
                title="UPI আইডি কপি করুন"
              >
                {copied ? <Check className="w-4 h-4 text-green-700" /> : <Copy className="w-4 h-4 text-[#6F6961]" />}
                <span>{copied ? 'কপি হয়েছে' : 'Copy UPI ID'}</span>
              </button>
            </div>

            {/* Quiet Fallback and Details */}
            <div className="mt-4 pt-3 border-t border-[#DDD6CC]/40 text-[11px] text-[#6F6961] space-y-1">
              <p>
                UPI ID: <span className="font-mono text-[#211F1C] selection:bg-[#DDD6CC] select-all">{siteConfig.upiId}</span>
              </p>
              <p className="text-[10px] text-[#6F6961]/80">
                {isMobile 
                  ? 'আপনার ফোনের Google Pay, PhonePe, Paytm বা যেকোনো UPI অ্যাপের মাধ্যমে স্ক্যান অথবা পে করুন।'
                  : 'কম্পিউটার বা ল্যাপটপ থেকে পড়তে থাকলে আপনার ফোনের যেকোনো UPI অ্যাপ দিয়ে এই QR কোডটি স্ক্যান করুন।'}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
