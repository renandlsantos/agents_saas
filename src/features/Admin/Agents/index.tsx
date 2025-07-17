'use client';

import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Upload,
  message,
} from 'antd';
import { createStyles } from 'antd-style';
import {
  BrainCircuitIcon,
  EditIcon,
  FileIcon,
  PlusIcon,
  TrashIcon,
  UploadIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Center, Flexbox } from 'react-layout-kit';

import { adminService } from '@/services/admin';
import { AssistantCategory } from '@/types/discover';

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
  title: css`
    font-size: 24px;
    font-weight: 600;
    color: ${token.colorText};
  `,
  emptyContainer: css`
    padding: ${token.paddingXL * 2}px;
  `,
  agentCard: css`
    cursor: pointer;
    margin-block-end: ${token.marginMD}px;
    transition: all 0.3s;

    &:hover {
      box-shadow: ${token.boxShadowSecondary};
    }
  `,
}));

interface Agent {
  category: AssistantCategory;
  createdAt: string;
  description: string;
  files?: Array<{ id: string; name: string; size: number }>;
  id: string;
  isDomain: boolean;
  isPublic: boolean;
  knowledgeBaseId?: string;
  name: string;
  systemPrompt: string;
  tags: string[];
}

interface KnowledgeBase {
  description?: string;
  fileCount: number;
  id: string;
  name: string;
}

// Category options for the select dropdown
const categoryOptions = [
  { label: 'Acadêmico', value: AssistantCategory.Academic },
  { label: 'Carreira', value: AssistantCategory.Career },
  { label: 'Redação', value: AssistantCategory.CopyWriting },
  { label: 'Design', value: AssistantCategory.Design },
  { label: 'Educação', value: AssistantCategory.Education },
  { label: 'Emoções', value: AssistantCategory.Emotions },
  { label: 'Entretenimento', value: AssistantCategory.Entertainment },
  { label: 'Jogos', value: AssistantCategory.Games },
  { label: 'Geral', value: AssistantCategory.General },
  { label: 'Vida', value: AssistantCategory.Life },
  { label: 'Marketing', value: AssistantCategory.Marketing },
  { label: 'Escritório', value: AssistantCategory.Office },
  { label: 'Programação', value: AssistantCategory.Programming },
  { label: 'Tradução', value: AssistantCategory.Translation },
];

// Mock data para demonstração
const mockAgents: Agent[] = [
  {
    id: '1',
    name: 'Assistente de Vendas',
    description: 'Especializado em ajudar com vendas e atendimento ao cliente',
    systemPrompt: 'Você é um assistente de vendas experiente...',
    category: AssistantCategory.Marketing,
    tags: ['vendas', 'atendimento', 'e-commerce'],
    isPublic: true,
    isDomain: true,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    name: 'Analista de Dados',
    description: 'Ajuda com análise de dados e criação de relatórios',
    systemPrompt: 'Você é um analista de dados especializado...',
    category: AssistantCategory.Office,
    tags: ['dados', 'análise', 'relatórios'],
    isPublic: false,
    isDomain: false,
    createdAt: '2024-01-10T14:30:00Z',
  },
];

const AdminAgents = () => {
  const { styles } = useStyles();
  const [agents, setAgents] = useState<Agent[]>(mockAgents);
  const [loading, setLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState<string | undefined>();
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [form] = Form.useForm();

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const response = await adminService.getAgents({
        page: 1,
        pageSize: 100,
      });
      setAgents(
        response.agents.map((agent: any) => ({
          ...agent,
          category: agent.category as AssistantCategory,
          tags: agent.tags || [],
          isPublic: agent.isPublic || false,
          isDomain: agent.isDomain || false,
        })),
      );
    } catch {
      message.error('Erro ao carregar agentes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // TODO: Buscar agentes da API
    fetchAgents();
  }, []);

  const handleCreateAgent = async (values: any) => {
    try {
      setLoading(true);

      const agentData = {
        name: values.name,
        description: values.description,
        systemPrompt: values.systemPrompt,
        category: values.category,
        tags: values.tags ? values.tags.split(',').map((t: string) => t.trim()) : [],
        isDomain: values.isDomain || false,
        knowledgeBaseFiles: uploadedFiles.length > 0 ? uploadedFiles : undefined,
      };

      if (editingAgent) {
        await adminService.updateAgent(editingAgent.id, agentData);
        message.success('Agente atualizado com sucesso!');
      } else {
        await adminService.createAgent(agentData);
        message.success('Agente criado com sucesso!');
      }

      // Refresh the list
      await fetchAgents();

      setCreateModalOpen(false);
      form.resetFields();
      setEditingAgent(null);
      setSelectedKnowledgeBase(undefined);
      setUploadedFiles([]);
    } catch {
      message.error('Erro ao salvar agente');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
    form.setFieldsValue({
      ...agent,
      tags: agent.tags.join(', '),
    });
    setCreateModalOpen(true);
  };

  const handleDeleteAgent = async (agentId: string) => {
    Modal.confirm({
      title: 'Confirmar exclusão',
      content: 'Tem certeza que deseja excluir este agente?',
      okText: 'Excluir',
      cancelText: 'Cancelar',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await adminService.deleteAgent(agentId);
          message.success('Agente excluído com sucesso!');
          // Refresh the list
          await fetchAgents();
        } catch {
          message.error('Erro ao excluir agente');
        }
      },
    });
  };

  const columns = [
    {
      title: 'Nome',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <Space>
          <BrainCircuitIcon size={16} />
          <strong>{text}</strong>
        </Space>
      ),
    },
    {
      title: 'Descrição',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Categoria',
      dataIndex: 'category',
      key: 'category',
      render: (category: AssistantCategory) => {
        const categoryOption = categoryOptions.find((opt) => opt.value === category);
        return <Tag>{categoryOption?.label || category}</Tag>;
      },
    },
    {
      title: 'Tipo',
      key: 'type',
      render: (_: any, record: Agent) => (
        <Space>
          <Tag color={record.isDomain ? 'blue' : 'default'}>
            {record.isDomain ? 'Domínio' : 'Usuário'}
          </Tag>
          {record.knowledgeBaseId && <Tag icon={<FileIcon size={12} />}>KB</Tag>}
        </Space>
      ),
    },
    {
      title: 'Criado em',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('pt-BR'),
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (_: any, record: Agent) => (
        <Space>
          <Button
            type="text"
            icon={<EditIcon size={16} />}
            onClick={() => handleEditAgent(record)}
          />
          <Button
            type="text"
            danger
            icon={<TrashIcon size={16} />}
            onClick={() => handleDeleteAgent(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Gerenciamento de Agentes</h1>
        <Button
          type="primary"
          icon={<PlusIcon size={16} />}
          onClick={() => {
            setEditingAgent(null);
            form.resetFields();
            setCreateModalOpen(true);
          }}
        >
          Criar Agente
        </Button>
      </div>

      {agents.length === 0 ? (
        <Card>
          <Center className={styles.emptyContainer}>
            <Empty
              image={<BrainCircuitIcon size={64} strokeWidth={1} />}
              description="Nenhum agente criado ainda"
            >
              <Button type="primary" onClick={() => setCreateModalOpen(true)}>
                Criar Primeiro Agente
              </Button>
            </Empty>
          </Center>
        </Card>
      ) : (
        <Table
          columns={columns}
          dataSource={agents}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} agentes`,
          }}
        />
      )}

      <Modal
        title={editingAgent ? 'Editar Agente' : 'Criar Novo Agente'}
        open={createModalOpen}
        onCancel={() => {
          setCreateModalOpen(false);
          setEditingAgent(null);
          form.resetFields();
          setSelectedKnowledgeBase(undefined);
          setUploadedFiles([]);
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateAgent}>
          <Form.Item
            name="name"
            label="Nome do Agente"
            rules={[{ required: true, message: 'Nome é obrigatório' }]}
          >
            <Input placeholder="Ex: Assistente de Vendas" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Descrição"
            rules={[{ required: true, message: 'Descrição é obrigatória' }]}
          >
            <TextArea rows={3} placeholder="Descreva o que este agente faz..." />
          </Form.Item>

          <Form.Item
            name="systemPrompt"
            label="System Prompt"
            rules={[{ required: true, message: 'System prompt é obrigatório' }]}
          >
            <TextArea rows={6} placeholder="Você é um assistente especializado em..." />
          </Form.Item>

          <Form.Item
            name="category"
            label="Categoria"
            rules={[{ required: true, message: 'Categoria é obrigatória' }]}
          >
            <Select placeholder="Selecione uma categoria" options={categoryOptions} />
          </Form.Item>

          <Form.Item name="tags" label="Tags (separadas por vírgula)">
            <Input placeholder="vendas, atendimento, chatbot" />
          </Form.Item>

          <Form.Item
            name="isDomain"
            label="Agente de Domínio"
            valuePropName="checked"
            tooltip="Agentes de domínio são visíveis para todos os usuários"
          >
            <Switch checkedChildren="Sim" unCheckedChildren="Não" />
          </Form.Item>

          <Form.Item
            label="Banco de Conhecimento"
            tooltip="Adicione arquivos para criar um banco de conhecimento para este agente"
          >
            <Upload
              beforeUpload={(file) => {
                // Add file to list without uploading
                setUploadedFiles([
                  ...uploadedFiles,
                  {
                    id: Date.now().toString(),
                    name: file.name,
                    size: file.size,
                  },
                ]);
                return false;
              }}
              onRemove={(file) => {
                const newFiles = uploadedFiles.filter((f) => f.name !== file.name);
                setUploadedFiles(newFiles);
              }}
              fileList={uploadedFiles.map((f) => ({
                uid: f.id,
                name: f.name,
                size: f.size,
                status: 'done' as const,
              }))}
              multiple
            >
              <Button icon={<UploadIcon size={16} />}>Adicionar Arquivos</Button>
            </Upload>
          </Form.Item>

          <Form.Item>
            <Flexbox gap={8} horizontal justify="flex-end">
              <Button onClick={() => setCreateModalOpen(false)}>Cancelar</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingAgent ? 'Salvar Alterações' : 'Criar Agente'}
              </Button>
            </Flexbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminAgents;
