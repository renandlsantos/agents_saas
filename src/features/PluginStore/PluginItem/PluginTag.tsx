import { Icon, Tag } from '@lobehub/ui';
import { BadgeCheck, Package } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { InstallPluginMeta } from '@/types/tool/plugin';

interface PluginTagProps extends Pick<InstallPluginMeta, 'author' | 'type'> {
  showIcon?: boolean;
  showText?: boolean;
}

const PluginTag = memo<PluginTagProps>(({ showIcon = true, author, type, showText = true }) => {
  const { t } = useTranslation('plugin');
  const isCustom = type === 'customPlugin';
  const isOfficial = author === 'Agents SaaS';

  // Don't render Community tag
  if (!isCustom && !isOfficial) {
    return null;
  }

  return (
    <Tag
      color={isCustom ? 'warning' : 'success'}
      icon={showIcon && <Icon icon={isCustom ? Package : BadgeCheck} />}
      size={'small'}
    >
      {showText && (author || t('store.customPlugin'))}
    </Tag>
  );
});

export default PluginTag;
