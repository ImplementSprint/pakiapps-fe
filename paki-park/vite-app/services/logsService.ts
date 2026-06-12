import { api } from './api';

// ─── Transaction Log types ────────────────────────────────────────────────────

export type TransactionType = 'payment' | 'refund' | 'partial_refund' | 'reversal' | 'adjustment';
export type TxStatus        = 'success' | 'failed' | 'pending' | 'refunded';
export type TxPaymentMethod = 'GCash' | 'PayMaya' | 'Credit/Debit Card' | 'Cash' | 'System';

export interface TransactionLog {
  _id:             string;
  id:              number;
  bookingId:       number | null;
  userId:          number | null;
  reference:       string | null;
  transactionType: TransactionType;
  paymentMethod:   TxPaymentMethod;
  amount:          number;
  currency:        string;
  status:          TxStatus;
  description:     string | null;
  metadata:        Record<string, unknown>;
  createdAt:       string;
  /** Populated associations */
  user?:    { id: number; name: string; email: string } | null;
  booking?: { id: number; reference: string; spot: string; date: string; timeSlot: string } | null;
}

export interface TransactionStats {
  totalTransactions: number;
  totalRevenue:      number;
  byPaymentMethod:   { method: string; count: number; total: number }[];
  byTransactionType: { type: string;   count: number; total: number }[];
  monthlyRevenue:    { month: string;  transactions: number; revenue: number }[];
}

// ─── Activity Log types ───────────────────────────────────────────────────────

export type ActivitySeverity = 'info' | 'warning' | 'critical';

export interface ActivityLog {
  _id:        string;
  id:         number;
  userId:     number | null;
  action:     string;
  entityType: string | null;
  entityId:   string | null;
  description:string | null;
  ipAddress:  string | null;
  userAgent:  string | null;
  severity:   ActivitySeverity;
  metadata:   Record<string, unknown>;
  createdAt:  string;
  /** Populated associations */
  user?: { id: number; name: string; email: string; role: string } | null;
}

export interface ActivityStats {
  bySeverity:     { severity: string; count: number }[];
  topActions:     { action: string;   count: number }[];
  byEntityType:   { entityType: string; count: number }[];
  recentCritical: ActivityLog[];
}

// ─── Shared query params ──────────────────────────────────────────────────────

export interface LogQueryParams {
  page?:   number;
  limit?:  number;
  from?:   string;   // YYYY-MM-DD
  to?:     string;   // YYYY-MM-DD
}

export interface TxQueryParams extends LogQueryParams {
  status?:          TxStatus;
  paymentMethod?:   TxPaymentMethod;
  transactionType?: TransactionType;
  reference?:       string;
}

export interface ActivityQueryParams extends LogQueryParams {
  severity?:   ActivitySeverity;
  action?:     string;
  entityType?: string;
  userId?:     number;
}

// ─── Paginated response ───────────────────────────────────────────────────────

export interface PaginatedLogs<T> {
  logs:        T[];
  total:       number;
  page:        number;
  totalPages:  number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

function buildQuery(params: Record<string, unknown>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const logsService = {
  // ── Transaction Logs ─────────────────────────────────────────────────────

  async getTransactionLogs(params?: TxQueryParams): Promise<PaginatedLogs<TransactionLog>> {
    const res = await api.get<PaginatedLogs<TransactionLog>>(
      `/logs/transactions${buildQuery(params ?? {})}`
    );
    return res.data!;
  },

  async getTransactionStats(): Promise<TransactionStats> {
    const res = await api.get<TransactionStats>('/logs/transactions/stats');
    return res.data!;
  },

  // ── Activity Logs ─────────────────────────────────────────────────────────

  async getActivityLogs(params?: ActivityQueryParams): Promise<PaginatedLogs<ActivityLog>> {
    const res = await api.get<PaginatedLogs<ActivityLog>>(
      `/logs/activity${buildQuery(params ?? {})}`
    );
    return res.data!;
  },

  async getActivityStats(): Promise<ActivityStats> {
    const res = await api.get<ActivityStats>('/logs/activity/stats');
    return res.data!;
  },
};
