# PRD — Recibo Fácil / BelegGuard (Facil Labs)

## Vision
Local-first, privacy-friendly mobile app (React Native / Expo, Android-first) that
combines two everyday "don't forget a date" jobs into one app:
1. **Pantry / supplies** — track food & household items and their expiry dates.
2. **Receipts / warranties** — store proof of purchase, warranty and return deadlines.

Brand: Facil Labs — "facilita a sua vida". Names: Recibo Fácil (BR) / BelegGuard (DE).

## Principles
- No servers, no account, **local-first**. All sensitive data stays on the device.
- Privacy-friendly, simple, not overloaded. No AI overkill.
- Multilingual from day one: DE, PT-BR, EN (auto by device language).

## MVP scope (DONE)
### Pantry
- Add/edit product: barcode (optional + camera scan), name (required), brand, quantity.
- Optional product lookup via **Open Food Facts** with graceful offline / not-found fallback.
- Storage location: fridge / freezer / pantry / other. Expiry date (date picker).
- Reminder offsets: on day / 1 day / 3 days / 7 days before (multi-select).
- Status: active / consumed / discarded. List sorted by soonest expiry. Search (name/barcode/brand).
- Local notifications scheduled per offset; re-synced whenever the expiry/status changes.

### Receipts
- Add/edit receipt: photo (camera or gallery), title (required), merchant, purchase date,
  amount, currency, category, warranty-until, return-until, notes.
- Local notifications for warranty and return deadlines. List + search (title/merchant/category/notes).
- Images saved to the app's private document directory; DB stores only the path.

### App-wide
- Home with two primary actions + "Expiring soon" + "Recent receipts".
- Bottom tabs: Home, Pantry, Receipts, Search, Settings.
- Settings: language (auto/DE/PT-BR/EN), default reminders, enable notifications, premium info.
- i18n (i18n-js + expo-localization). Design: Outfit/Manrope, organic-earthy light theme.

## Architecture
- **DB:** expo-sqlite on native (SQLite). Web preview uses a localStorage-backed mirror
  (`src/db/*.web.ts`) so the app is fully usable/testable in the browser too.
- **Data model:** inventory_items, receipts, receipt_images, receipt_ocr_text (reserved for
  future OCR/FTS), notification_settings (maps scheduled notifications to entities).
- **Notifications:** expo-notifications, local scheduled only (no Firebase / no remote push).
- **Files:** expo-file-system (legacy API) — images on disk, paths in DB.
- **Lookup:** Open Food Facts REST, called directly from device, optional & fault-tolerant.

## Not in MVP (architected for later)
- On-device OCR (ML Kit) — needs a dev/EAS build; table reserved. MHD-OCR later as Beta only.
- FTS5 full-text search (schema reserved).
- Export/Backup (JSON + images / ZIP).
- Premium: one-time purchase to lift free limits (`src/config/limits.ts`, ENFORCE_LIMITS=false).

## Roadmap
- v1: both areas, barcode, photo, local DB, local notifications, OFF lookup, search, i18n. ✅
- v1.1: FTS5 search active, export/backup, custom reminders, premium limit enforcement.
- v2: on-device OCR for receipts, MHD-OCR Beta, iOS release.

## Platform notes / honest constraints
- Camera barcode scan, real photo capture, and local notification delivery require a
  **development / EAS build on a real Android device** — they do NOT run in Expo Go web preview.
- Web preview is for UI/flow validation only (uses localStorage data layer).
