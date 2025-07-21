'use client';

import { Alert, Form, type FormGroupItemType, ImageSelect, SliderWithInput, TextArea } from '@lobehub/ui';
import { Switch } from 'antd';
import { useThemeMode } from 'antd-style';
import isEqual from 'fast-deep-equal';
import { EyeOff, LayoutList, MessagesSquare } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { FORM_STYLE } from '@/const/layoutTokens';
import { imageUrl } from '@/const/url';
import { useServerConfigStore } from '@/store/serverConfig';
import { useSessionStore } from '@/store/session';
import { sessionSelectors } from '@/store/session/selectors';
import { useUserStore } from '@/store/user';
import { userProfileSelectors } from '@/store/user/selectors';

import { selectors, useStore } from '../store';

const AgentChat = memo(() => {
  const { t } = useTranslation('setting');
  const [form] = Form.useForm();
  const { isDarkMode } = useThemeMode();
  const isMobile = useServerConfigStore((s) => s.isMobile);
  const updateConfig = useStore((s) => s.setChatConfig);
  const config = useStore(selectors.currentChatConfig, isEqual);

  // Check user permissions
  const currentSession = useSessionStore(sessionSelectors.currentSession);
  const currentUserId = useUserStore(userProfileSelectors.userId);
  const isAdmin = useUserStore(userProfileSelectors.isAdmin);
  
  // Check if this is a domain agent (published by admin)
  const isDomainAgent = currentSession?.isDomain || false;
  const isOwnAgent = currentSession?.userId === currentUserId;
  
  // User can edit chat config if:
  // 1. They are admin OR
  // 2. It's their own agent and not a domain agent
  const canEditChat = isAdmin || (isOwnAgent && !isDomainAgent);

  // If user cannot edit chat config, show a message
  if (!canEditChat) {
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
            title: t('settingChat.title'),
          },
        ]}
        itemsType={'group'}
        variant={'borderless'}
        {...FORM_STYLE}
      />
    );
  }

  const chat: FormGroupItemType = {
    children: [
      {
        children: (
          <ImageSelect
            height={86}
            options={[
              {
                icon: MessagesSquare,
                img: imageUrl(`chatmode_chat_${isDarkMode ? 'dark' : 'light'}.webp`),
                label: t('settingChat.chatStyleType.type.chat'),
                value: 'chat',
              },
              {
                icon: LayoutList,
                img: imageUrl(`chatmode_docs_${isDarkMode ? 'dark' : 'light'}.webp`),
                label: t('settingChat.chatStyleType.type.docs'),
                value: 'docs',
              },
            ]}
            style={{
              marginRight: 2,
            }}
            unoptimized={false}
            width={144}
          />
        ),
        label: t('settingChat.chatStyleType.title'),
        minWidth: undefined,
        name: 'displayMode',
      },
      {
        children: <TextArea placeholder={t('settingChat.inputTemplate.placeholder')} />,
        desc: t('settingChat.inputTemplate.desc'),
        label: t('settingChat.inputTemplate.title'),
        name: 'inputTemplate',
      },
      {
        children: <Switch />,
        desc: t('settingChat.enableAutoCreateTopic.desc'),
        label: t('settingChat.enableAutoCreateTopic.title'),
        layout: 'horizontal',
        minWidth: undefined,
        name: 'enableAutoCreateTopic',
        valuePropName: 'checked',
      },
      {
        children: <SliderWithInput max={8} min={0} unlimitedInput={true} />,
        desc: t('settingChat.autoCreateTopicThreshold.desc'),
        divider: false,
        hidden: !config.enableAutoCreateTopic,
        label: t('settingChat.autoCreateTopicThreshold.title'),
        name: 'autoCreateTopicThreshold',
      },
      {
        children: <Switch />,
        label: t('settingChat.enableHistoryCount.title'),
        layout: 'horizontal',
        minWidth: undefined,
        name: 'enableHistoryCount',
        valuePropName: 'checked',
      },
      {
        children: <SliderWithInput max={20} min={0} unlimitedInput={true} />,
        desc: t('settingChat.historyCount.desc'),
        divider: false,
        hidden: !config.enableHistoryCount,
        label: t('settingChat.historyCount.title'),
        name: 'historyCount',
      },
      {
        children: <Switch />,
        hidden: !config.enableHistoryCount,
        label: t('settingChat.enableCompressHistory.title'),
        layout: 'horizontal',
        minWidth: undefined,
        name: 'enableCompressHistory',
        valuePropName: 'checked',
      },
    ],
    title: t('settingChat.title'),
  };

  return (
    <Form
      footer={
        <Form.SubmitFooter
          texts={{
            reset: t('submitFooter.reset'),
            submit: t('settingChat.submit'),
            unSaved: t('submitFooter.unSaved'),
            unSavedWarning: t('submitFooter.unSavedWarning'),
          }}
        />
      }
      form={form}
      initialValues={config}
      items={[chat]}
      itemsType={'group'}
      onFinish={updateConfig}
      variant={'borderless'}
      {...FORM_STYLE}
    />
  );
});

export default AgentChat;
