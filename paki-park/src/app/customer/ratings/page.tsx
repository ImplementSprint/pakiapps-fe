'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RateAndReview } from '@/components/customer/RateAndReview';
import { bookingService } from '@/services/bookingService';

export default function RatingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    bookingService.getMyBookings({ page: 1 })
      .then(data => {
        if (data?.bookings) {
          setBookings(data.bookings);
        }
      })
      .catch(() => {
        // Silently handle if backend is unavailable or has no bookings
      });
  }, []);

  const handleReviewSubmit = async (data: any) => {
    // In the future, this will submit to the backend API.
    // For now, RateAndReview handles the success state and will call onClose after a delay.
    console.log("Review submitted:", data);
  };

  const formattedBookings = bookings.map((b: any) => ({
    id: b._id,
    reference: b.reference || `PKS-${b._id.substring(0, 5)}`,
    date: new Date(b.createdAt).toLocaleDateString(),
    location: b.locationName || (typeof b.locationId === 'object' && b.locationId?.name) || 'Parking Spot'
  }));

  return (
    <div className="min-h-screen bg-[#f4f7fa]">
      <RateAndReview 
        isOpen={true} 
        onClose={() => router.push('/customer/home')}
        onSubmit={handleReviewSubmit}
        availableBookings={formattedBookings.length > 0 ? formattedBookings : undefined}
      />
    </div>
  );
}
