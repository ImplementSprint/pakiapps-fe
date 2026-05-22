import type { UserRole } from "@/lib/auth-types";

function safeLocalStorageGet(key: string) {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

export function getStoredUserIdentity() {
  const userId = safeLocalStorageGet("userId");
  const userRole =
    (safeLocalStorageGet("userRole") || safeLocalStorageGet("user_role")) as
      | UserRole
      | null;
  const userName = safeLocalStorageGet("userName");

  return { userId, userRole, userName };
}

export function getTutorialStorageKey(role: UserRole) {
  const { userId, userName } = getStoredUserIdentity();
  const identity = userId || userName || "anonymous";
  return `tutorial_seen:${role}:${identity}`;
}

export function clearClientSession() {
  if (typeof window === "undefined") return;

  const keysToRemove = [
    "userId",
    "userName",
    "userRole",
    "user_role",
    "is_logged_in",
    "hub_status",
  ];

  for (const key of keysToRemove) {
    window.localStorage.removeItem(key);
  }

  window.sessionStorage.clear();
}
