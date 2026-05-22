import type { Notification } from "@/features/components/NotificationDropdown";

const STORAGE_KEY = "customerLocalNotifications";

type LocalNotificationInput = {
  type: Notification["type"];
  title: string;
  message: string;
};

type StoredNotification = Notification & {
  createdAt: string;
};

function formatRelativeTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  const diffMs = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < hour) {
    const minutes = Math.max(1, Math.floor(diffMs / minute));
    return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  }

  if (diffMs < day) {
    const hours = Math.max(1, Math.floor(diffMs / hour));
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.max(1, Math.floor(diffMs / day));
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function readStoredNotifications() {
  if (typeof window === "undefined") {
    return [] as StoredNotification[];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [] as StoredNotification[];
    }

    const parsed = JSON.parse(raw) as StoredNotification[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [] as StoredNotification[];
  }
}

function writeStoredNotifications(notifications: StoredNotification[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  window.dispatchEvent(new Event("storage"));
}

function getNotificationSignature(notification: Pick<Notification, "type" | "title" | "message">) {
  return `${notification.type}::${notification.title.trim()}::${notification.message.trim()}`;
}

export function pushLocalCustomerNotification(input: LocalNotificationInput) {
  const createdAt = new Date().toISOString();
  const nextNotification: StoredNotification = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: input.type,
    title: input.title,
    message: input.message,
    time: formatRelativeTime(createdAt),
    isRead: false,
    createdAt,
  };

  const notifications = readStoredNotifications();
  writeStoredNotifications([nextNotification, ...notifications].slice(0, 20));
}

export function getLocalCustomerNotifications() {
  return readStoredNotifications().map((notification) => ({
    ...notification,
    time: formatRelativeTime(notification.createdAt),
  }));
}

export function mergeCustomerNotifications(notifications: Notification[]) {
  const localNotifications = getLocalCustomerNotifications();
  const merged = [...notifications];
  const seen = new Set(
    notifications.map((notification) => getNotificationSignature(notification)),
  );

  for (const localNotification of localNotifications) {
    const signature = getNotificationSignature(localNotification);
    if (!seen.has(signature)) {
      merged.push(localNotification);
      seen.add(signature);
    }
  }

  return merged
    .sort((left, right) => {
      const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
      const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
      return rightTime - leftTime;
    })
    .slice(0, 20);
}

export function markLocalCustomerNotificationAsRead(notificationId: string) {
  const notifications = readStoredNotifications();
  writeStoredNotifications(
    notifications.map((notification) =>
      notification.id === notificationId
        ? { ...notification, isRead: true }
        : notification,
    ),
  );
}

export function markAllLocalCustomerNotificationsAsRead() {
  const notifications = readStoredNotifications();
  writeStoredNotifications(
    notifications.map((notification) => ({ ...notification, isRead: true })),
  );
}

export function clearAllLocalCustomerNotifications() {
  writeStoredNotifications([]);
}
