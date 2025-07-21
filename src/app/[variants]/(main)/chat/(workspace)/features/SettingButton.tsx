'use client';

import { ActionIcon, Tooltip } from '@lobehub/ui';
import { AlignJustify } from 'lucide-react';
import dynamic from 'next/dynamic';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { DESKTOP_HEADER_ICON_SIZE, MOBILE_HEADER_ICON_SIZE } from '@/const/layoutTokens';
import { useOpenChatSettings } from '@/hooks/useInterceptingRoutes';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';
import { useSessionStore } from '@/store/session';
import { sessionSelectors } from '@/store/session/selectors';
import { useUserStore } from '@/store/user';
import { settingsSelectors, userProfileSelectors } from '@/store/user/selectors';
import { HotkeyEnum } from '@/types/hotkey';

const AgentSettings = dynamic(() => import('./AgentSettings'), {
  ssr: false,
});

const SettingButton = memo<{ mobile?: boolean }>(({ mobile }) => {
  const hotkey = useUserStore(settingsSelectors.getHotkeyById(HotkeyEnum.OpenChatSettings));
  const { t } = useTranslation('common');
  const openChatSettings = useOpenChatSettings();
  const id = useSessionStore((s) => s.activeId);
  
  // Check permissions
  const featureFlags = useServerConfigStore(featureFlagsSelectors);
  const isAgentEditable = featureFlags.isAgentEditable;
  const currentSession = useSessionStore(sessionSelectors.currentSession);
  const currentUserId = useUserStore(userProfileSelectors.userId);
  const isAdmin = useUserStore(userProfileSelectors.isAdmin);
  
  // Don't show settings button if:
  // 1. Agent editing is disabled globally
  // 2. Session doesn't exist
  // 3. User is not admin and the session doesn't belong to them
  if (!isAgentEditable || !currentSession) return null;
  
  const isOwnAgent = currentSession.userId === currentUserId;
  const canEdit = isAdmin || isOwnAgent;
  
  if (!canEdit) return null;

  return (
    <>
      <Tooltip hotkey={hotkey} title={t('openChatSettings.title', { ns: 'hotkey' })}>
        <ActionIcon
          icon={AlignJustify}
          onClick={() => openChatSettings()}
          size={mobile ? MOBILE_HEADER_ICON_SIZE : DESKTOP_HEADER_ICON_SIZE}
        />
      </Tooltip>
      <AgentSettings key={id} />
    </>
  );
});

export default SettingButton;
