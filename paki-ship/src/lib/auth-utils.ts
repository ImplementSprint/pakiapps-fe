import type { UserRole } from "@/lib/auth-types";

export function getRedirectPath(role: UserRole) {
  if (role === "driver") return "/driver/home";
  if (role === "operator") return "/operator/home";
  return "/customer/home";
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "").slice(-10);
}
