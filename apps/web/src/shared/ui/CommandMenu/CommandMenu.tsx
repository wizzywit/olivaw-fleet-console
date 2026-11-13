'use client';

import { clsx } from 'clsx';
import type { KeyboardEvent } from 'react';
import {
  Autocomplete,
  Dialog,
  Header,
  Input,
  Menu,
  MenuItem,
  MenuSection,
  Modal,
  ModalOverlay,
  SearchField,
  Text,
} from 'react-aria-components';
import styles from './CommandMenu.module.css';

export interface CommandMenuItem {
  id: string;
  label: string;
  detail?: string;
}

export interface CommandMenuSection {
  id: string;
  title: string;
  items: CommandMenuItem[];
}

export interface CommandMenuProps {
  label: string;
  placeholder: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  inputValue: string;
  onInputChange: (value: string) => void;
  sections: CommandMenuSection[];
  onAction: (id: string) => void;
  onTab?: () => void;
  emptyText: string;
}

// A search box over grouped commands in a modal: arrow keys move, Enter runs, Escape closes and restores focus.
export function CommandMenu({
  label,
  placeholder,
  isOpen,
  onOpenChange,
  inputValue,
  onInputChange,
  sections,
  onAction,
  onTab,
  emptyText,
}: CommandMenuProps) {
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Tab' && !event.shiftKey && onTab !== undefined && inputValue.trim() !== '') {
      event.preventDefault();
      onTab();
    }
  };
  return (
    <ModalOverlay isOpen={isOpen} onOpenChange={onOpenChange} isDismissable className={clsx(styles.overlay)}>
      <Modal className={clsx(styles.modal)}>
        <Dialog aria-label={label} className={clsx(styles.dialog)}>
          <Autocomplete inputValue={inputValue} onInputChange={onInputChange}>
            <SearchField aria-label={label} autoFocus className={clsx(styles.search)}>
              <Input placeholder={placeholder} className={clsx(styles.input)} onKeyDown={onKeyDown} />
            </SearchField>
            <Menu
              className={clsx(styles.menu)}
              onAction={(key) => {
                onAction(String(key));
              }}
              renderEmptyState={() => <p className={clsx(styles.empty)}>{emptyText}</p>}
            >
              {sections.map((section) => (
                <MenuSection key={section.id} id={section.id} className={clsx(styles.section)}>
                  <Header className={clsx(styles.sectionTitle)}>{section.title}</Header>
                  {section.items.map((item) => (
                    <MenuItem key={item.id} id={item.id} textValue={item.label} className={clsx(styles.item)}>
                      <Text slot="label" className={clsx(styles.itemLabel)}>
                        {item.label}
                      </Text>
                      {item.detail !== undefined && (
                        <Text slot="description" className={clsx(styles.itemDetail)}>
                          {item.detail}
                        </Text>
                      )}
                    </MenuItem>
                  ))}
                </MenuSection>
              ))}
            </Menu>
          </Autocomplete>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
