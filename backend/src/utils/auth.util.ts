import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const comparePassword = async (
  password: string,
  hashed: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashed);
};

export const generateAccessToken = (payload: {
  id: string;
  email: string;
  role: Role;
}): string => {
  const secret = process.env.JWT_SECRET || 'dohssheba_jwt_secret_dev_key_2026';
  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
};

export const generateRefreshToken = (payload: { id: string }): string => {
  const refreshSecret = process.env.JWT_REFRESH_SECRET || 'dohssheba_jwt_refresh_dev_key_2026';
  return jwt.sign(payload, refreshSecret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  } as jwt.SignOptions);
};

const BANGLA_WORD_MAP: Record<string, string> = {
  'চাল': 'cal', 'ডাল': 'dal', 'ময়দা': 'moyda', 'ময়দা': 'moyda', 'আটা': 'ata',
  'মাছ': 'mach', 'মাংস': 'mangso', 'গোশত': 'goshto', 'ডিম': 'dim', 'দুধ': 'dudh',
  'তেল': 'tel', 'সবজি': 'sobji', 'ফল': 'fol', 'মসলা': 'mosla', 'মশলা': 'mosla',
  'রান্না': 'ranna', 'পাক': 'pak', 'পানি': 'pani', 'চা': 'cha', 'কফি': 'kofi',
  'নাশতা': 'nashta', 'মিষ্টি': 'mishti', 'বিস্কুট': 'biscuits', 'স্ন্যাক্স': 'snacks',
  'হাউসহোল্ড': 'household', 'পরিষ্কার': 'porishkar', 'পেশাদার': 'peshadar',
  'চিকেন': 'chicken', 'গরুর': 'beef', 'খাসির': 'mutton', 'মুরগি': 'murgi',
  'সরিষা': 'shorisha', 'সয়াবিন': 'soyabean', 'পনির': 'paneer', 'মাখন': 'makhon',
  'ঘি': 'ghee', 'সুজি': 'suji',
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

export const generateSlug = (text: string): string => {
  if (!text) return '';
  let str = text.trim().replace(/^\/+|\/+$/g, '');

  if (/[\u0980-\u09FF]/.test(str)) {
    str = str.replace(/(\s+|^)(ও|এবং|and|&)(\s+|$)/gi, ' ');
    for (const [word, replacement] of Object.entries(BANGLA_WORD_MAP)) {
      str = str.split(word).join(replacement);
    }
    let charResult = '';
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      charResult += BANGLA_CHAR_MAP[ch] || ch;
    }
    str = charResult;
  }

  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};


export const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

export const generateBookingNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BKG-${timestamp}-${random}`;
};
