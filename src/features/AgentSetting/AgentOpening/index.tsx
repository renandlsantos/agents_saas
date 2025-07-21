'use client';

import { Alert, Form } from '@lobehub/ui';
import { EyeOff } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { FORM_STYLE } from '@/const/layoutTokens';
import { useServerConfigStore } from '@/store/serverConfig';
import { useSessionStore } from '@/store/session';
import { sessionSelectors } from '@/store/session/selectors';
import { useUserStore } from '@/store/user';
import { userProfileSelectors } from '@/store/user/selectors';

import OpeningMessage from './OpeningMessage';
import OpeningQuestions from './OpeningQuestions';

const wrapperCol = {
  style: {
    maxWidth: '100%',
    width: '100%',
  },
};

const AgentOpening = memo(() => {
  const { t } = useTranslation('setting');
  const isMobile = useServerConfigStore((s) => s.isMobile);

  // Check user permissions
  const currentSession = useSessionStore(sessionSelectors.currentSession);
  const currentUserId = useUserStore(userProfileSelectors.userId);
  const isAdmin = useUserStore(userProfileSelectors.isAdmin);
  
  // Check if this is a domain agent (published by admin)
  const isDomainAgent = currentSession?.isDomain || false;
  const isOwnAgent = currentSession?.userId === currentUserId;
  
  // User can edit opening if:
  // 1. They are admin OR
  // 2. It's their own agent and not a domain agent
  const canEditOpening = isAdmin || (isOwnAgent && !isDomainAgent);

  // If user cannot edit opening, show a message
  if (!canEditOpening) {
    return (
      <Form
        items={[
          {
            children: (
              <Flexbox gap={16} paddingBlock={isMobile ? 16 : 0}>
                <Alert
                  closable={false}
                  description={t('settingAgent.prompt.adminProtected', { ns: 'setting' })}
                  icon={<EyeOff />}
                  message={t('settingAgent.prompt.hiddenTitle', { ns: 'setting' })}
                  type="info"
                />
              </Flexbox>
            ),
            title: t('settingOpening.title'),
          },
        ]}
        itemsType={'group'}
        variant={'borderless'}
        {...FORM_STYLE}
      />
    );
  }

  return (
    <Form
      items={[
        {
          children: [
            {
              children: <OpeningMessage />,
              desc: t('settingOpening.openingMessage.desc'),
              label: t('settingOpening.openingMessage.title'),
              layout: 'vertical',
              wrapperCol,
            },
            {
              children: <OpeningQuestions />,
              desc: t('settingOpening.openingQuestions.desc'),
              label: t('settingOpening.openingQuestions.title'),
              layout: 'vertical',
              wrapperCol,
            },
          ],
          title: t('settingOpening.title'),
        },
      ]}
      itemsType={'group'}
      variant={'borderless'}
      {...FORM_STYLE}
    />
  );
});

export default AgentOpening;
