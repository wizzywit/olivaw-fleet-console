import type { ReactNode } from 'react';
import { ToggleButton } from 'react-aria-components';
import { clsx } from 'clsx';
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
    <ToggleButton className={clsx(styles.tile)} isSelected={isPressed} onChange={onPress}>
      <span className={clsx(styles.header)}>
        <span className={clsx(styles.label)}>{label}</span>
        <span className={clsx(styles.value)}>{value}</span>
      </span>
      {visual}
      {detail !== undefined && <span className={clsx(styles.detail)}>{detail}</span>}
    </ToggleButton>
  );
}
