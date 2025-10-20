/**
 * Two-Factor Authentication (2FA) Utilities
 * TOTP-based 2FA with backup codes
 */

import { authenticator } from 'otplib';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import QRCode from 'qrcode';

// =====================================================
// CONFIGURATION
// =====================================================

const APP_NAME = 'Vereinsfinanzverwaltung';
const ENCRYPTION_KEY = process.env.TWO_FACTOR_ENCRYPTION_KEY || randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';

// Configure OTP library
authenticator.options = {
  window: 1, // Allow 1 step before/after (30 seconds tolerance)
  digits: 6,
  step: 30,
  epoch: Date.now(),
};

// =====================================================
// ENCRYPTION UTILITIES
// =====================================================

function encrypt(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');

  const decipher = createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(ivHex, 'hex')
  );

  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// =====================================================
// 2FA SETUP
// =====================================================

export interface TwoFactorSetup {
  secret: string;
  encrypted_secret: string;
  qr_code: string;
  backup_codes: string[];
  encrypted_backup_codes: string[];
}

export async function generateTwoFactorSecret(
  userEmail: string
): Promise<TwoFactorSetup> {
  // Generate secret
  const secret = authenticator.generateSecret();

  // Generate OTP auth URL
  const otpauth = authenticator.keyuri(userEmail, APP_NAME, secret);

  // Generate QR code
  const qr_code = await QRCode.toDataURL(otpauth);

  // Generate backup codes
  const backup_codes = Array.from({ length: 10 }, () =>
    randomBytes(5).toString('hex').toUpperCase()
  );

  // Encrypt sensitive data
  const encrypted_secret = encrypt(secret);
  const encrypted_backup_codes = backup_codes.map((code) => encrypt(code));

  return {
    secret,
    encrypted_secret,
    qr_code,
    backup_codes,
    encrypted_backup_codes,
  };
}

// =====================================================
// 2FA VERIFICATION
// =====================================================

export function verifyTwoFactorToken(
  encryptedSecret: string,
  token: string
): boolean {
  try {
    const secret = decrypt(encryptedSecret);
    return authenticator.verify({ token, secret });
  } catch (error) {
    console.error('2FA verification error:', error);
    return false;
  }
}

export function verifyBackupCode(
  encryptedBackupCodes: string[],
  providedCode: string
): { valid: boolean; usedIndex?: number } {
  try {
    for (let i = 0; i < encryptedBackupCodes.length; i++) {
      const code = decrypt(encryptedBackupCodes[i]);
      if (code === providedCode.toUpperCase()) {
        return { valid: true, usedIndex: i };
      }
    }
    return { valid: false };
  } catch (error) {
    console.error('Backup code verification error:', error);
    return { valid: false };
  }
}

// =====================================================
// 2FA MANAGEMENT
// =====================================================

export function regenerateBackupCodes(): {
  backup_codes: string[];
  encrypted_backup_codes: string[];
} {
  const backup_codes = Array.from({ length: 10 }, () =>
    randomBytes(5).toString('hex').toUpperCase()
  );

  const encrypted_backup_codes = backup_codes.map((code) => encrypt(code));

  return { backup_codes, encrypted_backup_codes };
}

export function getDecryptedBackupCodes(
  encryptedBackupCodes: string[]
): string[] {
  return encryptedBackupCodes.map((encrypted) => {
    try {
      return decrypt(encrypted);
    } catch {
      return '';
    }
  }).filter(Boolean);
}

// =====================================================
// TIME-BASED UTILITIES
// =====================================================

export function getTimeRemaining(): number {
  const now = Math.floor(Date.now() / 1000);
  const step = authenticator.options.step as number;
  return step - (now % step);
}

export function getCurrentToken(encryptedSecret: string): string {
  try {
    const secret = decrypt(encryptedSecret);
    return authenticator.generate(secret);
  } catch (error) {
    console.error('Token generation error:', error);
    throw new Error('Failed to generate token');
  }
}
