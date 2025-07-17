'use client';

import { Typography } from 'antd';
import { createStyles } from 'antd-style';

const { Title, Text } = Typography;

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    width: 100%;
  `,
  header: css`
    margin-block-end: ${token.marginLG}px;
  `,
  placeholder: css`
    padding: ${token.paddingLG * 4}px;
    color: ${token.colorTextSecondary};
    text-align: center;
  `,
}));

const AdminAgents = () => {
  const { styles } = useStyles();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title level={2}>Agent Builder</Title>
        <Text type="secondary">Create and manage custom AI agents for users</Text>
      </div>

      <div className={styles.placeholder}>
        <Title level={4} type="secondary">
          Agent Builder Coming Soon
        </Title>
        <Text type="secondary">
          This feature will allow you to create custom AI agents with specific knowledge bases,
          system prompts, and capabilities that users can discover and use.
        </Text>
      </div>
    </div>
  );
};

export default AdminAgents;
