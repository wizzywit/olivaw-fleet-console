'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => undefined;
const platformModifier = () => (/Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl');

// Shortcuts accept Cmd and Ctrl everywhere; this only picks the key name people expect on their platform. The server
// cannot know the platform, so it renders the Apple name and the client corrects it right after hydration.
export const useShortcutModifier = (): string => useSyncExternalStore(subscribe, platformModifier, () => '⌘');
