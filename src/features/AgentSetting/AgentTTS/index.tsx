'use client';

import { VoiceList } from '@lobehub/tts';
import { Alert, Form, type FormGroupItemType, Select } from '@lobehub/ui';
import { Switch } from 'antd';
import isEqual from 'fast-deep-equal';
import { EyeOff, Mic } from 'lucide-react';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { FORM_STYLE } from '@/const/layoutTokens';
import { useGlobalStore } from '@/store/global';
import { globalGeneralSelectors } from '@/store/global/selectors';
import { useServerConfigStore } from '@/store/serverConfig';
import { useSessionStore } from '@/store/session';
import { sessionSelectors } from '@/store/session/selectors';
import { useUserStore } from '@/store/user';
import { userProfileSelectors } from '@/store/user/selectors';

import { selectors, useStore } from '../store';
import SelectWithTTSPreview from './SelectWithTTSPreview';
import { ttsOptions } from './options';

const TTS_SETTING_KEY = 'tts';
const { openaiVoiceOptions, localeOptions } = VoiceList;

const AgentTTS = memo(() => {
  const { t } = useTranslation('setting');
  const [form] = Form.useForm();
  const isMobile = useServerConfigStore((s) => s.isMobile);
  const voiceList = useGlobalStore((s) => {
    const locale = globalGeneralSelectors.currentLanguage(s);
    return (all?: boolean) => new VoiceList(all ? undefined : locale);
  });
  const config = useStore(selectors.currentTtsConfig, isEqual);
  const updateConfig = useStore((s) => s.setAgentConfig);

  // Check user permissions
  const currentSession = useSessionStore(sessionSelectors.currentSession);
  const currentUserId = useUserStore(userProfileSelectors.userId);
  const isAdmin = useUserStore(userProfileSelectors.isAdmin);
  
  // Check if this is a domain agent (published by admin)
  const isDomainAgent = currentSession?.isDomain === true;
  const isOwnAgent = currentSession?.userId === currentUserId;
  
  // User can edit TTS if:
  // 1. They are admin OR
  // 2. It's their own agent and not a domain agent
  const canEditTTS = isAdmin || (isOwnAgent && !isDomainAgent);

  // Must call hooks before conditional returns
  const { edgeVoiceOptions, microsoftVoiceOptions } = useMemo(
    () => voiceList(config.showAllLocaleVoice),
    [config.showAllLocaleVoice],
  );

  // If user cannot edit TTS, show a message
  if (!canEditTTS) {
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
            title: t('settingTTS.title'),
          },
        ]}
        itemsType={'group'}
        variant={'borderless'}
        {...FORM_STYLE}
      />
    );
  }

  const tts: FormGroupItemType = {
    children: [
      {
        children: <Select options={ttsOptions} />,
        desc: t('settingTTS.ttsService.desc'),
        label: t('settingTTS.ttsService.title'),
        name: [TTS_SETTING_KEY, 'ttsService'],
      },
      {
        children: <Switch />,
        desc: t('settingTTS.showAllLocaleVoice.desc'),
        hidden: config.ttsService === 'openai',
        label: t('settingTTS.showAllLocaleVoice.title'),
        layout: 'horizontal',
        minWidth: undefined,
        name: [TTS_SETTING_KEY, 'showAllLocaleVoice'],
        valuePropName: 'checked',
      },
      {
        children: <SelectWithTTSPreview options={openaiVoiceOptions} server={'openai'} />,
        desc: t('settingTTS.voice.desc'),
        hidden: config.ttsService !== 'openai',
        label: t('settingTTS.voice.title'),
        name: [TTS_SETTING_KEY, 'voice', 'openai'],
      },
      {
        children: <SelectWithTTSPreview options={edgeVoiceOptions} server={'edge'} />,
        desc: t('settingTTS.voice.desc'),
        divider: false,
        hidden: config.ttsService !== 'edge',
        label: t('settingTTS.voice.title'),
        name: [TTS_SETTING_KEY, 'voice', 'edge'],
      },
      {
        children: <SelectWithTTSPreview options={microsoftVoiceOptions} server={'microsoft'} />,
        desc: t('settingTTS.voice.desc'),
        divider: false,
        hidden: config.ttsService !== 'microsoft',
        label: t('settingTTS.voice.title'),
        name: [TTS_SETTING_KEY, 'voice', 'microsoft'],
      },
      {
        children: (
          <Select
            options={[
              { label: t('settingCommon.lang.autoMode'), value: 'auto' },
              ...(localeOptions || []),
            ]}
          />
        ),
        desc: t('settingTTS.sttLocale.desc'),
        label: t('settingTTS.sttLocale.title'),
        name: [TTS_SETTING_KEY, 'sttLocale'],
      },
    ],
    icon: Mic,
    title: t('settingTTS.title'),
  };

  return (
    <Form
      footer={
        <Form.SubmitFooter
          texts={{
            reset: t('submitFooter.reset'),
            submit: t('settingTTS.submit'),
            unSaved: t('submitFooter.unSaved'),
            unSavedWarning: t('submitFooter.unSavedWarning'),
          }}
        />
      }
      form={form}
      initialValues={{
        [TTS_SETTING_KEY]: config,
      }}
      items={[tts]}
      itemsType={'group'}
      onFinish={updateConfig}
      variant={'borderless'}
      {...FORM_STYLE}
    />
  );
});

export default AgentTTS;
