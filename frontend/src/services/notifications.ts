import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { initDatabase, genId } from "../db/database";
import { fromISODate, whenLabel } from "../utils/dates";
import { t } from "../i18n";
import { InventoryItem, Receipt } from "../db/types";

const CHANNEL_ID = "reminders";
const REMINDER_HOUR = 9; // fire reminders at 09:00 local time

// Foreground presentation (SDK 54 keys).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

let channelReady = false;

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android" || channelReady) return;
  try {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#2B5A50",
    });
    channelReady = true;
  } catch {
    // ignore — channel creation only matters on real Android devices
  }
}

export async function getNotificationStatus(): Promise<Notifications.PermissionStatus | null> {
  if (Platform.OS === "web") return null;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  } catch {
    return null;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    await ensureAndroidChannel();
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    const req = await Notifications.requestPermissionsAsync();
    return req.granted;
  } catch {
    return false;
  }
}

function fireDateFor(iso: string | null, offsetDays: number): Date | null {
  const base = fromISODate(iso);
  if (!base) return null;
  base.setDate(base.getDate() - offsetDays);
  base.setHours(REMINDER_HOUR, 0, 0, 0);
  return base;
}

async function scheduleAt(
  fireDate: Date,
  title: string,
  body: string,
): Promise<string | null> {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: false },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireDate,
        channelId: CHANNEL_ID,
      },
    });
    return id;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[notify] schedule failed", e);
    return null;
  }
}

async function recordSchedule(
  entityType: string,
  entityId: string,
  scheduledId: string,
  fireDate: string,
  offsetDays: number,
): Promise<void> {
  const db = await initDatabase();
  if (!db) return;
  await db.runAsync(
    `INSERT INTO notification_settings
      (id, entity_type, entity_id, scheduled_id, fire_date, offset_days)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [genId(), entityType, entityId, scheduledId, fireDate, offsetDays],
  );
}

// Cancel every scheduled notification linked to an entity and clear its rows.
export async function cancelEntityReminders(
  entityType: string,
  entityId: string,
): Promise<void> {
  const db = await initDatabase();
  if (!db) return;
  const rows = await db.getAllAsync<{ scheduled_id: string }>(
    `SELECT scheduled_id FROM notification_settings
     WHERE entity_type = ? AND entity_id = ?`,
    [entityType, entityId],
  );
  for (const r of rows) {
    try {
      await Notifications.cancelScheduledNotificationAsync(r.scheduled_id);
    } catch {
      // already fired / unavailable
    }
  }
  await db.runAsync(
    `DELETE FROM notification_settings WHERE entity_type = ? AND entity_id = ?`,
    [entityType, entityId],
  );
}

// (Re)build all reminders for a pantry item based on its expiry + offsets.
export async function syncInventoryReminders(
  item: InventoryItem,
): Promise<void> {
  if (Platform.OS === "web") return;
  await ensureAndroidChannel();
  await cancelEntityReminders("inventory", item.id);

  if (item.status !== "active" || !item.expiry_date) return;
  const offsets = item.reminder_offsets?.length ? item.reminder_offsets : [];
  const now = new Date();

  for (const offset of offsets) {
    const fire = fireDateFor(item.expiry_date, offset);
    if (!fire || fire.getTime() <= now.getTime()) continue;
    const body = t("notify.expiryBody", {
      name: item.name,
      when: whenLabel(item.expiry_date),
    });
    const id = await scheduleAt(fire, t("notify.expiryTitle"), body);
    if (id) {
      await recordSchedule(
        "inventory",
        item.id,
        id,
        fire.toISOString(),
        offset,
      );
    }
  }
}

// (Re)build warranty + return reminders for a receipt (fires on the day).
export async function syncReceiptReminders(receipt: Receipt): Promise<void> {
  if (Platform.OS === "web") return;
  await ensureAndroidChannel();
  await cancelEntityReminders("receipt_warranty", receipt.id);
  await cancelEntityReminders("receipt_return", receipt.id);

  const now = new Date();

  const plan: {
    type: "receipt_warranty" | "receipt_return";
    date: string | null;
    title: string;
    bodyKey: string;
  }[] = [
    {
      type: "receipt_warranty",
      date: receipt.warranty_until,
      title: t("notify.warrantyTitle"),
      bodyKey: "notify.warrantyBody",
    },
    {
      type: "receipt_return",
      date: receipt.return_until,
      title: t("notify.returnTitle"),
      bodyKey: "notify.returnBody",
    },
  ];

  for (const p of plan) {
    if (!p.date) continue;
    const fire = fireDateFor(p.date, 0);
    if (!fire || fire.getTime() <= now.getTime()) continue;
    const body = t(p.bodyKey, {
      title: receipt.title,
      when: whenLabel(p.date),
    });
    const id = await scheduleAt(fire, p.title, body);
    if (id) {
      await recordSchedule(p.type, receipt.id, id, fire.toISOString(), 0);
    }
  }
}

export async function cancelAllReceiptReminders(
  receiptId: string,
): Promise<void> {
  await cancelEntityReminders("receipt_warranty", receiptId);
  await cancelEntityReminders("receipt_return", receiptId);
}
