'use client';

import { Col, Row, Spin, Typography } from 'antd';
import { createStyles } from 'antd-style';
import {
  ActivityIcon,
  BrainCircuitIcon,
  CreditCardIcon,
  MessageSquareIcon,
  ServerIcon,
  TrendingUpIcon,
  UsersIcon,
} from 'lucide-react';
import { useEffect } from 'react';
import { Center, Flexbox } from 'react-layout-kit';

import StatisticCard from '@/components/StatisticCard';
import { useAdminStore } from '@/store/admin';

const { Title } = Typography;

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    width: 100%;
  `,
  title: css`
    margin-block-end: ${token.marginLG}px;
  `,
  loadingContainer: css`
    height: 400px;
  `,
  metricsGrid: css`
    margin-block-end: ${token.marginXL}px;
  `,
  recentSection: css`
    margin-block-start: ${token.marginXL}px;
  `,
}));

const AdminDashboard = () => {
  const { styles } = useStyles();
  const { metrics, loading, fetchMetrics, refreshMetrics } = useAdminStore((s) => ({
    metrics: s.metrics,
    loading: s.loading,
    fetchMetrics: s.fetchMetrics,
    refreshMetrics: s.refreshMetrics,
  }));

  useEffect(() => {
    fetchMetrics();
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      refreshMetrics();
    }, 30_000);

    return () => clearInterval(interval);
  }, [fetchMetrics, refreshMetrics]);

  if (loading) {
    return (
      <Center className={styles.loadingContainer}>
        <Spin size="large" />
      </Center>
    );
  }

  return (
    <div className={styles.container}>
      <Title level={2} className={styles.title}>
        Dashboard Overview
      </Title>

      <Row gutter={[16, 16]} className={styles.metricsGrid}>
        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            title="Total Users"
            statistic={{
              value: metrics.totalUsers,
              suffix:
                metrics.userGrowth !== 0
                  ? `${metrics.userGrowth > 0 ? '+' : ''}${metrics.userGrowth.toFixed(1)}%`
                  : undefined,
            }}
            footer={
              <Flexbox align="center" gap={4}>
                <UsersIcon size={16} />
                <span>All registered users</span>
              </Flexbox>
            }
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            title="Active Users"
            statistic={{
              value: metrics.activeUsers,
              suffix:
                metrics.activeUserGrowth !== 0
                  ? `${metrics.activeUserGrowth > 0 ? '+' : ''}${metrics.activeUserGrowth.toFixed(1)}%`
                  : undefined,
            }}
            footer={
              <Flexbox align="center" gap={4}>
                <ActivityIcon size={16} />
                <span>Active in last 7 days</span>
              </Flexbox>
            }
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            title="Total Messages"
            statistic={{
              value: metrics.totalMessages,
              suffix:
                metrics.messageGrowth !== 0
                  ? `${metrics.messageGrowth > 0 ? '+' : ''}${metrics.messageGrowth.toFixed(1)}%`
                  : undefined,
            }}
            footer={
              <Flexbox align="center" gap={4}>
                <MessageSquareIcon size={16} />
                <span>All chat messages</span>
              </Flexbox>
            }
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            title="Tokens Used"
            statistic={{
              value: metrics.totalTokens,
              formatter: (value: any) => {
                if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                return value.toString();
              },
              suffix:
                metrics.tokenGrowth !== 0
                  ? `${metrics.tokenGrowth > 0 ? '+' : ''}${metrics.tokenGrowth.toFixed(1)}%`
                  : undefined,
            }}
            footer={
              <Flexbox align="center" gap={4}>
                <BrainCircuitIcon size={16} />
                <span>Total token consumption</span>
              </Flexbox>
            }
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            title="Active Subscriptions"
            statistic={{
              value: metrics.activeSubscriptions,
              suffix:
                metrics.subscriptionGrowth !== 0
                  ? `${metrics.subscriptionGrowth > 0 ? '+' : ''}${metrics.subscriptionGrowth.toFixed(1)}%`
                  : undefined,
            }}
            footer={
              <Flexbox align="center" gap={4}>
                <CreditCardIcon size={16} />
                <span>Paid subscriptions</span>
              </Flexbox>
            }
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            title="Revenue (Monthly)"
            statistic={{
              value: metrics.monthlyRevenue,
              prefix: '$',
              precision: 2,
              suffix:
                metrics.revenueGrowth !== 0
                  ? `${metrics.revenueGrowth > 0 ? '+' : ''}${metrics.revenueGrowth.toFixed(1)}%`
                  : undefined,
            }}
            footer={
              <Flexbox align="center" gap={4}>
                <TrendingUpIcon size={16} />
                <span>Current month revenue</span>
              </Flexbox>
            }
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            title="Active Models"
            statistic={{
              value: metrics.activeModels,
            }}
            footer={
              <Flexbox align="center" gap={4}>
                <ServerIcon size={16} />
                <span>Enabled AI models</span>
              </Flexbox>
            }
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            title="Custom Agents"
            statistic={{
              value: metrics.customAgents,
              suffix:
                metrics.agentGrowth !== 0
                  ? `${metrics.agentGrowth > 0 ? '+' : ''}${metrics.agentGrowth.toFixed(1)}%`
                  : undefined,
            }}
            footer={
              <Flexbox align="center" gap={4}>
                <BrainCircuitIcon size={16} />
                <span>User-created agents</span>
              </Flexbox>
            }
          />
        </Col>
      </Row>

      <div className={styles.recentSection}>
        <Title level={3}>Recent Activity</Title>
        {/* TODO: Add recent activity feed */}
      </div>
    </div>
  );
};

export default AdminDashboard;
