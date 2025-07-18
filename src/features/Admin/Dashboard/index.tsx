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
import { Center, Flexbox } from 'react-layout-kit';

import StatisticCard from '@/components/StatisticCard';
import { lambdaQuery } from '@/libs/trpc/client';

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

  // Fetch real metrics from API
  const { data: metrics, isLoading } = lambdaQuery.admin.getDashboardMetrics.useQuery(undefined, {
    refetchInterval: 30_000, // Refresh every 30 seconds
  });

  if (isLoading || !metrics) {
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
                <span>Last 7 days</span>
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
                <span>All time messages</span>
              </Flexbox>
            }
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            title="Revenue"
            statistic={{
              value: metrics.monthlyRevenue,
              prefix: '$',
              suffix:
                metrics.revenueGrowth !== 0
                  ? `${metrics.revenueGrowth > 0 ? '+' : ''}${metrics.revenueGrowth.toFixed(1)}%`
                  : undefined,
              precision: 2,
            }}
            footer={
              <Flexbox align="center" gap={4}>
                <CreditCardIcon size={16} />
                <span>Monthly recurring</span>
              </Flexbox>
            }
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <StatisticCard
            title="Active Models"
            statistic={{
              value: metrics.activeModels,
              suffix: 'models',
            }}
            footer={
              <Flexbox align="center" gap={4}>
                <ServerIcon size={16} />
                <span>Enabled AI models</span>
              </Flexbox>
            }
          />
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <StatisticCard
            title="Custom Agents"
            statistic={{
              value: metrics.customAgents,
              suffix: 'agents',
            }}
            footer={
              <Flexbox align="center" gap={4}>
                <BrainCircuitIcon size={16} />
                <span>User-created agents</span>
              </Flexbox>
            }
          />
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <StatisticCard
            title="Token Usage"
            statistic={{
              value: metrics.totalTokens.toLocaleString(),
              suffix: 'tokens',
            }}
            footer={
              <Flexbox align="center" gap={4}>
                <TrendingUpIcon size={16} />
                <span>Total tokens consumed</span>
              </Flexbox>
            }
          />
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
