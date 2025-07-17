'use client';

import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  ConfigProvider,
  Divider,
  Form,
  Input,
  List,
  Row,
  Space,
  Spin,
  Switch,
  Tag,
  Typography,
  message,
} from 'antd';
import { createStyles } from 'antd-style';
import {
  CheckCircleIcon,
  EditIcon,
  ExternalLinkIcon,
  KeyIcon,
  ServerIcon,
  SettingsIcon,
  XCircleIcon,
} from 'lucide-react';
import { memo, useState } from 'react';
import { Center, Flexbox } from 'react-layout-kit';

import { lambdaQuery } from '@/libs/trpc/client';

const { Title, Text, Link } = Typography;
const { Password } = Input;

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    width: 100%;
  `,
  providerCard: css`
    margin-block-end: ${token.marginLG}px;

    .ant-card-body {
      padding: ${token.paddingLG}px;
    }
  `,
  providerHeader: css`
    display: flex;
    gap: ${token.marginMD}px;
    align-items: center;
    justify-content: space-between;
  `,
  providerInfo: css`
    display: flex;
    flex: 1;
    gap: ${token.marginMD}px;
    align-items: center;
  `,
  providerLogo: css`
    width: 48px;
    height: 48px;
    border: 1px solid ${token.colorBorder};
    border-radius: ${token.borderRadiusLG}px;

    background: ${token.colorBgContainer};
  `,
  modelItem: css`
    padding-block: ${token.paddingSM}px;
    padding-inline: ${token.paddingMD}px;
    border-radius: ${token.borderRadius}px;
    transition: all 0.3s;

    &:hover {
      background: ${token.colorBgTextHover};
    }
  `,
  apiConfig: css`
    margin-block-start: ${token.marginMD}px;
    padding: ${token.paddingMD}px;
    border-radius: ${token.borderRadius}px;
    background: ${token.colorBgLayout};
  `,
  loadingContainer: css`
    height: 400px;
  `,
}));

interface Model {
  contextWindow?: number;
  displayName: string;
  enabled: boolean;
  id: string;
  type: string;
}

interface Provider {
  enabled: boolean;
  id: string;
  logo?: string | null;
  models: Model[];
  name: string;
}

const Statistic = ({ title, value, prefix, suffix }: any) => (
  <Flexbox gap={8}>
    <Text type="secondary">{title}</Text>
    <Flexbox align="center" gap={8}>
      {prefix}
      <Title level={3} style={{ margin: 0 }}>
        {value}
      </Title>
      {suffix && <Text type="secondary">{suffix}</Text>}
    </Flexbox>
  </Flexbox>
);

const ModelCard = memo<{ model: Model; onToggle: (enabled: boolean) => void }>(
  ({ model, onToggle }) => {
    const { styles } = useStyles();

    return (
      <div className={styles.modelItem}>
        <Flexbox align="center" justify="space-between">
          <Space>
            <Tag color={model.type === 'chat' ? 'blue' : 'green'}>{model.type}</Tag>
            <Text strong>{model.displayName}</Text>
            {model.contextWindow && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {(model.contextWindow / 1000).toFixed(0)}k context
              </Text>
            )}
          </Space>
          <Switch
            checked={model.enabled}
            onChange={onToggle}
            checkedChildren="Enabled"
            unCheckedChildren="Disabled"
          />
        </Flexbox>
      </div>
    );
  },
);

const ProviderCard = memo<{
  isUpdating: boolean;
  onUpdate: (providerId: string, updates: any) => void;
  provider: Provider;
}>(({ provider, onUpdate, isUpdating }) => {
  const { styles } = useStyles();
  const [configOpen, setConfigOpen] = useState(false);
  const [form] = Form.useForm();

  const handleToggleProvider = (enabled: boolean) => {
    onUpdate(provider.id, { enabled });
  };

  const handleSaveConfig = async () => {
    try {
      const values = await form.validateFields();
      onUpdate(provider.id, { settings: values });
      setConfigOpen(false);
      message.success('Provider configuration updated');
    } catch {
      message.error('Please fill in all required fields');
    }
  };

  return (
    <Card className={styles.providerCard}>
      <div className={styles.providerHeader}>
        <div className={styles.providerInfo}>
          {provider.logo && provider.logo !== null ? (
            <Avatar src={provider.logo} size={48} shape="square" className={styles.providerLogo} />
          ) : (
            <Center className={styles.providerLogo}>
              <ServerIcon size={24} />
            </Center>
          )}
          <div>
            <Title level={4} style={{ margin: 0 }}>
              {provider.name}
            </Title>
            <Text type="secondary">{provider.models.length} models</Text>
          </div>
        </div>
        <Space>
          <Button icon={<KeyIcon size={16} />} onClick={() => setConfigOpen(!configOpen)}>
            API Configuration
          </Button>
          <Switch
            checked={provider.enabled}
            onChange={handleToggleProvider}
            loading={isUpdating}
            checkedChildren="Enabled"
            unCheckedChildren="Disabled"
          />
        </Space>
      </div>

      {configOpen && (
        <div className={styles.apiConfig}>
          <Form form={form} layout="vertical">
            <Form.Item
              name="apiKey"
              label="API Key"
              rules={[{ required: true, message: 'Please enter API key' }]}
            >
              <Password placeholder="sk-..." />
            </Form.Item>
            {provider.id === 'openai' && (
              <Form.Item name="baseURL" label="Base URL (Optional)">
                <Input placeholder="https://api.openai.com/v1" />
              </Form.Item>
            )}
            <Form.Item>
              <Space>
                <Button type="primary" onClick={handleSaveConfig}>
                  Save Configuration
                </Button>
                <Button onClick={() => setConfigOpen(false)}>Cancel</Button>
              </Space>
            </Form.Item>
          </Form>
        </div>
      )}

      <Divider />

      <Title level={5}>Available Models</Title>
      <List
        dataSource={provider.models}
        renderItem={(model) => (
          <ModelCard
            key={model.id}
            model={model}
            onToggle={(enabled) => {
              // In a real app, you would update individual model settings
              message.info(`Model ${model.displayName} ${enabled ? 'enabled' : 'disabled'}`);
            }}
          />
        )}
      />
    </Card>
  );
});

const AdminModels = () => {
  const { styles } = useStyles();

  // Fetch model configuration from API
  const { data, isLoading, refetch } = lambdaQuery.admin.getModelConfig.useQuery();
  const updateProviderMutation = lambdaQuery.admin.updateProviderConfig.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      message.error(error.message || 'Failed to update provider');
    },
  });

  const handleUpdateProvider = (providerId: string, updates: any) => {
    updateProviderMutation.mutate({ providerId, ...updates });
  };

  if (isLoading || !data) {
    return (
      <Center className={styles.loadingContainer}>
        <Spin size="large" />
      </Center>
    );
  }

  const enabledProviders = data.providers.filter((p) => p.enabled).length;
  const totalModels = data.providers.reduce((sum, p) => sum + p.models.length, 0);
  const enabledModels = data.providers.reduce(
    (sum, p) => sum + p.models.filter((m) => m.enabled).length,
    0,
  );

  return (
    <div className={styles.container}>
      <Flexbox justify="space-between" align="center" style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          Model Configuration
        </Title>
        <Text type="secondary">Manage AI model providers and their configurations</Text>
      </Flexbox>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Active Providers"
              value={enabledProviders}
              suffix={`/ ${data.providers.length}`}
              prefix={<CheckCircleIcon size={20} />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="Total Models" value={totalModels} prefix={<ServerIcon size={20} />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Enabled Models"
              value={enabledModels}
              suffix={`/ ${totalModels}`}
              prefix={<Badge status="processing" />}
            />
          </Card>
        </Col>
      </Row>

      {data.providers.map((provider) => (
        <ProviderCard
          key={provider.id}
          provider={{
            ...provider,
            enabled: provider.enabled ?? false,
            logo: provider.logo ?? undefined,
          }}
          onUpdate={handleUpdateProvider}
          isUpdating={updateProviderMutation.isPending}
        />
      ))}
    </div>
  );
};

export default AdminModels;
