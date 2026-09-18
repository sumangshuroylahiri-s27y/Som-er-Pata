import { siteConfig } from '../data/siteConfig';

export interface UPIValidationResult {
  isValid: boolean;
  amount: number | null;
  error?: string;
}

export const PRESET_AMOUNTS = [10, 20, 100, 200] as const;
export const MIN_AMOUNT = 1;
export const MAX_AMOUNT = 100000;

/**
 * Validates a donation amount.
 */
export function validateDonationAmount(rawAmount: number | string): UPIValidationResult {
  if (typeof rawAmount === 'string') {
    const trimmed = rawAmount.trim();
    if (!trimmed) {
      return { isValid: false, amount: null, error: 'অনুগ্রহ করে একটি সঠিক টাকার পরিমাণ লিখুন।' };
    }
    // Check if contains non-digit characters
    if (!/^\d+$/.test(trimmed)) {
      return { isValid: false, amount: null, error: 'কেবলমাত্র পূর্ণসংখ্যা গ্রহণযোগ্য।' };
    }
    const num = parseInt(trimmed, 10);
    return validateNumericAmount(num);
  }

  return validateNumericAmount(rawAmount);
}

function validateNumericAmount(num: number): UPIValidationResult {
  if (isNaN(num) || !isFinite(num)) {
    return { isValid: false, amount: null, error: 'অবৈধ টাকার পরিমাণ।' };
  }
  if (num <= 0) {
    return { isValid: false, amount: null, error: 'অনুদানের পরিমাণ অবশ্যই শূন্যের বেশি হতে হবে।' };
  }
  if (num < MIN_AMOUNT) {
    return { isValid: false, amount: null, error: `সর্বনিম্ন অনুদান ₹${MIN_AMOUNT}।` };
  }
  if (num > MAX_AMOUNT) {
    return { isValid: false, amount: null, error: `সর্বোচ্চ সীমা ₹${MAX_AMOUNT}।` };
  }

  return { isValid: true, amount: Math.floor(num) };
}

/**
 * Builds the standard NPCI UPI URI with correctly encoded parameters.
 * Format: upi://pay?pa=UPI_ID&pn=PAYEE_NAME&am=AMOUNT&cu=INR
 */
export function generateUPIUri(amount: number): string {
  const params = new URLSearchParams();
  params.set('pa', siteConfig.upiId);
  params.set('pn', siteConfig.upiPayeeName);
  params.set('am', amount.toString());
  params.set('cu', 'INR');
  
  // Also provide a clean narrative note in English/ASCII as required by some banking apps
  params.set('tn', 'Literary Appreciation');

  return `upi://pay?${params.toString()}`;
}

/**
 * Helper to check if current device is mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
}
