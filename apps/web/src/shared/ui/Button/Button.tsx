import type { ReactNode } from 'react';
import { Button as AriaButton } from 'react-aria-components';
import { cx } from '../../lib/cx';
import styles from './Button.module.css';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'quiet';
  size?: 'md' | 'touch';
  isDisabled?: boolean;
  onPress: () => void;
  children?: ReactNode;
  'aria-label'?: string;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isDisabled = false,
  onPress,
  children,
  ...aria
}: ButtonProps) {
  return (
    <AriaButton
      className={cx(styles.button, styles[variant], styles[size])}
      isDisabled={isDisabled}
      onPress={onPress}
      {...aria}
    >
      {children}
    </AriaButton>
  );
}
