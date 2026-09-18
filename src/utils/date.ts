const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

const BENGALI_MONTHS = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

export function toBengaliNumeral(num: number | string): string {
  return String(num).replace(/\d/g, (d) => BENGALI_DIGITS[parseInt(d, 10)]);
}

/**
 * Formats YYYY-MM-DD into Bengali date string e.g. "১৮ সেপ্টেম্বর, ২০২৬"
 */
export function formatBengaliDate(isoDateString: string): string {
  if (!isoDateString) return '';
  const parts = isoDateString.split('-');
  if (parts.length !== 3) return isoDateString;

  const year = parseInt(parts[0], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(monthIdx) || isNaN(day) || monthIdx < 0 || monthIdx > 11) {
    return isoDateString;
  }

  const bnDay = toBengaliNumeral(day);
  const bnMonth = BENGALI_MONTHS[monthIdx];
  const bnYear = toBengaliNumeral(year);

  return `${bnDay} ${bnMonth}, ${bnYear}`;
}
