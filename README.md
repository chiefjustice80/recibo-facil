# BelegGuard / Recibo Fácil

> Facil Labs — *facilita a sua vida*
> Eine **local-first** Expo/React-Native-App zum Verwalten von Lebensmittel-Ablaufdaten
> und zum sicheren Aufbewahren von Belegen, Garantien und Kaufnachweisen.

- **Brasilien:** Recibo Fácil
- **Deutschland:** BelegGuard

---

## 1. Ziel der App

Zwei alltägliche „Vergiss-kein-Datum"-Aufgaben in einer App:

1. **Vorräte / Lebensmittel** — Produkt per Barcode scannen oder manuell erfassen,
   Mindesthaltbarkeits-/Ablaufdatum speichern und **lokal** rechtzeitig erinnert werden.
2. **Belege / Garantien** — Kaufbelege fotografieren, lokal speichern, benennen und
   optional Händler, Betrag, Kategorie, Garantie- und Rückgabefristen hinterlegen –
   inkl. **lokaler** Erinnerung vor Fristablauf.

## 2. Produktphilosophie

- **Kein eigener Server, kein Backend, kein Account-Zwang.**
- **Local-first:** Alle Daten bleiben auf dem Gerät (SQLite + App-Dateisystem).
- Keine Cloud-Synchronisierung, keine Werbung, kein Tracking.
- Datenschutzfreundlich und bewusst einfach. Android-first, iOS später.

## 3. Tech Stack

| Bereich | Technologie |
|---|---|
| Framework | Expo **SDK 54**, React **19.1**, React Native **0.81** |
| Sprache | TypeScript |
| Navigation | expo-router (file-based) |
| Lokale DB | **expo-sqlite** (nativ) · localStorage-Spiegel im Web-Preview |
| Dateien | expo-file-system (Bilder im Dokumentverzeichnis) |
| Kamera / Barcode | expo-camera |
| Fotos | expo-image-picker |
| Benachrichtigungen | expo-notifications (**nur lokal**, kein Remote-Push) |
| i18n | i18n-js + expo-localization (DE / PT-BR / EN) |
| Tastatur | react-native-keyboard-controller |
| Icons / Fonts | lucide-react-native, @expo-google-fonts (Outfit, Manrope) |
| Produkt-Lookup | Open Food Facts (optional, fehlertolerant) |

## 4. Local-first-Architektur

```
Gerät
 ├─ SQLite (expo-sqlite)
 │   ├─ inventory_items        Produkte / Vorräte
 │   ├─ receipts               Belege / Garantien
 │   ├─ receipt_images         Pfade zu Belegbildern
 │   ├─ receipt_ocr_text       (reserviert für spätere OCR/Volltextsuche)
 │   └─ notification_settings  geplante lokale Erinnerungen ↔ Datensatz
 ├─ Dokumentverzeichnis/receipts/   Belegfotos (nur Pfade in der DB)
 └─ Lokale Notifications (expo-notifications)
```

- Es werden **keine** Daten an einen Server gesendet.
- Der einzige optionale Netzwerkaufruf ist der **Open-Food-Facts-Lookup** beim Barcode-Scan
  (rein optional; die App funktioniert vollständig offline und wenn kein Produkt gefunden wird).

> **Hinweis zum Ordner `backend/`:** Dieser stammt aus dem Plattform-Gerüst und wird von der
> App **nicht** verwendet. Für ein eigenständiges Repo kann er zusammen mit `tests/`,
> `test_reports/`, `memory/` und `test_result.md` gelöscht werden.

---

## 5. Voraussetzungen

- **Node.js 20 LTS** (empfohlen; SDK 54 unterstützt Node 20/22)
- **Yarn 1.x** (Classic) — dieses Projekt nutzt `yarn.lock`
- **Android Studio** (für Emulator) oder ein echtes Android-Gerät mit **Expo Go**
- Für native Funktionen (Kamera, SQLite, Notifications): ein **Development Build**

## 6. Installation unter Windows

```powershell
# 1. Repository klonen und in den App-Ordner wechseln
cd frontend

# 2. Abhängigkeiten installieren
yarn install

# 3. Optional: Projekt-Health prüfen
npx expo-doctor
```

### Umgebungsvariablen

Die Datei `frontend/.env` ist (korrekt) per `.gitignore` ausgeschlossen und enthält im
Plattform-Preview interne Variablen. Für eine **eigene** lokale Entwicklung wird normalerweise
**keine** `.env` benötigt – die App ist local-first. Lege bei Bedarf eine eigene `.env` an
(nur `EXPO_PUBLIC_*`-Variablen sind im Client sichtbar).

## 7. Start der Android-App

### Variante A — Schnelltest mit Expo Go (eingeschränkt)
```powershell
cd frontend
npx expo start
# Im Terminal "a" drücken (Android-Emulator) oder den QR-Code mit Expo Go scannen
```
> In Expo Go sind echter Kamera-Scan, Foto-Aufnahme und die Zustellung lokaler
> Notifications **nicht zuverlässig** testbar.

### Variante B — Development Build (empfohlen, voller Funktionsumfang)
```powershell
cd frontend
npx expo run:android
```
Damit werden die nativen Module (expo-camera, expo-sqlite, expo-notifications) eingebunden
und alle MVP-Funktionen sind auf einem echten Gerät/Emulator testbar.

## 8. Wichtige Befehle

```powershell
yarn install            # Abhängigkeiten installieren
npx expo start          # Dev-Server starten
npx expo run:android    # Android Development Build bauen & starten
npx expo-doctor         # Projekt auf Kompatibilität prüfen
npx expo install --check# Versions-Kompatibilität der Pakete prüfen
npx eslint .            # Linting
```

---

## 9. MVP-Scope (enthalten)

**Vorräte**
- Barcode-Scan (Kamera) + manuelle Eingabe
- Optionaler Open-Food-Facts-Lookup (offline-/fehlertolerant)
- MHD/Ablaufdatum, Lagerort (Kühlschrank/Gefrierfach/Vorratsschrank/Sonstiges), Menge
- Erinnerungen (am Tag / 1 / 3 / 7 Tage vorher)
- Status aktiv/verbraucht/entsorgt, Liste nach nächstem Ablauf sortiert, Suche

**Belege**
- Foto (Kamera oder Galerie), dauerhaft lokal gespeichert
- Titel, Händler, Kaufdatum, Betrag, Währung, Kategorie, Garantie-/Rückgabefrist, Notizen
- Lokale Erinnerungen für Garantie-/Fristdaten
- Liste + Suche (Titel / Händler / Kategorie / Notizen)

**App-weit**
- Startscreen mit zwei Hauptaktionen + „Läuft bald ab" + „Aktuelle Belege"
- Tabs: Start / Vorräte / Belege / Suche / Einstellungen
- Mehrsprachig (DE / PT-BR / EN, automatisch nach Gerätesprache)

## 10. Ausdrücklich (noch) NICHT enthalten

- **OCR / Texterkennung** — nur architektonisch vorbereitet (Tabelle `receipt_ocr_text`),
  benötigt native On-Device-Module und einen Development Build. Geplant für v2,
  MHD-OCR nur als Beta.
- **Cloud-Sync / Backup in die Cloud**
- **Accountsystem / Login**
- **Monetarisierung / Premium-Kauf** — Limits sind als Konstanten vorbereitet
  (`src/config/limits.ts`), aber **nicht** erzwungen.
- **Werbung**, Family Sharing, automatische Positionsanalyse von Kassenzetteln

## 11. Bekannte Einschränkungen

- Kamera, Barcode-Scan, SQLite-Persistenz und lokale Notifications laufen **nicht** im
  Web-Preview und nur eingeschränkt in Expo Go → voll testbar erst im **Development/EAS-Build**.
- Open-Food-Facts-Treffer hängen von der öffentlichen Datenbank ab; ohne Treffer/Internet
  erfolgt die Eingabe manuell.
- Lokale Notifications werden vom Betriebssystem geplant; sehr aggressive Akku-Spar-Modi
  (besonders auf manchen Android-Herstellern) können die Auslösung verzögern.

## 12. Roadmap

- **v1** (aktuell): beide Bereiche, Barcode, Foto, lokale DB, lokale Notifications, Suche, i18n.
- **v1.1**: FTS5-Volltextsuche, Export/Backup (JSON + Bilder), benutzerdefinierte Erinnerungen,
  Premium-Limit aktivieren.
- **v2**: On-Device-OCR (ML Kit) für Belege, MHD-OCR als Beta, iOS-Release.

---

© Facil Labs. Local-first. Deine Daten bleiben bei dir.
