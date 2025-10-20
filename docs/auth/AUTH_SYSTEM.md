# Backend Authentication System Documentation

## Overview

Das Backend-Authentifizierungssystem für die Vereinsfinanzverwaltung basiert auf Supabase Auth mit JWT-Tokens und umfasst ein vollständiges Rollenmanagement-System (RBAC).

## Systemarchitektur

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Application                        │
└───────────────┬─────────────────────────────────────────────┘
                │
                │ HTTP Requests with JWT
                │
┌───────────────▼─────────────────────────────────────────────┐
│              API Routes (/app/api/auth/*)                    │
├──────────────────────────────────────────────────────────────┤
│  • POST /api/auth/register     - User registration           │
│  • POST /api/auth/login        - User login                  │
│  • POST /api/auth/logout       - User logout                 │
│  • GET  /api/auth/me           - Get current user            │
│  • GET  /api/auth/profile      - Get user profile            │
│  • PATCH /api/auth/profile     - Update profile              │
│  • PUT  /api/auth/profile/password - Change password         │
│  • POST /api/auth/reset-password - Request password reset    │
│  • PUT  /api/auth/reset-password - Confirm password reset    │
│  • POST /api/auth/verify-email - Verify email                │
│  • POST /api/auth/refresh      - Refresh access token        │
└───────────────┬─────────────────────────────────────────────┘
                │
                │ Validates & Authenticates
                │
┌───────────────▼─────────────────────────────────────────────┐
│           Middleware (/lib/middleware/*)                     │
├──────────────────────────────────────────────────────────────┤
│  • authenticate()          - Verify JWT token                │
│  • requirePermission()     - Check specific permission       │
│  • requireRole()           - Check user role                 │
│  • requireOwnership()      - Verify resource ownership       │
└───────────────┬─────────────────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────────────────────┐
│            Auth Utilities (/lib/auth/*)                      │
├──────────────────────────────────────────────────────────────┤
│  • session.ts  - JWT token creation & verification           │
│  • roles.ts    - RBAC permissions system                     │
│  • password.ts - Password hashing & verification             │
└───────────────┬─────────────────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────────────────────┐
│         Supabase Database (PostgreSQL)                       │
├──────────────────────────────────────────────────────────────┤
│  • users table with RLS policies                             │
│  • Secure password storage with bcrypt                       │
│  • Role and permission management                            │
└──────────────────────────────────────────────────────────────┘
```

## Benutzerrollen & Berechtigungen

### Verfügbare Rollen

1. **ADMIN** - Vollzugriff auf alle Funktionen
2. **TREASURER** (Kassenwart) - Finanzmanagement
3. **BOARD_MEMBER** (Vorstandsmitglied) - Lese- und Transaktionsrechte
4. **MEMBER** (Mitglied) - Basis-Leserechte
5. **GUEST** (Gast) - Minimale Leserechte

### Berechtigungen nach Rolle

```typescript
// Admin - Vollzugriff
user:*, account:*, transaction:*, budget:*, report:*, settings:*

// Treasurer - Finanzverwaltung
user:read, account:*, transaction:*, budget:*, report:*, settings:view

// Board Member - Basis-Management
user:read, account:read, transaction:{create,read}, budget:read, report:*

// Member - Lesen
account:read, transaction:read, budget:read, report:view

// Guest - Minimal
account:read, report:view
```

## API Endpoints

### 1. Registrierung

**POST** `/api/auth/register`

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "firstName": "Max",
  "lastName": "Mustermann",
  "phoneNumber": "+49123456789",
  "dateOfBirth": "1990-01-01"
}
```

**Response**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "Max",
    "lastName": "Mustermann",
    "role": "member"
  },
  "token": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresAt": "2025-10-27T..."
}
```

### 2. Login

**POST** `/api/auth/login`

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "Max",
    "lastName": "Mustermann",
    "role": "member",
    "emailVerified": true
  },
  "token": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresAt": "2025-10-27T..."
}
```

### 3. Aktuellen Benutzer abrufen

**GET** `/api/auth/me`

**Headers**
```
Authorization: Bearer eyJhbGc...
```

**Response**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "Max",
    "lastName": "Mustermann",
    "phoneNumber": "+49123456789",
    "dateOfBirth": "1990-01-01",
    "role": "member",
    "emailVerified": true,
    "createdAt": "2025-10-20T...",
    "updatedAt": "2025-10-20T..."
  }
}
```

### 4. Profil aktualisieren

**PATCH** `/api/auth/profile`

```json
{
  "firstName": "Maximilian",
  "phoneNumber": "+49987654321"
}
```

### 5. Passwort ändern

**PUT** `/api/auth/profile/password`

```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecurePass456!",
  "confirmPassword": "NewSecurePass456!"
}
```

### 6. Passwort zurücksetzen

**POST** `/api/auth/reset-password` (Anfrage)

```json
{
  "email": "user@example.com"
}
```

**PUT** `/api/auth/reset-password` (Bestätigung)

```json
{
  "token": "reset-token-from-email",
  "password": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

### 7. Token aktualisieren

**POST** `/api/auth/refresh`

```json
{
  "refreshToken": "eyJhbGc..."
}
```

### 8. Logout

**POST** `/api/auth/logout`

Löscht Session-Cookies.

## Middleware-Nutzung

### In API Routes

```typescript
import { authenticate, requirePermission, requireRole } from '@/lib/middleware/auth-middleware'
import { Permission, UserRole } from '@/lib/auth/roles'

// Basis-Authentifizierung
export async function GET(request: NextRequest) {
  const authResult = await authenticate(request)

  if (authResult instanceof NextResponse) {
    return authResult // Fehler-Response
  }

  const { user } = authResult
  // ... weiter mit authentifiziertem User
}

// Spezifische Berechtigung erforderlich
export async function POST(request: NextRequest) {
  const authResult = await requirePermission(request, Permission.TRANSACTION_CREATE)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  const { user } = authResult
  // ... nur Users mit TRANSACTION_CREATE Berechtigung kommen hier an
}

// Rolle erforderlich
export async function DELETE(request: NextRequest) {
  const authResult = await requireRole(request, [UserRole.ADMIN, UserRole.TREASURER])

  if (authResult instanceof NextResponse) {
    return authResult
  }

  const { user } = authResult
  // ... nur Admins und Treasurers kommen hier an
}
```

## Sicherheitsfeatures

### 1. Password Hashing
- Bcrypt mit Salting
- Minimum 10 Rounds
- Automatische Salt-Generierung

### 2. JWT Security
- HS256 Algorithmus
- 7 Tage Access Token Gültigkeit
- 30 Tage Refresh Token Gültigkeit
- Issuer & Audience Validation

### 3. Input Validation
- Zod Schema Validation
- Email Format Check
- Strong Password Requirements:
  - Minimum 8 Zeichen
  - Mindestens 1 Großbuchstabe
  - Mindestens 1 Kleinbuchstabe
  - Mindestens 1 Zahl
  - Mindestens 1 Sonderzeichen

### 4. Cookie Security
- HttpOnly Cookies
- Secure Flag (Production)
- SameSite: Lax
- Path Restrictions

### 5. Error Handling
- Generische Fehlermeldungen (keine Info-Leaks)
- Error Codes für Frontend
- Logging von kritischen Errors

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT
JWT_SECRET=your-secret-key-min-32-characters

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## Testing

Siehe `/tests/auth.test.ts` für Unit-Tests:

```bash
npm run test -- auth.test.ts
```

## Best Practices

1. **Immer Middleware verwenden** - Nie manuell Tokens validieren
2. **Refresh Tokens nutzen** - Für bessere UX bei langen Sessions
3. **Berechtigungen checken** - Nicht nur Rollen, sondern spezifische Permissions
4. **Error Codes** - Verwende standardisierte Error Codes für Frontend
5. **Logging** - Logge Auth-Events für Security Monitoring
6. **Rate Limiting** - Implementiere Rate Limits für Login/Register

## Dateien-Übersicht

```
/lib/auth/
├── roles.ts              # RBAC System
├── session.ts            # JWT Token Management
└── password.ts           # Password Hashing (existing)

/lib/middleware/
└── auth-middleware.ts    # Authentication Middleware

/lib/validation/
└── auth-schemas.ts       # Zod Validation Schemas

/app/api/auth/
├── register/route.ts     # Registration
├── login/route.ts        # Login
├── logout/route.ts       # Logout
├── me/route.ts          # Current User
├── profile/route.ts     # Profile Management
├── reset-password/route.ts  # Password Reset
├── verify-email/route.ts    # Email Verification
└── refresh/route.ts     # Token Refresh

/types/
└── auth.types.ts        # TypeScript Types
```

## Nächste Schritte

1. [ ] Email-Versand für Verifizierung einrichten
2. [ ] 2FA (Two-Factor Authentication) implementieren
3. [ ] Session Management Dashboard
4. [ ] Audit Logging für Security Events
5. [ ] Rate Limiting für Auth-Endpoints
6. [ ] OAuth Integration (Google, Microsoft)
