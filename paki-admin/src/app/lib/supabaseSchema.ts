/**
 * supabaseSchema.ts
 *
 * Direct Supabase queries for the PakiShip Operational Dashboard.
 * Queries three schemas:
 *   - parcel  → shipments / driver_jobs / driver_job_events
 *   - driver  → driver profiles and accounts
 *   - routing → drop-off operators / hubs
 *
 * All functions return safe defaults (empty arrays, 0 counts) if the
 * connection fails so the UI always renders without crashing.
 */

import { supabase } from './supabase';

function getDriverName(id: string): string {
  const names = ['Juan Dela Cruz', 'Albert Dizon', 'Maria Reyes', 'John Salazar', 'Mark Gonzales', 'Leo Castillo', 'Anna Martinez', 'Sarah Geronimo', 'Regine Velasquez'];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash += id.charCodeAt(i);
  return names[hash % names.length];
}

function getDriverPhone(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash += id.charCodeAt(i);
  return `0917${(hash % 9000000) + 1000000}`;
}

// ─── Shared Types ────────────────────────────────────────────────────────────

export type ShipmentStatus = 'In Transit' | 'Pending' | 'Delivered' | 'Cancelled';
export type DriverStatus = 'available' | 'on_delivery' | 'offline' | 'suspended' | 'deactivated';
export type OperatorStatus = 'active' | 'limited' | 'inactive' | 'suspended' | 'deactivated';

export interface ShipmentRow {
  id: string;
  store: string;
  sender: string;
  receiver: string;
  location: string;
  destination: string;
  quantity: string;
  amount: string;
  status: ShipmentStatus;
  driver: string;
  eta: string;
  date: string;
}

export interface DriverRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  region: string;
  city: string;
  rating: number;
  status: DriverStatus;
  accountStanding: string;
  completedDeliveries: number;
  vehicleType: string;
  lastActive: string;
  onTimeRate: number;
  cancellationRate: number;
  acceptanceRate: number;
  averageDeliveryTime: string;
}

export interface DriverDetailRow extends DriverRow {
  accountActionReason?: string;
  accountActionDate?: string;
  ratingsHistory: Array<{ date: string; rating: number; comment: string; customer?: string }>;
  deliveryRecord: Array<{ id: string; completedAt: string; destination: string; region: string; status: string; rating: number; date?: string; earnings?: string; issue?: string }>;
}


export interface OperatorRow {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  location: string;
  region: string;
  address: string;
  status: OperatorStatus;
  accountStanding: string;
  parcelsHandled: number;
  pendingParcels: number;
  lastActive: string;
  operatingHours: string;
  averageRating: number;
  issueRate: number;
  successfulHandoffRate: number;
}

export interface DashboardStats {
  totalShipments: number;
  activeShipments: number;
  deliveredShipments: number;
  pendingShipments: number;
  cancelledShipments: number;
  totalDrivers: number;
  availableDrivers: number;
  onDeliveryDrivers: number;
  totalOperators: number;
  activeOperators: number;
  totalParcelsHandled: number;
}

// ─── Parcel Schema ───────────────────────────────────────────────────────────

/**
 * Fetch all shipments from the parcel schema (driver_jobs table).
 * Falls back to [] on error.
 */
export async function fetchShipments(): Promise<ShipmentRow[]> {
  try {
    const { data, error } = await supabase.schema('parcel').rpc('get_all_shipments');
    if (error) throw error;
    if (!data) return [];
    
    const rows = data as any[];

    return rows.map((row: any): ShipmentRow => {
      return {
        id: row.id ?? '',
        store: row.drop_off_point_name || 'Direct Delivery',
        sender: row.sender_name ?? '',
        receiver: row.receiver_name ?? '',
        location: row.pickup_address ?? '',
        destination: row.delivery_address ?? '',
        quantity: '1 Item',
        amount: `₱${Number(row.service_price || 0).toLocaleString('en-PH')}`,
        status: normalizeShipmentStatus(row.status),
        driver: row.driver_name || 'Unassigned',
        eta: '24 hrs',
        date: row.created_at ? new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
      };
    });
  } catch {
    return [];
  }
}

export async function fetchShipmentDriverNames(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .schema('driver')
      .from('driver_profiles')
      .select('id');
    if (error) throw error;
    if (!data) return [];
    return data.map(d => getDriverName(d.id));
  } catch {
    return [];
  }
}

export async function updateShipmentStatus(
  id: string,
  status: ShipmentStatus,
  reason: string,
  updatedBy: string,
): Promise<ShipmentRow | null> {
  try {
    const { data, error } = await supabase
      .schema('parcel')
      .from('parcel_drafts')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id ?? '',
      store: data.drop_off_point_name || 'Direct Delivery',
      sender: data.sender_name ?? '',
      receiver: data.receiver_name ?? '',
      location: data.pickup_address ?? '',
      destination: data.delivery_address ?? '',
      quantity: '1 Item',
      amount: `₱${Number(data.service_price || 0).toLocaleString('en-PH')}`,
      status: normalizeShipmentStatus(data.status),
      driver: data.assigned_driver_id ? getDriverName(data.assigned_driver_id) : 'Unassigned',
      eta: '24 hrs',
      date: new Date().toLocaleDateString(),
    };
  } catch {
    return null;
  }
}

// ─── Driver Schema ────────────────────────────────────────────────────────────

/**
 * Fetch all drivers from the driver schema (profiles table).
 * Falls back to [] on error.
 */
export async function fetchDrivers(): Promise<DriverRow[]> {
  try {
    const { data, error } = await supabase.schema('driver').rpc('get_all_drivers');
    if (error) throw error;
    if (!data) return [];

    const rows = data as any[];
    return rows.map((row): DriverRow => ({
      id: row.id ?? '',
      name: row.name || getDriverName(row.id),
      email: row.email || `driver.${String(row.id).slice(0, 4)}@pakiship.com`,
      phone: row.phone || getDriverPhone(row.id),
      region: 'NCR',
      city: 'Manila',
      rating: Number(row.rating ?? 5.0),
      status: row.is_online ? 'available' : 'offline',
      accountStanding: row.documents_status === 'APPROVED' ? 'active' : 'inactive',
      completedDeliveries: Number(row.completed_deliveries ?? 0),
      vehicleType: row.vehicle_type ?? 'Motorcycle',
      lastActive: new Date().toLocaleDateString(),
      onTimeRate: 100,
      cancellationRate: 0,
      acceptanceRate: Number(row.acceptance_rate ?? 100),
      averageDeliveryTime: '25 mins',
    }));
  } catch {
    return [];
  }
}


// ─── Routing Schema ───────────────────────────────────────────────────────────

/**
 * Fetch all drop-off operators from the routing schema (hubs / drop_off_operators table).
 * Falls back to [] on error.
 */
export async function fetchOperators(): Promise<OperatorRow[]> {
  try {
    const { data, error } = await supabase.schema('routing').rpc('get_all_operators');
    if (error) throw error;
    if (!data) return [];

    const rows = data as any[];
    return rows.map((row): OperatorRow => {
      let hash = 0;
      for (let i = 0; i < String(row.id).length; i++) hash += String(row.id).charCodeAt(i);
      return {
        id: row.id ?? '',
        businessName: row.business_name ?? '',
        ownerName: row.owner_name || 'Unknown Owner',
        email: row.email || `operator.${String(row.id).slice(0, 4)}@pakiship.com`,
        phone: row.phone || `0918${(hash % 9000000) + 1000000}`,
        location: row.address ?? '',
        region: 'NCR',
        address: row.address ?? '',
        status: row.is_active ? 'active' : 'inactive',
        accountStanding: 'active',
        parcelsHandled: Number(row.parcels_handled ?? 0),
        pendingParcels: Number(row.pending_parcels ?? 0),
        lastActive: new Date().toLocaleDateString(),
        operatingHours: '08:00 - 20:00',
        averageRating: 4.8,
        issueRate: 0.1,
        successfulHandoffRate: 99.5,
      };
    });
  } catch {
    return [];
  }
}


// ─── Dashboard Aggregate Stats ────────────────────────────────────────────────

/**
 * Fetch aggregated stats for the dashboard from all three schemas.
 * Returns zeroed-out stats on any error.
 */
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const zero: DashboardStats = {
    totalShipments: 0,
    activeShipments: 0,
    deliveredShipments: 0,
    pendingShipments: 0,
    cancelledShipments: 0,
    totalDrivers: 0,
    availableDrivers: 0,
    onDeliveryDrivers: 0,
    totalOperators: 0,
    activeOperators: 0,
    totalParcelsHandled: 0,
  };

  try {
    const [shipmentsResult, driversResult, operatorsResult] = await Promise.allSettled([
      supabase.schema('parcel').from('parcel_drafts').select('status'),
      supabase.schema('driver').from('driver_profiles').select('is_online, documents_status'),
      supabase.schema('routing').from('operator_hubs').select('is_active'),
    ]);

    // Parcel schema
    if (shipmentsResult.status === 'fulfilled' && !shipmentsResult.value.error && shipmentsResult.value.data) {
      const rows = shipmentsResult.value.data ?? [];
      zero.totalShipments = rows.length;
      zero.activeShipments = rows.filter((r) => normalizeShipmentStatus(r.status) === 'In Transit').length;
      zero.deliveredShipments = rows.filter((r) => normalizeShipmentStatus(r.status) === 'Delivered').length;
      zero.pendingShipments = rows.filter((r) => normalizeShipmentStatus(r.status) === 'Pending').length;
      zero.cancelledShipments = rows.filter((r) => normalizeShipmentStatus(r.status) === 'Cancelled').length;
    }

    // Driver schema
    if (driversResult.status === 'fulfilled' && !driversResult.value.error && driversResult.value.data) {
      const rows = driversResult.value.data ?? [];
      const approvedDrivers = rows.filter((r) => r.documents_status === 'APPROVED');
      zero.totalDrivers = approvedDrivers.length;
      zero.availableDrivers = approvedDrivers.filter((r) => r.is_online).length;
      zero.onDeliveryDrivers = 0;
    }

    // Routing schema
    if (operatorsResult.status === 'fulfilled' && !operatorsResult.value.error && operatorsResult.value.data) {
      const rows = operatorsResult.value.data ?? [];
      zero.totalOperators = rows.length;
      zero.activeOperators = rows.filter((r) => r.is_active).length;
      zero.totalParcelsHandled = rows.length * 20;
    }
  } catch {
    // Return zero stats
  }

  return zero;
}


// ─── Analytics ────────────────────────────────────────────────────────────────

export interface AnalyticsChanges {
  revenue: string | null;
  delivered: string | null;
  pending: string | null;
  cancelled: string | null;
  lostReports: string | null;
  revenueUp: boolean;
  deliveredUp: boolean;
  pendingUp: boolean;
  cancelledUp: boolean;
  lostReportsUp: boolean;
}

export interface AnalyticsStats {
  revenue: number;
  delivered: number;
  pending: number;
  cancelled: number;
  lostReports: number;
  shipmentVolume: Array<{ month: string; volume: number; revenue: number }>;
  topDrivers: Array<{ name: string; completion: string; rating: string }>;
  totalDrivers: number;
  onDeliveryDrivers: number;
  activeNowDrivers: number;
  changes: AnalyticsChanges;
}

/** Compute a formatted % change string between two values. Returns null when prior is 0. */
function pctChange(current: number, prior: number): { label: string | null; up: boolean } {
  if (prior === 0) return { label: null, up: true };
  const delta = ((current - prior) / prior) * 100;
  const sign = delta >= 0 ? '+' : '';
  return { label: `${sign}${delta.toFixed(1)}%`, up: delta >= 0 };
}

export async function fetchAnalyticsStats(range: 'Today' | 'Last 7 Days' | 'Last 30 Days' | 'Year to Date'): Promise<AnalyticsStats> {
  const nullChanges: AnalyticsChanges = {
    revenue: null, delivered: null, pending: null, cancelled: null, lostReports: null,
    revenueUp: true, deliveredUp: true, pendingUp: false, cancelledUp: false, lostReportsUp: false,
  };
  const zero: AnalyticsStats = {
    revenue: 0, delivered: 0, pending: 0, cancelled: 0, lostReports: 0,
    shipmentVolume: [], topDrivers: [], totalDrivers: 0, onDeliveryDrivers: 0, activeNowDrivers: 0,
    changes: nullChanges,
  };

  try {
    const now = new Date();
    let currentSince: Date;
    let priorSince: Date;
    let priorUntil: Date;

    if (range === 'Today') {
      currentSince = new Date(now); currentSince.setHours(0, 0, 0, 0);
      priorSince = new Date(currentSince); priorSince.setDate(priorSince.getDate() - 1);
      priorUntil = new Date(currentSince);
    } else if (range === 'Last 7 Days') {
      currentSince = new Date(now); currentSince.setDate(now.getDate() - 7);
      priorSince = new Date(currentSince); priorSince.setDate(priorSince.getDate() - 7);
      priorUntil = new Date(currentSince);
    } else if (range === 'Last 30 Days') {
      currentSince = new Date(now); currentSince.setDate(now.getDate() - 30);
      priorSince = new Date(currentSince); priorSince.setDate(priorSince.getDate() - 30);
      priorUntil = new Date(currentSince);
    } else {
      currentSince = new Date(now.getFullYear(), 0, 1);
      priorSince = new Date(now.getFullYear() - 1, 0, 1);
      priorUntil = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    }

    const currentISO = currentSince.toISOString();
    const priorSinceISO = priorSince.toISOString();
    const priorUntilISO = priorUntil.toISOString();

    const res = await supabase.schema('parcel').rpc('get_analytics_data');
    if (res.error) {
      console.error('get_analytics_data error:', res.error);
      throw res.error;
    }
    const rawData = res.data as any;
    const allItems = rawData.items || [];
    const drafts = rawData.drafts || [];
    const driversRows = rawData.drivers || [];

    const items = allItems.filter((i: any) => i.created_at >= priorSinceISO);
    const draftMap = new Map(drafts.map((d: any) => [d.id, d]));

    const curItems = items.filter((item: any) => item.created_at >= currentISO);
    const prevItems = items.filter((item: any) => item.created_at >= priorSinceISO && item.created_at < priorUntilISO);

    let curRevenue = 0, curDelivered = 0, curPending = 0, curCancelled = 0, curLost = 0;
    const volumeMap: Record<string, { volume: number; revenue: number }> = {};
    const seenDraftsCur = new Set<string>();

    curItems.forEach(item => {
      if (seenDraftsCur.has(item.parcel_draft_id)) return;
      seenDraftsCur.add(item.parcel_draft_id);

      const d = draftMap.get(item.parcel_draft_id);
      if (!d) return;

      const price = Number(d.service_price ?? 0);
      const status = normalizeShipmentStatus(d.status);

      if (status === 'Delivered') curDelivered++;
      else if (status === 'Pending') curPending++;
      else if (status === 'Cancelled') curCancelled++;

      if ((d.status ?? '').toLowerCase() === 'lost') curLost++;

      curRevenue += price;

      const date = new Date(item.created_at);
      let label = '';
      if (range === 'Today') {
        label = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (range === 'Last 7 Days') {
        label = date.toLocaleDateString([], { weekday: 'short' });
      } else if (range === 'Last 30 Days') {
        label = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      } else {
        label = date.toLocaleDateString([], { month: 'short' });
      }
      if (!volumeMap[label]) {
        volumeMap[label] = { volume: 0, revenue: 0 };
      }
      volumeMap[label].volume += 1;
      volumeMap[label].revenue += price;
    });

    let prevRevenue = 0, prevDelivered = 0, prevPending = 0, prevCancelled = 0, prevLost = 0;
    const seenDraftsPrev = new Set<string>();

    prevItems.forEach(item => {
      if (seenDraftsPrev.has(item.parcel_draft_id)) return;
      seenDraftsPrev.add(item.parcel_draft_id);

      const d = draftMap.get(item.parcel_draft_id);
      if (!d) return;

      const price = Number(d.service_price ?? 0);
      const status = normalizeShipmentStatus(d.status);

      if (status === 'Delivered') prevDelivered++;
      else if (status === 'Pending') prevPending++;
      else if (status === 'Cancelled') prevCancelled++;

      if ((d.status ?? '').toLowerCase() === 'lost') prevLost++;

      prevRevenue += price;
    });

    zero.shipmentVolume = Object.entries(volumeMap).map(([month, stats]) => ({
      month,
      volume: stats.volume,
      revenue: stats.revenue
    }));

    // Driver stats
    if (driversRows.length > 0) {
      zero.totalDrivers = driversRows.length;
      zero.onDeliveryDrivers = 0;
      zero.activeNowDrivers = driversRows.filter((r: any) => r.is_online).length;
      zero.topDrivers = [...driversRows]
        .sort((a, b) => Number(b.acceptance_rate ?? 0) - Number(a.acceptance_rate ?? 0))
        .slice(0, 3)
        .map((r) => ({
          name: r.full_name || 'Unknown Driver',
          completion: `${(r.acceptance_rate ?? 100).toFixed(0)}%`,
          rating: '5.0',
        }));
    }

    zero.revenue = curRevenue;
    zero.delivered = curDelivered;
    zero.pending = curPending;
    zero.cancelled = curCancelled;
    zero.lostReports = curLost;

    const revChange = pctChange(curRevenue, prevRevenue);
    const delChange = pctChange(curDelivered, prevDelivered);
    const penChange = pctChange(curPending, prevPending);
    const canChange = pctChange(curCancelled, prevCancelled);
    const losChange = pctChange(curLost, prevLost);

    zero.changes = {
      revenue: revChange.label,
      delivered: delChange.label,
      pending: penChange.label,
      cancelled: canChange.label,
      lostReports: losChange.label,
      revenueUp: revChange.up,
      deliveredUp: delChange.up,
      pendingUp: penChange.up,
      cancelledUp: canChange.up,
      lostReportsUp: losChange.up,
    };
  } catch { /* return zeros */ }
  return zero;
}

// ─── Dashboard Live Feed ──────────────────────────────────────────────────────

export interface DashboardFeed {
  recentShipments: Array<{ store: string; location: string; amount: string; status: string }>;
  pendingDriverApps: number;
  openLostParcels: number;
}

export async function fetchDashboardFeed(): Promise<DashboardFeed> {
  const empty: DashboardFeed = { recentShipments: [], pendingDriverApps: 0, openLostParcels: 0 };
  try {
    const { data, error } = await supabase.schema('parcel').rpc('get_dashboard_feed');
    if (error) throw error;
    
    const d = data as any;
    empty.recentShipments = (d.recent || []).map((r: any) => ({
      store: r.drop_off_point_name ?? 'Direct Delivery',
      location: r.pickup_address ?? '',
      amount: Number((r.service_price ?? '0').toString().replace(/[^\d.]/g, '') || 0).toLocaleString('en-PH'),
      status: normalizeShipmentStatus(r.status),
    }));
    empty.pendingDriverApps = d.apps ?? 0;
    empty.openLostParcels = d.lost ?? 0;
  } catch { /* return empty */ }
  return empty;
}

// ─── Lost Parcel Cases ────────────────────────────────────────────────────────

export type LostParcelStatus = 'open' | 'investigating' | 'found' | 'refunded' | 'closed';

export interface LostParcelCaseRow {
  id: string;
  parcelId: string;
  affectedCustomer: string;
  customerEmail: string;
  route: string;
  parcelValue: number;
  dateReported: string;
  status: LostParcelStatus;
  assignedTeam: string;
  lastKnownLocation: string;
  lastKnownTimestamp: string;
  statusHistory: Array<{ id: string; status: string; timestamp: string; updatedBy: string; note: string }>;
  timeline: Array<{ id: string; label: string; location: string; timestamp: string; status: string; note: string }>;
  assignedDriver: { name: string; phone: string; vehicle: string; rating: number; lastContact: string };
}

export async function fetchLostParcelCases(): Promise<LostParcelCaseRow[]> {
  try {
    const { data, error } = await supabase.schema('parcel').rpc('get_lost_parcels');
    if (error) throw error;
    if (!data) return [];
    
    const rows = data as any[];

    return rows.map((row: any): LostParcelCaseRow => ({
      id: row.id ?? '',
      parcelId: row.parcel_draft_id ?? '',
      affectedCustomer: row.sender_name ?? '',
      customerEmail: '', // Not returned by default query
      route: row.tracking_number ?? '',
      parcelValue: Number(row.parcel_value ?? 0),
      dateReported: row.created_at ?? '',
      status: normalizeLostStatus(row.status),
      assignedTeam: row.priority ?? 'Support',
      lastKnownLocation: row.resolution_notes ?? '',
      lastKnownTimestamp: row.created_at ?? '',
      statusHistory: [],
      timeline: [],
      assignedDriver: { name: row.driver_name || 'Unassigned', phone: '', vehicle: '', rating: 5, lastContact: '' },
    }));
  } catch {
    return [];
  }
}

export async function updateLostParcelStatus(id: string, status: LostParcelStatus, note: string, updatedBy: string): Promise<boolean> {
  try {
    // 1. Fetch current status history to append to it
    const { data: currentCase, error: fetchError } = await supabase
      .schema('parcel')
      .from('lost_parcel_cases')
      .select('status_history')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const currentHistory = Array.isArray(currentCase?.status_history) ? currentCase.status_history : [];
    const newEvent = {
      id: `ISH-${id}-${currentHistory.length + 1}`,
      status,
      timestamp: new Date().toISOString(),
      updatedBy,
      note
    };
    const updatedHistory = [...currentHistory, newEvent];

    // 2. Update the lost_parcel_cases table
    const { error: updateError } = await supabase
      .schema('parcel')
      .from('lost_parcel_cases')
      .update({ 
        status, 
        status_history: updatedHistory,
        updated_at: new Date().toISOString() 
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // 3. Insert event log
    await supabase.schema('parcel').from('lost_parcel_case_events').insert({
      case_id: id, 
      status, 
      note, 
      updated_by: updatedBy, 
      timestamp: new Date().toISOString(),
    });

    return true;
  } catch (err) {
    console.error('updateLostParcelStatus error:', err);
    return false;
  }
}


// ─── User Acceptance Applications ─────────────────────────────────────────────

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface DriverApplicationRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  region: string;
  applicationDate: string;
  documentCount: number;
  status: ApplicationStatus;
  accountStatus: 'inactive' | 'active';
  activatedDate?: string;
  vehicleType?: string;
  plateNumber?: string;
  documents: Array<{ name: string; size: string; uploadDate: string; url: string }>;
}

export interface BusinessApplicationRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  region: string;
  applicationDate: string;
  documentCount: number;
  status: ApplicationStatus;
  accountStatus: 'inactive' | 'active';
  activatedDate?: string;
  businessName?: string;
  businessType?: string;
  documents: Array<{ name: string; size: string; uploadDate: string; url: string }>;
}

export interface DropOffApplicationRow {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  location: string;
  address: string;
  dateApplied: string;
  status: ApplicationStatus;
  platformStatus: 'inactive' | 'active';
  activatedDate?: string;
  rejectionReason?: string;
  businessDocuments: Array<{ name: string; requirement: string; size: string; uploadDate: string; url: string; verificationStatus: string }>;
}

export async function fetchDriverApplications(): Promise<DriverApplicationRow[]> {
  try {
    const { data, error } = await supabase.schema('driver').rpc('get_dropoff_applications');
    if (error) throw error;
    if (!data) return [];
    
    const rows = data as any[];

    return rows.map((row: any): DriverApplicationRow => {
      return {
        id: row.id ?? '',
        name: row.full_name || 'Unknown Driver',
        email: row.email || `driver.${row.id.slice(0, 4)}@pakiship.com`,
        phone: row.phone_number || getDriverPhone(row.id),
        region: 'NCR',
        applicationDate: new Date().toLocaleDateString(),
        documentCount: 2,
        status: row.driver_status === 'REJECTED' ? 'rejected' : 'pending',
        accountStatus: 'inactive',
        activatedDate: undefined,
        vehicleType: row.vehicle_type ?? 'Motorcycle',
        plateNumber: row.plate_number || `PLATE-${row.id.slice(0, 4).toUpperCase()}`,
        documents: [
          { name: 'Driver License.pdf', size: '1.2 MB', uploadDate: new Date().toLocaleDateString(), url: '#' },
          { name: 'NBI Clearance.pdf', size: '850 KB', uploadDate: new Date().toLocaleDateString(), url: '#' }
        ],
      };
    });
  } catch {
    return [];
  }
}

export async function fetchBusinessApplications(): Promise<BusinessApplicationRow[]> {
  return [];
}

export async function fetchDropOffApplications(): Promise<DropOffApplicationRow[]> {
  try {
    const { data, error } = await supabase.schema('routing').rpc('get_hub_applications');
    if (error) throw error;
    if (!data) return [];
    
    const rows = data as any[];

    return rows.map((row: any): DropOffApplicationRow => {
      return {
        id: row.id ?? '',
        businessName: row.name ?? '',
        ownerName: row.full_name || 'Unknown Hub Owner',
        email: row.email || `operator.${row.id.slice(0, 4)}@pakiship.com`,
        phone: row.phone_number || '09000000000',
        location: row.location_name ?? '',
        address: row.location_name ?? '',
        dateApplied: new Date().toLocaleDateString(),
        status: row.status === 'REJECTED' ? 'rejected' : 'pending',
        platformStatus: 'inactive',
        activatedDate: undefined,
        rejectionReason: undefined,
        businessDocuments: [
          { name: 'Business Permit.pdf', requirement: 'Permit', size: '1.5 MB', uploadDate: new Date().toLocaleDateString(), url: '#', verificationStatus: 'pending' }
        ],
      };
    });
  } catch {
    return [];
  }
}

export async function approveApplication(schema: 'driver' | 'routing', table: string, id: string): Promise<boolean> {
  try {
    if (schema === 'driver') {
      const { error } = await supabase
        .schema('driver')
        .from('driver_profiles')
        .update({ documents_status: 'APPROVED' })
        .eq('id', id);
      return !error;
    } else if (schema === 'routing') {
      const { error } = await supabase
        .schema('routing')
        .from('operator_hubs')
        .update({ is_active: true })
        .eq('id', id);
      return !error;
    }
    return false;
  } catch (err) {
    console.error('approveApplication database error:', err);
    return false;
  }
}

export async function rejectApplication(schema: 'driver' | 'routing', table: string, id: string, reason: string): Promise<boolean> {
  try {
    if (schema === 'driver') {
      const { error } = await supabase
        .schema('driver')
        .from('driver_profiles')
        .update({ documents_status: 'REJECTED' })
        .eq('id', id);
      return !error;
    } else if (schema === 'routing') {
      return true;
    }
    return false;
  } catch (err) {
    console.error('rejectApplication database error:', err);
    return false;
  }
}



// ─── Driver Detail (single driver with sub-records) ───────────────────────────

export async function fetchDriverDetail(driverId: string): Promise<DriverDetailRow | null> {
  try {
    const { data, error } = await supabase.schema('driver').rpc('get_driver_detail', { p_driver_id: driverId });
    if (error) throw error;
    if (!data) return null;

    const d = data as any;

    const ratingsHistory = (d.ratings_history ?? []).map((r: any) => ({
      date: r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : '',
      rating: Number(r.rating),
      comment: r.comment ?? '',
      customer: r.customer_name ?? 'Anonymous'
    }));

    const deliveryRecord = (d.delivery_record ?? []).map((dr: any) => ({
      id: dr.id,
      completedAt: new Date().toISOString(),
      destination: dr.delivery_address ?? '',
      region: 'NCR',
      status: normalizeShipmentStatus(dr.status),
      rating: 5
    }));

    const avgRating = ratingsHistory.length > 0
      ? Number((ratingsHistory.reduce((acc: number, r: any) => acc + r.rating, 0) / ratingsHistory.length).toFixed(1))
      : 5.0;

    return {
      id: d.id ?? '',
      name: d.name || getDriverName(d.id),
      email: d.email || `driver.${String(d.id).slice(0, 4)}@pakiship.com`,
      phone: d.phone || getDriverPhone(d.id),
      region: 'NCR',
      city: 'Manila',
      rating: avgRating,
      status: d.is_online ? 'available' : 'offline',
      accountStanding: d.documents_status === 'APPROVED' ? 'active' : 'inactive',
      completedDeliveries: deliveryRecord.length,
      vehicleType: d.vehicle_type ?? 'Motorcycle',
      lastActive: new Date().toLocaleDateString(),
      onTimeRate: 100,
      cancellationRate: 0,
      acceptanceRate: Number(d.acceptance_rate ?? 100),
      averageDeliveryTime: '25 mins',
      ratingsHistory,
      deliveryRecord
    };
  } catch {
    return null;
  }
}

export async function updateDriverAccountStatus(driverId: string, action: 'suspend' | 'reactivate' | 'deactivate', reason: string): Promise<boolean> {
  const status = action === 'reactivate' ? 'APPROVED' : 'REJECTED';
  try {
    const { error } = await supabase.schema('driver').from('driver_profiles').update({
      documents_status: status,
    }).eq('id', driverId);
    return !error;
  } catch {
    return false;
  }
}

export interface OperatorDetailRow extends OperatorRow {
  accountActionReason?: string;
  accountActionDate?: string;
  binCapacity: { totalBins: number; occupiedBins: number; reservedBins: number; availableBins: number; utilizationRate: number };
  dropOffHistory: Array<{ id: string; date: string; parcelsReceived: number; parcelsReleased: number; exceptions: number; status: string }>;
  customerRatings: Array<{ date: string; customer: string; rating: number; comment: string }>;
}

export async function fetchOperatorDetail(operatorId: string): Promise<OperatorDetailRow | null> {
  try {
    const { data, error } = await supabase.schema('routing').rpc('get_operator_detail', { p_operator_id: operatorId });
    if (error) throw error;
    if (!data) return null;

    const d = data as any;
    let hash = 0;
    for (let i = 0; i < String(d.id).length; i++) hash += String(d.id).charCodeAt(i);

    return {
      id: d.id ?? '',
      businessName: d.business_name ?? '',
      ownerName: d.owner_name || 'Unknown Owner',
      email: d.email || `operator.${String(d.id).slice(0, 4)}@pakiship.com`,
      phone: d.phone || `0918${(hash % 9000000) + 1000000}`,
      location: d.address ?? '',
      region: 'NCR',
      address: d.address ?? '',
      status: d.is_active ? 'active' : 'inactive',
      accountStanding: 'active',
      parcelsHandled: Number(d.parcels_handled ?? 0),
      pendingParcels: Number(d.pending_parcels ?? 0),
      lastActive: new Date().toLocaleDateString(),
      operatingHours: '08:00 - 20:00',
      averageRating: 4.8,
      issueRate: 0.1,
      successfulHandoffRate: 99.5,
      binCapacity: { totalBins: d.storage_capacity || 100, occupiedBins: 0, reservedBins: 0, availableBins: d.storage_capacity || 100, utilizationRate: 0 },
      dropOffHistory: [],
      customerRatings: [],
    };
  } catch {
    return null;
  }
}

export async function updateOperatorAccountStatus(operatorId: string, action: 'suspend' | 'reactivate' | 'deactivate', reason: string): Promise<boolean> {
  const is_active = action === 'reactivate';
  try {
    const { error } = await supabase.schema('routing').from('operator_hubs').update({
      is_active
    }).eq('id', operatorId);
    return !error;
  } catch {
    return false;
  }
}

// ─── Normalizers ──────────────────────────────────────────────────────────────

function normalizeShipmentStatus(raw: string | null | undefined): ShipmentStatus {
  const map: Record<string, ShipmentStatus> = {
    'submitted': 'In Transit',
    'draft': 'Pending',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled',
  };
  return map[(raw ?? '').toLowerCase()] ?? 'Pending';
}

function normalizeDriverStatus(raw: string | null | undefined): DriverStatus {
  const map: Record<string, DriverStatus> = {
    'available': 'available',
    'on_delivery': 'on_delivery',
    'on delivery': 'on_delivery',
    'offline': 'offline',
    'suspended': 'suspended',
    'deactivated': 'deactivated',
  };
  return map[(raw ?? '').toLowerCase()] ?? 'offline';
}

function normalizeOperatorStatus(raw: string | null | undefined): OperatorStatus {
  const map: Record<string, OperatorStatus> = {
    'active': 'active',
    'limited': 'limited',
    'limited capacity': 'limited',
    'inactive': 'inactive',
    'suspended': 'suspended',
    'deactivated': 'deactivated',
  };
  return map[(raw ?? '').toLowerCase()] ?? 'inactive';
}

function normalizeLostStatus(raw: string | null | undefined): LostParcelStatus {
  const valid: LostParcelStatus[] = ['open', 'investigating', 'found', 'refunded', 'closed'];
  const val = (raw ?? '').toLowerCase() as LostParcelStatus;
  return valid.includes(val) ? val : 'open';
}

function normalizeAppStatus(raw: string | null | undefined): ApplicationStatus {
  const valid: ApplicationStatus[] = ['pending', 'approved', 'rejected'];
  const val = (raw ?? '').toLowerCase() as ApplicationStatus;
  return valid.includes(val) ? val : 'pending';
}

// ─── Local Storage Mocks Fallback ──────────────────────────────────────────

function getStored<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const stored = localStorage.getItem(key);
    if (!stored) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(stored);
  } catch {
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

const MOCK_DRIVERS: DriverRow[] = [
  {
    id: 'DRV-001',
    name: 'John Salazar',
    email: 'john.salazar@email.com',
    phone: '+63 917 406 1102',
    region: 'NCR',
    city: 'Manila',
    rating: 4.7,
    status: 'available',
    accountStanding: 'active',
    completedDeliveries: 142,
    vehicleType: 'Motorcycle',
    lastActive: '2026-05-14T17:10:00',
    onTimeRate: 96.5,
    cancellationRate: 1.2,
    acceptanceRate: 98.0,
    averageDeliveryTime: '24 mins'
  },
  {
    id: 'DRV-002',
    name: 'Mark Gonzales',
    email: 'mark.gonzales@email.com',
    phone: '+63 918 221 7044',
    region: 'NCR',
    city: 'Manila',
    rating: 4.5,
    status: 'on_delivery',
    accountStanding: 'active',
    completedDeliveries: 98,
    vehicleType: 'Motorcycle',
    lastActive: '2026-05-13T15:40:00',
    onTimeRate: 92.0,
    cancellationRate: 3.4,
    acceptanceRate: 94.0,
    averageDeliveryTime: '28 mins'
  },
  {
    id: 'DRV-003',
    name: 'Maria Reyes',
    email: 'maria.reyes@email.com',
    phone: '+63 915 602 3481',
    region: 'NCR',
    city: 'Manila',
    rating: 4.8,
    status: 'available',
    accountStanding: 'active',
    completedDeliveries: 210,
    vehicleType: 'Motorcycle',
    lastActive: '2026-05-12T14:25:00',
    onTimeRate: 98.2,
    cancellationRate: 0.5,
    acceptanceRate: 99.1,
    averageDeliveryTime: '19 mins'
  },
  {
    id: 'DRV-004',
    name: 'Leo Castillo',
    email: 'leo.castillo@email.com',
    phone: '+63 922 818 5530',
    region: 'NCR',
    city: 'Manila',
    rating: 4.4,
    status: 'offline',
    accountStanding: 'active',
    completedDeliveries: 76,
    vehicleType: 'Motorcycle',
    lastActive: '2026-05-11T12:20:00',
    onTimeRate: 89.5,
    cancellationRate: 4.0,
    acceptanceRate: 91.2,
    averageDeliveryTime: '32 mins'
  },
  {
    id: 'DRV-005',
    name: 'Anna Martinez',
    email: 'anna.martinez@email.com',
    phone: '+63 927 441 8920',
    region: 'NCR',
    city: 'Manila',
    rating: 4.6,
    status: 'suspended',
    accountStanding: 'suspended',
    completedDeliveries: 120,
    vehicleType: 'Motorcycle',
    lastActive: '2026-05-10T18:45:00',
    onTimeRate: 94.0,
    cancellationRate: 2.1,
    acceptanceRate: 95.5,
    averageDeliveryTime: '26 mins'
  }
];

const MOCK_DRIVER_DETAILS: Record<string, DriverDetailRow> = {
  'DRV-001': {
    ...MOCK_DRIVERS[0],
    accountActionReason: undefined,
    accountActionDate: undefined,
    ratingsHistory: [
      { date: '2026-05-14', rating: 5, customer: 'Carla Mendoza', comment: 'Rider was extremely polite and fast.' },
      { date: '2026-05-12', rating: 4, customer: 'Kevs Cruz', comment: 'Delivered in good condition.' }
    ],
    deliveryRecord: [
      { id: 'JOB-9982', destination: 'P. Noval, Sampaloc', region: 'NCR', completedAt: '2026-05-14T16:45:00', status: 'delivered', rating: 5 }
    ]
  },
  'DRV-002': { ...MOCK_DRIVERS[1], ratingsHistory: [], deliveryRecord: [] },
  'DRV-003': { ...MOCK_DRIVERS[2], ratingsHistory: [], deliveryRecord: [] },
  'DRV-004': { ...MOCK_DRIVERS[3], ratingsHistory: [], deliveryRecord: [] },
  'DRV-005': {
    ...MOCK_DRIVERS[4],
    accountActionReason: 'Frequent late deliveries beyond grace period.',
    accountActionDate: '2026-05-10',
    ratingsHistory: [],
    deliveryRecord: []
  }
};

const MOCK_OPERATORS: OperatorRow[] = [
  {
    id: 'OP-001',
    businessName: 'Lawson Lacson Ave',
    ownerName: 'Albert Dizon',
    email: 'lawson.lacson@email.com',
    phone: '+63 917 112 3344',
    location: 'Lacson Ave, Sampaloc',
    region: 'NCR',
    address: '1081 Lacson Ave, Sampaloc, Manila',
    status: 'active',
    accountStanding: 'active',
    parcelsHandled: 1250,
    pendingParcels: 14,
    lastActive: '2026-05-14T18:05:00',
    operatingHours: '06:00 - 23:00',
    averageRating: 4.8,
    issueRate: 0.2,
    successfulHandoffRate: 99.8
  },
  {
    id: 'OP-002',
    businessName: '7-Eleven Espana',
    ownerName: 'Clara Santos',
    email: '711.espana@email.com',
    phone: '+63 918 445 6677',
    location: 'Espana Blvd, Sampaloc',
    region: 'NCR',
    address: 'Espana Blvd cor. Asturias St, Sampaloc, Manila',
    status: 'active',
    accountStanding: 'active',
    parcelsHandled: 2310,
    pendingParcels: 32,
    lastActive: '2026-05-13T17:46:00',
    operatingHours: '24 Hours',
    averageRating: 4.6,
    issueRate: 0.5,
    successfulHandoffRate: 99.2
  },
  {
    id: 'OP-003',
    businessName: 'UST Overpass Drop-Off Counter',
    ownerName: 'Roberto Gomez',
    email: 'ust.counter@email.com',
    phone: '+63 919 778 9900',
    location: 'UST Overpass, Sampaloc',
    region: 'NCR',
    address: 'Espana Blvd, near UST Overpass, Sampaloc, Manila',
    status: 'limited',
    accountStanding: 'active',
    parcelsHandled: 850,
    pendingParcels: 45,
    lastActive: '2026-05-12T16:20:00',
    operatingHours: '08:00 - 20:00',
    averageRating: 4.2,
    issueRate: 2.1,
    successfulHandoffRate: 97.5
  },
  {
    id: 'OP-004',
    businessName: 'Asturias Partner Counter',
    ownerName: 'Elena Velez',
    email: 'asturias.counter@email.com',
    phone: '+63 922 111 2233',
    location: 'Asturias St, Sampaloc',
    region: 'NCR',
    address: 'Asturias St, Sampaloc, Manila',
    status: 'suspended',
    accountStanding: 'suspended',
    parcelsHandled: 520,
    pendingParcels: 0,
    lastActive: '2026-05-11T14:35:00',
    operatingHours: 'Closed',
    averageRating: 4.0,
    issueRate: 4.5,
    successfulHandoffRate: 95.0
  }
];

const MOCK_OPERATOR_DETAILS: Record<string, OperatorDetailRow> = {
  'OP-001': {
    ...MOCK_OPERATORS[0],
    accountActionReason: undefined,
    accountActionDate: undefined,
    binCapacity: { totalBins: 100, occupiedBins: 14, reservedBins: 5, availableBins: 81, utilizationRate: 14.0 },
    dropOffHistory: [
      { id: 'H-001', date: '2026-05-14', parcelsReceived: 45, parcelsReleased: 38, exceptions: 0, status: 'Completed' }
    ],
    customerRatings: [
      { date: '2026-05-14', customer: 'Bea Flores', rating: 5, comment: 'Great customer service!' }
    ]
  },
  'OP-002': { ...MOCK_OPERATORS[1], binCapacity: { totalBins: 200, occupiedBins: 32, reservedBins: 10, availableBins: 158, utilizationRate: 16.0 }, dropOffHistory: [], customerRatings: [] },
  'OP-003': { ...MOCK_OPERATORS[2], binCapacity: { totalBins: 150, occupiedBins: 45, reservedBins: 15, availableBins: 90, utilizationRate: 30.0 }, dropOffHistory: [], customerRatings: [] },
  'OP-004': {
    ...MOCK_OPERATORS[3],
    accountActionReason: 'Suspended due to high package exception rate.',
    accountActionDate: '2026-05-11',
    binCapacity: { totalBins: 80, occupiedBins: 0, reservedBins: 0, availableBins: 80, utilizationRate: 0.0 },
    dropOffHistory: [],
    customerRatings: []
  }
};

const MOCK_DRIVER_APPLICATIONS: DriverApplicationRow[] = [
  {
    id: 'DAPP-001',
    name: 'Carlos Yulo',
    email: 'carlos.yulo@email.com',
    phone: '09171234567',
    region: 'NCR',
    applicationDate: '2026-05-18',
    documentCount: 3,
    status: 'pending',
    accountStatus: 'inactive',
    vehicleType: 'Motorcycle',
    plateNumber: 'ABC 1234',
    documents: [
      { name: 'Professional License.pdf', size: '1.2 MB', uploadDate: '2026-05-18', url: '#' },
      { name: 'NBI Clearance.pdf', size: '950 KB', uploadDate: '2026-05-18', url: '#' },
      { name: 'ORCR Motorcycle.pdf', size: '2.1 MB', uploadDate: '2026-05-18', url: '#' }
    ]
  },
  {
    id: 'DAPP-002',
    name: 'EJ Obiena',
    email: 'ej.obiena@email.com',
    phone: '09187654321',
    region: 'Region IV-A',
    applicationDate: '2026-05-17',
    documentCount: 3,
    status: 'pending',
    accountStatus: 'inactive',
    vehicleType: 'Motorcycle',
    plateNumber: 'XYZ 7890',
    documents: [
      { name: 'Professional License.pdf', size: '1.4 MB', uploadDate: '2026-05-17', url: '#' },
      { name: 'NBI Clearance.pdf', size: '1.1 MB', uploadDate: '2026-05-17', url: '#' },
      { name: 'ORCR Motorcycle.pdf', size: '1.8 MB', uploadDate: '2026-05-17', url: '#' }
    ]
  }
];

const MOCK_BUSINESS_APPLICATIONS: BusinessApplicationRow[] = [
  {
    id: 'BAPP-001',
    name: 'Sarah Geronimo',
    email: 'sarah.g@email.com',
    phone: '09191112222',
    region: 'NCR',
    applicationDate: '2026-05-19',
    documentCount: 2,
    status: 'pending',
    accountStatus: 'inactive',
    businessName: 'Popstar Express Delivery',
    businessType: 'Logistics Service Provider',
    documents: [
      { name: 'SEC Registration.pdf', size: '3.4 MB', uploadDate: '2026-05-19', url: '#' },
      { name: 'Mayor Permit 2026.pdf', size: '2.1 MB', uploadDate: '2026-05-19', url: '#' }
    ]
  },
  {
    id: 'BAPP-002',
    name: 'Regine Velasquez',
    email: 'regine.v@email.com',
    phone: '09223334444',
    region: 'Region III',
    applicationDate: '2026-05-16',
    documentCount: 2,
    status: 'pending',
    accountStatus: 'inactive',
    businessName: 'Songbird Logistics Inc',
    businessType: 'Freight Forwarding',
    documents: [
      { name: 'DTI Certificate.pdf', size: '1.8 MB', uploadDate: '2026-05-16', url: '#' },
      { name: 'Mayor Permit 2026.pdf', size: '2.4 MB', uploadDate: '2026-05-16', url: '#' }
    ]
  }
];

const MOCK_DROPOFF_APPLICATIONS: DropOffApplicationRow[] = [
  {
    id: 'OAPP-001',
    businessName: 'Uncle John Asturias',
    ownerName: 'Juan Dela Cruz',
    email: 'unclejohns.asturias@email.com',
    phone: '09175556666',
    location: 'Asturias St, Sampaloc',
    address: '124 Asturias St, Sampaloc, Manila',
    dateApplied: '2026-05-19',
    status: 'pending',
    platformStatus: 'inactive',
    businessDocuments: [
      { name: 'DTI Certificate.pdf', requirement: 'Business Registration', size: '1.2 MB', uploadDate: '2026-05-19', url: '#', verificationStatus: 'verified' },
      { name: 'Barangay Clearance.pdf', requirement: 'Barangay Permit', size: '890 KB', uploadDate: '2026-05-19', url: '#', verificationStatus: 'pending' }
    ]
  },
  {
    id: 'OAPP-002',
    businessName: 'Lawson P. Noval',
    ownerName: 'Maria Clara',
    email: 'lawson.pnoval@email.com',
    phone: '09188889999',
    location: 'P. Noval, Sampaloc',
    address: '951 P. Noval St, Sampaloc, Manila',
    dateApplied: '2026-05-18',
    status: 'pending',
    platformStatus: 'inactive',
    businessDocuments: [
      { name: 'SEC Registration.pdf', requirement: 'Business Registration', size: '2.5 MB', uploadDate: '2026-05-18', url: '#', verificationStatus: 'verified' },
      { name: 'Mayor Permit.pdf', requirement: 'Mayor Permit', size: '1.7 MB', uploadDate: '2026-05-18', url: '#', verificationStatus: 'verified' }
    ]
  }
];

const MOCK_LOST_PARCEL_CASES: LostParcelCaseRow[] = [
  {
    id: 'LPC-1021',
    parcelId: 'PKS-2026-9982',
    affectedCustomer: 'Carla Mendoza',
    customerEmail: 'carla.mendoza@email.com',
    route: 'Lacson Ave to P. Noval',
    parcelValue: 12500,
    dateReported: '2026-05-14',
    status: 'investigating',
    statusHistory: [
      { id: 'ISH-1021-1', status: 'open', timestamp: '2026-05-14T18:05:00Z', updatedBy: 'Support Desk', note: 'Customer reported parcel missing after missed delivery scan.' },
      { id: 'ISH-1021-2', status: 'investigating', timestamp: '2026-05-14T18:22:00Z', updatedBy: 'Incident Response', note: 'Assigned to incident team for hub scan verification.' },
    ],
    assignedTeam: 'Incident Response',
    lastKnownLocation: 'PakiShip Sampaloc Sorting Desk',
    lastKnownTimestamp: '2026-05-14T16:45:00Z',
    assignedDriver: {
      name: 'John Salazar',
      phone: '+63 917 406 1102',
      vehicle: 'Motorcycle - NCR 4812',
      rating: 4.7,
      lastContact: '2026-05-14T17:10:00Z',
    },
    timeline: [
      { id: 'TL-001', label: 'Parcel accepted', location: 'Lawson Lacson Ave', timestamp: '2026-05-14T10:20:00Z', status: 'completed', note: 'Parcel scanned at partner counter.' },
      { id: 'TL-002', label: 'Driver pickup', location: 'Lawson Lacson Ave', timestamp: '2026-05-14T11:05:00Z', status: 'completed', note: 'Driver confirmed package pickup.' },
      { id: 'TL-003', label: 'Hub intake scan', location: 'PakiShip Sampaloc Sorting Desk', timestamp: '2026-05-14T16:45:00Z', status: 'flagged', note: 'Last confirmed scan before missing handoff.' },
      { id: 'TL-004', label: 'Customer delivery', location: 'P. Noval, Sampaloc', timestamp: '2026-05-14T18:30:00Z', status: 'pending', note: 'Delivery scan missing.' },
    ],
  },
  {
    id: 'LPC-1018',
    parcelId: 'PKS-2026-9824',
    affectedCustomer: 'Noel Ramirez',
    customerEmail: 'noel.ramirez@email.com',
    route: 'Espana Blvd to Dapitan',
    parcelValue: 8750,
    dateReported: '2026-05-13',
    status: 'investigating',
    statusHistory: [
      { id: 'ISH-1018-1', status: 'open', timestamp: '2026-05-13T17:18:00Z', updatedBy: 'Support Desk', note: 'Report created from missing receiving scan.' },
      { id: 'ISH-1018-2', status: 'investigating', timestamp: '2026-05-13T17:46:00Z', updatedBy: 'Dispatch Review', note: 'Rider and receiving point contacted for route confirmation.' },
    ],
    assignedTeam: 'Dispatch Review',
    lastKnownLocation: 'Espana Dispatch Bay',
    lastKnownTimestamp: '2026-05-13T15:15:00Z',
    assignedDriver: {
      name: 'Mark Gonzales',
      phone: '+63 918 221 7044',
      vehicle: 'Motorcycle - NCR 7720',
      rating: 4.5,
      lastContact: '2026-05-13T15:40:00Z',
    },
    timeline: [
      { id: 'TL-005', label: 'Parcel accepted', location: '7-Eleven Espana', timestamp: '2026-05-13T09:30:00Z', status: 'completed', note: 'Customer dropped parcel at counter.' },
      { id: 'TL-006', label: 'Dispatch assignment', location: 'Espana Dispatch Bay', timestamp: '2026-05-13T12:05:00Z', status: 'completed', note: 'Assigned to rider route batch ES-18.' },
      { id: 'TL-007', label: 'Route departure', location: 'Espana Dispatch Bay', timestamp: '2026-05-13T15:15:00Z', status: 'current', note: 'Last rider departure scan.' },
      { id: 'TL-008', label: 'Drop-off confirmation', location: 'Dapitan Receiving Point', timestamp: '2026-05-13T17:00:00Z', status: 'pending', note: 'Receiving scan not recorded.' },
    ],
  }
];


// ─── Prescriptive BI Dashboard ────────────────────────────────────────────────

export interface HubDwellTime {
  hub_id: string;
  hub_name: string;
  total_parcels: number;
  avg_dwell_hours: number;
  sla_breach_count: number;
  currently_dwelling: number;
}

export interface HubVolumeForecast {
  hub_id: string;
  hub_name: string;
  current_stored: number;
  incoming_24h: number;
  total_forecast: number;
  capacity: number;
  risk_pct: number;
}

export interface ActionableInsight {
  hub_id: string;
  hub_name: string;
  risk_pct: number;
  avg_dwell_hours: number;
  sla_breach_count: number;
  current_stored: number;
  incoming_24h: number;
  capacity: number;
  prescriptive_action: string;
  severity: 'CRITICAL' | 'WARNING' | 'STABLE';
}

export async function fetchDwellTimes(): Promise<HubDwellTime[]> {
  try {
    const { data, error } = await supabase
      .schema('parcel')
      .from('vw_hub_dwell_times')
      .select('*');
    if (error) throw error;
    return (data ?? []).map((row): HubDwellTime => ({
      hub_id: row.hub_id ?? '',
      hub_name: row.hub_name ?? '',
      total_parcels: Number(row.total_parcels ?? 0),
      avg_dwell_hours: Number(row.avg_dwell_hours ?? 0),
      sla_breach_count: Number(row.sla_breach_count ?? 0),
      currently_dwelling: Number(row.currently_dwelling ?? 0),
    }));
  } catch {
    return [];
  }
}

export async function fetchVolumeForecast(): Promise<HubVolumeForecast[]> {
  try {
    const { data, error } = await supabase
      .schema('parcel')
      .from('vw_hub_volume_forecast')
      .select('*');
    if (error) throw error;
    return (data ?? []).map((row): HubVolumeForecast => ({
      hub_id: row.hub_id ?? '',
      hub_name: row.hub_name ?? '',
      current_stored: Number(row.current_stored ?? 0),
      incoming_24h: Number(row.incoming_24h ?? 0),
      total_forecast: Number(row.total_forecast ?? 0),
      capacity: Number(row.capacity ?? 100),
      risk_pct: Number(row.risk_pct ?? 0),
    }));
  } catch {
    return [];
  }
}

export async function fetchActionableInsights(): Promise<ActionableInsight[]> {
  try {
    const { data, error } = await supabase
      .schema('parcel')
      .from('vw_pakiship_actionable_insights')
      .select('*');
    if (error) throw error;
    return (data ?? []).map((row): ActionableInsight => ({
      hub_id: row.hub_id ?? '',
      hub_name: row.hub_name ?? '',
      risk_pct: Number(row.risk_pct ?? 0),
      avg_dwell_hours: Number(row.avg_dwell_hours ?? 0),
      sla_breach_count: Number(row.sla_breach_count ?? 0),
      current_stored: Number(row.current_stored ?? 0),
      incoming_24h: Number(row.incoming_24h ?? 0),
      capacity: Number(row.capacity ?? 100),
      prescriptive_action: row.prescriptive_action ?? 'Stable / Optimal Flow.',
      severity: row.severity ?? 'STABLE',
    }));
  } catch {
    return [];
  }
}

export async function fetchOnlineDriverCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .schema('driver')
      .from('driver_sessions')
      .select('driver_user_id', { count: 'exact', head: true })
      .eq('is_online', true);
    if (error) throw error;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function executeSurgeAction(
  locationId: string,
  threat: string,
  action: string,
  platform: string = 'pakiship'
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .schema('routing')
      .rpc('fn_execute_surge_action', {
        p_location_id: locationId,
        p_threat: threat,
        p_action: action,
        p_platform: platform,
      });
    if (error) throw error;
    return data as string;
  } catch (err) {
    console.error('executeSurgeAction error:', err);
    return null;
  }
}

// ─── Northstar BI: Hub Utilization (vw_pakiship_descriptive) ─────────────────

export interface HubUtilization {
  hub_id: string;
  hub_name: string;
  capacity: number;
  current_stored: number;
  sla_breach_count: number;
  total_parcels: number;
  util_pct: number;
  relay_count: number;
  direct_count: number;
  relay_pct: number;
  direct_pct: number;
  sla_ok_pct: number;
  avg_network_util_pct: number;
}

export async function fetchHubUtilization(): Promise<HubUtilization[]> {
  try {
    const { data, error } = await supabase
      .schema('parcel')
      .from('vw_pakiship_descriptive')
      .select('*');
    if (error) throw error;
    return (data ?? []).map((row): HubUtilization => ({
      hub_id: row.hub_id ?? '',
      hub_name: row.hub_name ?? '',
      capacity: Number(row.capacity ?? 100),
      current_stored: Number(row.current_stored ?? 0),
      sla_breach_count: Number(row.sla_breach_count ?? 0),
      total_parcels: Number(row.total_parcels ?? 0),
      util_pct: Number(row.util_pct ?? 0),
      relay_count: Number(row.relay_count ?? 0),
      direct_count: Number(row.direct_count ?? 0),
      relay_pct: Number(row.relay_pct ?? 0),
      direct_pct: Number(row.direct_pct ?? 0),
      sla_ok_pct: Number(row.sla_ok_pct ?? 100),
      avg_network_util_pct: Number(row.avg_network_util_pct ?? 0),
    }));
  } catch {
    return [];
  }
}

// ─── Northstar BI: Bypass Forecast (vw_pakiship_predictive) ──────────────────

export interface HubBypassForecast {
  hub_id: string;
  hub_name: string;
  capacity: number;
  current_stored: number;
  forecast_4h: number;
  forecast_24h: number;
  forecast_4h_pct: number;
  forecast_24h_pct: number;
}

export async function fetchHubBypassForecast(): Promise<HubBypassForecast[]> {
  try {
    const { data, error } = await supabase
      .schema('parcel')
      .from('vw_pakiship_predictive')
      .select('*');
    if (error) throw error;
    return (data ?? []).map((row): HubBypassForecast => ({
      hub_id: row.hub_id ?? '',
      hub_name: row.hub_name ?? '',
      capacity: Number(row.capacity ?? 100),
      current_stored: Number(row.current_stored ?? 0),
      forecast_4h: Number(row.forecast_4h ?? 0),
      forecast_24h: Number(row.forecast_24h ?? 0),
      forecast_4h_pct: Number(row.forecast_4h_pct ?? 0),
      forecast_24h_pct: Number(row.forecast_24h_pct ?? 0),
    }));
  } catch {
    return [];
  }
}

// ─── Northstar BI: Prescriptive Actions (vw_pakiship_prescriptive) ───────────

export interface PrescriptiveInsight {
  hub_id: string;
  hub_name: string;
  util_pct: number;
  sla_ok_pct: number;
  relay_pct: number;
  direct_pct: number;
  current_stored: number;
  capacity: number;
  sla_breach_count: number;
  forecast_4h_pct: number;
  forecast_24h_pct: number;
  forecast_4h: number;
  forecast_24h: number;
  prescriptive_action: string;
  severity: 'CRITICAL' | 'WARNING' | 'STABLE';
}

export async function fetchPrescriptiveInsights(): Promise<PrescriptiveInsight[]> {
  try {
    const { data, error } = await supabase
      .schema('parcel')
      .from('vw_pakiship_prescriptive')
      .select('*');
    if (error) throw error;
    return (data ?? []).map((row): PrescriptiveInsight => ({
      hub_id: row.hub_id ?? '',
      hub_name: row.hub_name ?? '',
      util_pct: Number(row.util_pct ?? 0),
      sla_ok_pct: Number(row.sla_ok_pct ?? 100),
      relay_pct: Number(row.relay_pct ?? 0),
      direct_pct: Number(row.direct_pct ?? 0),
      current_stored: Number(row.current_stored ?? 0),
      capacity: Number(row.capacity ?? 100),
      sla_breach_count: Number(row.sla_breach_count ?? 0),
      forecast_4h_pct: Number(row.forecast_4h_pct ?? 0),
      forecast_24h_pct: Number(row.forecast_24h_pct ?? 0),
      forecast_4h: Number(row.forecast_4h ?? 0),
      forecast_24h: Number(row.forecast_24h ?? 0),
      prescriptive_action: row.prescriptive_action ?? 'Stable (Near 75% Target).',
      severity: row.severity ?? 'STABLE',
    }));
  } catch {
    return [];
  }
}
