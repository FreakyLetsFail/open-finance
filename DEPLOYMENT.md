# Deployment Anleitung - Open Finance Vereinsfinanzverwaltung

## ✅ GitHub Deployment - ABGESCHLOSSEN

Code wurde erfolgreich gepusht zu: https://github.com/FreakyLetsFail/open-finance.git

## 🚀 Supabase Deployment

### Schritt 1: Supabase Projekt erstellen

1. Gehen Sie zu https://supabase.com/dashboard
2. Erstellen Sie ein neues Projekt
3. Notieren Sie sich:
   - Project URL: `https://[your-project-ref].supabase.co`
   - Anon/Public Key
   - Service Role Key (für Admin-Operationen)

### Schritt 2: Environment Variables einrichten

Erstellen Sie eine `.env.local` Datei im Projektverzeichnis:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Schritt 3: Datenbank-Migration durchführen

**Option A: Supabase CLI (empfohlen)**

```bash
# Login
supabase login

# Projekt verlinken
supabase link --project-ref [your-project-ref]

# Migration anwenden
supabase db push

# Alternativ: SQL direkt ausführen
supabase db execute < database/migrations/001_initial_setup.sql
```

**Option B: Supabase Dashboard**

1. Gehen Sie zum SQL Editor in Ihrem Supabase Dashboard
2. Kopieren Sie den Inhalt von `database/migrations/001_initial_setup.sql`
3. Führen Sie das SQL-Skript aus

### Schritt 4: Row Level Security (RLS) Policies einrichten

```bash
# Via CLI
supabase db execute < database/policies/rls-policies.sql

# Oder via Dashboard SQL Editor
```

### Schritt 5: Seed-Daten einfügen (Optional)

Fügen Sie Standard-Rollen und Kategorien ein:

```sql
-- Rollen
INSERT INTO roles (name, role_type, description) VALUES
  ('Administrator', 'admin', 'Volle Systemrechte'),
  ('Kassenwart', 'treasurer', 'Finanzielle Verwaltung'),
  ('Vorstand', 'board_member', 'Lesezugriff auf alle Daten'),
  ('Kassenprüfer', 'auditor', 'Prüfrechte und Audit-Logs'),
  ('Mitglied', 'member', 'Eingeschränkter Zugriff'),
  ('Gast', 'guest', 'Minimaler Zugriff');

-- Kategorien
INSERT INTO categories (name, code, category_type) VALUES
  -- Einnahmen
  ('Mitgliedsbeiträge', 'INC-001', 'income'),
  ('Spenden', 'INC-002', 'income'),
  ('Veranstaltungseinnahmen', 'INC-003', 'income'),

  -- Ausgaben
  ('Raummiete', 'EXP-001', 'expense'),
  ('Versicherungen', 'EXP-002', 'expense'),
  ('Material', 'EXP-003', 'expense'),
  ('Veranstaltungskosten', 'EXP-004', 'expense');

-- Geschäftsjahre
INSERT INTO fiscal_years (year, start_date, end_date) VALUES
  (2024, '2024-01-01', '2024-12-31'),
  (2025, '2025-01-01', '2025-12-31');
```

### Schritt 6: TypeScript Types generieren

```bash
# Generiere Typen aus der Datenbank
npx supabase gen types typescript --local > types/supabase.ts

# Oder mit verlinktem Projekt
npx supabase gen types typescript --linked > types/supabase.ts
```

### Schritt 7: Anwendung testen

```bash
# Dependencies installieren
npm install

# Development Server starten
npm run dev

# Öffnen Sie http://localhost:3000
```

### Schritt 8: Production Build

```bash
# Build erstellen
npm run build

# Production Server testen
npm run start
```

## 📋 Deployment Checklist

- [x] GitHub Repository erstellt und Code gepusht
- [ ] Supabase Projekt erstellt
- [ ] Environment Variables konfiguriert
- [ ] Datenbank-Migration durchgeführt
- [ ] RLS Policies aktiviert
- [ ] Seed-Daten eingefügt
- [ ] TypeScript Types generiert
- [ ] Anwendung lokal getestet
- [ ] Production Build erfolgreich

## 🔐 Sicherheits-Hinweise

1. **Niemals** die Service Role Keys im Client-Code verwenden
2. **Immer** RLS Policies für alle Tabellen aktivieren
3. **Niemals** `.env.local` ins Git Repository committen
4. **Regelmäßig** Backups der Datenbank erstellen

## 🐛 Troubleshooting

### Fehler: "relation does not exist"
- Prüfen Sie, ob alle Migrationen erfolgreich durchgeführt wurden
- Führen Sie `supabase db reset` aus (Achtung: löscht alle Daten!)

### Fehler: "Unauthorized"
- Prüfen Sie die Environment Variables
- Stellen Sie sicher, dass die Keys korrekt kopiert wurden
- Überprüfen Sie RLS Policies

### Fehler: Build-Fehler
- Löschen Sie `node_modules` und `package-lock.json`
- Führen Sie `npm install` erneut aus
- Prüfen Sie die TypeScript-Konfiguration

## 📞 Support

Bei Fragen oder Problemen:
- GitHub Issues: https://github.com/FreakyLetsFail/open-finance/issues
- Supabase Discord: https://discord.supabase.com
