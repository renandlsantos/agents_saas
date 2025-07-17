'use client';

import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  List,
  Modal,
  Space,
  Statistic,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import { createStyles } from 'antd-style';
import type { ColumnsType } from 'antd/es/table';
import {
  CheckIcon,
  DollarSignIcon,
  EditIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon,
  ZapIcon,
} from 'lucide-react';
import { useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import { lambdaQuery } from '@/libs/trpc/client';

const { Title, Text } = Typography;
const { TextArea } = Input;

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    width: 100%;
  `,
  header: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-block-end: ${token.marginLG}px;
  `,
  planCard: css`
    margin-block-end: ${token.marginLG}px;
  `,
  featureList: css`
    .ant-list-item {
      padding-block: ${token.paddingSM}px;
      padding-inline: 0;
    }
  `,
  statsCard: css`
    text-align: center;
  `,
}));

interface BillingPlan {
  features: string[];
  id: string;
  interval: 'monthly' | 'yearly';
  isActive: boolean;
  maxTokensPerRequest: number;
  name: string;
  price: number;
  subscriberCount: number;
  tokensPerMonth: number;
}

const AdminBilling = () => {
  const { styles } = useStyles();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<BillingPlan | null>(null);
  const [form] = Form.useForm();

  // Fetch billing data from API
  const { data: billingData, isLoading } = lambdaQuery.admin.getBillingData.useQuery();

  const plans = billingData?.plans || [];
  const totalRevenue = billingData?.summary.totalRevenue || 0;
  const totalSubscribers = billingData?.summary.totalSubscribers || 0;
  const averageRevenuePerUser = billingData?.summary.averageRevenuePerUser || 0;

  const handleEditPlan = (plan: BillingPlan) => {
    setEditingPlan(plan);
    form.setFieldsValue({
      ...plan,
      features: plan.features.join('\n'),
    });
    setEditModalOpen(true);
  };

  const handleSavePlan = async () => {
    try {
      const values = await form.validateFields();
      const updatedPlan = {
        ...values,
        features: values.features.split('\n').filter((f: string) => f.trim()),
      };

      // In a real app, you would call an API to update the plan
      message.success(editingPlan ? 'Plan updated successfully' : 'Plan created successfully');

      setEditModalOpen(false);
      form.resetFields();
    } catch {
      message.error('Please fill in all required fields');
    }
  };

  const handleDeletePlan = (planId: string) => {
    Modal.confirm({
      title: 'Delete Plan',
      content: 'Are you sure you want to delete this plan? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      onOk: () => {
        // In a real app, you would call an API to delete the plan
        message.success('Plan deleted successfully');
      },
    });
  };

  const columns: ColumnsType<BillingPlan> = [
    {
      title: 'Plan Name',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <Space>
          <Text strong>{name}</Text>
          {!record.isActive && <Tag color="red">Inactive</Tag>}
        </Space>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price, record) => (
        <Text>
          ${price}/{record.interval === 'monthly' ? 'mo' : 'yr'}
        </Text>
      ),
    },
    {
      title: 'Tokens/Month',
      dataIndex: 'tokensPerMonth',
      key: 'tokensPerMonth',
      render: (tokens) => <Text>{(tokens / 1_000_000).toFixed(1)}M</Text>,
    },
    {
      title: 'Subscribers',
      dataIndex: 'subscriberCount',
      key: 'subscriberCount',
      render: (count) => (
        <Space>
          <UsersIcon size={16} />
          <Text>{count}</Text>
        </Space>
      ),
    },
    {
      title: 'Revenue',
      key: 'revenue',
      render: (_, record) => (
        <Text strong>${(record.price * record.subscriberCount).toFixed(2)}/mo</Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => <Switch checked={isActive} />,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditIcon size={16} />}
            onClick={() => handleEditPlan(record)}
          />
          <Button
            type="text"
            danger
            icon={<TrashIcon size={16} />}
            onClick={() => handleDeletePlan(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title level={2}>Billing & Plans</Title>
        <Button
          type="primary"
          icon={<PlusIcon size={16} />}
          onClick={() => {
            setEditingPlan(null);
            form.resetFields();
            setEditModalOpen(true);
          }}
        >
          Add Plan
        </Button>
      </div>

      <Tabs
        items={[
          {
            key: 'overview',
            label: 'Overview',
            children: (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Space size="large">
                  <Card className={styles.statsCard}>
                    <Statistic
                      title="Total Revenue"
                      value={totalRevenue}
                      prefix="$"
                      suffix="/mo"
                      precision={2}
                    />
                  </Card>
                  <Card className={styles.statsCard}>
                    <Statistic
                      title="Total Subscribers"
                      value={totalSubscribers}
                      prefix={<UsersIcon size={20} />}
                    />
                  </Card>
                  <Card className={styles.statsCard}>
                    <Statistic
                      title="Average Revenue per User"
                      value={averageRevenuePerUser}
                      prefix="$"
                      precision={2}
                    />
                  </Card>
                </Space>

                <Card title="Subscription Plans" loading={isLoading}>
                  <Table columns={columns} dataSource={plans} rowKey="id" pagination={false} />
                </Card>
              </Space>
            ),
          },
          {
            key: 'plans',
            label: 'Plan Details',
            children: (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {plans.map((plan) => (
                  <Card
                    key={plan.id}
                    className={styles.planCard}
                    title={
                      <Flexbox justify="space-between" align="center">
                        <Space>
                          <Title level={4} style={{ margin: 0 }}>
                            {plan.name}
                          </Title>
                          <Tag color={plan.isActive ? 'success' : 'default'}>
                            {plan.isActive ? 'Active' : 'Inactive'}
                          </Tag>
                        </Space>
                        <Space>
                          <Button
                            type="text"
                            icon={<EditIcon size={16} />}
                            onClick={() => handleEditPlan(plan)}
                          />
                        </Space>
                      </Flexbox>
                    }
                  >
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                      <Flexbox gap={24}>
                        <div>
                          <Text type="secondary">Price</Text>
                          <Title level={3} style={{ margin: 0 }}>
                            ${plan.price}/{plan.interval === 'monthly' ? 'mo' : 'yr'}
                          </Title>
                        </div>
                        <div>
                          <Text type="secondary">Tokens per Month</Text>
                          <Title level={3} style={{ margin: 0 }}>
                            {(plan.tokensPerMonth / 1_000_000).toFixed(1)}M
                          </Title>
                        </div>
                        <div>
                          <Text type="secondary">Max Tokens per Request</Text>
                          <Title level={3} style={{ margin: 0 }}>
                            {(plan.maxTokensPerRequest / 1000).toFixed(0)}K
                          </Title>
                        </div>
                        <div>
                          <Text type="secondary">Subscribers</Text>
                          <Title level={3} style={{ margin: 0 }}>
                            {plan.subscriberCount}
                          </Title>
                        </div>
                      </Flexbox>

                      <div>
                        <Text type="secondary">Features</Text>
                        <List
                          className={styles.featureList}
                          dataSource={plan.features}
                          renderItem={(item) => (
                            <List.Item>
                              <Space>
                                <CheckIcon size={16} color="#52c41a" />
                                {item}
                              </Space>
                            </List.Item>
                          )}
                        />
                      </div>
                    </Space>
                  </Card>
                ))}
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title={editingPlan ? 'Edit Plan' : 'Create Plan'}
        open={editModalOpen}
        onOk={handleSavePlan}
        onCancel={() => {
          setEditModalOpen(false);
          form.resetFields();
        }}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Plan Name"
            rules={[{ required: true, message: 'Please enter plan name' }]}
          >
            <Input placeholder="e.g., Pro, Enterprise" />
          </Form.Item>

          <Space size="large" style={{ width: '100%' }}>
            <Form.Item
              name="price"
              label="Price"
              rules={[{ required: true, message: 'Please enter price' }]}
              style={{ flex: 1 }}
            >
              <InputNumber
                prefix="$"
                placeholder="29.99"
                style={{ width: '100%' }}
                min={0}
                precision={2}
              />
            </Form.Item>

            <Form.Item
              name="interval"
              label="Billing Interval"
              rules={[{ required: true }]}
              initialValue="monthly"
              style={{ flex: 1 }}
            >
              <Input disabled value="monthly" />
            </Form.Item>
          </Space>

          <Space size="large" style={{ width: '100%' }}>
            <Form.Item
              name="tokensPerMonth"
              label="Tokens per Month"
              rules={[{ required: true, message: 'Please enter token limit' }]}
              style={{ flex: 1 }}
            >
              <InputNumber
                placeholder="1000000"
                style={{ width: '100%' }}
                min={0}
                formatter={(value) => `${value}`.replaceAll(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value!.replaceAll(/\$\s?|(,*)/g, '') as any}
              />
            </Form.Item>

            <Form.Item
              name="maxTokensPerRequest"
              label="Max Tokens per Request"
              rules={[{ required: true, message: 'Please enter max tokens' }]}
              style={{ flex: 1 }}
            >
              <InputNumber placeholder="8000" style={{ width: '100%' }} min={0} />
            </Form.Item>
          </Space>

          <Form.Item
            name="features"
            label="Features (one per line)"
            rules={[{ required: true, message: 'Please enter features' }]}
          >
            <TextArea
              rows={6}
              placeholder="All Free features
GPT-4 access
Priority support
Custom agents"
            />
          </Form.Item>

          <Form.Item name="isActive" label="Active" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminBilling;
