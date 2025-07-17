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
import { useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import { lambdaQuery } from '@/libs/trpc/client';

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
  avatar?: string | null;
  createdAt: Date;
  email: string | null;
  fullName?: string | null;
  id: string;
  isAdmin: boolean;
  messageCount: number;
  sessionCount: number;
  updatedAt: Date;
}

const AdminUsers = () => {
  const { styles } = useStyles();
  const [searchText, setSearchText] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'admin'>('all');

  // Fetch users using tRPC
  const { data, isLoading, refetch } = lambdaQuery.admin.getUsers.useQuery({
    page: currentPage,
    pageSize,
    search: searchText,
    filter,
  });

  const toggleAdminMutation = lambdaQuery.admin.toggleUserAdmin.useMutation({
    onSuccess: () => {
      message.success('User admin status updated successfully');
      refetch();
    },
    onError: (error: any) => {
      message.error(error.message || 'Failed to update admin status');
    },
  });

  const handleToggleAdmin = async (userId: string, isAdmin: boolean) => {
    await toggleAdminMutation.mutateAsync({ userId, isAdmin });
  };

  const users = data?.users || [];
  const totalUsers = data?.total || 0;

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
            {record.fullName?.[0] || record.email?.[0]?.toUpperCase() || 'U'}
          </Avatar>
          <div>
            <div>{record.fullName || record.email?.split('@')[0] || 'Unknown User'}</div>
            <div style={{ fontSize: 12, color: '#999' }}>{record.email || 'No email'}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Space>
          <Tag color="success">Active</Tag>
          {record.isAdmin && (
            <Tag color="blue" icon={<ShieldIcon size={12} />}>
              Admin
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Sessions',
      dataIndex: 'sessionCount',
      key: 'sessions',
      render: (count: number) => count || 0,
    },
    {
      title: 'Usage',
      key: 'usage',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <span>{record.messageCount || 0} messages</span>
        </Space>
      ),
    },
    {
      title: 'Joined',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: Date) => {
        const dateStr = typeof date === 'string' ? date : date?.toISOString();
        return (
          <Tooltip title={dayjs(dateStr).format('YYYY-MM-DD HH:mm')}>
            {dayjs(dateStr).fromNow()}
          </Tooltip>
        );
      },
    },
    {
      title: 'Last Active',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: Date) => {
        const dateStr = typeof date === 'string' ? date : date?.toISOString();
        return (
          <Tooltip title={dayjs(dateStr).format('YYYY-MM-DD HH:mm')}>
            {dayjs(dateStr).fromNow()}
          </Tooltip>
        );
      },
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
              ],
            }}
          >
            <Button type="text" icon={<MoreVerticalIcon size={16} />} />
          </Dropdown>
        </div>
      ),
    },
  ];

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
        dataSource={users}
        loading={isLoading}
        rowKey="id"
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: totalUsers,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} users`,
          onChange: (page, size) => {
            setCurrentPage(page);
            if (size !== pageSize) setPageSize(size);
          },
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
                {selectedUser.fullName?.[0] || selectedUser.email?.[0]?.toUpperCase() || 'U'}
              </Avatar>
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  {selectedUser.fullName || selectedUser.email?.split('@')[0] || 'Unknown User'}
                </Title>
                <Space>
                  <MailIcon size={16} />
                  {selectedUser.email || 'No email'}
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
                <Tag color="success">Active</Tag>
              </Flexbox>
              <Flexbox justify="space-between">
                <span>Admin:</span>
                <Tag color={selectedUser.isAdmin ? 'blue' : 'default'}>
                  {selectedUser.isAdmin ? 'Yes' : 'No'}
                </Tag>
              </Flexbox>
              <Flexbox justify="space-between">
                <span>Sessions:</span>
                <span>{selectedUser.sessionCount || 0}</span>
              </Flexbox>
              <Flexbox justify="space-between">
                <span>Joined:</span>
                <span>{dayjs(selectedUser.createdAt).format('YYYY-MM-DD HH:mm')}</span>
              </Flexbox>
              <Flexbox justify="space-between">
                <span>Last Updated:</span>
                <span>{dayjs(selectedUser.updatedAt).format('YYYY-MM-DD HH:mm')}</span>
              </Flexbox>
            </Space>

            <Space direction="vertical" style={{ width: '100%' }}>
              <Title level={5}>Usage Statistics</Title>
              <Flexbox justify="space-between">
                <span>Messages:</span>
                <span>{selectedUser.messageCount || 0}</span>
              </Flexbox>
              <Flexbox justify="space-between">
                <span>Sessions:</span>
                <span>{selectedUser.sessionCount || 0}</span>
              </Flexbox>
            </Space>
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default AdminUsers;
