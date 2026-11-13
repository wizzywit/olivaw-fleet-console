import { Meter } from 'react-aria-components';
import { cx } from '../../lib/cx';
import styles from './BatteryMeter.module.css';

export interface BatteryMeterProps {
  percent: number;
  criticalPercent: number;
  charging: boolean;
  isStale?: boolean;
}

function describe(percent: number, criticalPercent: number, charging: boolean): string {
  if (charging) return `Battery ${percent}%, charging`;
  if (percent < criticalPercent) return `Battery ${percent}%, below the ${criticalPercent}% threshold`;
  return `Battery ${percent}%`;
}

export function BatteryMeter({ percent, criticalPercent, charging, isStale = false }: BatteryMeterProps) {
  const isLow = !charging && percent < criticalPercent;
  return (
    <Meter
      className={cx(styles.meter)}
      value={percent}
      aria-label={describe(percent, criticalPercent, charging)}
      data-low={isLow}
      data-stale={isStale}
    >
      <span className={cx(styles.track)} aria-hidden="true">
        <span className={cx(styles.fill)} style={{ width: `${percent}%` }} />
        <span className={cx(styles.threshold)} data-threshold style={{ left: `${criticalPercent}%` }} />
      </span>
      <span className={cx(styles.value)} aria-hidden="true">
        {percent}%
      </span>
    </Meter>
  );
}
