# Admin Development Guide - Agents SaaS

This document provides a comprehensive guide for developing the admin panel following the existing project patterns and architecture.

## 🎯 Project Overview

**Lobe Chat** is a modern AI chatbot framework built with:

- **Frontend**: Next.js 15, React 19, Ant Design, Zustand
- **Backend**: tRPC, Drizzle ORM, PostgreSQL/PGLite
- **Auth**: Clerk (primary), NextAuth (secondary)
- **Styling**: antd-style with token-based theming

## 🏗️ Architecture Patterns to Follow

### 1. UI Component Patterns

#### Component Hierarchy

```
src/components (reusable) → installed packages → @lobehub/ui → antd
```

#### Styling Approach

```typescript
// Complex styles with createStyles
const useStyles = createStyles(({ css, token }) => ({
  container: css`
    background: ${token.colorBgContainer};
    border-radius: ${token.borderRadius}px;
    padding: ${token.padding}px;
  `,
}));

// Simple styles inline
<div style={{ color: theme.colorPrimary }} />
```

#### Key UI Components for Admin

- `StatisticCard` - Metrics display
- `Cell` - List items with icons
- `Flexbox`, `Center` - Layout utilities
- Loading/Error boundaries
- Responsive layouts

### 2. Database Layer Requirements

#### Security Pattern (CRITICAL)

```typescript
// ✅ CORRECT - Always check userId
async findByUser(userId: string) {
  return this.db.query.table.findMany({
    where: eq(table.userId, userId),
  });
}

// ❌ WRONG - Security vulnerability
async findAll() {
  return this.db.query.table.findMany();
}
```

#### Model Structure Template

```typescript
export class AdminModel extends BaseModel {
  // Always include userId in operations
  async create(data: NewAdmin) {
    return this.db.insert(adminTable).values({
      ...data,
      userId: this.userId, // REQUIRED
    });
  }

  async update(id: string, data: Partial<Admin>) {
    return this.db
      .update(adminTable)
      .set(data)
      .where(
        and(
          eq(adminTable.id, id),
          eq(adminTable.userId, this.userId), // REQUIRED
        ),
      );
  }
}
```

### 3. State Management Pattern

#### Store Structure

```
src/store/admin/
├── slices/
│   ├── dashboard/
│   │   ├── action.ts
│   │   ├── initialState.ts
│   │   └── selectors.ts
│   ├── users/
│   └── billing/
├── store.ts
└── selectors.ts
```

#### Slice Example

```typescript
// initialState.ts
export interface AdminDashboardState {
  metrics: {
    totalUsers: number;
    activeUsers: number;
    totalTokens: number;
  };
  loading: boolean;
}

// selectors.ts
export const dashboardSelectors = {
  metrics: (s: AdminStoreState) => s.metrics,
  isLoading: (s: AdminStoreState) => s.loading,
};

// action.ts
export interface AdminDashboardAction {
  fetchMetrics: () => Promise<void>;
  refreshMetrics: () => void;
}
```

### 4. Service Layer Pattern

```typescript
// src/services/admin.ts
class AdminService {
  async getMetrics() {
    // Adapt to environment
    if (isServerMode) {
      return this.client.admin.getMetrics.query();
    }
    // Local database queries
    return this.getDashboardMetricsFromLocal();
  }
}
```

### 5. Routing Structure

Admin routes should follow:

```
/admin                    # Dashboard
/admin/users             # User management
/admin/billing           # Billing plans
/admin/models            # LLM configuration
/admin/agents            # Agent builder
/admin/analytics         # Usage analytics
```

## 📋 Admin Features Implementation Plan

### Phase 1: Core Admin Infrastructure

1. **Admin Layout & Navigation**
   - Create `/app/admin` route structure
   - Implement admin-specific layout
   - Add role-based access control
   - Create sidebar navigation

2. **Dashboard Overview**
   - User statistics (total, active, new)
   - Usage metrics (tokens, requests)
   - System health indicators
   - Recent activity feed

### Phase 2: User Management

1. **User List & Search**
   - Paginated user table
   - Search and filters
   - Bulk actions support
   - Export functionality

2. **User Details & Actions**
   - View user profile
   - Enable/disable accounts
   - View user's usage history
   - Reset user data

### Phase 3: Billing & Plans

1. **Plan Management**
   - Create/edit billing plans
   - Set token limits per plan
   - Configure features per plan
   - Plan pricing management

2. **User Subscriptions**
   - View user subscriptions
   - Manual plan assignment
   - Usage tracking per user
   - Billing history

### Phase 4: Model Configuration

1. **LLM Management**
   - List all available models
   - Enable/disable models
   - Configure model settings
   - Set rate limits

2. **Provider Configuration**
   - API key management
   - Provider-specific settings
   - Cost configuration
   - Usage monitoring

### Phase 5: Agent Builder System

1. **Agent Creation**
   - Agent builder interface
   - Knowledge base upload
   - System prompt configuration
   - Testing interface

2. **Agent Discovery**
   - Category management
   - Agent publishing flow
   - Featured agents
   - Usage analytics

## 🔐 Security Considerations

1. **Role-Based Access**

   ```typescript
   // Middleware check
   if (!user.isAdmin) {
     return redirect('/unauthorized');
   }
   ```

2. **Database Security**
   - All queries must include userId checks
   - Use parameterized queries
   - Validate all inputs
   - Audit trail for admin actions

3. **API Security**
   - Rate limiting on admin endpoints
   - Action logging
   - Sensitive data encryption
   - CSRF protection

## 🎨 UI/UX Guidelines

### Admin Theme

- Use existing theme tokens
- Maintain consistency with main app
- Professional, data-focused design
- Clear visual hierarchy

### Component Patterns

```typescript
// Admin metric card
<StatisticCard
  title="Total Users"
  value={metrics.totalUsers}
  trend={metrics.userGrowth}
  loading={loading}
/>

// Admin table
<Table
  columns={userColumns}
  dataSource={users}
  pagination={{ pageSize: 20 }}
  loading={loading}
/>
```

### Responsive Design

- Desktop-first for admin
- Minimum 1024px width
- Mobile view for essential features
- Use existing responsive hooks

## ✅ Implementation Status

### Completed Features

1. **Admin Infrastructure** ✅
   - Admin route structure at `/admin/*`
   - Role-based access control with `isAdmin` field in users table
   - Admin-specific layout with sidebar navigation
   - Authentication middleware checking admin privileges

2. **Admin Dashboard** ✅
   - Overview metrics (users, messages, tokens, revenue)
   - Real-time statistics with growth indicators
   - Responsive card-based layout
   - Mock data integration (ready for real API)

3. **User Management** ✅
   - User list with search and filters
   - Enable/disable user accounts
   - Grant/revoke admin privileges
   - User detail modal
   - Usage statistics per user

4. **Billing & Plans** ✅
   - Plan management (create, edit, delete)
   - Token limits configuration
   - Feature management per plan
   - Revenue overview
   - Subscriber counts

5. **Model Configuration** ✅
   - Provider management (OpenAI, Anthropic, etc.)
   - Enable/disable models
   - API key configuration
   - Cost settings per model
   - Rate limit configuration

### Pending Features

1. **Token Usage Tracking**
   - Real-time token consumption monitoring
   - Plan-based limits enforcement
   - Usage history and analytics

2. **Agent Builder**
   - Custom agent creation interface
   - Knowledge base management
   - System prompt configuration
   - Agent discovery and categorization

3. **Analytics Dashboard**
   - Detailed usage patterns
   - Model popularity metrics
   - User behavior analytics
   - Cost analysis

## 🚀 Implementation Steps

1. **Setup Admin Routes**
   - Create `/app/admin` directory
   - Implement layout and navigation
   - Add authentication middleware

2. **Create Database Schemas**
   - Admin-specific tables if needed
   - Extend existing schemas
   - Add necessary indexes

3. **Implement Core Services**
   - AdminService for business logic
   - tRPC routers for API
   - Zustand store for state

4. **Build UI Components**
   - Follow existing patterns
   - Reuse components where possible
   - Maintain theme consistency

5. **Add Security Layers**
   - Role checks in middleware
   - Database-level security
   - Audit logging

## 📍 File Structure

```
src/
├── app/admin/                    # Admin routes
│   ├── layout.tsx               # Admin authentication check
│   ├── page.tsx                 # Dashboard page
│   ├── users/page.tsx           # User management
│   ├── billing/page.tsx         # Billing management
│   ├── models/page.tsx          # Model configuration
│   ├── agents/page.tsx          # Agent builder (placeholder)
│   └── analytics/page.tsx       # Analytics (placeholder)
├── features/Admin/              # Admin UI components
│   ├── Layout/                  # Admin layout with sidebar
│   ├── Dashboard/               # Dashboard metrics
│   ├── Users/                   # User management UI
│   ├── Billing/                 # Billing plans UI
│   ├── Models/                  # Model config UI
│   ├── Agents/                  # Agent builder UI
│   └── Analytics/               # Analytics UI
├── store/admin/                 # Admin state management
│   ├── slices/dashboard/        # Dashboard state
│   └── store.ts                 # Admin store setup
├── services/admin.ts            # Admin business logic
├── server/routers/lambda/admin.ts # Admin API endpoints
└── database/
    ├── schemas/admin.ts         # Admin-specific tables
    └── schemas/user.ts          # Updated with isAdmin field
```

## 📝 Code Examples

### Admin Route Protection

```typescript
// app/admin/layout.tsx
import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }) {
  const { userId, sessionClaims } = auth();

  if (!userId || !sessionClaims?.isAdmin) {
    redirect('/unauthorized');
  }

  return <AdminLayoutWrapper>{children}</AdminLayoutWrapper>;
}
```

### Admin Store Setup

```typescript
// store/admin/store.ts
import { StateCreator } from 'zustand';

import { AdminDashboardSlice } from './slices/dashboard';
import { AdminUsersSlice } from './slices/users';

export type AdminStore = AdminDashboardSlice & AdminUsersSlice;

export const createAdminStore: StateCreator<AdminStore> = (...a) => ({
  ...createDashboardSlice(...a),
  ...createUsersSlice(...a),
});
```

### Admin Service Example

```typescript
// services/admin.ts
export class AdminService {
  async getDashboardMetrics() {
    const [users, usage, health] = await Promise.all([
      this.getUserMetrics(),
      this.getUsageMetrics(),
      this.getSystemHealth(),
    ]);

    return { users, usage, health };
  }

  private async getUserMetrics() {
    if (isServerMode) {
      return this.client.admin.getUserMetrics.query();
    }
    // Local implementation
  }
}
```

## 🔧 Development Workflow

1. **Follow existing patterns** - Don't reinvent the wheel
2. **Test security thoroughly** - All operations must be user-isolated
3. **Use TypeScript strictly** - Let types guide development
4. **Maintain responsive design** - Test on multiple screen sizes
5. **Document as you go** - Update this guide with learnings

## 📚 Reference Points

- **Profile Stats** (`/profile/stats`) - Dashboard UI reference
- **Settings Pages** (`/settings/*`) - Navigation pattern
- **Model Provider Config** - Configuration UI patterns
- **Billing Models** (`/database/models/billing.ts`) - Existing billing structure

This guide should be updated as the admin panel evolves. Always prioritize security and follow the established patterns.
