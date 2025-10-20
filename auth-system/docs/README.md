# Authentifizierungssystem - Vereinsfinanzverwaltung

Vollständiges, produktionsreifes Authentifizierungssystem mit Supabase Auth, rollenbasierter Zugriffskontrolle und Zwei-Faktor-Authentifizierung.

## 🚀 Features

### Kernfunktionen
- ✅ **Benutzerregistrierung** mit E-Mail-Verifizierung
- ✅ **Sichere Anmeldung** mit PKCE Flow
- ✅ **Passwort-Reset** via E-Mail-Link
- ✅ **Zwei-Faktor-Authentifizierung (2FA)** mit TOTP
- ✅ **Rollenbasierte Zugriffskontrolle (RBAC)**
- ✅ **Session Management** mit Auto-Refresh
- ✅ **Audit Logging** aller Auth-Events
- ✅ **Protected Routes** mit Middleware

### Sicherheit
- 🔒 OWASP-konforme Passwortrichtlinien
- 🔒 Verschlüsselte 2FA-Secrets
- 🔒 Rate Limiting & Account Lockout
- 🔒 Row Level Security (RLS) Policies
- 🔒 Security Headers (CSP, XSS-Schutz)
- 🔒 IP-Tracking und User-Agent-Logging

### Benutzerrollen
- **Admin**: Voller Zugriff auf alle Funktionen
- **Treasurer**: Finanzverwaltung und Reports
- **Board Member**: Ansicht und Mitgliederverwaltung
- **Member**: Eigenes Profil und öffentliche Daten
- **Guest**: Nur-Lese-Zugriff auf öffentliche Daten

## 📁 Projektstruktur

```
auth-system/
├── database/
│   └── schema.sql                 # PostgreSQL Schema mit RLS
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser Client
│   │   └── server.ts             # Server-Side Clients
│   └── auth/
│       ├── two-factor.ts         # 2FA Utilities
│       └── permissions.ts        # RBAC Logic
├── hooks/
│   └── useAuth.ts                # Auth Hook
├── types/
│   ├── auth.ts                   # Type Definitions
│   └── validation.ts             # Zod Schemas
├── components/auth/
│   ├── ProtectedRoute.tsx        # Route Guards
│   └── TwoFactorSetup.tsx        # 2FA UI
├── app/
│   ├── auth/
│   │   ├── login/page.tsx        # Login Form
│   │   ├── register/page.tsx     # Registration Form
│   │   └── reset-password/page.tsx # Password Reset
│   └── api/auth/
│       ├── audit/route.ts        # Audit Logs API
│       └── 2fa/
│           ├── setup/route.ts    # 2FA Setup API
│           └── verify/route.ts   # 2FA Verify API
├── middleware.ts                  # Auth Middleware
└── tests/
    └── auth.test.ts              # Test Suite
```

## 🔧 Installation

### 1. Datenbank Setup

```bash
# Supabase lokal starten
supabase start

# Schema anwenden
supabase db push

# Oder manuell:
psql -h localhost -U postgres -d postgres -f database/schema.sql
```

### 2. Environment Variables

Erstellen Sie eine `.env.local` Datei:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 2FA Encryption (generieren Sie einen sicheren Key)
TWO_FACTOR_ENCRYPTION_KEY=your_32_byte_hex_key
```

Encryption Key generieren:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Dependencies installieren

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install zod react-hook-form @hookform/resolvers/zod
npm install otplib qrcode
npm install -D @types/qrcode
```

## 📖 Verwendung

### Authentication Hook

```typescript
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, profile, signIn, signOut, hasRole } = useAuth();

  // Anmelden
  await signIn({
    email: 'user@example.com',
    password: 'password',
  });

  // Berechtigungen prüfen
  if (hasRole(UserRole.ADMIN)) {
    // Admin-Funktionen
  }
}
```

### Protected Routes

```typescript
import { ProtectedRoute, AdminRoute } from '@/components/auth/ProtectedRoute';

// Nur für angemeldete Benutzer
<ProtectedRoute>
  <DashboardPage />
</ProtectedRoute>

// Nur für Admins
<AdminRoute>
  <AdminPanel />
</AdminRoute>

// Mehrere Rollen
<ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.TREASURER]}>
  <FinancePage />
</ProtectedRoute>
```

### Permission Checking

```typescript
import { hasPermission } from '@/lib/auth/permissions';

// Berechtigung prüfen
if (hasPermission(profile, { resource: 'finances', action: 'create' })) {
  // Erlaubt
}

// Convenience-Funktionen
import { CommonPermissions } from '@/lib/auth/permissions';

if (CommonPermissions.viewFinances(profile)) {
  // Ansehen erlaubt
}
```

### Zwei-Faktor-Authentifizierung

```typescript
import { TwoFactorSetup } from '@/components/auth/TwoFactorSetup';

<TwoFactorSetup
  onComplete={() => {
    console.log('2FA aktiviert');
  }}
  onCancel={() => {
    console.log('Abgebrochen');
  }}
/>
```

## 🧪 Testing

```bash
# Tests ausführen
npm test

# Mit Coverage
npm run test:coverage

# Watch Mode
npm run test:watch
```

## 🔐 Sicherheitsrichtlinien

### Passwortanforderungen
- Mindestens 12 Zeichen
- Groß- und Kleinbuchstaben
- Mindestens eine Ziffer
- Mindestens ein Sonderzeichen
- Keine häufig verwendeten Passwörter

### 2FA Empfehlungen
- TOTP-basiert (Google Authenticator, Authy, etc.)
- 10 Backup-Codes für Notfälle
- Codes sind verschlüsselt gespeichert

### Account Security
- Automatische Sperrung nach 5 fehlgeschlagenen Login-Versuchen
- IP-Tracking für verdächtige Aktivitäten
- Audit Logs für alle Auth-Events

## 🚀 Deployment

### Supabase Production Setup

1. **Projekt erstellen** auf [supabase.com](https://supabase.com)
2. **Schema deployen**:
   ```bash
   supabase db push --linked
   ```
3. **Environment Variables** in Vercel/Netlify setzen
4. **Email Templates** konfigurieren in Supabase Dashboard

### Email Templates

Passen Sie die Standard-Templates an unter:
`Supabase Dashboard > Authentication > Email Templates`

- **Confirm Signup**: Willkommensnachricht
- **Magic Link**: Login-Link
- **Reset Password**: Passwort-Reset-Link

## 📊 Monitoring

### Audit Logs abfragen

```typescript
// GET /api/auth/audit
const response = await fetch('/api/auth/audit?limit=50&offset=0');
const { logs, total } = await response.json();
```

### User Activity Dashboard

Nutzen Sie die Audit Logs für:
- Login-Statistiken
- Fehlgeschlagene Login-Versuche
- Passwortänderungen
- 2FA-Aktivierungen
- Rollenänderungen

## 🛠️ Troubleshooting

### Häufige Probleme

**Session wird nicht gespeichert**
- Überprüfen Sie Cookie-Einstellungen
- HTTPS erforderlich in Produktion

**2FA funktioniert nicht**
- Zeitabweichung auf Server und Client prüfen
- Encryption Key muss konsistent sein

**RLS Policies blockieren Zugriff**
- Überprüfen Sie, ob `auth.uid()` korrekt ist
- Testen Sie Policies mit `EXPLAIN ANALYZE`

## 📚 Weitere Ressourcen

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/deploying/production-checklist)

## 📄 Lizenz

MIT License - Siehe LICENSE Datei für Details
