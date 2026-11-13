import { Input, Label, SearchField as AriaSearchField } from 'react-aria-components';
import { KeyHint } from '../KeyHint/KeyHint';
import { cx } from '../../lib/cx';
import styles from './SearchField.module.css';

export interface SearchFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  shortcut?: string[];
}

export function SearchField({ label, placeholder, value, onChange, shortcut }: SearchFieldProps) {
  return (
    <AriaSearchField className={cx(styles.field)} value={value} onChange={onChange}>
      <Label className={cx(styles.label)}>{label}</Label>
      <svg
        className={cx(styles.icon)}
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <Input className={cx(styles.input)} placeholder={placeholder} />
      {shortcut && <KeyHint keys={shortcut} />}
    </AriaSearchField>
  );
}
