import { memo } from 'react';

export enum PlanType {
  Preview = 'preview',
}

export interface PlanTagProps {
  type?: PlanType;
}

const PlanTag = memo<PlanTagProps>(() => {
  // Hide the Community tag completely
  return null;
});

export default PlanTag;
