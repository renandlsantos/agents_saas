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

const AdminAnalytics = () => {
  const { styles } = useStyles();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title level={2}>Analytics</Title>
        <Text type="secondary">Detailed usage analytics and insights</Text>
      </div>

      <div className={styles.placeholder}>
        <Title level={4} type="secondary">
          Analytics Dashboard Coming Soon
        </Title>
        <Text type="secondary">
          This feature will provide detailed analytics including user behavior, token usage
          patterns, popular models, conversation metrics, and more.
        </Text>
      </div>
    </div>
  );
};

export default AdminAnalytics;
