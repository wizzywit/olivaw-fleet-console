'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useFleetRobots, useFleetSites, useLivePause } from '@/entities/fleet';
import { compareByUrgency, robotStatusLabel, type RobotStatus } from '@/entities/robot';
import { matchesFleetSearch, useFleetFilter } from '@/features/filter-fleet';
import { useViewMode } from '@/features/switch-fleet-view';
import { useThemeToggle } from '@/features/toggle-theme';
import { formatPercent, useKeyboardShortcut } from '@/shared/lib';

interface PaletteCommand {
  id: string;
  label: string;
  detail?: string;
  run: () => void;
}

const maxRobotResults = 8;
const statuses: readonly RobotStatus[] = ['attention', 'offline', 'working', 'charging', 'idle'];

export function useCommandPalette() {
  const [isOpen, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();
  const isFleetPage = (usePathname() ?? '/') === '/';
  const robots = useFleetRobots();
  const sites = useFleetSites();
  const filter = useFleetFilter();
  const view = useViewMode();
  const live = useLivePause();
  const theme = useThemeToggle();

  const close = () => {
    setOpen(false);
    setQuery('');
  };
  useKeyboardShortcut({ key: 'k', withModifier: true }, () => {
    if (isOpen) close();
    else setOpen(true);
  });

  const needle = query.trim().toLowerCase();
  const matches = (command: PaletteCommand) => needle === '' || command.label.toLowerCase().includes(needle);
  const siteName = (siteId: string) => sites.find((site) => site.id === siteId)?.name;

  // Matching reuses the fleet search, so the palette and the search field always agree on what a query means.
  const robotCommands: PaletteCommand[] =
    needle === ''
      ? []
      : [...robots.values()]
          .filter((robot) => matchesFleetSearch(robot, query, siteName))
          .sort(compareByUrgency)
          .slice(0, maxRobotResults)
          .map((robot) => ({
            id: `robot:${robot.id}`,
            label: robot.id,
            detail: `${robotStatusLabel(robot.status)} · ${siteName(robot.siteId) ?? robot.siteId} · battery ${formatPercent(robot.battery.percent)}`,
            run: () => {
              router.push(`/robots/${encodeURIComponent(robot.id)}`);
            },
          }));

  const filterCommands: PaletteCommand[] = isFleetPage
    ? [
        ...statuses.map((status) => ({
          id: `status:${status}`,
          label: `Show only ${robotStatusLabel(status)}`,
          run: () => {
            filter.setStatus(status);
          },
        })),
        ...(filter.isActive ? [{ id: 'filters:clear', label: 'Clear filters', run: filter.clear }] : []),
      ].filter(matches)
    : [];
  if (isFleetPage && needle !== '') {
    filterCommands.push({
      id: 'filters:search',
      label: `Search the fleet for "${query.trim()}"`,
      detail: 'Tab',
      run: () => {
        filter.setQuery(query.trim());
      },
    });
  }

  const actionCommands: PaletteCommand[] = [
    ...(isFleetPage
      ? [
          {
            id: 'view:toggle',
            label: `Switch to ${view.view === 'grid' ? 'table' : 'grid'} view`,
            detail: 'G',
            run: view.toggleView,
          },
        ]
      : [
          {
            id: 'go:fleet',
            label: 'Go to the fleet',
            run: () => {
              router.push('/');
            },
          },
        ]),
    {
      id: 'live:toggle',
      label: live.isPaused ? 'Resume live updates' : 'Pause live updates',
      run: live.isPaused ? live.resume : live.pause,
    },
    { id: 'theme:toggle', label: theme.label, run: theme.toggle },
  ].filter(matches);

  const sections = [
    { id: 'robots', title: 'Robots', commands: robotCommands },
    { id: 'filters', title: 'Filters', commands: filterCommands },
    { id: 'actions', title: 'Actions', commands: actionCommands },
  ].filter((section) => section.commands.length > 0);
  const commands = sections.flatMap((section) => section.commands);

  return {
    isOpen,
    query,
    setQuery,
    open: () => {
      setOpen(true);
    },
    onOpenChange: (next: boolean) => {
      if (next) setOpen(true);
      else close();
    },
    sections: sections.map(({ id, title, commands: items }) => ({
      id,
      title,
      items: items.map(({ id: itemId, label, detail }) => ({
        id: itemId,
        label,
        ...(detail === undefined ? {} : { detail }),
      })),
    })),
    runCommand: (id: string) => {
      commands.find((command) => command.id === id)?.run();
      close();
    },
    // Tab turns the typed text into the fleet search, also from other pages.
    searchFleet: () => {
      const text = query.trim();
      if (isFleetPage) filter.setQuery(text);
      else router.push(`/?q=${encodeURIComponent(text)}`);
      close();
    },
  };
}
