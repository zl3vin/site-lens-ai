# SiteLens AI
**URL-based website audit for Search & AI readiness.**

> **Enter a URL. Find out how ready your website is for Search & AI.**
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38BDF8)
![Cheerio](https://img.shields.io/badge/HTML_Parsing-Cheerio-E88C1F)
![Status](https://img.shields.io/badge/Status-MVP-success)

---

## Überblick
**SiteLens AI** ist ein schlankes Website-Audit-Tool, das öffentlich erreichbare Websites anhand technischer, struktureller und inhaltlicher Signale analysiert.

Der Nutzer gibt eine URL ein und erhält anschließend:

- eine Gesamtbewertung von **0–100**
- sechs einzelne Audit-Scores
- erkannte Schwachstellen
- priorisierte Handlungsempfehlungen
Der Fokus liegt nicht nur auf klassischer SEO, sondern zusätzlich auf Signalen, die für die **maschinenlesbare Einordnung einer Website und ihre AI Readiness** relevant sind.

---

## Das Problem
Klassische Website-Audits konzentrieren sich häufig auf technische SEO-Kriterien.

Mit der zunehmenden Bedeutung von KI-gestützten Such- und Antwortsystemen werden jedoch weitere Faktoren relevant:

- Ist eindeutig erkennbar, welches Unternehmen hinter einer Website steht?
- Sind Inhalte strukturiert und maschinenlesbar?
- Werden strukturierte Daten eingesetzt?
- Sind wichtige Informationen klar gegliedert?
- Verfügt die Website über nachvollziehbare Entitäts- und Vertrauenssignale?
SiteLens AI bündelt diese Signale in einem kompakten Audit.

---

## So funktioniert SiteLens AI

```
Website-URL
    ↓
Serverseitiger Abruf
    ↓
HTML-Parsing
    ↓
Regelbasierte Checks
    ↓
6 Audit-Bereiche
    ↓
Gesamt-Score
    ↓
Priorisierte Empfehlungen
```
Für das HTML-Parsing wird **Cheerio** verwendet.

Die Analyse erfolgt serverseitig über eine Next.js API Route.

---

# Audit-Bereiche

## 1. Technik
Prüft grundlegende technische Voraussetzungen der Website.

Beispiele:

- HTTPS
- HTTP-Status
- Viewport
- Canonical URL
- Robots-Signale

---

## 2. Metadaten
Analysiert zentrale Meta-Informationen.

Beispiele:

- Seitentitel
- Title-Länge
- Meta Description
- Description-Länge
- Open Graph

---

## 3. Strukturierte Daten
Untersucht maschinenlesbare Schema.org-Daten.

Beispiele:

- JSON-LD vorhanden
- valides JSON-LD
- erkannte Schema-Typen
- Organization Schema

---

## 4. Inhalte
Bewertet grundlegende Content- und Seitenstrukturen.

Beispiele:

- H1 vorhanden
- H2-Struktur
- sichtbarer Textumfang
- interne Verlinkung

---

## 5. Entitätssignale
Prüft, wie eindeutig das Unternehmen bzw. die Marke hinter der Website erkennbar ist.

Beispiele:

- Organization Schema
- Über-uns-Seite
- Kontakt
- Impressum
- Social-Media-Profile
- `sameAs`-Signale

---

## 6. Zitationsbereitschaft
Bewertet anhand nachvollziehbarer Website-Signale, wie klar Inhalte strukturiert und maschinenlesbar aufbereitet sind.

Einbezogen werden unter anderem:

- Überschriftenstruktur
- strukturierte Daten
- Entitätssignale
- informativer Inhalt
- klar gegliederte Informationsblöcke

> **Wichtig:** Dieser Score ist eine Readiness-Einschätzung. Er misst nicht, ob eine Website tatsächlich von ChatGPT, Gemini, Perplexity oder anderen KI-Systemen zitiert wird.

---

# Scoring
Jeder Audit-Bereich erhält einen Score zwischen:

```
0 – 100
```
Die aktuelle MVP-Version berechnet daraus eine Gesamtbewertung über die sechs Audit-Bereiche.

Beispiel:

```
Gesamtbewertung         88 / 100

Technik                 100 %
Metadaten               100 %
Strukturierte Daten      75 %
Inhalte                 100 %
Entitätssignale          50 %
Zitationsbereitschaft   100 %
```
Die Scores sind **regelbasiert und deterministisch**.

Es werden keine zufälligen oder durch ein LLM erfundenen Bewertungen erzeugt.

---

# Empfehlungen
Aus fehlgeschlagenen Checks erstellt SiteLens AI automatisch bis zu fünf priorisierte Handlungsempfehlungen.

Beispiele:

```
1. Organization Schema ergänzen
2. Canonical URL hinzufügen
3. Meta Description verbessern
4. Unternehmenssignale stärken
5. Inhaltsstruktur verbessern
```
Damit liefert das Tool nicht nur einen Score, sondern direkt nutzbare Ansatzpunkte für die Optimierung.

---

# Tech Stack
TechnologieEinsatz**Next.js**Web-App und serverseitige API**React**Benutzeroberfläche**TypeScript**Typisierte Anwendungslogik**Tailwind CSS**Styling und Responsive Design**Cheerio**Serverseitiges HTML-Parsing**Git / GitHub**Versionsverwaltung**Vercel**Geplantes Deployment
---

# Projektstruktur

```
src/
├── app/
│   ├── api/
│   │   └── analyze/
│   │       └── route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
└── lib/
    ├── audit.ts
    └── types.ts
```
Die erste Version wurde bewusst kompakt gehalten.

Mit wachsendem Funktionsumfang kann die Audit-Engine später in einzelne Module für Technical, Metadata, Structured Data, Content und Entity Signals aufgeteilt werden.

---

# Sicherheit
Da SiteLens AI vom Nutzer eingegebene URLs serverseitig abruft, enthält die Audit-Logik grundlegende Schutzmaßnahmen.

Unter anderem:

- nur HTTP/HTTPS
- Blockierung lokaler Adressen
- Blockierung privater IP-Bereiche
- erneute Prüfung von Redirect-Zielen
- Request-Timeout
- begrenzte Response-Größe
- begrenzte Redirect-Anzahl
Damit soll verhindert werden, dass die öffentliche Audit-Funktion für Zugriffe auf interne Netzwerkressourcen verwendet wird.

---

# Aktueller MVP-Stand
Die aktuelle Version analysiert bewusst **nur die Startseite einer Website**.

Enthalten sind:

- URL-Eingabe
- serverseitiger Website-Abruf
- HTML-Parsing
- Technical Audit
- Metadata Audit
- Structured Data Audit
- Content Audit
- Entity Signals
- Citation Readiness
- Overall Score
- priorisierte Empfehlungen
- grundlegender SSRF-Schutz
- responsive Web-Oberfläche

---

# Roadmap

## V1.1 – Design & Branding

- finales SiteLens-AI-Branding
- optimierte Typografie
- überarbeitete Score-Darstellung
- detaillierte Audit-Ergebnisse
- Mobile-Polish
- dezente UI-Easter-Eggs

## V1.2 – Erweiterter Audit

- Multi-Page Crawl
- detaillierte Einzelchecks
- Technology Detection
- Impact- und Effort-Bewertung
- Quick Wins
- Potenzial-Score

## Spätere Versionen

- Wettbewerbervergleich
- Audit History
- Website Monitoring
- Shareable Reports
- PDF Export
- AI Visibility Tracking
- Prompt Tracking

---

# Lokal starten
Repository klonen und Dependencies installieren:

```
npm install
```
Development Server starten:

```
npm run dev
```
Anschließend:

```
http://localhost:3000
```
Produktions-Build testen:

```
npm run build
```

---

# Ziel des Projekts
SiteLens AI wurde als eigenständiges Portfolio-Projekt entwickelt, um mehrere Bereiche miteinander zu verbinden:

- SEO
- technische Website-Analyse
- Structured Data
- Content-Struktur
- Entity Signals
- AI Readiness
- Webentwicklung
- datenbasierte Handlungsempfehlungen
Der Schwerpunkt liegt darauf, technische Website-Signale **verständlich zu bewerten und in konkrete Maßnahmen zu übersetzen**.

---

## Hinweis
SiteLens AI ist ein unabhängiges Analysewerkzeug.

Das Projekt steht in keiner Verbindung zu Google, OpenAI, Anthropic, Perplexity oder anderen Suchmaschinen- bzw. KI-Anbietern.

Die aktuelle Version misst keine tatsächlichen Rankings, Erwähnungen oder Zitationen innerhalb externer KI-Systeme.

---
**SiteLens AI**
*Enter a URL. Find out how ready your website is for Search & AI.*
![alt text](image.png)