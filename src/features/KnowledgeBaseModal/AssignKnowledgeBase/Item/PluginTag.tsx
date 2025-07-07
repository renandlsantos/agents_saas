import { Icon, Tag } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { BadgeCheck, Package } from 'lucide-react';
import { rgba } from 'polished';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { InstallPluginMeta } from '@/types/tool/plugin';

const useStyles = createStyles(({ css, token }) => ({
  community: css`
    color: ${rgba(token.colorInfo, 0.75)};
    background: ${token.colorInfoBg};

    &:hover {
      color: ${token.colorInfo};
    }
  `,
  custom: css`
    color: ${rgba(token.colorWarning, 0.75)};
    background: ${token.colorWarningBg};

    &:hover {
      color: ${token.colorWarning};
    }
  `,
  official: css`
    color: ${rgba(token.colorSuccess, 0.75)};
    background: ${token.colorSuccessBg};

    &:hover {
      color: ${token.colorSuccess};
    }
  `,
}));

interface PluginTagProps extends Pick<InstallPluginMeta, 'author' | 'type'> {
  showIcon?: boolean;
  showText?: boolean;
}

const PluginTag = memo<PluginTagProps>(({ showIcon = true, author, type, showText = true }) => {
  const { t } = useTranslation('plugin');
  const { styles, cx } = useStyles();
  const isCustom = type === 'customPlugin';
  const isOfficial = author === 'Agents SaaS';

  // Don't render Community tag
  if (!isCustom && !isOfficial) {
    return null;
  }

  return (
    <Tag
      className={cx(isCustom ? styles.custom : styles.official)}
      icon={showIcon && <Icon icon={isCustom ? Package : BadgeCheck} />}
    >
      {showText && (author || t('store.customPlugin'))}
    </Tag>
  );
});

export default PluginTag;
