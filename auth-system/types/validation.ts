/**
 * Zod Validation Schemas
 * Type-safe validation for authentication forms and API requests
 */

import { z } from 'zod';

// =====================================================
// COMMON VALIDATORS
// =====================================================

// Email validation with German email providers
export const emailSchema = z
  .string()
  .min(1, 'E-Mail-Adresse ist erforderlich')
  .email('Ungültige E-Mail-Adresse')
  .toLowerCase()
  .refine(
    (email) => {
      // Additional validation for common typos
      const domain = email.split('@')[1];
      const commonTypos = ['gmial.com', 'gmai.com', 'gmil.com', 'yahooo.com'];
      return !commonTypos.includes(domain);
    },
    { message: 'Bitte überprüfen Sie die E-Mail-Adresse auf Tippfehler' }
  );

// Password validation (OWASP compliant)
export const passwordSchema = z
  .string()
  .min(12, 'Passwort muss mindestens 12 Zeichen lang sein')
  .max(128, 'Passwort darf maximal 128 Zeichen lang sein')
  .refine(
    (password) => /[a-z]/.test(password),
    'Passwort muss mindestens einen Kleinbuchstaben enthalten'
  )
  .refine(
    (password) => /[A-Z]/.test(password),
    'Passwort muss mindestens einen Großbuchstaben enthalten'
  )
  .refine(
    (password) => /[0-9]/.test(password),
    'Passwort muss mindestens eine Ziffer enthalten'
  )
  .refine(
    (password) => /[^a-zA-Z0-9]/.test(password),
    'Passwort muss mindestens ein Sonderzeichen enthalten'
  )
  .refine(
    (password) => {
      // Check for common weak passwords
      const weakPasswords = [
        'password123!',
        'Password123!',
        'Qwerty123!',
        'Admin123!',
      ];
      return !weakPasswords.includes(password);
    },
    'Dieses Passwort ist zu häufig verwendet. Bitte wählen Sie ein sichereres Passwort.'
  );

// Phone validation (German format)
export const phoneSchema = z
  .string()
  .regex(
    /^(\+49|0)[1-9][0-9]{1,14}$/,
    'Ungültige Telefonnummer. Format: +49... oder 0...'
  )
  .optional();

// =====================================================
// AUTHENTICATION SCHEMAS
// =====================================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Passwort ist erforderlich'),
  remember_me: z.boolean().optional().default(false),
});

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    password_confirm: z.string(),
    full_name: z
      .string()
      .min(2, 'Name muss mindestens 2 Zeichen lang sein')
      .max(100, 'Name darf maximal 100 Zeichen lang sein')
      .regex(
        /^[a-zA-ZäöüÄÖÜß\s-]+$/,
        'Name darf nur Buchstaben, Leerzeichen und Bindestriche enthalten'
      ),
    phone: phoneSchema,
    terms_accepted: z.literal(true, {
      errorMap: () => ({
        message: 'Sie müssen die Nutzungsbedingungen akzeptieren',
      }),
    }),
    privacy_accepted: z.literal(true, {
      errorMap: () => ({
        message: 'Sie müssen die Datenschutzerklärung akzeptieren',
      }),
    }),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: 'Passwörter stimmen nicht überein',
    path: ['password_confirm'],
  });

export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

export const passwordResetConfirmSchema = z
  .object({
    token: z.string().min(1, 'Token ist erforderlich'),
    new_password: passwordSchema,
    password_confirm: z.string(),
  })
  .refine((data) => data.new_password === data.password_confirm, {
    message: 'Passwörter stimmen nicht überein',
    path: ['password_confirm'],
  });

export const passwordChangeSchema = z
  .object({
    current_password: z.string().min(1, 'Aktuelles Passwort ist erforderlich'),
    new_password: passwordSchema,
    password_confirm: z.string(),
  })
  .refine((data) => data.new_password === data.password_confirm, {
    message: 'Passwörter stimmen nicht überein',
    path: ['password_confirm'],
  })
  .refine((data) => data.current_password !== data.new_password, {
    message: 'Neues Passwort muss sich vom aktuellen unterscheiden',
    path: ['new_password'],
  });

// =====================================================
// PROFILE SCHEMAS
// =====================================================

export const profileUpdateSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Name muss mindestens 2 Zeichen lang sein')
    .max(100, 'Name darf maximal 100 Zeichen lang sein')
    .regex(
      /^[a-zA-ZäöüÄÖÜß\s-]+$/,
      'Name darf nur Buchstaben, Leerzeichen und Bindestriche enthalten'
    )
    .optional(),
  phone: phoneSchema,
  avatar_url: z.string().url('Ungültige URL').optional(),
});

// =====================================================
// TWO-FACTOR AUTHENTICATION SCHEMAS
// =====================================================

export const twoFactorVerifySchema = z.object({
  code: z
    .string()
    .length(6, 'Code muss genau 6 Ziffern lang sein')
    .regex(/^[0-9]+$/, 'Code darf nur Ziffern enthalten'),
});

export const twoFactorBackupCodeSchema = z.object({
  code: z
    .string()
    .length(10, 'Backup-Code muss genau 10 Zeichen lang sein')
    .regex(/^[A-Z0-9]+$/, 'Ungültiger Backup-Code'),
});

// =====================================================
// TYPE EXPORTS
// =====================================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type TwoFactorVerifyInput = z.infer<typeof twoFactorVerifySchema>;
export type TwoFactorBackupCodeInput = z.infer<typeof twoFactorBackupCodeSchema>;
