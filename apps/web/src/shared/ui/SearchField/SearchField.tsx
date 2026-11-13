import { Button, Input, Label, SearchField as AriaSearchField } from 'react-aria-components';
import { KeyHint } from '../KeyHint/KeyHint';
import { clsx } from 'clsx';
import styles from './SearchField.module.css';

export interface SearchFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  shortcut?: { keys: string[]; label: string; onPress: () => void };
}

export function SearchField({ label, placeholder, value, onChange, shortcut }: SearchFieldProps) {
  return (
    <AriaSearchField className={clsx(styles.field)} value={value} onChange={onChange}>
      <Label className={clsx(styles.label)}>{label}</Label>
      <svg
        className={clsx(styles.icon)}
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
      <Input className={clsx(styles.input)} placeholder={placeholder} />
      {shortcut !== undefined && (
        <Button
          className={clsx(styles.shortcut)} // The name contains the visible keys, so speech users can say what they see (WCAG 2.5.3).
          aria-label={`${shortcut.label} ${shortcut.keys.join(' ')}`}
          onPress={shortcut.onPress}
        >
          <KeyHint keys={shortcut.keys} />
        </Button>
      )}
    </AriaSearchField>
  );
}
