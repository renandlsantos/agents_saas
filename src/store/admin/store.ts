import { StateCreator, create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { AdminStoreState, initialState } from './initialState';
import { AdminDashboardAction, createDashboardSlice } from './slices/dashboard';

export type AdminStore = AdminStoreState & AdminDashboardAction;

const createStore: StateCreator<AdminStore> = (...parameters) => ({
  ...initialState,
  ...createDashboardSlice(...parameters),
});

export const useAdminStore = create<AdminStore>()(
  devtools(createStore, {
    name: 'LobeChat_Admin',
  }),
);
