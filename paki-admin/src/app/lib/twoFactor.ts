export type TwoFactorPlatform = 'pakiadmin' | 'pakiship' | 'pakipark';

export function normalizeTwoFactorEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getTwoFactorStorageKey(platform: TwoFactorPlatform, email: string) {
  return `${platform}:2fa:${normalizeTwoFactorEmail(email)}`;
}

export function isTwoFactorEnabledForEmail(email: string, platforms: TwoFactorPlatform[] = ['pakiadmin', 'pakiship', 'pakipark']) {
  if (typeof window === 'undefined') {
    return false;
  }

  const normalizedEmail = normalizeTwoFactorEmail(email);

  if (!normalizedEmail) {
    return false;
  }

  return platforms.some((platform) => window.localStorage.getItem(getTwoFactorStorageKey(platform, normalizedEmail)) === 'enabled');
}
