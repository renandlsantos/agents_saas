import { Icon } from '@lobehub/ui';
import { LucideIcon } from 'lucide-react';
import { forwardRef } from 'react';

// Custom token icon SVG
const TokenIconSvg: LucideIcon = forwardRef<SVGSVGElement, any>((props, ref) => (
  <svg
    fill="currentColor"
    fillRule="evenodd"
    height="1em"
    ref={ref}
    viewBox="0 0 24 24"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g>
      {/* Outer circle */}
      <circle
        cx="12"
        cy="12"
        fill="none"
        r="9"
        stroke="currentColor"
        strokeWidth="2"
      />
      {/* Inner coin details */}
      <path
        d="M12 7v10M9 9h6c.55 0 1 .45 1 1v0c0 .55-.45 1-1 1h-6c-.55 0-1 .45-1 1v0c0 .55.45 1 1 1h6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </g>
  </svg>
));

TokenIconSvg.displayName = 'TokenIcon';

interface TokenIconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const TokenIcon: React.FC<TokenIconProps> = ({ size = 16, className, style }) => {
  return (
    <Icon
      className={className}
      icon={TokenIconSvg}
      size={size}
      style={style}
    />
  );
};

export default TokenIcon;