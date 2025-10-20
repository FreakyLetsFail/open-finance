# 🚀 Quick Start - Open Finance

## Schnellstart in 5 Minuten

### 1. Repository klonen (bereits erledigt ✓)

```bash
git clone https://github.com/FreakyLetsFail/open-finance.git
cd open-finance
```

### 2. Dependencies installieren

```bash
npm install
```

### 3. Supabase Setup

**Option A: Automatisches Setup (empfohlen)**

```bash
./scripts/setup-supabase.sh
```

Das Skript führt Sie durch:
- Projekt-Auswahl/Erstellung
- Datenbank-Migration
- RLS Policies
- TypeScript Types Generierung

**Option B: Manuelles Setup**

```bash
# 1. Projekt verlinken
supabase link --project-ref YOUR_PROJECT_REF

# 2. Migration anwenden
supabase db push

# 3. RLS Policies
supabase db execute < database/policies/rls-policies.sql

# 4. Types generieren
supabase gen types typescript --linked > types/supabase.ts
```

### 4. Environment Variables

Erstellen Sie `.env.local`:

```bash
cp .env.example .env.local
```

Füllen Sie die Werte aus:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Wo finde ich die Keys?**
- Gehen Sie zu https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
- Kopieren Sie URL, anon key und service_role key

### 5. Seed-Daten (Optional)

```sql
-- Via Supabase Dashboard SQL Editor oder:
supabase db execute <<SQL
-- Standard-Rollen
INSERT INTO roles (name, role_type, description) VALUES
  ('Administrator', 'admin', 'Volle Systemrechte'),
  ('Kassenwart', 'treasurer', 'Finanzielle Verwaltung'),
  ('Vorstand', 'board_member', 'Lesezugriff auf alle Daten'),
  ('Kassenprüfer', 'auditor', 'Prüfrechte und Audit-Logs'),
  ('Mitglied', 'member', 'Eingeschränkter Zugriff'),
  ('Gast', 'guest', 'Minimaler Zugriff');

-- Kategorien
INSERT INTO categories (name, code, category_type) VALUES
  ('Mitgliedsbeiträge', 'INC-001', 'income'),
  ('Spenden', 'INC-002', 'income'),
  ('Veranstaltungseinnahmen', 'INC-003', 'income'),
  ('Raummiete', 'EXP-001', 'expense'),
  ('Versicherungen', 'EXP-002', 'expense'),
  ('Material', 'EXP-003', 'expense');

-- Geschäftsjahr
INSERT INTO fiscal_years (year, start_date, end_date) VALUES
  (2025, '2025-01-01', '2025-12-31');
SQL
```

### 6. Anwendung starten

```bash
npm run dev
```

Öffnen Sie http://localhost:3000

### 7. Ersten Benutzer erstellen

1. Gehen Sie zu `/auth/register`
2. Registrieren Sie sich
3. In Supabase Dashboard → Authentication → Users
4. Bestätigen Sie die E-Mail (oder deaktivieren Sie Email Confirmation)
5. Weisen Sie eine Rolle zu (fügen Sie Eintrag in `user_roles` Tabelle ein)

## 📚 Verfügbare Seiten

- `/` - Dashboard
- `/members` - Mitgliederverwaltung
- `/transactions` - Buchungen
- `/contributions` - Beiträge
- `/auth/login` - Anmeldung
- `/auth/register` - Registrierung

## 🔧 Nützliche Befehle

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run start            # Production server

# Database
supabase db push         # Push migrations
supabase db pull         # Pull remote schema
supabase db reset        # Reset local database
supabase gen types       # Generate TypeScript types

# Git
git pull                 # Pull latest changes
git push                 # Push changes
```

## 🆘 Troubleshooting

**Problem: "relation does not exist"**
```bash
supabase db reset
supabase db push
```

**Problem: "Unauthorized"**
- Prüfen Sie `.env.local`
- Verifizieren Sie die Keys im Supabase Dashboard

**Problem: RLS Policy Fehler**
```bash
supabase db execute < database/policies/rls-policies.sql
```

**Problem: TypeScript Errors**
```bash
rm -rf node_modules package-lock.json
npm install
supabase gen types typescript --linked > types/supabase.ts
```

## 📖 Weitere Dokumentation

- [DEPLOYMENT.md](DEPLOYMENT.md) - Ausführliche Deployment-Anleitung
- [Database Schema](database/README.md) - Datenbank-Dokumentation
- [API Docs](docs/api/) - API-Dokumentation

## 🎯 Nächste Schritte

1. Passen Sie die Kategorien an Ihren Verein an
2. Fügen Sie Mitglieder hinzu
3. Erstellen Sie erste Buchungen
4. Konfigurieren Sie Beiträge

Viel Erfolg! 🎉
