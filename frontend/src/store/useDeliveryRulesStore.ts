import { create } from 'zustand';
import { fetchApi } from '@/lib/api-client';
import { DeliveryRule } from '@/types/deliveryRule';

interface DeliveryRulesState {
  rules: DeliveryRule[];
  loading: boolean;
  loaded: boolean;
  fetchRules: () => Promise<void>;
  calculateFee: (subtotal: number) => {
    deliveryFee: number;
    isFree: boolean;
    matchedRule: DeliveryRule | null;
    nextFreeRule: DeliveryRule | null;
    amountNeededForFree: number;
  };
}

const defaultFallbackRules: DeliveryRule[] = [
  { id: 'def-1', minAmount: 0, maxAmount: 499, charge: 50, isFree: false, isActive: true },
  { id: 'def-2', minAmount: 500, maxAmount: 999, charge: 80, isFree: false, isActive: true },
  { id: 'def-3', minAmount: 1000, maxAmount: null, charge: 0, isFree: true, isActive: true },
];

export const useDeliveryRulesStore = create<DeliveryRulesState>((set, get) => ({
  rules: [],
  loading: false,
  loaded: false,

  fetchRules: async () => {
    set({ loading: true });
    try {
      const res = await fetchApi<DeliveryRule[]>('/delivery-rules');
      if (res && res.success && Array.isArray(res.data)) {
        set({ rules: res.data, loaded: true });
      }
    } catch (err) {
      console.error('Error fetching delivery rules:', err);
    } finally {
      set({ loading: false });
    }
  },

  calculateFee: (subtotal: number) => {
    const numSubtotal = Number(subtotal) || 0;
    const rulesList = get().rules.length > 0 ? get().rules : defaultFallbackRules;
    const activeRules = rulesList.filter((r) => r.isActive).sort((a, b) => a.minAmount - b.minAmount);

    if (numSubtotal <= 0) {
      return {
        deliveryFee: 0,
        isFree: true,
        matchedRule: null,
        nextFreeRule: null,
        amountNeededForFree: 0,
      };
    }

    const matchedRule = activeRules.find((rule) => {
      const minOk = numSubtotal >= rule.minAmount;
      const maxOk = rule.maxAmount === null || rule.maxAmount === undefined || numSubtotal <= rule.maxAmount;
      return minOk && maxOk;
    }) || null;

    let deliveryFee = 50;
    let isFree = false;

    if (matchedRule) {
      isFree = Boolean(matchedRule.isFree);
      deliveryFee = isFree ? 0 : matchedRule.charge;
    }

    // Find next rule that offers Free Delivery
    const nextFreeRule = activeRules.find((r) => r.isFree && r.minAmount > numSubtotal) || null;
    const amountNeededForFree = nextFreeRule ? nextFreeRule.minAmount - numSubtotal : 0;

    return {
      deliveryFee,
      isFree,
      matchedRule,
      nextFreeRule,
      amountNeededForFree,
    };
  },
}));
