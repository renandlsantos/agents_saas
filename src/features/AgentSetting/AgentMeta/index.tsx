'use client';

import { Alert, Button, Form, type FormGroupItemType, type FormItemProps, Tooltip } from '@lobehub/ui';
import { useUpdateEffect } from 'ahooks';
import isEqual from 'fast-deep-equal';
import { EyeOff, Wand2 } from 'lucide-react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { FORM_STYLE } from '@/const/layoutTokens';
import { INBOX_SESSION_ID } from '@/const/session';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';
import { useSessionStore } from '@/store/session';
import { sessionSelectors } from '@/store/session/selectors';
import { useUserStore } from '@/store/user';
import { userProfileSelectors } from '@/store/user/selectors';

import { selectors, useStore } from '../store';
import AutoGenerateAvatar from './AutoGenerateAvatar';
import AutoGenerateInput from './AutoGenerateInput';
import AutoGenerateSelect from './AutoGenerateSelect';
import BackgroundSwatches from './BackgroundSwatches';

const AgentMeta = memo(() => {
  const { t } = useTranslation('setting');
  const [form] = Form.useForm();
  const { isAgentEditable } = useServerConfigStore(featureFlagsSelectors);
  const isMobile = useServerConfigStore((s) => s.isMobile);
  const [hasSystemRole, updateMeta, autocompleteMeta, autocompleteAllMeta] = useStore((s) => [
    !!s.config.systemRole,
    s.setAgentMeta,
    s.autocompleteMeta,
    s.autocompleteAllMeta,
  ]);
  const [isInbox, loadingState] = useStore((s) => [s.id === INBOX_SESSION_ID, s.loadingState]);
  const meta = useStore(selectors.currentMetaConfig, isEqual);
  const [background, setBackground] = useState(meta.backgroundColor);

  // Check user permissions
  const currentSession = useSessionStore(sessionSelectors.currentSession);
  const currentUserId = useUserStore(userProfileSelectors.userId);
  const isAdmin = useUserStore(userProfileSelectors.isAdmin);
  
  // Check if this is a domain agent (published by admin)
  const isDomainAgent = currentSession?.isDomain || false;
  const isOwnAgent = currentSession?.userId === currentUserId;
  
  // User can edit meta if:
  // 1. They are admin OR
  // 2. It's their own agent and not a domain agent
  const canEditMeta = isAdmin || (isOwnAgent && !isDomainAgent);

  useUpdateEffect(() => {
    form.setFieldsValue(meta);
  }, [meta]);

  if (isInbox) return null;

  // If user cannot edit meta, show a message
  if (!canEditMeta) {
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
            title: t('settingAgent.name.title'),
          },
        ]}
        itemsType={'group'}
        variant={'borderless'}
        {...FORM_STYLE}
      />
    );
  }

  const basic = [
    {
      Render: AutoGenerateInput,
      key: 'title',
      label: t('settingAgent.name.title'),
      placeholder: t('settingAgent.name.placeholder'),
    },
    {
      Render: AutoGenerateInput,
      desc: t('settingAgent.description.desc'),
      key: 'description',
      label: t('settingAgent.description.title'),
      placeholder: t('settingAgent.description.placeholder'),
    },
    {
      Render: AutoGenerateSelect,
      desc: t('settingAgent.tag.desc'),
      key: 'tags',
      label: t('settingAgent.tag.title'),
      placeholder: t('settingAgent.tag.placeholder'),
    },
  ];

  const autocompleteItems: FormItemProps[] = basic.map((item) => {
    const AutoGenerate = item.Render;
    return {
      children: (
        <AutoGenerate
          canAutoGenerate={hasSystemRole}
          loading={loadingState?.[item.key]}
          onGenerate={() => {
            autocompleteMeta(item.key as keyof typeof meta);
          }}
          placeholder={item.placeholder}
        />
      ),
      label: item.label,
      name: item.key,
    };
  });

  const metaData: FormGroupItemType = {
    children: [
      {
        children: (
          <AutoGenerateAvatar
            background={background}
            canAutoGenerate={hasSystemRole}
            loading={loadingState?.['avatar']}
            onGenerate={() => autocompleteMeta('avatar')}
          />
        ),
        label: t('settingAgent.avatar.title'),
        layout: 'horizontal',
        minWidth: undefined,
        name: 'avatar',
      },
      {
        children: <BackgroundSwatches onValuesChange={(c) => setBackground(c)} />,
        label: t('settingAgent.backgroundColor.title'),
        minWidth: undefined,
        name: 'backgroundColor',
      },
      ...autocompleteItems,
    ],
    extra: (
      <Tooltip
        title={
          !hasSystemRole
            ? t('autoGenerateTooltipDisabled', { ns: 'common' })
            : t('autoGenerateTooltip', { ns: 'common' })
        }
      >
        <Button
          disabled={!hasSystemRole}
          icon={Wand2}
          iconPosition={'end'}
          iconProps={{
            size: 12,
          }}
          loading={Object.values(loadingState as any).some((i) => !!i)}
          onClick={(e: any) => {
            e.stopPropagation();
            autocompleteAllMeta(true);
          }}
          size={'small'}
        >
          {t('autoGenerate', { ns: 'common' })}
        </Button>
      </Tooltip>
    ),
    title: t('settingAgent.title'),
  };

  return (
    <Form
      disabled={!isAgentEditable}
      footer={
        <Form.SubmitFooter
          texts={{
            reset: t('submitFooter.reset'),
            submit: t('settingAgent.submit'),
            unSaved: t('submitFooter.unSaved'),
            unSavedWarning: t('submitFooter.unSavedWarning'),
          }}
        />
      }
      form={form}
      initialValues={meta}
      items={[metaData]}
      itemsType={'group'}
      onFinish={updateMeta}
      variant={'borderless'}
      {...FORM_STYLE}
    />
  );
});

export default AgentMeta;
