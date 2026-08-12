/**
 * Utility functions for Category & Subcategory Slug Generation & Validation
 */

const BANGLA_WORD_MAP: Record<string, string> = {
  'চাল': 'cal',
  'ডাল': 'dal',
  'ময়দা': 'moyda',
  'ময়দা': 'moyda',
  'আটা': 'ata',
  'মাছ': 'mach',
  'মাংস': 'mangso',
  'গোশত': 'goshto',
  'ডিম': 'dim',
  'দুধ': 'dudh',
  'তেল': 'tel',
  'সবজি': 'sobji',
  'ফল': 'fol',
  'মসলা': 'mosla',
  'মশলা': 'mosla',
  'রান্না': 'ranna',
  'পাক': 'pak',
  'পানি': 'pani',
  'চা': 'cha',
  'কফি': 'kofi',
  'নাশতা': 'nashta',
  'মিষ্টি': 'mishti',
  'বিস্কুট': 'biscuits',
  'স্ন্যাক্স': 'snacks',
  'হাউসহোল্ড': 'household',
  'পরিষ্কার': 'porishkar',
  'পেশাদার': 'peshadar',
  'চিকেন': 'chicken',
  'গরুর': 'beef',
  'খাসির': 'mutton',
  'মুরগি': 'murgi',
  'সরিষা': 'shorisha',
  'সয়াবিন': 'soyabean',
  'পনির': 'paneer',
  'মাখন': 'makhon',
  'ঘি': 'ghee',
  'সুজি': 'suji',
};

const BANGLA_CHAR_MAP: Record<string, string> = {
  'অ': 'o', 'আ': 'a', 'ই': 'i', 'ঈ': 'i', 'উ': 'u', 'ঊ': 'u', 'ঋ': 'ri', 'এ': 'e', 'ঐ': 'oi', 'ও': 'o', 'ঔ': 'ou',
  'া': 'a', 'ি': 'i', 'ী': 'i', 'ু': 'u', 'ূ': 'u', 'ৃ': 'ri', 'ে': 'e', 'ৈ': 'oi', 'ো': 'o', 'ৌ': 'ou',
  'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng',
  'চ': 'c', 'ছ': 'ch', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'n',
  'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
  'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
  'প': 'p', 'ফ': 'f', 'ব': 'b', 'ভ': 'v', 'ম': 'm',
  'য': 'j', 'র': 'r', 'ল': 'l', 'শ': 's', 'ষ': 's', 'স': 's', 'হ': 'h',
  'ড়': 'r', 'ঢ়': 'rh', 'য়': 'y', 'ৎ': 't', 'ং': 'ng', 'ঃ': 'h', 'ঁ': 'n'
};

/**
 * Transliterate Bangla text to English latin characters
 */
function transliterateBangla(text: string): string {
  let result = text;
  // Replace standalone conjunctions (" ও ", " এবং ", " & ", " and ") with space
  result = result.replace(/(\s+|^)(ও|এবং|and|&)(\s+|$)/gi, ' ');

  // Word-level replacement
  for (const [word, replacement] of Object.entries(BANGLA_WORD_MAP)) {
    result = result.split(word).join(replacement);
  }

  // Character-level replacement for any remaining Bangla characters
  let charResult = '';
  for (let i = 0; i < result.length; i++) {
    const ch = result[i];
    if (BANGLA_CHAR_MAP[ch]) {
      charResult += BANGLA_CHAR_MAP[ch];
    } else {
      charResult += ch;
    }
  }

  return charResult;
}

/**
 * Auto-generate a clean URL slug from title string (English or Bangla).
 * Example: "চাল, ডাল ও ময়দা" => "cal-dal-moyda"
 * Example: "Cooking & Essentials" => "cooking-essentials"
 */
export function generateCategorySlug(title: string): string {
  if (!title || !title.trim()) return '';

  let str = title.trim();

  // If title contains Bengali script, transliterate it first
  if (/[\u0980-\u09FF]/.test(str)) {
    str = transliterateBangla(str);
  }

  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')   // Remove all non-word chars except space and hyphen
    .replace(/[\s_-]+/g, '-')    // Replace spaces and underscores with single hyphen
    .replace(/^-+|-+$/g, '');   // Trim leading and trailing hyphens
}

/**
 * Clean user-entered slug input (strips leading/trailing slashes, normalizes spaces/special characters)
 */
export function cleanSlugInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/^\/+/, '')        // Strip leading slashes
    .replace(/\/+$/, '')        // Strip trailing slashes
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Validate slug format (lowercase alphanumeric and hyphens)
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || !slug.trim()) return false;
  const clean = slug.trim();
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(clean);
}
