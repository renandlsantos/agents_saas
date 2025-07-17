import { jsonb, pgTable, text } from 'drizzle-orm/pg-core';

import { timestamps } from './_helpers';
import { users } from './user';

// Admin action logs for audit trail
export const adminLogs = pgTable('admin_logs', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),

  action: text('action').notNull(), // e.g., 'user.disable', 'plan.create', 'model.update'
  resource: text('resource').notNull(), // e.g., 'user', 'plan', 'model'
  resourceId: text('resource_id'), // ID of the affected resource

  details: jsonb('details'), // Additional action details
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),

  ...timestamps,
});

export type NewAdminLog = typeof adminLogs.$inferInsert;
export type AdminLogItem = typeof adminLogs.$inferSelect;

// Admin-specific settings
export const adminSettings = pgTable('admin_settings', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  key: text('key').unique().notNull(), // e.g., 'dashboard.refresh_rate', 'alerts.enabled'
  value: jsonb('value').notNull(),
  description: text('description'),

  ...timestamps,
});

export type NewAdminSetting = typeof adminSettings.$inferInsert;
export type AdminSettingItem = typeof adminSettings.$inferSelect;
