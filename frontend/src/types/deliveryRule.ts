export interface DeliveryRule {
  id: string;
  minAmount: number;
  maxAmount: number | null;
  charge: number;
  isFree: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}
