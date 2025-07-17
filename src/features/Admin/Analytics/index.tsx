'use client';

import { Card, Col, DatePicker, Row, Select, Spin, Typography } from 'antd';
import { createStyles } from 'antd-style';
import type { RangePickerProps } from 'antd/es/date-picker';
import dayjs from 'dayjs';
import {
  ActivityIcon,
  BarChart3Icon,
  MessageSquareIcon,
  TrendingUpIcon,
  UsersIcon,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { Center, Flexbox } from 'react-layout-kit';

import StatisticCard from '@/components/StatisticCard';
import { adminService } from '@/services/admin';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Dynamic import for charts to avoid SSR issues
const Line = dynamic(() => import('@ant-design/charts').then((mod) => mod.Line), { ssr: false });

const Column = dynamic(() => import('@ant-design/charts').then((mod) => mod.Column), {
  ssr: false,
});

const Pie = dynamic(() => import('@ant-design/charts').then((mod) => mod.Pie), { ssr: false });

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    width: 100%;
  `,
  header: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginMD}px;
    align-items: center;
    justify-content: space-between;

    margin-block-end: ${token.marginLG}px;
  `,
  title: css`
    margin: 0;
  `,
  filters: css`
    display: flex;
    gap: ${token.marginSM}px;
    align-items: center;
  `,
  loadingContainer: css`
    height: 400px;
  `,
  chartCard: css`
    margin-block-end: ${token.marginLG}px;
  `,
  chartTitle: css`
    margin-block-end: ${token.marginMD}px;
    font-size: ${token.fontSizeLG}px;
    font-weight: 600;
  `,
}));

interface AnalyticsData {
  messageVolume: Array<{ count: number, date: string; }>;
  modelUsage: Array<{ count: number; model: string; percentage: number }>;
  summary: {
    avgDailyMessages: number;
    avgSessionLength: number;
    newUsers: number;
    totalMessages: number;
  };
  tokenUsage: Array<{ date: string; tokens: number }>;
  topAgents: Array<{ messages: number; name: string; users: number }>;
  userSignups: Array<{ count: number, date: string; }>;
}

const AdminAnalytics = () => {
  const { styles } = useStyles();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const data = await adminService.getAnalytics(timeRange);
      setAnalyticsData(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const handleDateRangeChange: RangePickerProps['onChange'] = (dates) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]]);
      // TODO: Implement custom date range analytics
    }
  };

  if (loading || !analyticsData) {
    return (
      <Center className={styles.loadingContainer}>
        <Spin size="large" />
      </Center>
    );
  }

  // Chart configurations
  const messageVolumeConfig = {
    data: analyticsData.messageVolume,
    xField: 'date',
    yField: 'count',
    smooth: true,
    lineStyle: {
      lineWidth: 2,
    },
    point: {
      size: 3,
      shape: 'circle',
    },
    tooltip: {
      showTitle: true,
      formatter: (datum: any) => {
        return { name: 'Messages', value: datum.count };
      },
    },
  };

  const userSignupsConfig = {
    data: analyticsData.userSignups,
    xField: 'date',
    yField: 'count',
    columnStyle: {
      radius: [8, 8, 0, 0],
    },
    tooltip: {
      showTitle: true,
      formatter: (datum: any) => {
        return { name: 'New Users', value: datum.count };
      },
    },
  };

  const modelUsageConfig = {
    data: analyticsData.modelUsage,
    angleField: 'count',
    colorField: 'model',
    radius: 0.8,
    label: {
      type: 'outer',
      content: '{name} ({percentage}%)',
    },
    interactions: [
      {
        type: 'pie-legend-active',
      },
      {
        type: 'element-active',
      },
    ],
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <Title level={2} className={styles.title}>
            Analytics
          </Title>
          <Text type="secondary">Detailed usage analytics and insights</Text>
        </div>
        <div className={styles.filters}>
          <Select
            value={timeRange}
            onChange={setTimeRange}
            options={[
              { label: 'Last 7 days', value: '7d' },
              { label: 'Last 30 days', value: '30d' },
              { label: 'Last 90 days', value: '90d' },
            ]}
            style={{ width: 140 }}
          />
          <RangePicker onChange={handleDateRangeChange} />
        </div>
      </div>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            title="Total Messages"
            statistic={{
              value: analyticsData.summary.totalMessages,
              formatter: (value: any) => {
                if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                return value.toString();
              },
            }}
            footer={
              <Flexbox align="center" gap={4}>
                <MessageSquareIcon size={16} />
                <span>In selected period</span>
              </Flexbox>
            }
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            title="New Users"
            statistic={{
              value: analyticsData.summary.newUsers,
            }}
            footer={
              <Flexbox align="center" gap={4}>
                <UsersIcon size={16} />
                <span>User signups</span>
              </Flexbox>
            }
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            title="Avg Daily Messages"
            statistic={{
              value: analyticsData.summary.avgDailyMessages,
              precision: 0,
            }}
            footer={
              <Flexbox align="center" gap={4}>
                <TrendingUpIcon size={16} />
                <span>Messages per day</span>
              </Flexbox>
            }
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            title="Avg Session Length"
            statistic={{
              value: analyticsData.summary.avgSessionLength,
              suffix: 'min',
              precision: 1,
            }}
            footer={
              <Flexbox align="center" gap={4}>
                <ActivityIcon size={16} />
                <span>User engagement</span>
              </Flexbox>
            }
          />
        </Col>
      </Row>

      {/* Message Volume Chart */}
      <Card className={styles.chartCard}>
        <div className={styles.chartTitle}>
          <Flexbox align="center" gap={8}>
            <BarChart3Icon size={20} />
            Message Volume Over Time
          </Flexbox>
        </div>
        <Line {...messageVolumeConfig} height={300} />
      </Card>

      {/* User Signups and Model Usage */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card className={styles.chartCard}>
            <div className={styles.chartTitle}>
              <Flexbox align="center" gap={8}>
                <UsersIcon size={20} />
                New User Signups
              </Flexbox>
            </div>
            <Column {...userSignupsConfig} height={300} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card className={styles.chartCard}>
            <div className={styles.chartTitle}>
              <Flexbox align="center" gap={8}>
                <BarChart3Icon size={20} />
                Model Usage Distribution
              </Flexbox>
            </div>
            <Pie {...modelUsageConfig} height={300} />
          </Card>
        </Col>
      </Row>

      {/* Top Agents Table */}
      <Card className={styles.chartCard}>
        <div className={styles.chartTitle}>Top Performing Agents</div>
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px' }}>Agent Name</th>
              <th style={{ textAlign: 'right', padding: '8px' }}>Messages</th>
              <th style={{ textAlign: 'right', padding: '8px' }}>Users</th>
            </tr>
          </thead>
          <tbody>
            {analyticsData.topAgents.map((agent, index) => (
              <tr key={index}>
                <td style={{ padding: '8px' }}>{agent.name}</td>
                <td style={{ textAlign: 'right', padding: '8px' }}>
                  {agent.messages.toLocaleString()}
                </td>
                <td style={{ textAlign: 'right', padding: '8px' }}>
                  {agent.users.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default AdminAnalytics;
