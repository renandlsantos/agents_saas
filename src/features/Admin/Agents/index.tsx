'use client';

import { Button, Card, Empty, Form, Input, Modal, Space, Table, Tag, message } from 'antd';
import { createStyles } from 'antd-style';
import { BrainCircuitIcon, EditIcon, PlusIcon, TrashIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Center, Flexbox } from 'react-layout-kit';

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
  category: string;
  createdAt: string;
  description: string;
  id: string;
  isPublic: boolean;
  name: string;
  systemPrompt: string;
  tags: string[];
}

// Mock data para demonstração
const mockAgents: Agent[] = [
  {
    id: '1',
    name: 'Assistente de Vendas',
    description: 'Especializado em ajudar com vendas e atendimento ao cliente',
    systemPrompt: 'Você é um assistente de vendas experiente...',
    category: 'Vendas',
    tags: ['vendas', 'atendimento', 'e-commerce'],
    isPublic: true,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    name: 'Analista de Dados',
    description: 'Ajuda com análise de dados e criação de relatórios',
    systemPrompt: 'Você é um analista de dados especializado...',
    category: 'Analytics',
    tags: ['dados', 'análise', 'relatórios'],
    isPublic: false,
    createdAt: '2024-01-10T14:30:00Z',
  },
];

const AdminAgents = () => {
  const { styles } = useStyles();
  const [agents, setAgents] = useState<Agent[]>(mockAgents);
  const [loading, setLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [form] = Form.useForm();

  const fetchAgents = async () => {
    setLoading(true);
    try {
      // TODO: Implementar chamada API real
      await new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 1000);
      });
      setAgents(mockAgents);
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
      // TODO: Call API to create agent
      const newAgent: Agent = {
        id: Date.now().toString(),
        ...values,
        tags: values.tags ? values.tags.split(',').map((t: string) => t.trim()) : [],
        isPublic: false,
        createdAt: new Date().toISOString(),
      };

      if (editingAgent) {
        setAgents(
          agents.map((a) => (a.id === editingAgent.id ? { ...newAgent, id: editingAgent.id } : a)),
        );
        message.success('Agente atualizado com sucesso!');
      } else {
        setAgents([...agents, newAgent]);
        message.success('Agente criado com sucesso!');
      }

      setCreateModalOpen(false);
      form.resetFields();
      setEditingAgent(null);
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
          // TODO: Call API to delete agent
          setAgents(agents.filter((a) => a.id !== agentId));
          message.success('Agente excluído com sucesso!');
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
      render: (category: string) => <Tag>{category}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'isPublic',
      key: 'isPublic',
      render: (isPublic: boolean) => (
        <Tag color={isPublic ? 'green' : 'orange'}>{isPublic ? 'Público' : 'Privado'}</Tag>
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
            <Input placeholder="Ex: Vendas, Suporte, Marketing" />
          </Form.Item>

          <Form.Item name="tags" label="Tags (separadas por vírgula)">
            <Input placeholder="vendas, atendimento, chatbot" />
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
