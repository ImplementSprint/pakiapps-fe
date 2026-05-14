export interface PaymentMethod {
  id: number;
  displayLabel: string;
  mobileNumber: string;
  isDefault: boolean;
}

export const paymentMethodService = {
  getAll: async (): Promise<PaymentMethod[]> => {
    return [];
  }
};
