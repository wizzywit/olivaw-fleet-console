import type { ReactNode } from 'react';
import { ToggleButton } from 'react-aria-components';
import { cx } from '../../lib/cx';
import styles from './StatTile.module.css';

export interface StatTileProps {
  label: string;
  value: string;
  detail?: string;
  visual?: ReactNode;
  isPressed: boolean;
  onPress: () => void;
}

export function StatTile({ label, value, detail, visual, isPressed, onPress }: StatTileProps) {
  return (
    <ToggleButton className={cx(styles.tile)} isSelected={isPressed} onChange={onPress}>
      <span className={cx(styles.header)}>
        <span className={cx(styles.label)}>{label}</span>
        <span className={cx(styles.value)}>{value}</span>
      </span>
      {visual}
      {detail !== undefined && <span className={cx(styles.detail)}>{detail}</span>}
    </ToggleButton>
  );
}
