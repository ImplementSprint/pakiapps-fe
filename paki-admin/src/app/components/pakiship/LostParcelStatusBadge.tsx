import type { LostParcelStatus } from '../../lib/supabaseSchema';

export function LostParcelStatusBadge({ status }: { status: LostParcelStatus }) {
  const statusConfig = {
    open: 'bg-amber-50 text-amber-600 border-amber-100',
    investigating: 'bg-blue-50 text-blue-600 border-blue-100',
    found: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    refunded: 'bg-red-50 text-red-600 border-red-100',
    closed: 'bg-gray-50 text-gray-500 border-gray-100',
  };

  const labels = {
    open: 'Open',
    investigating: 'Investigating',
    found: 'Found',
    refunded: 'Refunded',
    closed: 'Closed',
  };

  return (
    <span className={`inline-block whitespace-nowrap rounded-full border px-3 py-1 text-[10px] font-bold uppercase ${statusConfig[status]}`}>
      {labels[status]}
    </span>
  );
}
