// Cryptographic helpers for client-side credential hashing and identifier normalization

const FALLBACK_K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function pureJsSha256Hex(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const bitLen = bytes.length * 8;
  const paddedLen = Math.ceil((bytes.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLen);
  padded.set(bytes);
  padded[bytes.length] = 0x80;

  const view = new DataView(padded.buffer);
  view.setUint32(paddedLen - 8, Math.floor(bitLen / 0x100000000), false);
  view.setUint32(paddedLen - 4, bitLen >>> 0, false);

  const H = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);
  const W = new Uint32Array(64);

  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));

  for (let offset = 0; offset < paddedLen; offset += 64) {
    for (let i = 0; i < 16; i++) {
      W[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(W[i - 15], 7) ^ rotr(W[i - 15], 18) ^ (W[i - 15] >>> 3);
      const s1 = rotr(W[i - 2], 17) ^ rotr(W[i - 2], 19) ^ (W[i - 2] >>> 10);
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0;
    }

    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + FALLBACK_K[i] + W[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    H[0] = (H[0] + a) >>> 0;
    H[1] = (H[1] + b) >>> 0;
    H[2] = (H[2] + c) >>> 0;
    H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0;
    H[5] = (H[5] + f) >>> 0;
    H[6] = (H[6] + g) >>> 0;
    H[7] = (H[7] + h) >>> 0;
  }

  return Array.from(H)
    .map((word) => word.toString(16).padStart(8, '0'))
    .join('');
}

export function generateSalt(byteLength = 16): string {
  const bytes = new Uint8Array(byteLength);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const payload = `${salt}:${password}`;
  if (
    typeof crypto !== 'undefined' &&
    crypto.subtle &&
    typeof crypto.subtle.digest === 'function'
  ) {
    try {
      const encoded = new TextEncoder().encode(payload);
      const digest = await crypto.subtle.digest('SHA-256', encoded);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    } catch {
      return pureJsSha256Hex(payload);
    }
  }
  return pureJsSha256Hex(payload);
}

export async function verifyPasswordHash(
  password: string,
  salt: string,
  expectedHash: string
): Promise<boolean> {
  const candidate = await hashPassword(password, salt);
  if (candidate.length !== expectedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < candidate.length; i++) {
    diff |= candidate.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  }
  return diff === 0;
}

export function normalizePhoneKey(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 9) {
    return `998${digits}`;
  }
  if (digits.length === 14 && digits.startsWith('00998')) {
    return digits.slice(2);
  }
  return digits;
}

export function normalizeResidentPhoneLocal9(input?: string | null): string {
  let digits = String(input || '').replace(/\D/g, '');
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }
  if (digits.startsWith('998') && digits.length >= 12) {
    digits = digits.slice(3);
  }
  if (digits.length >= 9) {
    return digits.slice(-9);
  }
  return digits;
}

export function phonesMatch(a?: string | null, b?: string | null): boolean {
  const trimA = String(a || '').trim();
  const trimB = String(b || '').trim();
  if (!trimA || !trimB) return false;
  if (trimA === trimB) return true;

  const digitsA = trimA.replace(/\D/g, '');
  const digitsB = trimB.replace(/\D/g, '');
  if (!digitsA || !digitsB) return false;

  const localA = normalizeResidentPhoneLocal9(digitsA);
  const localB = normalizeResidentPhoneLocal9(digitsB);
  if (localA.length === 9 && localB.length === 9 && localA === localB) {
    return true;
  }

  return digitsA.length >= 7 && digitsA === digitsB;
}

export function formatUzPhoneDisplay(input: string): string {
  const key = normalizePhoneKey(input);
  if (key.length === 12 && key.startsWith('998')) {
    return `+998 ${key.slice(3, 5)} ${key.slice(5, 8)} ${key.slice(8, 10)} ${key.slice(10, 12)}`;
  }
  return input.trim();
}

export function isValidUzPhone(input: string): boolean {
  const digits = input.replace(/\D/g, '');
  return (digits.length === 12 && digits.startsWith('998')) || digits.length === 9;
}

export function isValidAnyPhone(input: string): boolean {
  const digits = input.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

export function generateVerificationCode(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return String(1000 + (arr[0] % 9000));
  }
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function generateTempPassword(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return `RC${1000 + (arr[0] % 9000)}`;
  }
  return `RC${Math.floor(1000 + Math.random() * 9000)}`;
}

export interface PasswordStrengthResult {
  isValid: boolean;
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
  score: number;
}

export function validateStrongPassword(password: string): PasswordStrengthResult {
  const val = password || '';
  const minLength = val.length >= 8;
  const hasUppercase = /[A-Z]/.test(val);
  const hasLowercase = /[a-z]/.test(val);
  const hasNumber = /[0-9]/.test(val);
  const hasSymbol = /[^A-Za-z0-9\s]/.test(val);

  const checks = [minLength, hasUppercase, hasLowercase, hasNumber, hasSymbol];
  const score = checks.filter(Boolean).length;

  return {
    isValid: minLength && hasUppercase && hasLowercase && hasNumber && hasSymbol,
    minLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSymbol,
    score,
  };
}

function secureRandomIndex(max: number): number {
  if (max <= 1) return 0;
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const arr = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / max) * max;
    let rand = 0;
    do {
      crypto.getRandomValues(arr);
      rand = arr[0];
    } while (rand >= limit);
    return rand % max;
  }
  return Math.floor(Math.random() * max);
}

export function generateStrongStaffPassword(length = 12): string {
  const targetLen = Math.max(8, length);
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%^&*-_+?';
  const all = upper + lower + digits + symbols;

  const chars: string[] = [
    upper[secureRandomIndex(upper.length)],
    lower[secureRandomIndex(lower.length)],
    digits[secureRandomIndex(digits.length)],
    symbols[secureRandomIndex(symbols.length)],
  ];

  while (chars.length < targetLen) {
    chars.push(all[secureRandomIndex(all.length)]);
  }

  // Fisher-Yates shuffle with secure random indices
  for (let i = chars.length - 1; i > 0; i--) {
    const j = secureRandomIndex(i + 1);
    const tmp = chars[i];
    chars[i] = chars[j];
    chars[j] = tmp;
  }

  return chars.join('');
}

export function resolveStaffRoleFromTitle(
  roleTitle?: string | null
): 'manager' | 'receptionist' | 'security' | 'cleaner' {
  const norm = String(roleTitle || '')
    .trim()
    .toLowerCase();

  if (
    norm.includes('security') ||
    norm.includes('qorovul') ||
    norm.includes('qo‘riq') ||
    norm.includes("qo'riq") ||
    norm.includes('xavfsiz') ||
    norm.includes('охран') ||
    norm.includes('безопас')
  ) {
    return 'security';
  }

  if (
    norm.includes('clean') ||
    norm.includes('housekeep') ||
    norm.includes('tozalik') ||
    norm.includes('farrosh') ||
    norm.includes('убор') ||
    norm.includes('чистот')
  ) {
    return 'cleaner';
  }

  if (
    norm.includes('reception') ||
    norm.includes('qabul') ||
    norm.includes('ресепш') ||
    norm.includes('рецепц') ||
    norm.includes('прием') ||
    norm.includes('приём')
  ) {
    return 'receptionist';
  }

  // Administrator, Manager, Accountant, Director, or custom operational staff -> Staff dashboard ('manager')
  return 'manager';
}
