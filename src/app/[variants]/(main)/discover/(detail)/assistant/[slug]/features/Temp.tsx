'use client';

import { Alert, Markdown } from '@lobehub/ui';
import { Skeleton } from 'antd';
import { useTheme } from 'antd-style';
import { BotMessageSquare, EyeOff } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox, FlexboxProps } from 'react-layout-kit';

import { DiscoverAssistantItem } from '@/types/discover';
import { useUserStore } from '@/store/user';
import { userProfileSelectors } from '@/store/user/selectors';

import HighlightBlock from '../../../features/HighlightBlock';

interface ConversationExampleProps extends FlexboxProps {
  data: DiscoverAssistantItem;
  identifier: string;
  mobile?: boolean;
}

const ConversationExample = memo<ConversationExampleProps>(({ data }) => {
  const { t } = useTranslation(['discover', 'setting']);
  const theme = useTheme();
  const isAdmin = useUserStore(userProfileSelectors.isAdmin);
  
  // Check if this is a domain agent (published by admin)
  // Note: DiscoverAssistantItem may not have isDomain field, so we check author as fallback
  const isDomainAgent = (data as any).isDomain || data.author === 'Agents SaaS';
  
  // Only admins can view system roles of domain agents
  const canViewSystemRole = isAdmin || !isDomainAgent;

  return (
    <HighlightBlock
      avatar={data?.meta.avatar}
      icon={BotMessageSquare}
      justify={'space-between'}
      style={{ background: theme.colorBgContainer }}
      title={t('assistants.systemRole', { ns: 'discover' })}
    >
      <Flexbox paddingInline={16}>
        {!canViewSystemRole ? (
          <Alert
            description={t('settingAgent.prompt.adminProtected', { ns: 'setting' })}
            icon={<EyeOff />}
            message={t('settingAgent.prompt.hiddenTitle', { ns: 'setting' })}
            type="info"
          />
        ) : data.config.systemRole ? (
          <Markdown fontSize={theme.fontSize}>{data.config.systemRole}</Markdown>
        ) : (
          <Skeleton paragraph={{ rows: 4 }} title={false} />
        )}
      </Flexbox>
    </HighlightBlock>
  );
});

export default ConversationExample;
