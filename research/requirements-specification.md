# Anforderungsspezifikation: Finanzverwaltungssystem für Vereine

## Executive Summary

Ein DSGVO-konformes, vereinsspezifisches Finanzverwaltungssystem zur Verwaltung von Mitgliedsbeiträgen, Spenden, Kassenbuch und Berichtswesen gemäß deutscher Gesetzgebung.

---

## 1. Funktionale Anforderungen

### 1.1 Mitgliederverwaltung

**MV-001**: System muss Mitgliederdaten erfassen (Name, Adresse, Beitrittsdatum, Mitgliedsnummer)
- **Priorität**: Hoch
- **DSGVO**: Rechtsgrundlage Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)
- **Datensparsamkeit**: Nur vereinsrelevante Daten

**MV-002**: Verwaltung von Mitgliedsbeiträgen
- Beitragssätze (regulär, ermäßigt, Familie, Ehrenamt)
- Zahlungsintervalle (monatlich, vierteljährlich, jährlich)
- Lastschriftmandate (SEPA)
- Beitragshistorie

**MV-003**: Austrittsverwaltung mit automatischer Löschfristen-Verwaltung
- Löschkonzept nach DSGVO Art. 17
- Aufbewahrungsfristen: 10 Jahre für steuerrelevante Daten (§ 147 AO)

### 1.2 Kassenbuchführung

**KB-001**: Digitales Kassenbuch nach GoBD-Anforderungen
- Unveränderbarkeit der Buchungen (Versionierung)
- Chronologische Aufzeichnung
- Zeitnahe Erfassung (max. 10 Tage)
- Vollständigkeit und Richtigkeit

**KB-002**: Belegverwaltung
- Upload von Belegen (PDF, Foto)
- Automatische Nummerierung
- Verknüpfung mit Buchungen
- Archivierung (10 Jahre)

**KB-003**: Buchungskategorien
- Einnahmen:
  - Mitgliedsbeiträge
  - Spenden
  - Sponsoring
  - Veranstaltungseinnahmen
  - Zuschüsse
- Ausgaben:
  - Personal
  - Raummiete
  - Material
  - Versicherungen
  - Verwaltung

**KB-004**: Mehrere Konten/Kassen
- Hauptkasse
- Barkasse
- Girokonto(en)
- Projektkonten

### 1.3 Spendenverwaltung

**SP-001**: Spendenverwaltung gemäß § 50 EStDV
- Spenderdaten (anonymisiert möglich)
- Spendenbetrag und Datum
- Zweckbindung
- Sammelspenden-Zuordnung

**SP-002**: Zuwendungsbestätigungen generieren
- Muster nach § 50 Abs. 1 EStDV
- Automatische Nummerierung
- PDF-Export
- Sammelbestätigungen (Jahresende)

**SP-003**: Spenderhistorie und -statistiken
- DSGVO-konforme Speicherung
- Spendenquittungen-Archiv (10 Jahre)

### 1.4 Berichtswesen

**BR-001**: Kassenbericht (monatlich/quartalsweise)
- Einnahmen-Ausgaben-Rechnung
- Kontostände
- Offene Posten

**BR-002**: Jahresabschluss
- Vermögensübersicht
- Einnahmen-Ausgaben-Rechnung
- Mitgliederstatistik
- Spendenstatistik

**BR-003**: Prüfberichte für Kassenprüfer
- Belegübersicht
- Kontenbewegungen
- Prüfprotokoll-Vorlage

**BR-004**: Export-Funktionen
- CSV-Export für Steuerberater
- PDF-Berichte
- DATEV-Schnittstelle (optional)

### 1.5 Budgetplanung und Controlling

**BC-001**: Haushaltsplan erstellen
- Planwerte für Kategorien
- Mehrjahresplanung
- Projektbudgets

**BC-002**: Soll-Ist-Vergleich
- Abweichungsanalyse
- Warnungen bei Budgetüberschreitung
- Prognosen

---

## 2. DSGVO-Anforderungen

### 2.1 Rechtsgrundlagen

**DSGVO-001**: Verarbeitungsverzeichnis (Art. 30 DSGVO)
- Zweck der Verarbeitung
- Kategorien betroffener Personen
- Kategorien personenbezogener Daten
- Empfänger
- Löschfristen

**DSGVO-002**: Datenschutzerklärung
- Information über Datenverarbeitung
- Rechte der Betroffenen
- Speicherdauer

### 2.2 Betroffenenrechte

**DSGVO-003**: Auskunftsrecht (Art. 15 DSGVO)
- Export aller gespeicherten Daten
- Maschinenlesbar (JSON/CSV)

**DSGVO-004**: Löschrecht (Art. 17 DSGVO)
- Manuelle Löschung
- Automatische Löschung nach Aufbewahrungsfristen
- Pseudonymisierung für steuerrelevante Daten

**DSGVO-005**: Berichtigung (Art. 16 DSGVO)
- Änderungshistorie
- Audit-Log

**DSGVO-006**: Datenportabilität (Art. 20 DSGVO)
- Export in strukturiertem Format

### 2.3 Technische und organisatorische Maßnahmen (TOMs)

**TOM-001**: Verschlüsselung
- Datenbank-Verschlüsselung at-rest (AES-256)
- TLS 1.3 für Datenübertragung
- Ende-zu-Ende-Verschlüsselung für Belege

**TOM-002**: Zugriffskontrolle
- Rollenbasiertes Berechtigungskonzept (RBAC)
- Zwei-Faktor-Authentifizierung (2FA)
- Session-Management

**TOM-003**: Protokollierung
- Audit-Log für alle Änderungen
- Login-Protokoll
- Zugriffsprotokolle (6 Monate)

**TOM-004**: Backup und Wiederherstellung
- Tägliche Backups
- Verschlüsselte Backups
- Disaster Recovery Plan

**TOM-005**: Datenschutz durch Technikgestaltung
- Privacy by Design
- Datensparsamkeit
- Pseudonymisierung wo möglich

---

## 3. Buchführungsanforderungen

### 3.1 GoBD-Konformität (Grundsätze ordnungsmäßiger Buchführung)

**GoBD-001**: Unveränderbarkeit
- Nachträgliche Änderungen nur mit Stornobuchung
- Versionierung aller Datensätze
- Zeitstempel für alle Buchungen

**GoBD-002**: Vollständigkeit
- Lückenlose Erfassung aller Geschäftsvorfälle
- Keine Lücken in Belegnummern

**GoBD-003**: Nachvollziehbarkeit
- Audit-Trail für alle Buchungen
- Verknüpfung zu Originalbelegen

**GoBD-004**: Zeitgerechtheit
- Erfassung innerhalb von 10 Tagen
- Zeitstempel bei Erfassung

**GoBD-005**: Ordnung
- Systematische Ablage
- Eindeutige Belegnummern
- Kontierung

**GoBD-006**: Aufbewahrung
- 10 Jahre für Buchungsbelege (§ 147 AO)
- 6 Jahre für sonstige Geschäftsunterlagen
- Revisionssichere Archivierung

### 3.2 Vereinsspezifische Anforderungen

**VS-001**: Gemeinnützigkeitsnachweis
- Trennung von ideellem Bereich und Zweckbetrieb
- Nachweise für Mittelverwendung
- Vermögensübersicht

**VS-002**: Transparenzanforderungen
- Rechenschaftsbericht für Mitgliederversammlung
- Öffentliche Finanzdaten (bei Gemeinnützigkeit)

---

## 4. Rollen und Berechtigungen

### 4.1 Rollenkonzept

**ROLE-001**: Administrator
- Vollzugriff auf alle Funktionen
- Benutzerverwaltung
- System-Konfiguration
- Backup/Restore

**ROLE-002**: Kassenwart/Schatzmeister
- Buchungen erfassen/bearbeiten
- Berichte generieren
- Mitgliederbeiträge verwalten
- Spendenverwaltung
- Keine Benutzerverwaltung

**ROLE-003**: Kassenprüfer
- Lesezugriff auf alle Buchungen
- Berichte generieren
- Keine Schreibrechte
- Prüfprotokoll erstellen

**ROLE-004**: Vorstand
- Lesezugriff auf Berichte
- Budgetplanung
- Keine Buchungen

**ROLE-005**: Mitgliederverwaltung
- Mitgliederdaten pflegen
- Beiträge verwalten
- Keine Kassenbuchungen

**ROLE-006**: Projektverantwortlicher
- Zugriff nur auf eigenes Projektbudget
- Buchungen für Projekt erfassen
- Projektberichte

### 4.2 Berechtigungsmatrix

| Funktion | Admin | Kassenwart | Prüfer | Vorstand | Mitglieder-Verw. | Projekt-Verantw. |
|----------|-------|------------|--------|----------|------------------|------------------|
| Buchungen erfassen | ✓ | ✓ | - | - | - | ✓ (Projekt) |
| Buchungen stornieren | ✓ | ✓ | - | - | - | - |
| Belege hochladen | ✓ | ✓ | - | - | - | ✓ (Projekt) |
| Berichte ansehen | ✓ | ✓ | ✓ | ✓ | - | ✓ (Projekt) |
| Mitgliederdaten | ✓ | ✓ | - | - | ✓ | - |
| Benutzerverwaltung | ✓ | - | - | - | - | - |
| Systemeinstellungen | ✓ | - | - | - | - | - |
| Spendenbescheinigungen | ✓ | ✓ | - | - | - | - |
| Budgetplanung | ✓ | ✓ | - | ✓ | - | - |
| Audit-Logs | ✓ | - | ✓ | - | - | - |

---

## 5. Technische Anforderungen

### 5.1 Plattform

**TECH-001**: Web-basierte Anwendung
- Responsive Design (Desktop, Tablet, Mobile)
- Moderne Browser-Unterstützung (Chrome, Firefox, Safari, Edge)
- Progressive Web App (PWA) für Offline-Nutzung

**TECH-002**: Hosting
- Deutschland/EU-Hosting (DSGVO)
- SSL/TLS-Verschlüsselung
- Regelmäßige Sicherheitsupdates

### 5.2 Performance

**PERF-001**: Ladezeiten
- Initiale Ladezeit < 2 Sekunden
- Navigation < 500ms
- Suchfunktionen < 1 Sekunde

**PERF-002**: Skalierbarkeit
- Unterstützung für bis zu 10.000 Mitglieder
- 100.000 Buchungen pro Jahr
- Gleichzeitige Benutzer: 50

### 5.3 Verfügbarkeit

**AVAIL-001**: Uptime
- 99.5% Verfügbarkeit
- Wartungsfenster außerhalb Geschäftszeiten
- Statusseite für Systemverfügbarkeit

### 5.4 Integration

**INT-001**: Import/Export
- CSV-Import für Mitgliederdaten
- SEPA-XML für Lastschriften
- DATEV-Export (optional)
- API für Drittanbieter (REST)

**INT-002**: Banking-Integration
- HBCI/FinTS-Schnittstelle (optional)
- MT940-Import (Kontoauszüge)
- SEPA-Zahlungsverkehr

---

## 6. Nicht-funktionale Anforderungen

### 6.1 Benutzerfreundlichkeit

**UX-001**: Intuitive Bedienung
- Geringe Einarbeitungszeit (< 2 Stunden)
- Kontextsensitive Hilfe
- Tooltips und Anleitungen

**UX-002**: Barrierefreiheit
- WCAG 2.1 Level AA
- Tastaturnavigation
- Screen-Reader-Unterstützung

### 6.2 Wartbarkeit

**MAINT-001**: Dokumentation
- Technische Dokumentation
- Benutzerhandbuch
- Admin-Handbuch
- API-Dokumentation

**MAINT-002**: Code-Qualität
- Clean Code Prinzipien
- Unit-Tests (> 80% Coverage)
- Integration-Tests
- Code-Reviews

### 6.3 Sicherheit

**SEC-001**: Authentifizierung
- Starke Passwörter (min. 12 Zeichen)
- Zwei-Faktor-Authentifizierung
- Session-Timeout (30 Minuten)

**SEC-002**: Autorisierung
- Prinzip der minimalen Rechtevergabe
- Regelmäßige Rechte-Reviews

**SEC-003**: Penetration Testing
- Jährliches externes Security-Audit
- Vulnerability Scanning

---

## 7. Compliance-Anforderungen

### 7.1 Steuerrecht

**TAX-001**: Gemeinnützigkeit (§§ 51-68 AO)
- Nachweis der Mittelverwendung
- Vier-Sphären-Modell (ideeller Bereich, Vermögensverwaltung, Zweckbetrieb, wirtschaftlicher Geschäftsbetrieb)
- Rücklagenverwaltung

**TAX-002**: Spendenrecht (§ 50 EStDV)
- Zuwendungsbestätigungen
- Spenderverzeichnis
- Nachweispflichten

**TAX-003**: Aufbewahrungspflichten (§ 147 AO)
- 10 Jahre für Buchungsbelege
- 6 Jahre für sonstige Unterlagen

### 7.2 Vereinsrecht

**VR-001**: Transparenz
- Rechenschaftspflicht gegenüber Mitgliedern
- Einsichtsrecht in Geschäftsunterlagen
- Jahresabschluss für Mitgliederversammlung

**VR-002**: Haftung
- Nachweise für sorgfältige Verwaltung
- Kassenprüfung dokumentieren

---

## 8. Datenmigration

### 8.1 Import bestehender Daten

**MIG-001**: Mitgliederdaten
- CSV/Excel-Import
- Validierung und Fehlerbehandlung
- Dubletten-Prüfung

**MIG-002**: Historische Buchungen
- Import mit Validierung
- Konsistenzprüfung
- Belegnummern-Mapping

**MIG-003**: Belege
- Bulk-Upload von PDFs
- Automatische Verknüpfung
- OCR für Belegdaten (optional)

---

## 9. Schulung und Support

### 9.1 Schulungsanforderungen

**TRAIN-001**: Einführungsschulung
- Admin-Schulung (1 Tag)
- Kassenwart-Schulung (0.5 Tage)
- Anwender-Schulung (2 Stunden)

**TRAIN-002**: Dokumentation
- Video-Tutorials
- Schritt-für-Schritt-Anleitungen
- FAQ

### 9.2 Support

**SUP-001**: Support-Kanäle
- E-Mail-Support
- Telefon-Hotline (Geschäftszeiten)
- Ticketsystem
- Online-Community/Forum

**SUP-002**: Service-Level
- Reaktionszeit: < 24 Stunden
- Kritische Fehler: < 4 Stunden
- Regelmäßige Updates und Patches

---

## 10. Erfolgskriterien

### 10.1 Akzeptanzkriterien

1. **Funktionalität**: Alle Kern-Features implementiert und getestet
2. **DSGVO**: Vollständige Compliance mit Datenschutzaudit
3. **GoBD**: Zertifizierung durch unabhängige Prüfstelle
4. **Benutzerakzeptanz**: > 80% Zufriedenheit in Umfrage
5. **Performance**: Alle Performance-Ziele erreicht
6. **Sicherheit**: Erfolgreiches Penetration Testing

### 10.2 Messbare Ziele

- Zeitersparnis: 50% weniger Zeit für Buchführung
- Fehlerquote: < 1% fehlerhafte Buchungen
- Schulungszeit: < 2 Stunden für Basisnutzung
- System-Verfügbarkeit: > 99.5%
- Benutzer-Login: > 80% der Berechtigten nutzen System monatlich

---

## 11. Risiken und Abhängigkeiten

### 11.1 Risiken

**RISK-001**: Datenschutzverletzung
- Wahrscheinlichkeit: Niedrig
- Impact: Hoch
- Mitigation: TOMs, regelmäßige Audits, Schulungen

**RISK-002**: Datenqualität bei Migration
- Wahrscheinlichkeit: Mittel
- Impact: Mittel
- Mitigation: Validierung, Testmigration, manuelle Prüfung

**RISK-003**: Benutzerakzeptanz
- Wahrscheinlichkeit: Mittel
- Impact: Hoch
- Mitigation: Early User Involvement, Schulungen, Change Management

**RISK-004**: Rechtliche Änderungen
- Wahrscheinlichkeit: Mittel
- Impact: Mittel
- Mitigation: Modulare Architektur, regelmäßige Updates

### 11.2 Abhängigkeiten

- Hosting-Provider mit DSGVO-Garantien
- Zahlungsdienstleister für SEPA
- Steuerberater für GoBD-Validierung
- Datenschutzbeauftragter (optional, ab 20 Personen)

---

## 12. Phasen und Meilensteine (Übersicht)

**Phase 1**: Anforderungsanalyse und Design (abgeschlossen mit diesem Dokument)

**Phase 2**: MVP Development (3 Monate)
- Mitgliederverwaltung
- Basis-Kassenbuch
- Einfache Berichte

**Phase 3**: Erweiterte Funktionen (2 Monate)
- Spendenverwaltung
- Budgetplanung
- DSGVO-Features

**Phase 4**: Compliance und Testing (1 Monat)
- GoBD-Zertifizierung
- Security Audit
- Benutzer-Tests

**Phase 5**: Einführung und Schulung (1 Monat)
- Datenmigration
- Schulungen
- Go-Live

---

## Anhang

### A.1 Glossar

- **GoBD**: Grundsätze ordnungsmäßiger Buchführung
- **DSGVO**: Datenschutz-Grundverordnung
- **AO**: Abgabenordnung
- **EStDV**: Einkommensteuer-Durchführungsverordnung
- **SEPA**: Single Euro Payments Area
- **TOM**: Technische und organisatorische Maßnahmen
- **RBAC**: Role-Based Access Control

### A.2 Referenzen

- DSGVO: https://dsgvo-gesetz.de
- GoBD: BMF-Schreiben vom 28.11.2019
- § 147 AO: Aufbewahrungspflichten
- § 50 EStDV: Zuwendungsbestätigungen
- §§ 51-68 AO: Gemeinnützigkeit

### A.3 Änderungshistorie

| Version | Datum | Autor | Änderungen |
|---------|-------|-------|------------|
| 1.0 | 2025-10-20 | Research Agent | Initiale Erstellung |

