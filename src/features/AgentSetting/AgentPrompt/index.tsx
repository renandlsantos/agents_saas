'use client';

import { Alert, Button, Form } from '@lobehub/ui';
import { EditableMessage } from '@lobehub/ui/chat';
import { EyeOff, PenLineIcon } from 'lucide-react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { FORM_STYLE } from '@/const/layoutTokens';
import Tokens from '@/features/AgentSetting/AgentPrompt/TokenTag';
import { useServerConfigStore } from '@/store/serverConfig';
import { useSessionStore } from '@/store/session';
import { sessionSelectors } from '@/store/session/selectors';
import { useUserStore } from '@/store/user';
import { userProfileSelectors } from '@/store/user/selectors';

import { useStore } from '../store';

const AgentPrompt = memo(() => {
  const { t } = useTranslation('setting');
  const isMobile = useServerConfigStore((s) => s.isMobile);
  const [editing, setEditing] = useState(false);
  const [systemRole, updateConfig] = useStore((s) => [s.config.systemRole, s.setAgentConfig]);
  
  // Check user permissions
  const currentSession = useSessionStore(sessionSelectors.currentSession);
  const currentUserId = useUserStore(userProfileSelectors.userId);
  const isAdmin = useUserStore(userProfileSelectors.isAdmin);
  
  // Check if this is a domain agent (published by admin)
  const isDomainAgent = currentSession?.isDomain || false;
  const isOwnAgent = currentSession?.userId === currentUserId;
  
  // User can view system role if:
  // 1. They are admin OR
  // 2. It's their own agent and not a domain agent
  const canViewSystemRole = isAdmin || (isOwnAgent && !isDomainAgent);
  const canEditSystemRole = isAdmin || (isOwnAgent && !isDomainAgent);

  const editButton = !editing && !!systemRole && canEditSystemRole && (
    <Button
      icon={PenLineIcon}
      iconPosition={'end'}
      iconProps={{
        size: 12,
      }}
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      size={'small'}
      type={'primary'}
    >
      {t('edit', { ns: 'common' })}
    </Button>
  );

  // If user cannot view system role, show a message
  if (!canViewSystemRole) {
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
            title: t('settingAgent.prompt.title'),
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
          children: (
            <Flexbox paddingBlock={isMobile ? 16 : 0}>
              <EditableMessage
                editing={editing && canEditSystemRole}
                height={'auto'}
                markdownProps={{
                  variant: 'chat',
                }}
                onChange={(e) => {
                  if (canEditSystemRole) {
                    updateConfig({ systemRole: e });
                  }
                }}
                onEditingChange={canEditSystemRole ? setEditing : undefined}
                placeholder={t('settingAgent.prompt.placeholder')}
                showEditWhenEmpty={canEditSystemRole}
                text={{
                  cancel: t('cancel', { ns: 'common' }),
                  confirm: t('ok', { ns: 'common' }),
                }}
                value={systemRole}
                variant={'borderless'}
              />
              {!editing && !!systemRole && <Tokens value={systemRole} />}
            </Flexbox>
          ),
          extra: editButton,
          title: t('settingAgent.prompt.title'),
        },
      ]}
      itemsType={'group'}
      variant={'borderless'}
      {...FORM_STYLE}
    />
  );
});

export default AgentPrompt;
