import { ToggleButton, ToggleButtonGroup } from 'react-aria-components';
import { cx } from '../../lib/cx';
import styles from './ToggleChipGroup.module.css';

export interface ToggleChip {
  id: string;
  label: string;
  count?: string;
  tone?: 'attention';
}

export interface ToggleChipGroupProps {
  label: string;
  items: ToggleChip[];
  selectedId: string;
  onChange: (id: string) => void;
}

export function ToggleChipGroup({ label, items, selectedId, onChange }: ToggleChipGroupProps) {
  return (
    <ToggleButtonGroup
      aria-label={label}
      className={cx(styles.group)}
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={[selectedId]}
      onSelectionChange={(keys) => {
        const [next] = keys;
        if (next !== undefined) onChange(String(next));
      }}
    >
      {items.map((item) => (
        <ToggleButton
          key={item.id}
          id={item.id}
          className={cx(styles.chip, item.tone === 'attention' && styles.attention)}
        >
          {item.label}
          {item.count !== undefined && <span className={cx(styles.count)}>{item.count}</span>}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
