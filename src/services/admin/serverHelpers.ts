import { and, count, eq, gte, sql } from 'drizzle-orm';

import { agents } from '@/database/schemas/agent';
import { messages } from '@/database/schemas/message';
import { sessions } from '@/database/schemas/session';
import { users } from '@/database/schemas/user';
import { serverDB } from '@/database/server';
import { AdminDashboardMetrics } from '@/store/admin/slices/dashboard';

export async function getServerDashboardMetrics(): Promise<AdminDashboardMetrics> {
  const db = await serverDB;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Get user metrics
  const [totalUsersResult] = await db.select({ count: count() }).from(users);
  const totalUsers = totalUsersResult.count;

  const [activeUsersResult] = await db
    .select({ count: count() })
    .from(users)
    .where(gte(users.updatedAt, sevenDaysAgo));
  const activeUsers = activeUsersResult.count;

  // Calculate user growth
  const [lastMonthUsersResult] = await db
    .select({ count: count() })
    .from(users)
    .where(
      and(gte(users.createdAt, startOfLastMonth), sql`${users.createdAt} <= ${endOfLastMonth}`),
    );
  const lastMonthUsers = lastMonthUsersResult.count;

  const [thisMonthUsersResult] = await db
    .select({ count: count() })
    .from(users)
    .where(gte(users.createdAt, startOfMonth));
  const thisMonthUsers = thisMonthUsersResult.count;

  const userGrowth =
    lastMonthUsers > 0 ? ((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100 : 0;

  // Get message metrics
  const [totalMessagesResult] = await db.select({ count: count() }).from(messages);
  const totalMessages = totalMessagesResult.count;

  // Mock token and subscription data for now
  const totalTokens = 8_500_000;
  const activeSubscriptions = 234;

  // Get revenue metrics (simplified - you might want to add a transactions table)
  const monthlyRevenue = activeSubscriptions * 29.99; // Assuming a fixed price for now

  // Get model metrics (count enabled models - simplified)
  const activeModels = 10; // Placeholder - implement based on your model configuration

  // Get agent metrics
  const [customAgentsResult] = await db.select({ count: count() }).from(agents);
  const customAgents = customAgentsResult.count;

  // Calculate growth rates (simplified - you might want to store historical data)
  const messageGrowth = 15.5; // Placeholder
  const tokenGrowth = 22.3; // Placeholder
  const activeUserGrowth = 8.7; // Placeholder
  const subscriptionGrowth = 12.4; // Placeholder
  const revenueGrowth = 18.9; // Placeholder
  const agentGrowth = 25; // Placeholder

  return {
    totalUsers,
    activeUsers,
    userGrowth,
    activeUserGrowth,
    totalMessages,
    messageGrowth,
    totalTokens,
    tokenGrowth,
    activeSubscriptions,
    subscriptionGrowth,
    monthlyRevenue,
    revenueGrowth,
    activeModels,
    customAgents,
    agentGrowth,
  };
}
