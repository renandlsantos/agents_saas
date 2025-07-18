import { StateCreator } from 'zustand';

import { adminService } from '@/services/admin';

import { AdminStore } from '../../store';
import { AdminDashboardState } from './initialState';

export interface AdminDashboardAction {
  clearError: () => void;
  fetchMetrics: () => Promise<void>;
  refreshMetrics: () => void;
}

export const createDashboardSlice: StateCreator<AdminStore, [], [], AdminDashboardAction> = (
  set,
  get,
) => ({
  // Initial state is spread in the store.ts file

  fetchMetrics: async () => {
    set({ loading: true, error: null });

    try {
      const metrics = await adminService.getDashboardMetrics();

      set({
        metrics,
        loading: false,
        lastRefresh: Date.now(),
      });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch metrics',
      });
    }
  },

  refreshMetrics: () => {
    const lastRefresh = get().lastRefresh;
    const now = Date.now();

    // Only refresh if more than 30 seconds have passed
    if (!lastRefresh || now - lastRefresh > 30_000) {
      get().fetchMetrics();
    }
  },

  clearError: () => {
    set({ error: null });
  },
});
