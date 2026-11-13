'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import Link from 'next/link';
import { useRef, useState, type KeyboardEvent } from 'react';
import { RobotStatusBadge } from '@/entities/robot';
import { formatRelativeTime } from '@/shared/lib';
import { BatteryMeter, KeyHint, VisuallyHidden } from '@/shared/ui';
import type { RobotRowView } from '../../use-cases/useFleetOverview';
import styles from './RobotTable.module.css';

export interface RobotTableProps {
  rows: RobotRowView[];
  criticalBatteryPercent: number;
  now: Date;
  onOpen: (href: string) => void;
  onHeldChange: (isHeld: boolean) => void;
}

const rowHeight = 52;

export function RobotTable({ rows, criticalBatteryPercent, now, onOpen, onHeldChange }: RobotTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasFocus, setHasFocus] = useState(false);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: 10,
  });
  const items = virtualizer.getVirtualItems();
  const paddingTop = items[0]?.start ?? 0;
  const paddingBottom = virtualizer.getTotalSize() - (items.at(-1)?.end ?? 0);
  const active = Math.min(activeIndex, rows.length - 1);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = { j: 1, ArrowDown: 1, k: -1, ArrowUp: -1 }[event.key];
    if (step !== undefined) {
      event.preventDefault();
      const next = Math.max(0, Math.min(rows.length - 1, active + step));
      setActiveIndex(next);
      virtualizer.scrollToIndex(next);
    } else if (event.key === 'Enter') {
      const row = rows[active];
      if (row !== undefined) onOpen(row.href);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div
        ref={scrollRef}
        className={styles.scroll}
        tabIndex={0}
        role="region"
        aria-label="Robots, sorted by urgency"
        aria-describedby="robot-table-keys"
        onKeyDown={onKeyDown}
        onMouseEnter={() => {
          onHeldChange(true);
        }}
        onMouseLeave={() => {
          onHeldChange(false);
        }}
        onFocus={() => {
          setHasFocus(true);
          onHeldChange(true);
        }}
        onBlur={(event) => {
          if (event.currentTarget.contains(event.relatedTarget)) return;
          setHasFocus(false);
          onHeldChange(false);
        }}
      >
        <table className={styles.table} aria-rowcount={rows.length + 1}>
          <caption>
            <VisuallyHidden>{`${rows.length} robots, sorted by urgency, then battery`}</VisuallyHidden>
          </caption>
          <thead>
            <tr aria-rowindex={1}>
              <th scope="col">Robot</th>
              <th scope="col">Site</th>
              <th scope="col" aria-sort="descending">
                Status
              </th>
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
                  <td className={styles.right}>{formatRelativeTime(row.lastReportAt, now)}</td>
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
      <p id="robot-table-keys" className={styles.keys}>
        <KeyHint keys={['j', 'k']} /> move · <KeyHint keys={['Enter']} /> open
      </p>
    </div>
  );
}
