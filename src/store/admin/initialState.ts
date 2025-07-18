import { AdminDashboardState, initialDashboardState } from './slices/dashboard';

export type AdminStoreState = AdminDashboardState;

export const initialState: AdminStoreState = {
  ...initialDashboardState,
};
