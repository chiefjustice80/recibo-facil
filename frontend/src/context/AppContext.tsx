import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { storage } from "@/src/utils/storage";
import { initDatabase, getInitError } from "@/src/db/database";
import { applyLocale, AppLocale, t as translate } from "@/src/i18n";

type LocalePref = AppLocale | "auto";

interface AppState {
  ready: boolean;
  dbError: boolean;
  locale: AppLocale;
  localePref: LocalePref;
  defaultReminders: number[];
  dataVersion: number;
  setLocalePref: (pref: LocalePref) => Promise<void>;
  setDefaultReminders: (offsets: number[]) => Promise<void>;
  refresh: () => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}

const AppContext = createContext<AppState | null>(null);

const KEY_LOCALE = "pref.locale";
const KEY_REMINDERS = "pref.defaultReminders";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [dbError, setDbError] = useState(false);
  const [localePref, setLocalePrefState] = useState<LocalePref>("auto");
  const [locale, setLocale] = useState<AppLocale>("en");
  const [defaultReminders, setDefaultRemindersState] = useState<number[]>([1]);
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    (async () => {
      await initDatabase();
      if (getInitError()) setDbError(true);

      const storedPref = (await storage.getItem(
        KEY_LOCALE,
        "auto",
      )) as LocalePref;
      const resolved = applyLocale(storedPref);
      setLocalePrefState(storedPref);
      setLocale(resolved);

      const storedReminders = await storage.getItem(KEY_REMINDERS, "[1]");
      try {
        const parsed = JSON.parse(storedReminders as string);
        if (Array.isArray(parsed)) setDefaultRemindersState(parsed);
      } catch {
        // keep default
      }

      setReady(true);
    })();
  }, []);

  const setLocalePref = useCallback(async (pref: LocalePref) => {
    const resolved = applyLocale(pref);
    setLocalePrefState(pref);
    setLocale(resolved);
    await storage.setItem(KEY_LOCALE, pref);
  }, []);

  const setDefaultReminders = useCallback(async (offsets: number[]) => {
    setDefaultRemindersState(offsets);
    await storage.setItem(KEY_REMINDERS, JSON.stringify(offsets));
  }, []);

  const refresh = useCallback(() => setDataVersion((v) => v + 1), []);

  const value = useMemo<AppState>(
    () => ({
      ready,
      dbError,
      locale,
      localePref,
      defaultReminders,
      dataVersion,
      setLocalePref,
      setDefaultReminders,
      refresh,
      // bound to `locale` so consumers re-render on language change
      t: (key, options) => translate(key, options),
    }),
    [
      ready,
      dbError,
      locale,
      localePref,
      defaultReminders,
      dataVersion,
      setLocalePref,
      setDefaultReminders,
      refresh,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
