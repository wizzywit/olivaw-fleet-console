import { useId, type ReactNode } from 'react';
import { ToggleButton, Tooltip, TooltipTrigger } from 'react-aria-components';
import { clsx } from 'clsx';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden';
import styles from './StatTile.module.css';

export interface StatTileProps {
  label: string;
  value: string;
  detail?: string;
  visual?: ReactNode;
  description?: string;
  tooltip?: ReactNode;
  isPressed: boolean;
  onPress: () => void;
}

export function StatTile({
  label,
  value,
  detail,
  visual,
  description,
  tooltip,
  isPressed,
  onPress,
}: StatTileProps) {
  const descriptionId = useId();
  const tile = (
    <ToggleButton
      className={clsx(styles.tile)}
      isSelected={isPressed}
      onChange={onPress}
      {...(description === undefined ? {} : { 'aria-describedby': descriptionId })}
    >
      <span className={clsx(styles.header)}>
        <span className={clsx(styles.label)}>{label}</span>
        <span className={clsx(styles.value)}>{value}</span>
      </span>
      {visual}
      {detail !== undefined && <span className={clsx(styles.detail)}>{detail}</span>}
      {description !== undefined && <VisuallyHidden id={descriptionId}>{description}</VisuallyHidden>}
    </ToggleButton>
  );
  if (tooltip === undefined) return tile;
  return (
    <TooltipTrigger delay={300} closeDelay={100}>
      {tile}
      <Tooltip className={clsx(styles.tooltip)} offset={8} placement="bottom">
        {tooltip}
      </Tooltip>
    </TooltipTrigger>
  );
}
