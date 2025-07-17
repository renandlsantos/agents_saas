'use client';

import {
  Badge,
  Button,
  Card,
  Collapse,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import { createStyles } from 'antd-style';
import type { ColumnsType } from 'antd/es/table';
import {
  CheckCircleIcon,
  DollarSignIcon,
  InfoIcon,
  KeyIcon,
  ServerIcon,
  SettingsIcon,
  XCircleIcon,
  ZapIcon,
} from 'lucide-react';
import { useState } from 'react';
import { Flexbox } from 'react-layout-kit';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    width: 100%;
  `,
  header: css`
    margin-block-end: ${token.marginLG}px;
  `,
  providerCard: css`
    margin-block-end: ${token.marginLG}px;
  `,
  modelRow: css`
    padding-block: ${token.paddingSM}px;
    padding-inline: 0;
    border-block-end: 1px solid ${token.colorBorderSecondary};

    &:last-child {
      border-block-end: none;
    }
  `,
  modelName: css`
    display: flex;
    gap: ${token.marginSM}px;
    align-items: center;
  `,
  configForm: css`
    margin-block-start: ${token.marginMD}px;
  `,
}));

interface ModelConfig {
  available: boolean;
  contextLength: number;
  costPer1kInput: number;
  costPer1kOutput: number;
  displayName: string;
  enabled: boolean;
  features: string[];
  id: string;
  maxOutputTokens: number;
  name: string;
  provider: string;
  rateLimit?: number;
}

interface ProviderConfig {
  apiKey?: string;
  displayName: string;
  enabled: boolean;
  endpoint?: string;
  id: string;
  models: ModelConfig[];
  name: string;
}

const AdminModels = () => {
  const { styles } = useStyles();
  const [providers, setProviders] = useState<ProviderConfig[]>([
    {
      id: 'openai',
      name: 'openai',
      displayName: 'OpenAI',
      enabled: true,
      apiKey: 'sk-proj-***',
      models: [
        {
          id: 'gpt-4',
          provider: 'openai',
          name: 'gpt-4',
          displayName: 'GPT-4',
          enabled: true,
          available: true,
          contextLength: 8192,
          maxOutputTokens: 4096,
          costPer1kInput: 0.03,
          costPer1kOutput: 0.06,
          rateLimit: 10_000,
          features: ['chat', 'function-calling', 'vision'],
        },
        {
          id: 'gpt-3.5-turbo',
          provider: 'openai',
          name: 'gpt-3.5-turbo',
          displayName: 'GPT-3.5 Turbo',
          enabled: true,
          available: true,
          contextLength: 4096,
          maxOutputTokens: 4096,
          costPer1kInput: 0.0005,
          costPer1kOutput: 0.0015,
          rateLimit: 90_000,
          features: ['chat', 'function-calling'],
        },
      ],
    },
    {
      id: 'anthropic',
      name: 'anthropic',
      displayName: 'Anthropic',
      enabled: true,
      apiKey: 'sk-ant-***',
      models: [
        {
          id: 'claude-3-opus',
          provider: 'anthropic',
          name: 'claude-3-opus-20240229',
          displayName: 'Claude 3 Opus',
          enabled: true,
          available: true,
          contextLength: 200_000,
          maxOutputTokens: 4096,
          costPer1kInput: 0.015,
          costPer1kOutput: 0.075,
          rateLimit: 5000,
          features: ['chat', 'vision', 'code-interpreter'],
        },
        {
          id: 'claude-3-sonnet',
          provider: 'anthropic',
          name: 'claude-3-sonnet-20240229',
          displayName: 'Claude 3 Sonnet',
          enabled: false,
          available: true,
          contextLength: 200_000,
          maxOutputTokens: 4096,
          costPer1kInput: 0.003,
          costPer1kOutput: 0.015,
          rateLimit: 10_000,
          features: ['chat', 'vision'],
        },
      ],
    },
  ]);

  const [expandedProviders, setExpandedProviders] = useState<string[]>(['openai']);
  const [apiKeyVisibility, setApiKeyVisibility] = useState<Record<string, boolean>>({});

  const handleProviderToggle = (providerId: string, enabled: boolean) => {
    setProviders(providers.map((p) => (p.id === providerId ? { ...p, enabled } : p)));
    message.success(`Provider ${enabled ? 'enabled' : 'disabled'}`);
  };

  const handleModelToggle = (providerId: string, modelId: string, enabled: boolean) => {
    setProviders(
      providers.map((p) =>
        p.id === providerId
          ? {
              ...p,
              models: p.models.map((m) => (m.id === modelId ? { ...m, enabled } : m)),
            }
          : p,
      ),
    );
    message.success(`Model ${enabled ? 'enabled' : 'disabled'}`);
  };

  const handleApiKeyUpdate = (providerId: string, apiKey: string) => {
    setProviders(providers.map((p) => (p.id === providerId ? { ...p, apiKey } : p)));
    message.success('API key updated');
  };

  const handleModelConfigUpdate = (
    providerId: string,
    modelId: string,
    config: Partial<ModelConfig>,
  ) => {
    setProviders(
      providers.map((p) =>
        p.id === providerId
          ? {
              ...p,
              models: p.models.map((m) => (m.id === modelId ? { ...m, ...config } : m)),
            }
          : p,
      ),
    );
    message.success('Model configuration updated');
  };

  const getProviderStats = (provider: ProviderConfig) => {
    const enabledModels = provider.models.filter((m) => m.enabled).length;
    const totalModels = provider.models.length;
    return { enabledModels, totalModels };
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title level={2}>Model Configuration</Title>
        <Text type="secondary">Manage AI model providers and their configurations</Text>
      </div>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {providers.map((provider) => {
          const stats = getProviderStats(provider);

          return (
            <Card
              key={provider.id}
              className={styles.providerCard}
              title={
                <Flexbox justify="space-between" align="center">
                  <Space size="large">
                    <Space>
                      <ServerIcon size={20} />
                      <Title level={4} style={{ margin: 0 }}>
                        {provider.displayName}
                      </Title>
                    </Space>
                    <Badge
                      count={`${stats.enabledModels}/${stats.totalModels} models`}
                      style={{ backgroundColor: '#52c41a' }}
                    />
                  </Space>
                  <Switch
                    checked={provider.enabled}
                    onChange={(checked) => handleProviderToggle(provider.id, checked)}
                  />
                </Flexbox>
              }
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {/* Provider Configuration */}
                <Card size="small" type="inner">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Flexbox gap={16} align="center">
                      <KeyIcon size={16} />
                      <Text strong>API Configuration</Text>
                    </Flexbox>

                    <Flexbox gap={16} align="center">
                      <Input.Password
                        placeholder="API Key"
                        value={provider.apiKey}
                        onChange={(e) => handleApiKeyUpdate(provider.id, e.target.value)}
                        style={{ flex: 1 }}
                        visibilityToggle={{
                          visible: apiKeyVisibility[provider.id],
                          onVisibleChange: (visible) =>
                            setApiKeyVisibility({ ...apiKeyVisibility, [provider.id]: visible }),
                        }}
                      />
                      <Button type="primary" size="small">
                        Test Connection
                      </Button>
                    </Flexbox>

                    {provider.endpoint && (
                      <Input
                        placeholder="Custom Endpoint"
                        value={provider.endpoint}
                        prefix={<ServerIcon size={16} />}
                      />
                    )}
                  </Space>
                </Card>

                {/* Models List */}
                <Card size="small" type="inner" title="Available Models">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {provider.models.map((model) => (
                      <div key={model.id} className={styles.modelRow}>
                        <Flexbox justify="space-between" align="center">
                          <div className={styles.modelName}>
                            <Space>
                              {model.available ? (
                                <CheckCircleIcon size={16} color="#52c41a" />
                              ) : (
                                <XCircleIcon size={16} color="#ff4d4f" />
                              )}
                              <Text strong>{model.displayName}</Text>
                              <Tag>{model.name}</Tag>
                            </Space>
                          </div>

                          <Space>
                            {model.features.map((feature) => (
                              <Tag key={feature} color="blue">
                                {feature}
                              </Tag>
                            ))}
                            <Switch
                              checked={model.enabled}
                              disabled={!provider.enabled || !model.available}
                              onChange={(checked) =>
                                handleModelToggle(provider.id, model.id, checked)
                              }
                            />
                          </Space>
                        </Flexbox>

                        {model.enabled && (
                          <Collapse ghost style={{ marginTop: 8 }}>
                            <Panel
                              header={
                                <Space>
                                  <SettingsIcon size={14} />
                                  <Text type="secondary">Configuration</Text>
                                </Space>
                              }
                              key="config"
                            >
                              <Form layout="vertical" size="small">
                                <Space size="large">
                                  <Form.Item label="Context Length">
                                    <InputNumber
                                      value={model.contextLength}
                                      min={1024}
                                      max={200_000}
                                      step={1024}
                                      formatter={(value) =>
                                        `${value}`.replaceAll(/\B(?=(\d{3})+(?!\d))/g, ',')
                                      }
                                      parser={(value: any) => value!.replaceAll(/\$\s?|(,*)/g, '')}
                                      onChange={(value) =>
                                        handleModelConfigUpdate(provider.id, model.id, {
                                          contextLength: value || 0,
                                        })
                                      }
                                    />
                                  </Form.Item>

                                  <Form.Item label="Max Output Tokens">
                                    <InputNumber
                                      value={model.maxOutputTokens}
                                      min={128}
                                      max={32_000}
                                      step={128}
                                      onChange={(value) =>
                                        handleModelConfigUpdate(provider.id, model.id, {
                                          maxOutputTokens: value || 0,
                                        })
                                      }
                                    />
                                  </Form.Item>

                                  <Form.Item label="Rate Limit (req/min)">
                                    <InputNumber
                                      value={model.rateLimit}
                                      min={0}
                                      placeholder="No limit"
                                      onChange={(value) =>
                                        handleModelConfigUpdate(provider.id, model.id, {
                                          rateLimit: value || undefined,
                                        })
                                      }
                                    />
                                  </Form.Item>
                                </Space>

                                <Space size="large">
                                  <Form.Item label="Cost per 1K Input Tokens">
                                    <InputNumber
                                      value={model.costPer1kInput}
                                      min={0}
                                      step={0.0001}
                                      precision={4}
                                      prefix="$"
                                      onChange={(value) =>
                                        handleModelConfigUpdate(provider.id, model.id, {
                                          costPer1kInput: value || 0,
                                        })
                                      }
                                    />
                                  </Form.Item>

                                  <Form.Item label="Cost per 1K Output Tokens">
                                    <InputNumber
                                      value={model.costPer1kOutput}
                                      min={0}
                                      step={0.0001}
                                      precision={4}
                                      prefix="$"
                                      onChange={(value) =>
                                        handleModelConfigUpdate(provider.id, model.id, {
                                          costPer1kOutput: value || 0,
                                        })
                                      }
                                    />
                                  </Form.Item>
                                </Space>
                              </Form>
                            </Panel>
                          </Collapse>
                        )}
                      </div>
                    ))}
                  </Space>
                </Card>
              </Space>
            </Card>
          );
        })}
      </Space>
    </div>
  );
};

export default AdminModels;
