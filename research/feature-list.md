# Feature-Liste: Finanzverwaltungssystem für Vereine

## Feature-Übersicht nach Priorität

### Legende
- **P0**: Kritisch - MVP, essentiell für Grundfunktion
- **P1**: Hoch - Wichtig für vollständige Nutzung
- **P2**: Mittel - Komfort, Effizienzsteigerung
- **P3**: Niedrig - Nice-to-have, Zukunft

**Komplexität**: 🟢 Niedrig | 🟡 Mittel | 🔴 Hoch

---

## 1. Authentifizierung und Benutzerverwaltung

### 1.1 Login und Registrierung (P0, 🟢)
- [ ] E-Mail/Passwort-Login
- [ ] Passwort-Reset per E-Mail
- [ ] Session-Management (Auto-Logout nach 30 Min)
- [ ] "Angemeldet bleiben" Funktion (7 Tage)
- [ ] Login-Historie (letzte 10 Logins)

### 1.2 Zwei-Faktor-Authentifizierung (P1, 🟡)
- [ ] 2FA Setup mit TOTP (Google Authenticator, Authy)
- [ ] QR-Code für 2FA-Aktivierung
- [ ] Backup-Codes (10 Einmal-Codes)
- [ ] 2FA-Deaktivierung (mit Passwort-Bestätigung)
- [ ] 2FA verpflichtend für Admin/Kassenwart (optional)

### 1.3 Benutzerverwaltung (P0, 🟢)
- [ ] Benutzer anlegen, bearbeiten, deaktivieren
- [ ] Rollenbasierte Berechtigungen (Admin, Kassenwart, Kassenprüfer, Vorstand, Mitgliederverwaltung, Projektverantwortlicher)
- [ ] Benutzer-Liste mit Filter (Rolle, Status)
- [ ] Passwort-Policy (min. 12 Zeichen, Komplexität)
- [ ] Account-Lockout nach 5 Fehlversuchen

### 1.4 Profilverwaltung (P2, 🟢)
- [ ] Eigenes Profil bearbeiten (Name, E-Mail)
- [ ] Passwort ändern
- [ ] Benachrichtigungseinstellungen
- [ ] Sprache (Deutsch/Englisch)
- [ ] Profilbild (optional)

---

## 2. Mitgliederverwaltung

### 2.1 Mitglieder-Stammdaten (P0, 🟡)
- [ ] Mitglied anlegen (Name, Adresse, Kontaktdaten)
- [ ] Mitgliedsnummer (automatisch generiert, editierbar)
- [ ] Mitgliedstyp (regulär, ermäßigt, Familie, Ehrenamt)
- [ ] Beitrittsdatum, Austrittsdatum
- [ ] Geburtstatum (optional für Altersstatistiken)
- [ ] Notizen-Feld (frei)

### 2.2 Mitglieder-Liste und Suche (P0, 🟢)
- [ ] Mitglieder-Tabelle mit Spalten (Nummer, Name, Typ, Status, Beitritt)
- [ ] Sortierung (nach Name, Nummer, Beitritt)
- [ ] Filter (Status: aktiv/ausgetreten, Typ, Zahlungsintervall)
- [ ] Volltextsuche (Name, Mitgliedsnummer, E-Mail)
- [ ] Pagination (20/50/100 pro Seite)
- [ ] Export als CSV/Excel

### 2.3 Beitragsverwaltung (P0, 🟡)
- [ ] Beitragssätze konfigurieren (Typ, Betrag, Intervall)
- [ ] Gültigkeitszeitraum für Beitragssätze
- [ ] Beitragshistorie pro Mitglied
- [ ] Beitragsrechnung generieren (PDF)
- [ ] Zahlungsstatus (offen, bezahlt, überfällig)
- [ ] Zahlungserinnerung (manuell, automatisch optional)

### 2.4 SEPA-Lastschriftmandat (P1, 🟡)
- [ ] SEPA-Mandat anlegen (IBAN, BIC, Datum)
- [ ] Mandat-Referenz generieren
- [ ] Mandatsstatus (aktiv, widerrufen)
- [ ] SEPA-XML generieren für Lastschriften (ISO 20022)
- [ ] Lastschrift-Vorlauf (5 Tage, konfigurierbar)

### 2.5 Import/Export (P1, 🟡)
- [ ] CSV/Excel-Import (Mapping-Tool)
- [ ] Validierung beim Import (Pflichtfelder, Format)
- [ ] Dublettenprüfung (Name, E-Mail)
- [ ] Import-Vorschau
- [ ] Export mit Filtermöglichkeiten

### 2.6 DSGVO-Funktionen (P0, 🔴)
- [ ] Datenexport für Mitglied (JSON/CSV, alle Daten)
- [ ] Löschanfrage stellen (automatische Prüfung Aufbewahrungsfrist)
- [ ] Anonymisierung für steuerrelevante Daten
- [ ] Einwilligungen verwalten (Newsletter, Foto, etc.)
- [ ] Änderungshistorie für Mitgliederdaten

---

## 3. Kassenbuch und Buchführung

### 3.1 Konten/Kassen (P0, 🟢)
- [ ] Konto anlegen (Name, Typ: Kasse/Bank, IBAN, Eröffnungssaldo)
- [ ] Konten-Liste mit Saldo
- [ ] Konto schließen (Datum, Endsaldo)
- [ ] Kontenplan konfigurieren (Kategorien)

### 3.2 Buchungen erfassen (P0, 🟡)
- [ ] Einnahme/Ausgabe buchen
- [ ] Buchungsdatum, Belegdatum
- [ ] Kategorie/Subkategorie (aus Kontenplan)
- [ ] Betrag, Beschreibung
- [ ] Konto/Kasse auswählen
- [ ] Beleg hochladen (PDF, Foto)
- [ ] Mitglied verknüpfen (optional)
- [ ] Projekt zuordnen (optional)
- [ ] Mehrwertsteuer erfassen (Satz, Betrag)
- [ ] Automatische Belegnummerierung

### 3.3 Kassenbuch-Ansicht (P0, 🟢)
- [ ] Chronologische Liste aller Buchungen
- [ ] Filter (Zeitraum, Konto, Kategorie, Typ)
- [ ] Suche (Beschreibung, Belegnummer)
- [ ] Sortierung (Datum, Betrag, Kategorie)
- [ ] Saldoanzeige (laufend)
- [ ] Monats-/Jahresansicht
- [ ] Export (PDF, CSV)

### 3.4 Stornobuchungen (P0, 🟡)
- [ ] Buchung stornieren (Grund angeben)
- [ ] Stornobuchung automatisch erstellen (negativ)
- [ ] Original-Buchung als "storniert" markieren
- [ ] Verknüpfung zwischen Original und Storno
- [ ] Stornierungen im Kassenbuch sichtbar

### 3.5 Belegverwaltung (P1, 🟡)
- [ ] Belege hochladen (Drag & Drop)
- [ ] Belege verknüpfen mit Buchungen
- [ ] Belegarchiv (alle Belege durchsuchbar)
- [ ] Thumbnail-Vorschau
- [ ] PDF-Vorschau im Browser
- [ ] Download einzelner Belege
- [ ] Bulk-Download (ZIP)
- [ ] Checksum-Validierung (SHA-256)

### 3.6 Mehrfachbuchungen (P2, 🟡)
- [ ] Buchungsvorlage erstellen (z.B. monatliche Miete)
- [ ] Serienbuchung (monatlich, quartalsweise)
- [ ] Bulk-Import von Kontoauszügen (MT940)

### 3.7 GoBD-Compliance (P0, 🔴)
- [ ] Unveränderbarkeit (Versionierung)
- [ ] Zeitstempel bei Erfassung
- [ ] Audit-Trail (alle Änderungen protokolliert)
- [ ] Vollständigkeit (lückenlose Belegnummern)
- [ ] Verfahrensdokumentation generieren

---

## 4. Spendenverwaltung

### 4.1 Spenden erfassen (P0, 🟡)
- [ ] Spende anlegen (Spender, Betrag, Datum, Zweck)
- [ ] Spendernummer generieren
- [ ] Spender-Stammdaten (Name, Adresse) - optional anonym
- [ ] Zuordnung zu Mitglied (falls Mitglied)
- [ ] Zahlungsart (Bar, Überweisung, PayPal)
- [ ] Sachspende dokumentieren

### 4.2 Zuwendungsbestätigungen (P0, 🔴)
- [ ] Zuwendungsbestätigung generieren (§ 50 EStDV)
- [ ] Amtliches Muster verwenden
- [ ] Fortlaufende Nummerierung
- [ ] PDF-Generierung
- [ ] Versand per E-Mail (optional)
- [ ] Sammelbestätigungen (Jahresende)
- [ ] Widerrufsfunktion (bei Fehler)

### 4.3 Spenderhistorie (P1, 🟢)
- [ ] Alle Spenden eines Spenders anzeigen
- [ ] Gesamtspendensumme pro Spender
- [ ] Spendenverlauf grafisch (Jahresvergleich)
- [ ] Export für Mailings

### 4.4 Spenden-Statistiken (P2, 🟡)
- [ ] Top-Spender (Jahr, Gesamt)
- [ ] Spenden nach Zweck
- [ ] Monatliche/jährliche Entwicklung
- [ ] Dashboard mit Grafiken

---

## 5. Berichtswesen

### 5.1 Kassenbericht (P0, 🟡)
- [ ] Einnahmen-Ausgaben-Rechnung (Zeitraum wählbar)
- [ ] Aufschlüsselung nach Kategorien
- [ ] Kontostände (Anfang, Ende)
- [ ] Offene Posten
- [ ] PDF-Export
- [ ] Druckoptimiert

### 5.2 Jahresabschluss (P1, 🔴)
- [ ] Vermögensübersicht (Aktiva, Passiva)
- [ ] Einnahmen-Ausgaben-Rechnung (gesamtes Jahr)
- [ ] Mitgliederstatistik (Anzahl, Beiträge)
- [ ] Spendenstatistik (Anzahl Spenden, Summe)
- [ ] Vergleich zum Vorjahr
- [ ] Export als PDF (für Mitgliederversammlung)

### 5.3 Budgetvergleich (P1, 🟡)
- [ ] Soll-Ist-Vergleich (Kategorie, Quartal, Jahr)
- [ ] Abweichungsanalyse (absolut, prozentual)
- [ ] Warnung bei Budgetüberschreitung
- [ ] Grafische Darstellung (Balkendiagramm)
- [ ] Export (PDF, Excel)

### 5.4 Mitgliederberichte (P2, 🟡)
- [ ] Mitgliederentwicklung (Zu-/Abgänge)
- [ ] Altersstruktur
- [ ] Beitragsaufkommen nach Typ
- [ ] Zahlungsmoral (Offene Beiträge)

### 5.5 Kassenprüfungsbericht (P1, 🟡)
- [ ] Belegübersicht für Zeitraum
- [ ] Kontenbewegungen detailliert
- [ ] Prüfprotokoll-Vorlage
- [ ] Unterschriftenfeld
- [ ] Export als PDF

### 5.6 DATEV-Export (P2, 🔴)
- [ ] DATEV-CSV-Format
- [ ] Kontenzuordnung (SKR03/SKR04)
- [ ] Validierung vor Export
- [ ] Import in DATEV-Software getestet

---

## 6. Budgetplanung

### 6.1 Haushaltsplan erstellen (P1, 🟡)
- [ ] Planwerte für Kategorien definieren
- [ ] Mehrjahresplanung (3-5 Jahre)
- [ ] Projektbudgets separat
- [ ] Budgetfreigabe-Workflow (optional)

### 6.2 Budgetüberwachung (P1, 🟢)
- [ ] Automatische Berechnung Restbudget
- [ ] Warnungen bei 80%, 100% Auslastung
- [ ] Dashboard mit Budgetstatus
- [ ] Prognose für Jahresende (Trendanalyse)

---

## 7. Projektverwaltung

### 7.1 Projekte (P2, 🟡)
- [ ] Projekt anlegen (Name, Budget, Laufzeit)
- [ ] Verantwortlicher zuweisen
- [ ] Status (aktiv, abgeschlossen, abgebrochen)
- [ ] Projektnummer generieren

### 7.2 Projektbuchungen (P2, 🟡)
- [ ] Buchungen Projekten zuordnen
- [ ] Projektbudget verfolgen
- [ ] Projektbericht (Einnahmen, Ausgaben)
- [ ] Mehrere Projekte vergleichen

---

## 8. Dashboard und Übersichten

### 8.1 Hauptdashboard (P0, 🟡)
- [ ] Kontostandsübersicht (alle Konten)
- [ ] Einnahmen/Ausgaben aktueller Monat
- [ ] Offene Beiträge (Anzahl, Summe)
- [ ] Kommende Fälligkeiten
- [ ] Letzte Buchungen (5-10)
- [ ] Quick Actions (Neue Buchung, Neues Mitglied)

### 8.2 Statistiken-Dashboard (P2, 🟡)
- [ ] Einnahmen/Ausgaben-Verlauf (Liniendiagramm, 12 Monate)
- [ ] Kategorien-Verteilung (Tortendiagramm)
- [ ] Mitgliederentwicklung (Balkendiagramm)
- [ ] Spendenentwicklung (Jahresvergleich)
- [ ] KPIs (Durchschnittliche Spende, Mitgliederwachstum)

---

## 9. Benachrichtigungen und Erinnerungen

### 9.1 E-Mail-Benachrichtigungen (P2, 🟢)
- [ ] Zahlungserinnerung (offene Beiträge)
- [ ] Zuwendungsbestätigung versenden
- [ ] Systembenachrichtigungen (neuer Benutzer, Fehler)
- [ ] Digest (wöchentlich/monatlich)

### 9.2 In-App-Benachrichtigungen (P2, 🟢)
- [ ] Glocken-Icon mit Anzahl ungelesener Benachrichtigungen
- [ ] Nachrichtentypen (Info, Warnung, Fehler)
- [ ] Als gelesen markieren
- [ ] Archiv

### 9.3 Automatische Erinnerungen (P2, 🟡)
- [ ] Beitragseinzug (7 Tage vorher)
- [ ] Budgetüberschreitung
- [ ] Backup-Fehler
- [ ] Ablaufende SEPA-Mandate

---

## 10. System-Administration

### 10.1 Systemeinstellungen (P0, 🟢)
- [ ] Vereinsdaten (Name, Adresse, Steuernummer)
- [ ] Bankverbindung
- [ ] Logo hochladen
- [ ] Geschäftsjahr definieren (Kalenderjahr/abweichend)
- [ ] Währung (EUR Standard)
- [ ] Sprache

### 10.2 Kategorien/Kontenplan (P0, 🟡)
- [ ] Kategorien anlegen, bearbeiten, löschen
- [ ] Subkategorien
- [ ] Vier-Sphären-Modell (ideeller Bereich, Vermögensverwaltung, Zweckbetrieb, wirtschaftlicher GB)
- [ ] Import von Standard-Kontenplan (SKR49 für Vereine)

### 10.3 Beitragssätze (P0, 🟢)
- [ ] Beitragssätze konfigurieren
- [ ] Gültigkeitszeitraum
- [ ] Historie alter Beitragssätze

### 10.4 Backup und Wiederherstellung (P0, 🔴)
- [ ] Manuelles Backup auslösen
- [ ] Automatische tägliche Backups
- [ ] Backup-Historie (letzte 30 Tage)
- [ ] Wiederherstellung aus Backup
- [ ] Backup-Download (verschlüsselt)

### 10.5 Audit-Log (P1, 🟡)
- [ ] Alle Aktionen protokollieren (Wer, Wann, Was)
- [ ] Filterbare Log-Ansicht
- [ ] Export (CSV)
- [ ] Retention (6 Monate, konfigurierbar)

### 10.6 DSGVO-Management (P0, 🔴)
- [ ] Verarbeitungsverzeichnis generieren
- [ ] Löschanfragen verwalten
- [ ] Auskunftsanfragen bearbeiten
- [ ] TOMs-Dokumentation
- [ ] Datenschutzerklärung aktualisieren

---

## 11. Import/Export

### 11.1 Datenimport (P1, 🟡)
- [ ] CSV/Excel-Import (Mitglieder, Buchungen)
- [ ] MT940-Import (Kontoauszüge)
- [ ] Mapping-Tool (Spalten zuordnen)
- [ ] Validierung, Fehlerbehandlung
- [ ] Import-Vorschau

### 11.2 Datenexport (P1, 🟢)
- [ ] CSV-Export (Mitglieder, Buchungen, Spenden)
- [ ] PDF-Export (Berichte)
- [ ] DATEV-Export
- [ ] SEPA-XML
- [ ] Vollständiger Datenexport (DSGVO Art. 20)

---

## 12. Mobile und Offline

### 12.1 Progressive Web App (P2, 🔴)
- [ ] Installierbar auf Smartphone/Desktop
- [ ] Offline-Nutzung (Service Worker)
- [ ] Push-Benachrichtigungen
- [ ] Responsive Design (optimiert für Mobile)

### 12.2 Schnellbuchung (P2, 🟢)
- [ ] Vereinfachte Buchungsmaske für Mobile
- [ ] Foto von Beleg direkt aufnehmen
- [ ] Favoriten für häufige Buchungen

---

## 13. Erweiterte Funktionen (Nice-to-have)

### 13.1 Multi-Tenancy (P3, 🔴)
- [ ] Mehrere Vereine in einer Instanz
- [ ] Daten komplett getrennt
- [ ] Übergreifende Verwaltung (Admin)

### 13.2 API (P3, 🔴)
- [ ] RESTful API für Drittanbieter
- [ ] API-Key-Verwaltung
- [ ] Rate Limiting
- [ ] Webhooks (z.B. neue Spende)

### 13.3 Integrationen (P3, 🔴)
- [ ] PayPal-Integration (Spenden)
- [ ] Stripe-Integration (Online-Beiträge)
- [ ] HBCI/FinTS (Kontoumsätze automatisch abrufen)
- [ ] Lexoffice/sevDesk (Buchhaltungssoftware)

### 13.4 AI-Features (P3, 🔴)
- [ ] OCR für Belege (automatische Datenextraktion)
- [ ] Kategorisierung von Buchungen (ML-basiert)
- [ ] Chatbot für Support
- [ ] Anomalieerkennung (ungewöhnliche Buchungen)

### 13.5 Gamification (P3, 🟡)
- [ ] Badges für Kassenprüfer (z.B. "100 Belege geprüft")
- [ ] Mitglieder-Engagement-Score
- [ ] Leaderboard (Spender des Jahres)

---

## Feature-Priorisierung für MVP (Minimum Viable Product)

### Phase 1: MVP (3 Monate)

**Authentifizierung (P0)**:
- Login/Logout, Passwort-Reset
- Benutzerverwaltung (Rollen)
- Session-Management

**Mitgliederverwaltung (P0)**:
- Mitglieder anlegen, bearbeiten, anzeigen
- Beitragsverwaltung (Basis)
- Mitglieder-Liste, Suche, Filter

**Kassenbuch (P0)**:
- Konten anlegen
- Buchungen erfassen (Einnahme/Ausgabe)
- Kassenbuch-Ansicht
- Belege hochladen
- Stornobuchungen

**Berichte (P0)**:
- Kassenbericht (Einnahmen-Ausgaben)
- Export (PDF)

**Dashboard (P0)**:
- Kontostandsübersicht
- Letzte Buchungen

**System (P0)**:
- Systemeinstellungen (Vereinsdaten)
- Kategorien/Kontenplan

**DSGVO (P0)**:
- Datenexport für Mitglied
- Löschanfrage

### Phase 2: Erweiterte Funktionen (2 Monate)

**Spendenverwaltung (P0)**:
- Spenden erfassen
- Zuwendungsbestätigungen generieren

**Berichte (P1)**:
- Jahresabschluss
- Budgetvergleich
- Kassenprüfungsbericht

**Mitglieder (P1)**:
- SEPA-Lastschriftmandate
- CSV-Import/Export

**Authentifizierung (P1)**:
- Zwei-Faktor-Authentifizierung

**Benachrichtigungen (P2)**:
- E-Mail-Benachrichtigungen (Basics)

**Audit (P1)**:
- Audit-Log

### Phase 3: Optimierung und Compliance (1 Monat)

**GoBD-Compliance (P0)**:
- Verfahrensdokumentation
- Audit-Trail optimieren

**DSGVO-Compliance (P0)**:
- Verarbeitungsverzeichnis
- TOMs-Dokumentation

**Backup (P0)**:
- Automatische Backups
- Wiederherstellung

**Testing und QA**:
- Penetration Test
- Performance-Optimierung
- Benutzertests

---

## Feature-Komplexität und Aufwand (Schätzung)

### Legende
- **S** (Small): 1-3 Tage
- **M** (Medium): 4-7 Tage
- **L** (Large): 8-15 Tage
- **XL** (Extra Large): 16+ Tage

| Feature | Priorität | Komplexität | Aufwand |
|---------|-----------|-------------|---------|
| Login/Authentifizierung | P0 | 🟢 | S |
| Benutzerverwaltung | P0 | 🟢 | S |
| 2FA | P1 | 🟡 | M |
| Mitglieder-CRUD | P0 | 🟡 | M |
| Mitglieder-Import | P1 | 🟡 | M |
| Beitragsverwaltung | P0 | 🟡 | M |
| SEPA-Lastschrift | P1 | 🟡 | L |
| Kassenbuch-Buchungen | P0 | 🟡 | M |
| Belegverwaltung | P1 | 🟡 | M |
| Stornobuchungen | P0 | 🟡 | S |
| Spendenverwaltung | P0 | 🟡 | M |
| Zuwendungsbestätigungen | P0 | 🔴 | L |
| Kassenbericht | P0 | 🟡 | M |
| Jahresabschluss | P1 | 🔴 | L |
| Budgetplanung | P1 | 🟡 | M |
| Dashboard | P0 | 🟡 | M |
| DSGVO-Datenexport | P0 | 🔴 | L |
| DSGVO-Löschung | P0 | 🔴 | L |
| GoBD-Compliance | P0 | 🔴 | XL |
| Audit-Log | P1 | 🟡 | M |
| Backup/Restore | P0 | 🔴 | L |
| DATEV-Export | P2 | 🔴 | L |
| PWA | P2 | 🔴 | XL |
| API | P3 | 🔴 | XL |

**Gesamt-Aufwand (MVP - Phase 1)**: ~40-50 Entwicklungstage (2-2.5 Monate bei 1 Vollzeit-Entwickler)
**Gesamt-Aufwand (Phase 2)**: ~30-40 Entwicklungstage (1.5-2 Monate)
**Gesamt-Aufwand (Phase 3)**: ~15-20 Entwicklungstage (0.75-1 Monat)

**Gesamt**: ~85-110 Entwicklungstage (4-5.5 Monate bei 1 Vollzeit-Entwickler)

---

## Zusammenfassung: Top 20 Features für MVP

1. ✅ Login/Authentifizierung
2. ✅ Benutzerverwaltung (Rollen)
3. ✅ Mitgliederverwaltung (CRUD)
4. ✅ Mitglieder-Liste/Suche
5. ✅ Beitragsverwaltung
6. ✅ Konten/Kassen anlegen
7. ✅ Buchungen erfassen
8. ✅ Kassenbuch-Ansicht
9. ✅ Belege hochladen
10. ✅ Stornobuchungen
11. ✅ Spenden erfassen
12. ✅ Zuwendungsbestätigungen
13. ✅ Kassenbericht
14. ✅ Dashboard (Übersicht)
15. ✅ Kategorien/Kontenplan
16. ✅ DSGVO-Datenexport
17. ✅ DSGVO-Löschanfrage
18. ✅ GoBD-Unveränderbarkeit
19. ✅ Systemeinstellungen
20. ✅ Backup-Funktion

---

## Änderungshistorie

| Version | Datum | Autor | Änderungen |
|---------|-------|-------|------------|
| 1.0 | 2025-10-20 | Research Agent | Initiale Erstellung |
