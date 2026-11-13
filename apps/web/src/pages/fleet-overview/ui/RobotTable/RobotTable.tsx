'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import Link from 'next/link';
import { useRef, useState, type KeyboardEvent } from 'react';
import type { ReactNode } from 'react';
import { RobotStatusBadge } from '@/entities/robot';
import { BatteryMeter, KeyHint, VisuallyHidden } from '@/shared/ui';
import type { RobotRowView } from '../../use-cases/useFleetOverview';
import { useHoldWhileWorking } from '../../use-cases/useHoldWhileWorking';
import styles from './RobotTable.module.css';

export interface RobotTableProps {
  rows: RobotRowView[];
  criticalBatteryPercent: number;
  now: Date;
  onOpen: (href: string) => void;
  onHeldChange: (isHeld: boolean) => void;
  notice?: ReactNode;
  describeRow: (row: RobotRowView, position: string) => string;
  lastReportLabel: (row: RobotRowView, now: Date) => string;
}

const rowHeight = 52;
// The sticky header sits above the rows inside the scroll box; the virtualizer must know it, or scrolling a row into
// view stops short by the header's height at the bottom and under the header at the top.
const headerHeight = 44;

export function RobotTable({
  rows,
  criticalBatteryPercent,
  now,
  onOpen,
  onHeldChange,
  describeRow,
  lastReportLabel,
  notice,
}: RobotTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { hasFocus, holdProps, focusProps } = useHoldWhileWorking(onHeldChange);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    scrollMargin: headerHeight,
    scrollPaddingStart: headerHeight,
    overscan: 10,
  });
  const items = virtualizer.getVirtualItems();
  const paddingTop = (items[0]?.start ?? headerHeight) - headerHeight;
  const paddingBottom = virtualizer.getTotalSize() - ((items.at(-1)?.end ?? headerHeight) - headerHeight);
  const active = Math.min(activeIndex, rows.length - 1);
  const activeRow = rows[active];
  // Announced when focus moves, not re-announced when the focused robot's values change under a screen reader.
  const [announcement, setAnnouncement] = useState('');
  const announce = (index: number) => {
    const row = rows[index];
    setAnnouncement(
      row === undefined ? '' : describeRow(row, `Row ${String(index + 1)} of ${String(rows.length)}`),
    );
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = { j: 1, ArrowDown: 1, k: -1, ArrowUp: -1 }[event.key];
    if (step !== undefined) {
      event.preventDefault();
      const next = Math.max(0, Math.min(rows.length - 1, active + step));
      setActiveIndex(next);
      announce(next);
      virtualizer.scrollToIndex(next);
    } else if (event.key === 'Enter' && activeRow !== undefined) {
      onOpen(activeRow.href);
    }
  };

  return (
    <div className={styles.wrapper} {...holdProps}>
      <div
        ref={scrollRef}
        className={styles.scroll}
        tabIndex={0}
        role="region"
        aria-label="Robots, sorted by urgency"
        aria-describedby="robot-table-keys"
        onKeyDown={onKeyDown}
        onFocus={() => {
          focusProps.onFocus();
          announce(active);
        }}
        onBlur={(event) => {
          focusProps.onBlur(event);
          if (!event.currentTarget.contains(event.relatedTarget)) setAnnouncement('');
        }}
      >
        <table className={styles.table} aria-rowcount={rows.length + 1}>
          <caption>
            <VisuallyHidden>{`${rows.length} robots, sorted by urgency, then battery`}</VisuallyHidden>
          </caption>
          <thead>
            <tr aria-rowindex={1} style={{ height: headerHeight }}>
              <th scope="col">Robot</th>
              <th scope="col">Site</th>
              <th scope="col">Status</th>
              <th scope="col">Battery</th>
              <th scope="col" className={styles.right}>
                Last report
              </th>
            </tr>
          </thead>
          <tbody>
            {paddingTop > 0 && (
              <tr aria-hidden="true">
                <td colSpan={5} style={{ height: paddingTop }} />
              </tr>
            )}
            {items.map((item) => {
              const row = rows[item.index];
              if (row === undefined) return null;
              return (
                <tr
                  key={row.id}
                  aria-rowindex={item.index + 2}
                  className={styles.row}
                  data-active={hasFocus && item.index === active}
                  style={{ height: rowHeight }}
                >
                  <th scope="row">
                    <Link href={row.href} className={styles.robot} tabIndex={-1}>
                      {row.id}
                    </Link>
                    <span className={styles.meta}>{row.vendorModel}</span>
                  </th>
                  <td className={styles.secondary}>{row.siteZone}</td>
                  <td>
                    <RobotStatusBadge status={row.status} isStale={row.isStale} />
                  </td>
                  <td>
                    <BatteryMeter
                      percent={row.batteryPercent}
                      criticalPercent={criticalBatteryPercent}
                      charging={row.charging}
                      isCritical={row.isBatteryCritical}
                      isStale={row.isStale}
                    />
                  </td>
                  <td className={styles.right}>{lastReportLabel(row, now)}</td>
                </tr>
              );
            })}
            {paddingBottom > 0 && (
              <tr aria-hidden="true">
                <td colSpan={5} style={{ height: paddingBottom }} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <VisuallyHidden>
        <span role="status" data-testid="robot-table-announcement">
          {announcement}
        </span>
      </VisuallyHidden>
      <p id="robot-table-keys" className={styles.keys}>
        <KeyHint keys={['j', 'k']} /> move · <KeyHint keys={['Enter']} /> open
      </p>
      {notice}
    </div>
  );
}
