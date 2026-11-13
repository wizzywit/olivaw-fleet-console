import { Meter } from 'react-aria-components';
import { clsx } from 'clsx';
import styles from './BatteryMeter.module.css';

export interface BatteryMeterProps {
  percent: number;
  criticalPercent: number;
  charging: boolean;
  isCritical: boolean;
  isStale?: boolean;
}

function describe(percent: number, criticalPercent: number, charging: boolean, isCritical: boolean): string {
  if (charging) return `Battery ${percent}%, charging`;
  if (isCritical) return `Battery ${percent}%, below the ${criticalPercent}% threshold`;
  return `Battery ${percent}%`;
}

// Presentational: whether the value is critical is decided upstream (by the server's rules), not here.
export function BatteryMeter({
  percent,
  criticalPercent,
  charging,
  isCritical,
  isStale = false,
}: BatteryMeterProps) {
  return (
    <Meter
      className={clsx(styles.meter)}
      value={percent}
      aria-label={describe(percent, criticalPercent, charging, isCritical)}
      data-low={isCritical}
      data-stale={isStale}
    >
      <span className={clsx(styles.track)} aria-hidden="true">
        <span className={clsx(styles.fill)} style={{ width: `${percent}%` }} />
        <span className={clsx(styles.threshold)} data-threshold style={{ left: `${criticalPercent}%` }} />
      </span>
      <span className={clsx(styles.value)} aria-hidden="true">
        {percent}%
      </span>
    </Meter>
  );
}
