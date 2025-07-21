import { useTheme } from 'antd-style';
import { FC } from 'react';
import { Flexbox } from 'react-layout-kit';

import TokenIcon from '../TokenIcon';

interface TokenCountProps {
  /**
   * Additional className for styling
   */
  className?: string;
  /**
   * The number of tokens to display
   */
  count: number;
  /**
   * Format function for the count display
   */
  formatCount?: (count: number) => string;
  /**
   * Size of the icon (default: 16)
   */
  iconSize?: number;
  /**
   * Optional label to display (e.g., "Tokens Used", "Remaining", etc.)
   */
  label?: string;
  /**
   * Color variant for the display
   */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

const MILLION = 1000000;
const THOUSAND = 1000;

const defaultFormatCount = (count: number): string => {
  if (count >= MILLION) {
    return `${(count / MILLION).toFixed(1)}M`;
  }
  if (count >= THOUSAND) {
    return `${(count / THOUSAND).toFixed(1)}K`;
  }
  return count.toLocaleString();
};

export const TokenCount: FC<TokenCountProps> = ({
  count,
  label,
  iconSize = 16,
  className,
  formatCount = defaultFormatCount,
  variant = 'default',
}) => {
  const theme = useTheme();

  const getColor = () => {
    switch (variant) {
      case 'primary': {
        return theme.colorPrimary;
      }
      case 'success': {
        return theme.colorSuccess;
      }
      case 'warning': {
        return theme.colorWarning;
      }
      case 'danger': {
        return theme.colorError;
      }
      default: {
        return theme.colorTextSecondary;
      }
    }
  };

  const color = getColor();

  return (
    <Flexbox
      align="center"
      className={className}
      gap={4}
      horizontal
      style={{ color }}
    >
      <TokenIcon size={iconSize} />
      <span style={{ fontSize: 14, fontWeight: 500 }}>
        {formatCount(count)}
      </span>
      {label && (
        <span style={{ fontSize: 12, opacity: 0.8 }}>
          {label}
        </span>
      )}
    </Flexbox>
  );
};

export default TokenCount;