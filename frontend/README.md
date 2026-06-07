# BelegGuard / Recibo Fácil — App (Expo)

This is the Expo (SDK 54) **local-first** mobile app. Full project documentation,
architecture, MVP scope and Windows setup instructions are in the
**[root README](../README.md)**.

## Quick start (Windows / macOS / Linux)

```bash
yarn install
npx expo start          # Expo Go / emulator (limited native features)
# or, for full native features (camera, sqlite, notifications):
npx expo run:android
```

## Project structure

```
app/                     expo-router screens (file-based routing)
  (tabs)/                Home, Inventory, Receipts, Search, Settings
  inventory/add.tsx      Add / edit a pantry product (barcode scan, lookup)
  receipts/add.tsx       Add / edit a receipt (photo, warranty, etc.)
src/
  db/                    SQLite data layer (+ *.web.ts localStorage mirror)
  services/              notifications, fileStorage, openFoodFacts
  components/            shared UI (ui, inputs, rows, BarcodeScannerModal)
  context/               AppContext (locale, reminders, refresh)
  i18n/                  translations (de / pt-BR / en)
  theme/                 design tokens
  config/                premium limit constants (not enforced in MVP)
```

## Useful commands

```bash
npx expo-doctor          # project health & dependency compatibility
npx expo install --check # verify package versions against the SDK
npx eslint .             # lint
```

Local-first: no backend, no account. All data stays on the device.
