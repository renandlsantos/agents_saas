'use client';

import { Alert, Form, type FormGroupItemType, Select, SliderWithInput } from '@lobehub/ui';
import { Form as AntdForm, Switch } from 'antd';
import isEqual from 'fast-deep-equal';
import { EyeOff } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { FORM_STYLE } from '@/const/layoutTokens';
import ModelSelect from '@/features/ModelSelect';
import { useProviderName } from '@/hooks/useProviderName';
import { useServerConfigStore } from '@/store/serverConfig';
import { useSessionStore } from '@/store/session';
import { sessionSelectors } from '@/store/session/selectors';
import { useUserStore } from '@/store/user';
import { userProfileSelectors } from '@/store/user/selectors';

import { selectors, useStore } from '../store';

const AgentModal = memo(() => {
  const { t } = useTranslation('setting');
  const [form] = Form.useForm();
  const isMobile = useServerConfigStore((s) => s.isMobile);
  const enableMaxTokens = AntdForm.useWatch(['chatConfig', 'enableMaxTokens'], form);
  const enableReasoningEffort = AntdForm.useWatch(['chatConfig', 'enableReasoningEffort'], form);
  const config = useStore(selectors.currentAgentConfig, isEqual);

  const updateConfig = useStore((s) => s.setAgentConfig);
  const providerName = useProviderName(useStore((s) => s.config.provider) as string);

  // Check user permissions
  const currentSession = useSessionStore(sessionSelectors.currentSession);
  const currentUserId = useUserStore(userProfileSelectors.userId);
  const isAdmin = useUserStore(userProfileSelectors.isAdmin);
  
  // Check if this is a domain agent (published by admin)
  const isDomainAgent = currentSession?.isDomain === true;
  const isOwnAgent = currentSession?.userId === currentUserId;
  
  // User can edit model if:
  // 1. They are admin OR
  // 2. It's their own agent and not a domain agent
  const canEditModel = isAdmin || (isOwnAgent && !isDomainAgent);

  // If user cannot edit model, show a message
  if (!canEditModel) {
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
            title: t('settingModel.title'),
          },
        ]}
        itemsType={'group'}
        variant={'borderless'}
        {...FORM_STYLE}
      />
    );
  }

  const model: FormGroupItemType = {
    children: [
      {
        children: <ModelSelect />,
        desc: t('settingModel.model.desc', { provider: providerName }),
        label: t('settingModel.model.title'),
        name: '_modalConfig',
        tag: 'model',
      },
      {
        children: <SliderWithInput max={2} min={0} step={0.1} />,
        desc: t('settingModel.temperature.desc'),
        label: t('settingModel.temperature.title'),
        name: ['params', 'temperature'],
        tag: 'temperature',
      },
      {
        children: <SliderWithInput max={1} min={0} step={0.1} />,
        desc: t('settingModel.topP.desc'),
        label: t('settingModel.topP.title'),
        name: ['params', 'top_p'],
        tag: 'top_p',
      },
      {
        children: <SliderWithInput max={2} min={-2} step={0.1} />,
        desc: t('settingModel.presencePenalty.desc'),
        label: t('settingModel.presencePenalty.title'),
        name: ['params', 'presence_penalty'],
        tag: 'presence_penalty',
      },
      {
        children: <SliderWithInput max={2} min={-2} step={0.1} />,
        desc: t('settingModel.frequencyPenalty.desc'),
        label: t('settingModel.frequencyPenalty.title'),
        name: ['params', 'frequency_penalty'],
        tag: 'frequency_penalty',
      },
      {
        children: <Switch />,
        label: t('settingModel.enableMaxTokens.title'),
        layout: 'horizontal',
        minWidth: undefined,
        name: ['chatConfig', 'enableMaxTokens'],
        valuePropName: 'checked',
      },
      {
        children: <SliderWithInput max={32_000} min={0} step={100} unlimitedInput={true} />,
        desc: t('settingModel.maxTokens.desc'),
        divider: false,
        hidden: !enableMaxTokens,
        label: t('settingModel.maxTokens.title'),
        name: ['params', 'max_tokens'],
        tag: 'max_tokens',
      },
      {
        children: <Switch />,
        label: t('settingModel.enableReasoningEffort.title'),
        layout: 'horizontal',
        minWidth: undefined,
        name: ['chatConfig', 'enableReasoningEffort'],
        valuePropName: 'checked',
      },
      {
        children: (
          <Select
            defaultValue="medium"
            options={[
              { label: t('settingModel.reasoningEffort.options.low'), value: 'low' },
              { label: t('settingModel.reasoningEffort.options.medium'), value: 'medium' },
              { label: t('settingModel.reasoningEffort.options.high'), value: 'high' },
            ]}
          />
        ),
        desc: t('settingModel.reasoningEffort.desc'),
        hidden: !enableReasoningEffort,
        label: t('settingModel.reasoningEffort.title'),
        name: ['params', 'reasoning_effort'],
        tag: 'reasoning_effort',
      },
    ],
    title: t('settingModel.title'),
  };

  return (
    <Form
      footer={
        <Form.SubmitFooter
          texts={{
            reset: t('submitFooter.reset'),
            submit: t('settingModel.submit'),
            unSaved: t('submitFooter.unSaved'),
            unSavedWarning: t('submitFooter.unSavedWarning'),
          }}
        />
      }
      form={form}
      initialValues={{
        ...config,
        _modalConfig: {
          model: config.model,
          provider: config.provider,
        },
      }}
      items={[model]}
      itemsType={'group'}
      onFinish={({ _modalConfig, ...rest }) => {
        updateConfig({
          model: _modalConfig?.model,
          provider: _modalConfig?.provider,
          ...rest,
        });
      }}
      variant={'borderless'}
      {...FORM_STYLE}
    />
  );
});

export default AgentModal;
