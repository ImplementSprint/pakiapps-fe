export type LostParcelStatus = 'open' | 'investigating' | 'found' | 'refunded' | 'closed';
export type TimelineStatus = 'completed' | 'current' | 'pending' | 'flagged';
export type RefundMethod = 'GCash' | 'Bank Transfer' | 'Card Reversal';

export interface ShipmentTimelineItem {
  id: string;
  label: string;
  location: string;
  timestamp: string;
  status: TimelineStatus;
  note: string;
}

export interface AssignedDriver {
  name: string;
  phone: string;
  vehicle: string;
  rating: number;
  lastContact: string;
}

export interface InvestigationStatusUpdate {
  id: string;
  status: LostParcelStatus;
  timestamp: string;
  updatedBy: string;
  note: string;
}

export interface RefundRecord {
  id: string;
  amount: number;
  method: RefundMethod;
  timestamp: string;
  issuedBy: string;
  note: string;
}

export interface ResolutionNotification {
  id: string;
  recipientEmail: string;
  subject: string;
  message: string;
  sentAt: string;
  sentBy: string;
  outcome: LostParcelStatus;
}

export interface LostParcelCase {
  id: string;
  parcelId: string;
  affectedCustomer: string;
  customerEmail: string;
  route: string;
  parcelValue: number;
  dateReported: string;
  status: LostParcelStatus;
  statusHistory: InvestigationStatusUpdate[];
  refund?: RefundRecord;
  resolutionNotification?: ResolutionNotification;
  assignedTeam: string;
  lastKnownLocation: string;
  lastKnownTimestamp: string;
  assignedDriver: AssignedDriver;
  timeline: ShipmentTimelineItem[];
}

export const LOST_PARCEL_CASES: LostParcelCase[] = [
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
      { id: 'ISH-1021-1', status: 'open', timestamp: '2026-05-14T18:05:00', updatedBy: 'Support Desk', note: 'Customer reported parcel missing after missed delivery scan.' },
      { id: 'ISH-1021-2', status: 'investigating', timestamp: '2026-05-14T18:22:00', updatedBy: 'Incident Response', note: 'Assigned to incident team for hub scan verification.' },
    ],
    assignedTeam: 'Incident Response',
    lastKnownLocation: 'PakiShip Sampaloc Sorting Desk',
    lastKnownTimestamp: '2026-05-14T16:45:00',
    assignedDriver: {
      name: 'John Salazar',
      phone: '+63 917 406 1102',
      vehicle: 'Motorcycle - NCR 4812',
      rating: 4.7,
      lastContact: '2026-05-14T17:10:00',
    },
    timeline: [
      { id: 'TL-001', label: 'Parcel accepted', location: 'Lawson Lacson Ave', timestamp: '2026-05-14T10:20:00', status: 'completed', note: 'Parcel scanned at partner counter.' },
      { id: 'TL-002', label: 'Driver pickup', location: 'Lawson Lacson Ave', timestamp: '2026-05-14T11:05:00', status: 'completed', note: 'Driver confirmed package pickup.' },
      { id: 'TL-003', label: 'Hub intake scan', location: 'PakiShip Sampaloc Sorting Desk', timestamp: '2026-05-14T16:45:00', status: 'flagged', note: 'Last confirmed scan before missing handoff.' },
      { id: 'TL-004', label: 'Customer delivery', location: 'P. Noval, Sampaloc', timestamp: '2026-05-14T18:30:00', status: 'pending', note: 'Delivery scan missing.' },
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
      { id: 'ISH-1018-1', status: 'open', timestamp: '2026-05-13T17:18:00', updatedBy: 'Support Desk', note: 'Report created from missing receiving scan.' },
      { id: 'ISH-1018-2', status: 'investigating', timestamp: '2026-05-13T17:46:00', updatedBy: 'Dispatch Review', note: 'Rider and receiving point contacted for route confirmation.' },
    ],
    assignedTeam: 'Dispatch Review',
    lastKnownLocation: 'Espana Dispatch Bay',
    lastKnownTimestamp: '2026-05-13T15:15:00',
    assignedDriver: {
      name: 'Mark Gonzales',
      phone: '+63 918 221 7044',
      vehicle: 'Motorcycle - NCR 7720',
      rating: 4.5,
      lastContact: '2026-05-13T15:40:00',
    },
    timeline: [
      { id: 'TL-005', label: 'Parcel accepted', location: '7-Eleven Espana', timestamp: '2026-05-13T09:30:00', status: 'completed', note: 'Customer dropped parcel at counter.' },
      { id: 'TL-006', label: 'Dispatch assignment', location: 'Espana Dispatch Bay', timestamp: '2026-05-13T12:05:00', status: 'completed', note: 'Assigned to rider route batch ES-18.' },
      { id: 'TL-007', label: 'Route departure', location: 'Espana Dispatch Bay', timestamp: '2026-05-13T15:15:00', status: 'current', note: 'Last rider departure scan.' },
      { id: 'TL-008', label: 'Drop-off confirmation', location: 'Dapitan Receiving Point', timestamp: '2026-05-13T17:00:00', status: 'pending', note: 'Receiving scan not recorded.' },
    ],
  },
  {
    id: 'LPC-1014',
    parcelId: 'PKS-2026-9751',
    affectedCustomer: 'Bea Flores',
    customerEmail: 'bea.flores@email.com',
    route: 'UST Overpass to Lerma',
    parcelValue: 4200,
    dateReported: '2026-05-12',
    status: 'open',
    statusHistory: [
      { id: 'ISH-1014-1', status: 'open', timestamp: '2026-05-12T16:20:00', updatedBy: 'Customer Support', note: 'Customer report logged with initial drop-off receipt.' },
    ],
    assignedTeam: 'Customer Support',
    lastKnownLocation: 'UST Overpass Drop-Off Counter',
    lastKnownTimestamp: '2026-05-12T13:55:00',
    assignedDriver: {
      name: 'Maria Reyes',
      phone: '+63 915 602 3481',
      vehicle: 'Motorcycle - NCR 2198',
      rating: 4.8,
      lastContact: '2026-05-12T14:25:00',
    },
    timeline: [
      { id: 'TL-009', label: 'Parcel accepted', location: 'UST Overpass Drop-Off Counter', timestamp: '2026-05-12T13:55:00', status: 'current', note: 'Only successful scan on the shipment.' },
      { id: 'TL-010', label: 'Driver pickup', location: 'UST Overpass Drop-Off Counter', timestamp: '2026-05-12T15:00:00', status: 'pending', note: 'Pickup confirmation awaiting customer document match.' },
    ],
  },
  {
    id: 'LPC-1009',
    parcelId: 'PKS-2026-9633',
    affectedCustomer: 'Lester Villanueva',
    customerEmail: 'lester.villanueva@email.com',
    route: 'Asturias to Laon Laan',
    parcelValue: 16480,
    dateReported: '2026-05-11',
    status: 'open',
    statusHistory: [
      { id: 'ISH-1009-1', status: 'open', timestamp: '2026-05-11T14:35:00', updatedBy: 'Hub Operations', note: 'Counter scan found without matching transfer scan.' },
    ],
    assignedTeam: 'Hub Operations',
    lastKnownLocation: 'Asturias Partner Counter',
    lastKnownTimestamp: '2026-05-11T11:45:00',
    assignedDriver: {
      name: 'Leo Castillo',
      phone: '+63 922 818 5530',
      vehicle: 'Motorcycle - NCR 6320',
      rating: 4.4,
      lastContact: '2026-05-11T12:20:00',
    },
    timeline: [
      { id: 'TL-011', label: 'Parcel accepted', location: 'Asturias Partner Counter', timestamp: '2026-05-11T11:45:00', status: 'flagged', note: 'Initial scan recorded; no subsequent movement.' },
      { id: 'TL-012', label: 'Hub transfer', location: 'Sampaloc Hub', timestamp: '2026-05-11T14:00:00', status: 'pending', note: 'Transfer scan missing.' },
    ],
  },
  {
    id: 'LPC-1006',
    parcelId: 'PKS-2026-9558',
    affectedCustomer: 'Jessa Rivera',
    customerEmail: 'jessa.rivera@email.com',
    route: 'Espana to Quiapo',
    parcelValue: 6200,
    dateReported: '2026-05-10',
    status: 'investigating',
    statusHistory: [
      { id: 'ISH-1006-1', status: 'open', timestamp: '2026-05-10T18:40:00', updatedBy: 'Support Desk', note: 'Customer reported parcel absent from expected delivery.' },
      { id: 'ISH-1006-2', status: 'investigating', timestamp: '2026-05-10T19:05:00', updatedBy: 'Dispatch Review', note: 'Transfer batch and rider log under review.' },
    ],
    assignedTeam: 'Dispatch Review',
    lastKnownLocation: 'Quiapo Route Van Transfer',
    lastKnownTimestamp: '2026-05-10T18:05:00',
    assignedDriver: {
      name: 'Anna Martinez',
      phone: '+63 927 441 8920',
      vehicle: 'Motorcycle - NCR 3431',
      rating: 4.6,
      lastContact: '2026-05-10T18:45:00',
    },
    timeline: [
      { id: 'TL-013', label: 'Parcel accepted', location: '7-Eleven Espana', timestamp: '2026-05-10T10:10:00', status: 'completed', note: 'Accepted at origin counter.' },
      { id: 'TL-014', label: 'Driver pickup', location: 'Espana Dispatch Bay', timestamp: '2026-05-10T13:40:00', status: 'completed', note: 'Picked up by assigned rider.' },
      { id: 'TL-015', label: 'Transfer scan', location: 'Quiapo Route Van Transfer', timestamp: '2026-05-10T18:05:00', status: 'current', note: 'Last known scan before report.' },
    ],
  },
  {
    id: 'LPC-1002',
    parcelId: 'PKS-2026-9412',
    affectedCustomer: 'Dianne Lopez',
    customerEmail: 'dianne.lopez@email.com',
    route: 'Lerma to Recto',
    parcelValue: 9700,
    dateReported: '2026-05-08',
    status: 'found',
    statusHistory: [
      { id: 'ISH-1002-1', status: 'open', timestamp: '2026-05-08T15:15:00', updatedBy: 'Support Desk', note: 'Missing parcel report created.' },
      { id: 'ISH-1002-2', status: 'investigating', timestamp: '2026-05-08T15:40:00', updatedBy: 'Claims Review', note: 'Counter and rider scans compared.' },
      { id: 'ISH-1002-3', status: 'found', timestamp: '2026-05-08T16:35:00', updatedBy: 'Claims Review', note: 'Parcel recovered at Recto receiving counter.' },
    ],
    assignedTeam: 'Claims Review',
    lastKnownLocation: 'Recto Receiving Counter',
    lastKnownTimestamp: '2026-05-08T16:30:00',
    assignedDriver: {
      name: 'Jose Navarro',
      phone: '+63 916 480 1928',
      vehicle: 'Motorcycle - NCR 5490',
      rating: 4.9,
      lastContact: '2026-05-08T16:50:00',
    },
    timeline: [
      { id: 'TL-016', label: 'Parcel accepted', location: 'Mini Stop Lerma', timestamp: '2026-05-08T09:10:00', status: 'completed', note: 'Accepted at origin counter.' },
      { id: 'TL-017', label: 'Driver pickup', location: 'Mini Stop Lerma', timestamp: '2026-05-08T11:05:00', status: 'completed', note: 'Picked up by rider.' },
      { id: 'TL-018', label: 'Recovery scan', location: 'Recto Receiving Counter', timestamp: '2026-05-08T16:30:00', status: 'completed', note: 'Parcel located and closed by claims review.' },
    ],
  },
  {
    id: 'LPC-0998',
    parcelId: 'PKS-2026-9369',
    affectedCustomer: 'Rachel Co',
    customerEmail: 'rachel.co@email.com',
    route: 'Santa Cruz to Sampaloc',
    parcelValue: 28100,
    dateReported: '2026-05-07',
    status: 'refunded',
    statusHistory: [
      { id: 'ISH-0998-1', status: 'open', timestamp: '2026-05-07T21:10:00', updatedBy: 'Support Desk', note: 'High value parcel reported missing.' },
      { id: 'ISH-0998-2', status: 'investigating', timestamp: '2026-05-07T21:32:00', updatedBy: 'Incident Response', note: 'Consolidation point and rider records reviewed.' },
      { id: 'ISH-0998-3', status: 'refunded', timestamp: '2026-05-08T11:05:00', updatedBy: 'Claims Review', note: 'Refund approved after failed recovery window.' },
    ],
    refund: {
      id: 'RF-2026-0998',
      amount: 28100,
      method: 'Bank Transfer',
      timestamp: '2026-05-08T11:05:00',
      issuedBy: 'Claims Review',
      note: 'Refund approved after failed recovery window.',
    },
    assignedTeam: 'Incident Response',
    lastKnownLocation: 'Santa Cruz Consolidation Point',
    lastKnownTimestamp: '2026-05-07T20:15:00',
    assignedDriver: {
      name: 'Daniel Torres',
      phone: '+63 917 650 2221',
      vehicle: 'Motorcycle - NCR 8110',
      rating: 4.3,
      lastContact: '2026-05-07T20:35:00',
    },
    timeline: [
      { id: 'TL-019', label: 'Parcel accepted', location: 'SM San Lazaro', timestamp: '2026-05-07T14:00:00', status: 'completed', note: 'Accepted by partner counter.' },
      { id: 'TL-020', label: 'Driver pickup', location: 'SM San Lazaro', timestamp: '2026-05-07T15:25:00', status: 'completed', note: 'Rider pickup confirmed.' },
      { id: 'TL-021', label: 'Consolidation scan', location: 'Santa Cruz Consolidation Point', timestamp: '2026-05-07T20:15:00', status: 'flagged', note: 'Last known scan; parcel not found in next batch.' },
    ],
  },
];
