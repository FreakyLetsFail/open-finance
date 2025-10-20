# Compliance-Checkliste: Finanzverwaltungssystem für Vereine

## Übersicht

Diese Checkliste dient zur Überprüfung der Compliance-Anforderungen während Entwicklung, Implementierung und Betrieb des Systems.

---

## 1. DSGVO-Compliance (Datenschutz-Grundverordnung)

### 1.1 Rechtmäßigkeit der Verarbeitung (Art. 6 DSGVO)

- [ ] **Rechtsgrundlage dokumentiert**: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) für Mitgliederdaten
- [ ] **Rechtsgrundlage für Spenden**: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung) oder lit. f (berechtigtes Interesse)
- [ ] **Besondere Kategorien geprüft**: Keine Verarbeitung von Gesundheitsdaten, politischen Meinungen etc. (Art. 9 DSGVO)
- [ ] **Einwilligungserklärungen**: Vorlage für Spender mit Opt-in und Widerrufsmöglichkeit

### 1.2 Informationspflichten (Art. 13-14 DSGVO)

- [ ] **Datenschutzerklärung erstellt**: Für Website und System
- [ ] **Informationen bei Erhebung**: Zweck, Rechtsgrundlage, Speicherdauer, Empfänger
- [ ] **Informationen über Rechte**: Auskunft, Berichtigung, Löschung, Widerspruch
- [ ] **Kontaktdaten DSB**: Datenschutzbeauftragter (falls benötigt) oder Verantwortlicher
- [ ] **Informationen in verständlicher Sprache**: Kein Fachjargon, klare Formulierungen

### 1.3 Betroffenenrechte (Art. 15-22 DSGVO)

- [ ] **Auskunftsrecht (Art. 15)**: Funktion zum Exportieren aller Daten einer Person (JSON/CSV)
- [ ] **Berichtigungsrecht (Art. 16)**: Editierfunktion für Mitgliederdaten mit Änderungshistorie
- [ ] **Löschrecht (Art. 17)**: Funktion für manuelle und automatische Löschung nach Aufbewahrungsfristen
- [ ] **Recht auf Einschränkung (Art. 18)**: Möglichkeit, Daten zu sperren statt zu löschen
- [ ] **Datenportabilität (Art. 20)**: Export in maschinenlesbarem Format (JSON, CSV)
- [ ] **Widerspruchsrecht (Art. 21)**: Opt-out für Newsletter, Marketing
- [ ] **Prozesse dokumentiert**: Workflow für Betroffenenanfragen (Frist: 1 Monat)

### 1.4 Technische und organisatorische Maßnahmen (Art. 32 DSGVO)

**Vertraulichkeit**:
- [ ] **Zugriffskontrolle**: Rollenbasiertes Berechtigungssystem (RBAC)
- [ ] **Authentifizierung**: Starke Passwörter, 2FA für Admin/Kassenwart
- [ ] **Verschlüsselung in Transit**: TLS 1.3 für alle Verbindungen
- [ ] **Verschlüsselung at Rest**: AES-256 für Datenbank und Backups
- [ ] **Session-Management**: Auto-Logout nach 30 Minuten Inaktivität

**Integrität**:
- [ ] **Unveränderbarkeit**: Versionierung, Stornobuchungen statt Löschen
- [ ] **Checksummen**: SHA-256 für hochgeladene Belege
- [ ] **Audit-Log**: Protokollierung aller Änderungen an personenbezogenen Daten

**Verfügbarkeit**:
- [ ] **Backup-Konzept**: Tägliche automatische Backups
- [ ] **Disaster Recovery Plan**: Dokumentiert, getestet (quartalsweise)
- [ ] **Uptime-Ziel**: > 99.5% Verfügbarkeit
- [ ] **Redundanz**: Datenbankreplikation, Multi-Region-Setup (optional)

**Belastbarkeit**:
- [ ] **DDoS-Schutz**: Cloudflare, Vercel Edge Network
- [ ] **Rate Limiting**: API-Limits zur Vermeidung von Missbrauch
- [ ] **Monitoring**: Echtzeit-Überwachung, Alerting bei Anomalien

**Wiederherstellbarkeit**:
- [ ] **Backup-Tests**: Monatlich
- [ ] **RTO dokumentiert**: Recovery Time Objective (4 Stunden)
- [ ] **RPO dokumentiert**: Recovery Point Objective (24 Stunden)

### 1.5 Datenschutz-Folgenabschätzung (Art. 35 DSGVO)

- [ ] **DSFA erforderlich?**: Geprüft (wahrscheinlich nicht bei Standardverarbeitung)
- [ ] **DSFA durchgeführt**: Falls erforderlich, Risiken bewertet
- [ ] **Maßnahmen zur Risikominimierung**: Dokumentiert

### 1.6 Verzeichnis von Verarbeitungstätigkeiten (Art. 30 DSGVO)

- [ ] **Verarbeitungsverzeichnis erstellt**:
  - Verarbeitung 1: Mitgliederverwaltung
  - Verarbeitung 2: Spendenverwaltung
  - Verarbeitung 3: Kassenbuchführung
  - Verarbeitung 4: Benutzerkonten
- [ ] **Zweck dokumentiert**: Für jede Verarbeitung
- [ ] **Kategorien betroffener Personen**: Mitglieder, Spender, Nutzer
- [ ] **Kategorien personenbezogener Daten**: Name, Adresse, Kontodaten, etc.
- [ ] **Empfänger**: Steuerberater, Finanzamt (bei Bedarf)
- [ ] **Drittlandtransfer**: Keine (nur EU-Hosting)
- [ ] **Löschfristen**: 10 Jahre (steuerrelevant), danach Löschung

### 1.7 Auftragsverarbeitung (Art. 28 DSGVO)

- [ ] **Auftragsverarbeitungsverträge (AVV)**: Mit allen Dienstleistern
  - [ ] Vercel (Hosting)
  - [ ] Supabase (Database, Auth, Storage)
  - [ ] AWS S3 (Backups)
  - [ ] SendGrid (E-Mail)
  - [ ] Sentry (Monitoring)
- [ ] **Garantien für EU-Standards**: Standard Contractual Clauses (SCCs)
- [ ] **Subdienestleister**: Auflistung und Genehmigung

### 1.8 Datenschutzverletzungen (Art. 33-34 DSGVO)

- [ ] **Meldeprozess definiert**: An Aufsichtsbehörde (72 Stunden)
- [ ] **Benachrichtigungsprozess**: An Betroffene (bei hohem Risiko)
- [ ] **Incident Response Plan**: Dokumentiert
- [ ] **Breach-Detection**: Monitoring, Alerting
- [ ] **Dokumentation**: Vorlage für Datenschutzverletzungen

### 1.9 Datenschutzbeauftragter (Art. 37-39 DSGVO)

- [ ] **Benennungspflicht geprüft**:
  - Ab 20 Personen mit regelmäßiger Verarbeitung (§ 38 BDSG)
  - Bei umfangreicher Verarbeitung besonderer Kategorien
- [ ] **DSB benannt**: Falls erforderlich
- [ ] **Kontaktdaten veröffentlicht**: Datenschutzerklärung, Impressum
- [ ] **Aufgaben definiert**: Überwachung, Beratung, Schulung

### 1.10 Privacy by Design & Default (Art. 25 DSGVO)

- [ ] **Datensparsamkeit**: Nur notwendige Daten erheben
- [ ] **Pseudonymisierung**: Wo möglich (z.B. anonyme Spenden)
- [ ] **Standardeinstellungen**: Datenschutzfreundlich (Opt-in, nicht Opt-out)
- [ ] **Verschlüsselung**: Per Default aktiviert
- [ ] **Zugriffskontrolle**: Prinzip der minimalen Rechtevergabe

---

## 2. GoBD-Compliance (Grundsätze ordnungsmäßiger Buchführung)

### 2.1 Allgemeine Anforderungen

- [ ] **Richtigkeit**: Buchungen entsprechen Geschäftsvorfällen
- [ ] **Vollständigkeit**: Lückenlose Erfassung aller Vorgänge
- [ ] **Zeitgerechtigkeit**: Buchungen innerhalb 10 Tagen
- [ ] **Ordnung**: Systematische Ablage, eindeutige Belegnummern
- [ ] **Unveränderbarkeit**: Nachträgliche Änderungen nur durch Storno

### 2.2 Nachvollziehbarkeit und Nachprüfbarkeit

- [ ] **Verfahrensdokumentation**: System und Prozesse dokumentiert
- [ ] **Audit-Trail**: Alle Änderungen protokolliert (Wer, Wann, Was)
- [ ] **Belegprinzip**: Keine Buchung ohne Beleg
- [ ] **Originalbelege**: Digitalisiert, revisionssicher archiviert
- [ ] **Kontierung nachvollziehbar**: Kategorie, Konto, Gegenkonto

### 2.3 Unveränderbarkeit

- [ ] **Keine nachträglichen Änderungen**: Nur Stornobuchungen
- [ ] **Versionierung**: Jede Änderung erzeugt neue Version
- [ ] **Zeitstempel**: Jede Buchung mit unveränderlichem Zeitstempel
- [ ] **Technische Maßnahmen**: Append-only Log, Checksummen

### 2.4 Aufbewahrung

- [ ] **Aufbewahrungsfristen**:
  - 10 Jahre für Buchungsbelege, Jahresabschlüsse (§ 147 Abs. 1 AO)
  - 6 Jahre für Geschäftsbriefe, Lieferscheine (§ 147 Abs. 3 AO)
- [ ] **Revisionssichere Archivierung**: Format-Konvertierung dokumentiert
- [ ] **Lesbarkeit**: Auch nach Jahren noch lesbar (keine proprietären Formate)
- [ ] **Zugriff**: Prüfer können innerhalb angemessener Frist auf Daten zugreifen

### 2.5 Verfahrensdokumentation

- [ ] **Allgemeine Beschreibung**: System, Zweck, Benutzer
- [ ] **Anwenderdokumentation**: Bedienungsanleitung
- [ ] **Technische Systemdokumentation**: Architektur, Schnittstellen
- [ ] **Betriebsdokumentation**: Backup, Recovery, Wartung
- [ ] **Änderungshistorie**: Versionen, Updates

### 2.6 Datensicherheit (GoBD)

- [ ] **Zugriffsschutz**: Nur autorisierte Personen
- [ ] **Berechtigungskonzept**: Rollenbasiert, dokumentiert
- [ ] **Protokollierung**: Zugriffe auf Daten
- [ ] **Datensicherung**: Regelmäßig, getestet
- [ ] **Virenschutz**: Aktuelle Schutzmaßnahmen

### 2.7 Internes Kontrollsystem (IKS)

- [ ] **Vier-Augen-Prinzip**: Kritische Buchungen geprüft
- [ ] **Kassenprüfung**: Regelmäßig durch unabhängige Prüfer
- [ ] **Plausibilitätsprüfungen**: Automatische Validierung (Beträge, Konten)
- [ ] **Abstimmungen**: Kontenabstimmung, Soll-Ist-Vergleich

---

## 3. Steuerrechtliche Anforderungen

### 3.1 Abgabenordnung (AO)

- [ ] **§ 147 AO Aufbewahrungspflichten**: 10 Jahre für Buchungsbelege
- [ ] **§ 140 AO Ordnungsvorschriften**: Buchführung ordnungsgemäß
- [ ] **§ 141 AO Buchführungspflichten**: Vollständig, richtig, zeitgerecht
- [ ] **§ 146 AO Ordnungsvorschriften**: Unveränderbarkeit, Nachvollziehbarkeit

### 3.2 Gemeinnützigkeit (§§ 51-68 AO)

- [ ] **§ 55 AO Selbstlosigkeit**: Mittel nur für satzungsmäßige Zwecke
- [ ] **§ 58 AO Vermögensbindung**: Transparente Vermögensübersicht
- [ ] **§ 59-62 AO Anforderungen an Satzung**: Gemeinnützige Zwecke dokumentiert
- [ ] **§ 63 AO Zeitnähe**: Mittel in angemessener Frist verwenden
- [ ] **§ 64 AO Rücklagen**: Zulässige Rücklagen beachtet
- [ ] **Vier-Sphären-Modell**:
  - [ ] Ideeller Bereich (steuerfrei)
  - [ ] Vermögensverwaltung (steuerfrei)
  - [ ] Zweckbetrieb (steuerfrei)
  - [ ] Wirtschaftlicher Geschäftsbetrieb (steuerpflichtig)
- [ ] **Mittelverwendungsnachweis**: Für Finanzamt, Mitgliederversammlung

### 3.3 Spendenrecht (§ 50 EStDV)

- [ ] **Zuwendungsbestätigungen**: Amtliches Muster verwenden
- [ ] **§ 50 Abs. 1 EStDV**: Pflichtangaben (Name Empfänger, Betrag, Datum, etc.)
- [ ] **Numerierung**: Fortlaufende Nummerierung der Bestätigungen
- [ ] **Aufbewahrung**: 10 Jahre (Verein), 1 Jahr nach Verwendung (Spender)
- [ ] **Sammelbestätigungen**: Möglich für Spenden bis 300 €
- [ ] **Widerruf**: Prozess für ungültige Bestätigungen

### 3.4 Umsatzsteuer (UStG)

- [ ] **§ 12 UStG**: Regelsteuersatz 19%, ermäßigt 7%
- [ ] **§ 4 Nr. 20 UStG**: Steuerbefreiung für gemeinnützige Vereine (ideeller Bereich)
- [ ] **Kleinunternehmerregelung (§ 19 UStG)**: Falls Umsatz < 22.000 € (2020: 50.000 €)
- [ ] **Vorsteuerabzug**: Dokumentation für abzugsfähige Vorsteuer

---

## 4. Vereinsrechtliche Anforderungen

### 4.1 BGB-Vereinsrecht (§§ 21-79 BGB)

- [ ] **§ 27 BGB Vorstand**: Vertretungsberechtigung dokumentiert
- [ ] **§ 28 BGB Vermögensverwaltung**: Ordnungsgemäße Verwaltung
- [ ] **§ 29 BGB Kassenprüfung**: Regelmäßige Prüfung durch Kassenprüfer
- [ ] **§ 32 BGB Mitgliederversammlung**: Rechenschaftspflicht, Finanzbericht

### 4.2 Transparenzanforderungen

- [ ] **Rechenschaftsbericht**: Für Mitgliederversammlung (jährlich)
- [ ] **Kassenbericht**: Einnahmen, Ausgaben, Kontostände
- [ ] **Vermögensübersicht**: Aktiva, Passiva
- [ ] **Einsichtsrecht**: Mitglieder können Unterlagen einsehen (auf Anfrage)

### 4.3 Haftung

- [ ] **Sorgfaltspflicht**: Nachweis ordnungsgemäßer Verwaltung
- [ ] **Kassenprüfung**: Dokumentiert (Protokoll, Bericht)
- [ ] **Versicherung**: D&O-Versicherung für Vorstand (empfohlen)

---

## 5. Technische Compliance

### 5.1 IT-Sicherheit

- [ ] **BSI IT-Grundschutz**: Angemessene Schutzmaßnahmen
- [ ] **Penetration Testing**: Jährlich durch externe Experten
- [ ] **Vulnerability Scanning**: Regelmäßig (monatlich)
- [ ] **Patch Management**: Zeitnahe Updates für Sicherheitslücken
- [ ] **Security Awareness**: Schulungen für Nutzer

### 5.2 Accessibility (WCAG 2.1)

- [ ] **Level A**: Basisanforderungen erfüllt
- [ ] **Level AA**: Erweiterte Anforderungen (Ziel)
- [ ] **Tastaturnavigation**: Alle Funktionen ohne Maus bedienbar
- [ ] **Screen-Reader**: Kompatibilität geprüft
- [ ] **Kontraste**: Mindestkontrast 4.5:1
- [ ] **Formulare**: Labels, Fehlermeldungen barrierefrei

### 5.3 Performance

- [ ] **Core Web Vitals**: LCP < 2.5s, FID < 100ms, CLS < 0.1
- [ ] **Lighthouse Score**: > 90 (Performance, Accessibility, Best Practices, SEO)
- [ ] **Load Testing**: System unter Last getestet (50+ gleichzeitige Nutzer)

---

## 6. Vertragliche Compliance

### 6.1 Nutzungsbedingungen

- [ ] **Terms of Service**: Erstellt, rechtlich geprüft
- [ ] **Haftungsausschluss**: Angemessene Haftungsbeschränkungen
- [ ] **Kündigung**: Regelungen für Vertragsbeendigung
- [ ] **Änderungen**: Prozess für Änderungen der AGB

### 6.2 Lizenzierung

- [ ] **Open-Source-Lizenzen**: Compliance geprüft (MIT, Apache, GPL)
- [ ] **Drittanbieter-Bibliotheken**: Lizenzvereinbarkeit
- [ ] **Lizenz-Scan**: Automatisiert (npm license-checker)

### 6.3 Service Level Agreements (SLA)

- [ ] **Verfügbarkeit**: 99.5% Uptime garantiert
- [ ] **Support-Zeiten**: Reaktionszeiten definiert
- [ ] **Wartungsfenster**: Kommuniziert (z.B. Sonntag 2-4 Uhr)
- [ ] **Eskalationsprozess**: Bei Ausfällen

---

## 7. Organisatorische Compliance

### 7.1 Rollen und Verantwortlichkeiten

- [ ] **RACI-Matrix**: Erstellt (Responsible, Accountable, Consulted, Informed)
- [ ] **Vertreterregelungen**: Für Ausfall von Schlüsselpersonen
- [ ] **Onboarding**: Prozess für neue Nutzer
- [ ] **Offboarding**: Prozess bei Austritt (Zugriff entziehen)

### 7.2 Schulungen

- [ ] **Admin-Schulung**: Dokumentiert, durchgeführt
- [ ] **Kassenwart-Schulung**: DSGVO, GoBD, System-Bedienung
- [ ] **Allgemeine Nutzer**: Basis-Schulung (2 Stunden)
- [ ] **Datenschutz-Schulung**: Jährlich für alle Nutzer
- [ ] **Security Awareness**: Phishing, Passwörter, Social Engineering

### 7.3 Dokumentation

- [ ] **Benutzerhandbuch**: Erstellt, aktuell
- [ ] **Admin-Handbuch**: Erstellt
- [ ] **Technische Dokumentation**: Architektur, APIs
- [ ] **Verfahrensdokumentation (GoBD)**: Vollständig
- [ ] **Datenschutzerklärung**: Veröffentlicht
- [ ] **Verarbeitungsverzeichnis**: Aktuell

---

## 8. Betriebliche Compliance

### 8.1 Incident Management

- [ ] **Incident Response Plan**: Dokumentiert, getestet
- [ ] **Eskalationsprozess**: Definiert (L1, L2, L3 Support)
- [ ] **Post-Mortem-Prozess**: Nach Incidents
- [ ] **Kommunikation**: Statusseite, E-Mail-Updates

### 8.2 Change Management

- [ ] **Change-Prozess**: RFC (Request for Change)
- [ ] **Release-Planung**: Regelmäßige Release-Zyklen
- [ ] **Rollback-Strategie**: Für fehlgeschlagene Releases
- [ ] **Testing vor Produktiv**: Staging-Umgebung

### 8.3 Monitoring und Alerting

- [ ] **Uptime-Monitoring**: Externe Überwachung (Uptime Robot)
- [ ] **Error-Tracking**: Sentry, automatische Benachrichtigungen
- [ ] **Performance-Monitoring**: Vercel Analytics
- [ ] **Security-Monitoring**: Ungewöhnliche Zugriffe, Failed Logins
- [ ] **Alerting**: Email, SMS, Slack für kritische Events

---

## 9. Audit und Zertifizierung

### 9.1 Internes Audit

- [ ] **Quartalsweise Überprüfung**: Compliance-Status
- [ ] **Checkliste abarbeiten**: Diese Checkliste
- [ ] **Dokumentation**: Audit-Bericht
- [ ] **Maßnahmen**: Bei Abweichungen

### 9.2 Externes Audit

- [ ] **DSGVO-Audit**: Durch Datenschutzexperten (vor Produktivstart)
- [ ] **GoBD-Zertifizierung**: Durch anerkannte Stelle (z.B. IDW, DATEV)
- [ ] **Penetration Test**: Jährlich
- [ ] **ISO 27001** (optional): IT-Sicherheit

### 9.3 Kassenprüfung

- [ ] **Kassenprüfer benannt**: Laut Satzung
- [ ] **Prüfungsrechte**: Zugriff auf System
- [ ] **Prüfbericht-Vorlage**: Im System
- [ ] **Prüfung dokumentiert**: Protokoll für Mitgliederversammlung

---

## 10. Continuous Compliance

### 10.1 Regelmäßige Reviews

- [ ] **Monatlich**: Security-Updates, Patch-Level
- [ ] **Quartalsweise**: Compliance-Checkliste, Berechtigungen
- [ ] **Halbjährlich**: Verarbeitungsverzeichnis, Datenschutzerklärung
- [ ] **Jährlich**: Externe Audits, Verträge, Policies

### 10.2 Gesetzesänderungen

- [ ] **Legal Monitoring**: Abonnement für Rechts-Newsletter
- [ ] **Impact Assessment**: Bei neuen Gesetzen
- [ ] **Anpassungen**: System, Prozesse, Dokumentation
- [ ] **Kommunikation**: An Nutzer, Betroffene

### 10.3 Verbesserungsprozess

- [ ] **Feedback-System**: Nutzer können Verbesserungen melden
- [ ] **Lessons Learned**: Nach Incidents, Audits
- [ ] **Kontinuierliche Verbesserung**: Iterative Anpassungen
- [ ] **Benchmarking**: Best Practices aus Industrie

---

## Zusammenfassung: Kritische Compliance-Anforderungen

### Must-Have (vor Produktivstart):

1. ✅ **DSGVO**:
   - Datenschutzerklärung
   - Betroffenenrechte (Auskunft, Löschung)
   - TOMs (Verschlüsselung, Zugriffskontrolle)
   - AVVs mit allen Dienstleistern
   - Verarbeitungsverzeichnis

2. ✅ **GoBD**:
   - Unveränderbarkeit (Versionierung, Stornos)
   - Vollständigkeit (lückenlose Belegnummern)
   - Verfahrensdokumentation
   - Aufbewahrung (10 Jahre)

3. ✅ **Steuerrecht**:
   - Zuwendungsbestätigungen (§ 50 EStDV)
   - Mittelverwendungsnachweis (§ 55 AO)
   - Aufbewahrungsfristen (§ 147 AO)

4. ✅ **Vereinsrecht**:
   - Rechenschaftsbericht
   - Kassenprüfung

### Nice-to-Have (nach Produktivstart):

- GoBD-Zertifizierung durch externe Stelle
- ISO 27001 Zertifizierung
- Erweiterte Analysen und Dashboards
- Mobile App
- API für Drittanbieter

---

## Verantwortlichkeiten

| Bereich | Verantwortlich | Prüfung |
|---------|----------------|---------|
| DSGVO | Datenschutzbeauftragter / Projektleiter | Datenschutzaudit |
| GoBD | Kassenwart / Steuerberater | Wirtschaftsprüfer |
| Steuerrecht | Schatzmeister / Steuerberater | Finanzamt |
| IT-Sicherheit | System-Administrator | Penetration Tester |
| Vereinsrecht | Vorstand | Kassenprüfer |

---

## Änderungshistorie

| Version | Datum | Autor | Änderungen |
|---------|-------|-------|------------|
| 1.0 | 2025-10-20 | Research Agent | Initiale Erstellung |

---

**Hinweis**: Diese Checkliste basiert auf dem aktuellen Rechtsstand (Januar 2025). Bei Gesetzesänderungen muss die Checkliste aktualisiert werden. Rechtliche Beratung durch Fachanwälte wird empfohlen.
