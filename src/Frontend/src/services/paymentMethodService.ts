import { api } from './authService';

export interface PaymentMethod {
  id: number;
  _id: string;
  userId: number;
  provider: 'GCash' | 'PayMaya' | 'card';
  mobileNumber?: string;
  displayLabel?: string;
  isDefault: boolean;
  createdAt: string;
}

const paymentMethodService = {
  /** List all saved payment methods for the logged-in user */
  getAll: async (): Promise<PaymentMethod[]> => {
    const res = await api.get('/payment-methods');
    return res.data.data ?? [];
  },

  /** Link a GCash number — 09XXXXXXXXX or +639XXXXXXXXX */
  linkGCash: async (mobileNumber: string): Promise<PaymentMethod> => {
    const res = await api.post('/payment-methods/gcash', { mobileNumber });
    return res.data.data;
  },

  /** Remove a saved payment method */
  remove: async (id: string | number): Promise<void> => {
    await api.delete(`/payment-methods/${id}`);
  },

  /** Set a payment method as the default */
  setDefault: async (id: string | number): Promise<PaymentMethod> => {
    const res = await api.patch(`/payment-methods/${id}/default`);
    return res.data.data;
  },
};

export { paymentMethodService };
