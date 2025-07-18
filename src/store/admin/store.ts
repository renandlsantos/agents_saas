import { createWithEqualityFn } from 'zustand/traditional';
import { StateCreator } from 'zustand';
import { shallow } from 'zustand/shallow';

import { createDevtools } from '../middleware/createDevtools';
import { AdminStoreState, initialState } from './initialState';
import { AdminDashboardAction, createDashboardSlice } from './slices/dashboard';

export type AdminStore = AdminStoreState & AdminDashboardAction;

const createStore: StateCreator<AdminStore, [['zustand/devtools', never]]> = (...parameters) => ({
  ...initialState,
  ...createDashboardSlice(...parameters),
});

const devtools = createDevtools('admin');

export const useAdminStore = createWithEqualityFn<AdminStore>()(devtools(createStore), shallow);
