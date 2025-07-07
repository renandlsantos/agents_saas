'use client';

import { Alert, Button, Input, Modal, type ModalProps } from '@lobehub/ui';
import { Divider } from 'antd';
import { useTheme } from 'antd-style';
import isEqual from 'fast-deep-equal';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import AgentInfo from '@/features/AgentInfo';
import { useAgentStore } from '@/store/agent';
import { agentSelectors } from '@/store/agent/selectors';
import { useSessionStore } from '@/store/session';
import { sessionMetaSelectors } from '@/store/session/selectors';

const showSubmissionDisabledAlert = () => {
  alert('Agent submission is currently disabled');
};

const SubmitAgentModal = memo<ModalProps>(({ open, onCancel }) => {
  const { t } = useTranslation('setting');
  const [identifier, setIdentifier] = useState('');
  const systemRole = useAgentStore(agentSelectors.currentAgentSystemRole);
  const theme = useTheme();
  const meta = useSessionStore(sessionMetaSelectors.currentAgentMeta, isEqual);

  const isMetaPass = Boolean(
    meta && meta.title && meta.description && (meta.tags as string[])?.length > 0 && meta.avatar,
  );

  return (
    <Modal
      allowFullscreen
      footer={
        <Button
          block
          disabled={!isMetaPass || !identifier}
          onClick={showSubmissionDisabledAlert}
          size={'large'}
          type={'primary'}
        >
          {t('submitAgentModal.button')}
        </Button>
      }
      onCancel={onCancel}
      open={open}
      title={t('submitAgentModal.tooltips')}
    >
      <Flexbox gap={16}>
        {!isMetaPass && (
          <Alert message={t('submitAgentModal.metaMiss')} showIcon type={'warning'} />
        )}
        <AgentInfo meta={meta} systemRole={systemRole} />
        <Divider style={{ margin: '8px 0' }} />
        <strong>
          <span style={{ color: theme.colorError, marginRight: 4 }}>*</span>
          {t('submitAgentModal.identifier')}
        </strong>
        <Input
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder={t('submitAgentModal.placeholder')}
          value={identifier}
        />
      </Flexbox>
    </Modal>
  );
});

export default SubmitAgentModal;
