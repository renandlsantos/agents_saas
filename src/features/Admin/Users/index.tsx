'use client';

import {
  Avatar,
  Button,
  Dropdown,
  Input,
  Modal,
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
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  CalendarIcon,
  MailIcon,
  MoreVerticalIcon,
  SearchIcon,
  ShieldIcon,
  UserCheckIcon,
  UserXIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import { useAdminStore } from '@/store/admin';

dayjs.extend(relativeTime);

const { Title } = Typography;
const { Search } = Input;

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    width: 100%;
  `,
  header: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.margin}px;
    align-items: center;
    justify-content: space-between;

    margin-block-end: ${token.marginLG}px;
  `,
  searchBar: css`
    width: 300px;
  `,
  userCell: css`
    display: flex;
    gap: ${token.marginSM}px;
    align-items: center;
  `,
  avatar: css`
    cursor: pointer;
  `,
  actions: css`
    display: flex;
    gap: ${token.marginXS}px;
  `,
}));

interface UserData {
  avatar?: string;
  createdAt: string;
  email: string;
  fullName?: string;
  id: string;
  isAdmin: boolean;
  isOnboarded: boolean;
  lastActiveAt?: string;
  subscription?: {
    plan: string;
    status: string;
  };
  updatedAt: string;
  usage?: {
    messages: number;
    tokens: number;
  };
  username?: string;
}

const AdminUsers = () => {
  const { styles } = useStyles();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Mock data - replace with actual API call
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setUsers([
        {
          id: '1',
          email: 'john.doe@example.com',
          username: 'johndoe',
          fullName: 'John Doe',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=johndoe',
          isAdmin: false,
          isOnboarded: true,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-03-20T15:30:00Z',
          lastActiveAt: '2024-03-20T15:30:00Z',
          subscription: { plan: 'pro', status: 'active' },
          usage: { messages: 1250, tokens: 450_000 },
        },
        {
          id: '2',
          email: 'jane.smith@example.com',
          username: 'janesmith',
          fullName: 'Jane Smith',
          isAdmin: true,
          isOnboarded: true,
          createdAt: '2024-01-10T08:00:00Z',
          updatedAt: '2024-03-19T12:00:00Z',
          subscription: { plan: 'free', status: 'active' },
          usage: { messages: 325, tokens: 125_000 },
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleToggleAdmin = async (userId: string, isAdmin: boolean) => {
    try {
      // API call to update admin status
      message.success(`User ${isAdmin ? 'granted' : 'revoked'} admin privileges`);
      setUsers(users.map((u) => (u.id === userId ? { ...u, isAdmin } : u)));
    } catch {
      message.error('Failed to update admin status');
    }
  };

  const columns: ColumnsType<UserData> = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <div className={styles.userCell}>
          <Avatar
            src={record.avatar}
            size={40}
            className={styles.avatar}
            onClick={() => {
              setSelectedUser(record);
              setDetailModalOpen(true);
            }}
          >
            {record.fullName?.[0] || record.email[0].toUpperCase()}
          </Avatar>
          <div>
            <div>{record.fullName || record.username || 'Unknown User'}</div>
            <div style={{ fontSize: 12, color: '#999' }}>{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Space>
          {record.isOnboarded ? (
            <Tag color="success">Active</Tag>
          ) : (
            <Tag color="default">Pending</Tag>
          )}
          {record.isAdmin && (
            <Tag color="blue" icon={<ShieldIcon size={12} />}>
              Admin
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Subscription',
      dataIndex: ['subscription', 'plan'],
      key: 'subscription',
      render: (plan) => (
        <Tag color={plan === 'pro' ? 'gold' : 'default'}>{plan?.toUpperCase() || 'FREE'}</Tag>
      ),
    },
    {
      title: 'Usage',
      key: 'usage',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <span>{record.usage?.messages || 0} messages</span>
          <span style={{ fontSize: 12, color: '#999' }}>
            {((record.usage?.tokens || 0) / 1000).toFixed(1)}k tokens
          </span>
        </Space>
      ),
    },
    {
      title: 'Joined',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => (
        <Tooltip title={dayjs(date).format('YYYY-MM-DD HH:mm')}>{dayjs(date).fromNow()}</Tooltip>
      ),
    },
    {
      title: 'Last Active',
      dataIndex: 'lastActiveAt',
      key: 'lastActiveAt',
      render: (date) =>
        date ? (
          <Tooltip title={dayjs(date).format('YYYY-MM-DD HH:mm')}>{dayjs(date).fromNow()}</Tooltip>
        ) : (
          '-'
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div className={styles.actions}>
          <Tooltip title={record.isAdmin ? 'Revoke Admin' : 'Grant Admin'}>
            <Switch
              checked={record.isAdmin}
              onChange={(checked) => handleToggleAdmin(record.id, checked)}
              checkedChildren={<UserCheckIcon size={12} />}
              unCheckedChildren={<UserXIcon size={12} />}
            />
          </Tooltip>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'view',
                  label: 'View Details',
                  icon: <UserCheckIcon size={16} />,
                  onClick: () => {
                    setSelectedUser(record);
                    setDetailModalOpen(true);
                  },
                },
                {
                  key: 'email',
                  label: 'Send Email',
                  icon: <MailIcon size={16} />,
                },
                { type: 'divider' },
                {
                  key: 'disable',
                  label: record.isOnboarded ? 'Disable User' : 'Enable User',
                  danger: record.isOnboarded,
                  onClick: () => {
                    try {
                      // API call to enable/disable user
                      message.success(
                        `User ${!record.isOnboarded ? 'enabled' : 'disabled'} successfully`,
                      );
                    } catch {
                      message.error('Failed to update user status');
                    }
                  },
                },
              ],
            }}
          >
            <Button type="text" icon={<MoreVerticalIcon size={16} />} />
          </Dropdown>
        </div>
      ),
    },
  ];

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchText.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchText.toLowerCase()) ||
      user.fullName?.toLowerCase().includes(searchText.toLowerCase()),
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title level={2}>User Management</Title>
        <Search
          placeholder="Search users..."
          allowClear
          enterButton={<SearchIcon size={16} />}
          className={styles.searchBar}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      <Table
        columns={columns}
        dataSource={filteredUsers}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} users`,
        }}
      />

      <Modal
        title="User Details"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        width={600}
      >
        {selectedUser && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Flexbox align="center" gap={16}>
              <Avatar src={selectedUser.avatar} size={64}>
                {selectedUser.fullName?.[0] || selectedUser.email[0].toUpperCase()}
              </Avatar>
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  {selectedUser.fullName || selectedUser.username || 'Unknown User'}
                </Title>
                <Space>
                  <MailIcon size={16} />
                  {selectedUser.email}
                </Space>
              </div>
            </Flexbox>

            <Space direction="vertical" style={{ width: '100%' }}>
              <Flexbox justify="space-between">
                <span>User ID:</span>
                <code>{selectedUser.id}</code>
              </Flexbox>
              <Flexbox justify="space-between">
                <span>Status:</span>
                <Tag color={selectedUser.isOnboarded ? 'success' : 'default'}>
                  {selectedUser.isOnboarded ? 'Active' : 'Pending'}
                </Tag>
              </Flexbox>
              <Flexbox justify="space-between">
                <span>Admin:</span>
                <Tag color={selectedUser.isAdmin ? 'blue' : 'default'}>
                  {selectedUser.isAdmin ? 'Yes' : 'No'}
                </Tag>
              </Flexbox>
              <Flexbox justify="space-between">
                <span>Subscription:</span>
                <Tag color={selectedUser.subscription?.plan === 'pro' ? 'gold' : 'default'}>
                  {selectedUser.subscription?.plan?.toUpperCase() || 'FREE'}
                </Tag>
              </Flexbox>
              <Flexbox justify="space-between">
                <span>Joined:</span>
                <span>{dayjs(selectedUser.createdAt).format('YYYY-MM-DD HH:mm')}</span>
              </Flexbox>
              <Flexbox justify="space-between">
                <span>Last Active:</span>
                <span>
                  {selectedUser.lastActiveAt
                    ? dayjs(selectedUser.lastActiveAt).format('YYYY-MM-DD HH:mm')
                    : 'Never'}
                </span>
              </Flexbox>
            </Space>

            <Space direction="vertical" style={{ width: '100%' }}>
              <Title level={5}>Usage Statistics</Title>
              <Flexbox justify="space-between">
                <span>Messages:</span>
                <span>{selectedUser.usage?.messages || 0}</span>
              </Flexbox>
              <Flexbox justify="space-between">
                <span>Tokens:</span>
                <span>{selectedUser.usage?.tokens?.toLocaleString() || 0}</span>
              </Flexbox>
            </Space>
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default AdminUsers;
