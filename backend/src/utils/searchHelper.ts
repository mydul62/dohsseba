/**
 * Multilingual & Banglish Search Expansion Utility for DOHS Sheba
 * Translates and expands search queries seamlessly across English, Bangla, and Banglish.
 */

// Dictionary mapping common Banglish, Bangla, and English terms to synonymous search keywords
const TRANSLATION_MAP: Record<string, string[]> = {
  // Eggs & Dairy
  'dim': ['dim', 'ডিম', 'egg', 'eggs', 'dairy'],
  'ডিম': ['dim', 'ডিম', 'egg', 'eggs', 'dairy'],
  'egg': ['dim', 'ডিম', 'egg', 'eggs', 'dairy'],
  'eggs': ['dim', 'ডিম', 'egg', 'eggs', 'dairy'],
  'doodh': ['doodh', 'dudh', 'দুধ', 'milk', 'dairy'],
  'dudh': ['doodh', 'dudh', 'দুধ', 'milk', 'dairy'],
  'দুধ': ['doodh', 'dudh', 'দুধ', 'milk', 'dairy'],
  'milk': ['doodh', 'dudh', 'দুধ', 'milk', 'dairy'],
  'makhon': ['butter', 'মাখন', 'makhon'],
  'butter': ['butter', 'মাখন', 'makhon'],
  'chana': ['paneer', 'ছানা', 'cheese', 'chana'],

  // Fish & Seafood
  'mach': ['mach', 'mache', 'maach', 'মাছ', 'fish', 'seafood', 'hilsha', 'ruhi', 'katla', 'chingri', 'prawn'],
  'mache': ['mach', 'mache', 'maach', 'মাছ', 'fish', 'seafood', 'hilsha', 'ruhi', 'katla', 'chingri', 'prawn'],
  'maach': ['mach', 'mache', 'maach', 'মাছ', 'fish', 'seafood', 'hilsha', 'ruhi', 'katla', 'chingri', 'prawn'],
  'মাছ': ['mach', 'mache', 'maach', 'মাছ', 'fish', 'seafood', 'hilsha', 'ruhi', 'katla', 'chingri', 'prawn'],
  'fish': ['mach', 'mache', 'maach', 'মাছ', 'fish', 'seafood', 'hilsha', 'ruhi', 'katla', 'chingri', 'prawn'],
  'chingri': ['chingri', 'prawn', 'shrimp', 'চিংড়ি'],

  // Meat & Poultry
  'murgi': ['murgi', 'morgi', 'chicken', 'মুরগি', 'broiler', 'sonali', 'deshi'],
  'morgi': ['murgi', 'morgi', 'chicken', 'মুরগি', 'broiler', 'sonali', 'deshi'],
  'মুরগি': ['murgi', 'morgi', 'chicken', 'মুরগি', 'broiler', 'sonali', 'deshi'],
  'chicken': ['murgi', 'morgi', 'chicken', 'মুরগি', 'broiler', 'sonali', 'deshi'],
  'mangso': ['mangso', 'mangsho', 'goshto', 'gosto', 'meat', 'beef', 'mutton', 'khasir', 'gorur', 'মাংস', 'গোশত'],
  'mangsho': ['mangso', 'mangsho', 'goshto', 'gosto', 'meat', 'beef', 'mutton', 'khasir', 'gorur', 'মাংস', 'গোশত'],
  'goshto': ['mangso', 'mangsho', 'goshto', 'gosto', 'meat', 'beef', 'mutton', 'khasir', 'gorur', 'মাংস', 'গোশত'],
  'meat': ['mangso', 'mangsho', 'goshto', 'gosto', 'meat', 'beef', 'mutton', 'khasir', 'gorur', 'মাংস', 'গোশত'],
  'beef': ['beef', 'gorur', 'গরুর', 'গোশত', 'মাংস'],
  'gorur': ['beef', 'gorur', 'গরুর', 'গোশত', 'মাংস'],
  'mutton': ['mutton', 'khasir', 'খাসির', 'মাংস'],
  'khasir': ['mutton', 'khasir', 'খাসির', 'মাংস'],

  // Grains, Rice & Cooking
  'chal': ['chal', 'chaal', 'rice', 'চাল', 'miniket', 'nazirshail', 'chinigura', 'basmati'],
  'chaal': ['chal', 'chaal', 'rice', 'চাল', 'miniket', 'nazirshail', 'chinigura', 'basmati'],
  'চাল': ['chal', 'chaal', 'rice', 'চাল', 'miniket', 'nazirshail', 'chinigura', 'basmati'],
  'rice': ['chal', 'chaal', 'rice', 'চাল', 'miniket', 'nazirshail', 'chinigura', 'basmati'],
  'ata': ['ata', 'atta', 'flour', 'আটা', 'ময়দা'],
  'atta': ['ata', 'atta', 'flour', 'আটা', 'ময়দা'],
  'ময়দা': ['moyda', 'flour', 'ময়দা'],
  'moyda': ['moyda', 'flour', 'ময়দা'],
  'dal': ['dal', 'daal', 'lentil', 'ডাল', 'মসুর', 'মুগ'],
  'daal': ['dal', 'daal', 'lentil', 'ডাল', 'মসুর', 'মুগ'],
  'ডাল': ['dal', 'daal', 'lentil', 'ডাল', 'মসুর', 'মুগ'],
  'tel': ['tel', 'tael', 'oil', 'তেল', 'soyabean', 'mustard', 'sunflower'],
  'tael': ['tel', 'tael', 'oil', 'তেল', 'soyabean', 'mustard', 'sunflower'],
  'তেল': ['tel', 'tael', 'oil', 'তেল', 'soyabean', 'mustard', 'sunflower'],
  'oil': ['tel', 'tael', 'oil', 'তেল', 'soyabean', 'mustard', 'sunflower'],
  'shorisha': ['mustard', 'সরিষা', 'shorisha'],
  'soyabean': ['soyabean', 'সয়াবিন', 'oil'],

  // Vegetables & Spices
  'alu': ['alu', 'aloo', 'potato', 'potatoes', 'আলু'],
  'aloo': ['alu', 'aloo', 'potato', 'potatoes', 'আলু'],
  'আলু': ['alu', 'aloo', 'potato', 'potatoes', 'আলু'],
  'potato': ['alu', 'aloo', 'potato', 'potatoes', 'আলু'],
  'potatoes': ['alu', 'aloo', 'potato', 'potatoes', 'আলু'],
  'peyaj': ['peyaj', 'piaz', 'piyaj', 'onion', 'onions', 'পেঁয়াজ'],
  'piaz': ['peyaj', 'piaz', 'piyaj', 'onion', 'onions', 'পেঁয়াজ'],
  'onion': ['peyaj', 'piaz', 'piyaj', 'onion', 'onions', 'পেঁয়াজ'],
  'পেঁয়াজ': ['peyaj', 'piaz', 'piyaj', 'onion', 'onions', 'পেঁয়াজ'],
  'rosun': ['rosun', 'garlic', 'রসুন'],
  'garlic': ['rosun', 'garlic', 'রসুন'],
  'ada': ['ada', 'ginger', 'আদা'],
  'ginger': ['ada', 'ginger', 'আদা'],
  'morich': ['chili', 'chilli', 'মরিচ', 'morich'],
  'chili': ['chili', 'chilli', 'মরিচ', 'morich'],
  'chilli': ['chili', 'chilli', 'মরিচ', 'morich'],
  'holud': ['turmeric', 'হলুদ', 'holud'],
  'turmeric': ['turmeric', 'হলুদ', 'holud'],
  'moshla': ['spices', 'masala', 'মসলা', 'moshla'],
  'masala': ['spices', 'masala', 'মসলা', 'moshla'],
  'sabji': ['vegetables', 'sabji', 'shobji', 'সবজি', 'শাক-সবজি'],
  'shobji': ['vegetables', 'sabji', 'shobji', 'সবজি', 'শাক-সবজি'],
  'সবজি': ['vegetables', 'sabji', 'shobji', 'সবজি', 'শাক-সবজি'],
  'vegetables': ['vegetables', 'sabji', 'shobji', 'সবজি', 'শাক-সবজি'],

  // Essentials, Drinks & Snacks
  'lobon': ['lobon', 'salt', 'লবণ'],
  'salt': ['lobon', 'salt', 'লবণ'],
  'লবণ': ['lobon', 'salt', 'লবণ'],
  'chini': ['chini', 'sugar', 'চিনি'],
  'sugar': ['chini', 'sugar', 'চিনি'],
  'চিনি': ['chini', 'sugar', 'চিনি'],
  'cha': ['cha', 'chai', 'tea', 'চা'],
  'chai': ['cha', 'chai', 'tea', 'চা'],
  'tea': ['cha', 'chai', 'tea', 'চা'],
  'চা': ['cha', 'chai', 'tea', 'চা'],
  'kofi': ['kofi', 'coffee', 'কফি'],
  'coffee': ['kofi', 'coffee', 'কফি'],
  'কফি': ['kofi', 'coffee', 'কফি'],
  'pani': ['pani', 'jol', 'water', 'পানি'],
  'water': ['pani', 'jol', 'water', 'পানি'],
  'পানি': ['pani', 'jol', 'water', 'পানি'],
  'fol': ['fol', 'phol', 'fruit', 'fruits', 'ফল', 'ফলমূল'],
  'fruit': ['fol', 'phol', 'fruit', 'fruits', 'ফল', 'ফলমূল'],
  'fruits': ['fol', 'phol', 'fruit', 'fruits', 'ফল', 'ফলমূল'],
  'ফল': ['fol', 'phol', 'fruit', 'fruits', 'ফল', 'ফলমূল'],
  'aam': ['aam', 'am', 'mango', 'আম'],
  'mango': ['aam', 'am', 'mango', 'আম'],
  'আম': ['aam', 'am', 'mango', 'আম'],
  'apel': ['apple', 'আপেল', 'apel'],
  'apple': ['apple', 'আপেল', 'apel'],
  'biskut': ['biscuit', 'biscuits', 'biskut', 'বিস্কুট'],
  'biscuit': ['biscuit', 'biscuits', 'biskut', 'বিস্কুট'],
  'biscuits': ['biscuit', 'biscuits', 'biskut', 'বিস্কুট'],
  'saban': ['soap', 'saban', 'shaban', 'সাবান'],
  'soap': ['soap', 'saban', 'shaban', 'সাবান'],
  'shampoo': ['shampoo', 'shampu', 'শ্যাম্পু'],
  'shampu': ['shampoo', 'shampu', 'শ্যাম্পু'],

  // Home Services Keywords
  'electrician': ['electrician', 'ilektrisian', 'current', 'electrical', 'ইলেকট্রিশিয়ান', 'ইলেকট্রিক'],
  'ilektrisian': ['electrician', 'ilektrisian', 'current', 'electrical', 'ইলেকট্রিশিয়ান', 'ইলেকট্রিক'],
  'ইলেকট্রিশিয়ান': ['electrician', 'ilektrisian', 'current', 'electrical', 'ইলেকট্রিশিয়ান', 'ইলেকট্রিক'],
  'ac': ['ac', 'air conditioner', 'esi', 'ac repair', 'jet wash', 'এসি', 'এসি রিপেয়ার'],
  'esi': ['ac', 'air conditioner', 'esi', 'ac repair', 'jet wash', 'এসি', 'এসি রিপেয়ার'],
  'এসি': ['ac', 'air conditioner', 'esi', 'ac repair', 'jet wash', 'এসি', 'এসি রিপেয়ার'],
  'plumber': ['plumber', 'plambar', 'প্লাম্বার', 'pipe', 'tap', 'leak'],
  'plambar': ['plumber', 'plambar', 'প্লাম্বার', 'pipe', 'tap', 'leak'],
  'প্লাম্বার': ['plumber', 'plambar', 'প্লাম্বার', 'pipe', 'tap', 'leak'],
  'cleaner': ['cleaner', 'cleaning', 'ক্লিনার', 'clean', 'wash'],
  'cleaning': ['cleaner', 'cleaning', 'ক্লিনার', 'clean', 'wash'],
  'ক্লিনার': ['cleaner', 'cleaning', 'ক্লিনার', 'clean', 'wash'],
  'car wash': ['car wash', 'car', 'gaari', 'gari', 'কার ওয়াশ', 'গাড়ি ওয়াশ'],
  'gari': ['car wash', 'car', 'gaari', 'gari', 'কার ওয়াশ', 'গাড়ি ওয়াশ'],
  'gaari': ['car wash', 'car', 'gaari', 'gari', 'কার ওয়াশ', 'গাড়ি ওয়াশ'],
  'laundry': ['laundry', 'iron', 'dhopa', 'কাপড় ধোয়া'],
  'cctv': ['cctv', 'camera', 'security', 'ক্যামেরা'],
  'pest': ['pest', 'pest control', 'poka', 'পোকা', 'পোকামাকড়'],
};

/**
 * Expands a search query string into multiple Banglish, English, and Bangla terms.
 * Returns an array of search keywords.
 */
export function expandSearchTerms(query: string): string[] {
  if (!query || !query.trim()) return [];

  const rawLower = query.trim().toLowerCase();
  const termsSet = new Set<string>();

  // Always include the raw search term
  termsSet.add(rawLower);

  // Split query into individual words (e.g. "deshi murgi" or "nodir mach")
  const words = rawLower.split(/\s+/).filter(Boolean);

  for (const word of words) {
    termsSet.add(word);
    if (TRANSLATION_MAP[word]) {
      TRANSLATION_MAP[word].forEach((syn) => termsSet.add(syn.toLowerCase()));
    }
  }

  // Check if full raw string matches any map key
  if (TRANSLATION_MAP[rawLower]) {
    TRANSLATION_MAP[rawLower].forEach((syn) => termsSet.add(syn.toLowerCase()));
  }

  return Array.from(termsSet);
}
