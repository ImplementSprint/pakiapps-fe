// 'use client' directive for client-side interactivity
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/modules/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/modules/components/ui/card';
import { getPakiShipShipment, type ShipmentRecord } from '@/modules/lib/pakishipApi';

export default function ShipmentDetailPage() {
  const params = useParams(); // URL param like /pakiship/shipments/[id]
  const idParam = params?.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  const router = useRouter();
  const [shipment, setShipment] = useState<ShipmentRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      return;
    }

    let isMounted = true;

    getPakiShipShipment(id)
      .then((data) => {
        if (isMounted) {
          setShipment(data);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const statusColors: Record<string, string> = {
    'In Transit': 'bg-blue-50 text-blue-600 border-blue-100',
    Delivered: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    Pending: 'bg-amber-50 text-amber-600 border-amber-100',
    Cancelled: 'bg-red-50 text-red-600 border-red-100',
  };

  const timelineSteps = ['Pending', 'In Transit', 'Delivered', 'Cancelled'];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F0F9F8] p-8 font-sans text-[#1A5D56]">
        <p className="text-sm font-bold text-[#39B5A8]">Loading shipment...</p>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="min-h-screen bg-[#F0F9F8] p-8 font-sans text-[#1A5D56]">
        <Button variant="ghost" className="mb-6 flex items-center gap-2 text-[#39B5A8]" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Back to Shipments
        </Button>
        <p className="text-sm font-bold text-red-500">Shipment was not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F9F8] p-8 font-sans text-[#1A5D56]">
      <Button
        variant="ghost"
        className="mb-6 flex items-center gap-2 text-[#39B5A8]"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4" /> Back to Shipments
      </Button>

      <Card className="max-w-4xl mx-auto bg-white shadow-lg">
        <CardHeader className="p-6 border-b border-[#39B5A8]/10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-[#041614]">
              Shipment {shipment.id}
            </CardTitle>
            <span
              className={`inline-flex items-center rounded-lg border px-3 py-1 text-xs font-black uppercase ${statusColors[shipment.status]}`}
            >
              {shipment.status}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          {/* Timeline */}
          <section>
            <h2 className="mb-4 text-xl font-semibold text-[#041614]">Status Timeline</h2>
            <div className="flex flex-col space-y-4">
              {timelineSteps.map((step) => {
                const isActive =
                  step === shipment.status ||
                  (step === 'Pending' && shipment.status === 'Pending') ||
                  (step === 'In Transit' && ['In Transit', 'Delivered'].includes(shipment.status));
                return (
                  <div key={step} className="flex items-center">
                    <div
                      className={`h-4 w-4 rounded-full mr-3 ${isActive ? 'bg-[#39B5A8]' : 'bg-gray-300'}`}
                    />
                    <span className="text-sm font-medium text-[#041614]">{step}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Sender / Receiver */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="mb-2 text-lg font-semibold text-[#041614]">Sender</h3>
              <p className="text-sm text-[#1A5D56]"><strong>Name:</strong> {shipment.sender}</p>
              <p className="text-sm text-[#1A5D56]"><strong>Address:</strong> {shipment.location}</p>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold text-[#041614]">Receiver</h3>
              <p className="text-sm text-[#1A5D56]"><strong>Name:</strong> {shipment.receiver}</p>
              <p className="text-sm text-[#1A5D56]"><strong>Address:</strong> {shipment.destination}</p>
            </div>
          </section>

          {/* Payment Details */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="mb-2 text-lg font-semibold text-[#041614]">Payment</h3>
              <p className="text-sm text-[#1A5D56]"><strong>Amount:</strong> PHP {shipment.amount}</p>
              <p className="text-sm text-[#1A5D56]"><strong>Quantity:</strong> {shipment.quantity}</p>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold text-[#041614]">Logistics</h3>
              <p className="text-sm text-[#1A5D56]"><strong>Driver:</strong> {shipment.driver}</p>
              <p className="text-sm text-[#1A5D56]"><strong>ETA:</strong> {shipment.eta}</p>
              <p className="text-sm text-[#1A5D56]"><strong>Date:</strong> {shipment.date}</p>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
