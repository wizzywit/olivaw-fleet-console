import { clsx } from 'clsx';
import { useId, type ReactNode } from 'react';
import { ToggleButton, ToggleButtonGroup } from 'react-aria-components';
import styles from './SegmentedControl.module.css';

export interface Segment {
  id: string;
  label: string;
  icon?: ReactNode;
}

export interface SegmentedControlProps {
  label: string;
  items: Segment[];
  selectedId: string;
  onChange: (id: string) => void;
}

// A switch between views of the same content, styled as one joined control so it never reads as a filter.
export function SegmentedControl({ label, items, selectedId, onChange }: SegmentedControlProps) {
  const labelId = useId();
  return (
    <div className={styles.field}>
      <span id={labelId} className={styles.label}>
        {label}
      </span>
      <ToggleButtonGroup
        aria-labelledby={labelId}
        className={clsx(styles.group)}
        selectionMode="single"
        disallowEmptySelection
        selectedKeys={[selectedId]}
        onSelectionChange={(keys) => {
          const [next] = keys;
          if (next !== undefined && String(next) !== selectedId) onChange(String(next));
        }}
      >
        {items.map((item) => (
          <ToggleButton key={item.id} id={item.id} className={clsx(styles.segment)}>
            {item.icon !== undefined && (
              <span className={styles.icon} aria-hidden="true">
                {item.icon}
              </span>
            )}
            {item.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </div>
  );
}
