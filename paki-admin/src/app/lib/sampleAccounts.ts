const SAMPLE_ACCOUNT_NAMES: Record<string, string> = {
  'admin@gmail.com': 'Zachary Miguel Navarro',
  'superadmin@gmail.com': 'Daniel Xavier Castillo',
};

export type AccountRole = 'super-admin' | 'admin';

const SAMPLE_ACCOUNT_ROLES: Record<string, AccountRole> = {
  'admin@gmail.com': 'admin',
  'superadmin@gmail.com': 'super-admin',
};

export function getSampleAccountName(email?: string | null) {
  if (!email) {
    return undefined;
  }

  return SAMPLE_ACCOUNT_NAMES[email.trim().toLowerCase()];
}

export function getDisplayNameForEmail(email: string | undefined | null, fallback: string) {
  return getSampleAccountName(email) || fallback;
}

export function getSampleAccountRole(email?: string | null): AccountRole {
  if (!email) {
    return 'admin';
  }

  return SAMPLE_ACCOUNT_ROLES[email.trim().toLowerCase()] || 'admin';
}

export function getAccountRoleLabel(role?: AccountRole) {
  return role === 'super-admin' ? 'Super Admin' : 'Admin';
}
