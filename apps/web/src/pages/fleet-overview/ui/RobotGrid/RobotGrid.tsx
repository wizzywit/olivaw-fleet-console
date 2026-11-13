'use client';

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type MouseEvent,
  type RefObject,
} from 'react';
import type { ReactNode } from 'react';
import { robotStatusLabel, type RobotStatus } from '@/entities/robot';
import { KeyHint, VisuallyHidden } from '@/shared/ui';
import type { RobotRowView } from '../../use-cases/useFleetOverview';
import { useHoldWhileWorking } from '../../use-cases/useHoldWhileWorking';
import { useRobotGrid } from '../../use-cases/useRobotGrid';
import { drawCells, readGridColors } from './drawGrid';
import styles from './RobotGrid.module.css';
import { tooltipPlacement, type TooltipPlacement } from './tooltipPlacement';

export interface RobotGridProps {
  rows: RobotRowView[];
  sites: readonly { id: string; name: string }[];
  onOpen: (href: string) => void;
  onHeldChange: (isHeld: boolean) => void;
  notice?: ReactNode;
}

const legend: RobotStatus[] = ['attention', 'offline', 'working', 'charging', 'idle'];

function useContentWidth(ref: RefObject<HTMLElement | null>): number {
  return useSyncExternalStore(
    (onChange) => {
      const element = ref.current;
      if (element === null || typeof ResizeObserver === 'undefined') return () => undefined;
      const observer = new ResizeObserver(onChange);
      observer.observe(element);
      return () => {
        observer.disconnect();
      };
    },
    () => ref.current?.clientWidth ?? 0,
    () => 0,
  );
}

// Redraws when the theme changes, even while live updates are paused.
function useThemeVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const bump = () => {
      setVersion((current) => current + 1);
    };
    const observer = new MutationObserver(bump);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const query = matchMedia('(prefers-color-scheme: dark)');
    query.addEventListener('change', bump);
    return () => {
      observer.disconnect();
      query.removeEventListener('change', bump);
    };
  }, []);
  return version;
}

export function RobotGrid({ rows, sites, onOpen, onHeldChange, notice }: RobotGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const width = useContentWidth(contentRef);
  const themeVersion = useThemeVersion();
  const grid = useRobotGrid(rows, sites, width);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [lastIndex, setLastIndex] = useState(0);
  const [hovered, setHovered] = useState<{ index: number; placement: TooltipPlacement } | null>(null);
  const { hasFocus, holdProps, focusProps } = useHoldWhileWorking(onHeldChange, () => {
    setHovered(null);
  });
  const focusIndex = grid.follow(focusedId, lastIndex);
  // The fallback follows the focused robot, so if it disappears focus lands where it last was, not where a key put it.
  if (focusIndex >= 0 && focusIndex !== lastIndex) setLastIndex(focusIndex);
  const [announcement, setAnnouncement] = useState('');
  const { layout, rowAt } = grid;
  const focusedCell = hasFocus ? layout.cells[focusIndex] : undefined;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d') ?? null;
    if (canvas === null || ctx === null) return;
    const frame = requestAnimationFrame(() => {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(layout.width * ratio));
      canvas.height = Math.max(1, Math.round(layout.height * ratio));
      canvas.style.width = `${String(layout.width)}px`;
      canvas.style.height = `${String(layout.height)}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      drawCells(ctx, layout, rowAt, readGridColors(canvas));
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [layout, rowAt, themeVersion]);

  const focusOn = (index: number) => {
    const cell = grid.layout.cells[index];
    if (cell === undefined) return;
    setFocusedId(cell.id);
    setLastIndex(index);
    setAnnouncement(grid.describe(index));
  };

  // Keeps the focused cell visible whenever it moves: by keyboard, or when a re-sort or filter moves the robot.
  useEffect(() => {
    const cell = hasFocus ? layout.cells[focusIndex] : undefined;
    const scroll = scrollRef.current;
    if (cell === undefined || scroll === null) return;
    const { scrollTop, clientHeight } = scroll;
    if (cell.y < scrollTop) scroll.scrollTop = cell.y - 24;
    else if (cell.y + layout.cell > scrollTop + clientHeight)
      scroll.scrollTop = cell.y + layout.cell - clientHeight + 8;
  }, [focusIndex, hasFocus, layout]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const direction = grid.directionFor(event.key);
    if (direction !== undefined) {
      event.preventDefault();
      focusOn(grid.move(focusIndex, direction));
    } else if (event.key === 'Enter') {
      const row = grid.rowAt(focusIndex);
      if (row !== undefined) onOpen(row.href);
    }
  };

  const pointAt = (event: MouseEvent<HTMLCanvasElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  };

  const hoveredRow = hovered === null ? undefined : grid.rowAt(hovered.index);

  return (
    <div className={styles.wrapper} {...holdProps}>
      <div
        ref={scrollRef}
        className={styles.scroll}
        tabIndex={0}
        role="region"
        aria-label="Robots grid, grouped by site"
        aria-describedby="robot-grid-keys"
        onKeyDown={onKeyDown}
        onFocus={() => {
          focusProps.onFocus();
          setAnnouncement(grid.describe(focusIndex));
        }}
        onBlur={(event) => {
          focusProps.onBlur(event);
          if (!event.currentTarget.contains(event.relatedTarget)) setAnnouncement('');
        }}
      >
        <div ref={contentRef} className={styles.content}>
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            aria-hidden="true"
            onClick={(event) => {
              const { x, y } = pointAt(event);
              const index = grid.hit(x, y);
              const row = index === null ? undefined : grid.rowAt(index);
              if (row !== undefined) onOpen(row.href);
            }}
            onMouseMove={(event) => {
              const { x, y } = pointAt(event);
              const index = grid.hit(x, y);
              const scroll = scrollRef.current;
              const view = {
                width: grid.layout.width,
                top: scroll?.scrollTop ?? 0,
                height: scroll?.clientHeight ?? Number.POSITIVE_INFINITY,
              };
              setHovered(index === null ? null : { index, placement: tooltipPlacement({ x, y }, view) });
            }}
          />
          {focusedCell !== undefined && (
            <div
              className={styles.focusRing}
              aria-hidden="true"
              style={{
                transform: `translate(${String(focusedCell.x - 3)}px, ${String(focusedCell.y - 3)}px)`,
                width: layout.cell + 6,
                height: layout.cell + 6,
              }}
            />
          )}
          {hovered !== null && hoveredRow !== undefined && (
            <div
              className={styles.tooltip}
              style={{
                left: hovered.placement.left,
                top: hovered.placement.top,
                transform: `translate(${hovered.placement.flipX ? '-100%' : '0'}, ${hovered.placement.flipY ? '-100%' : '0'})`,
              }}
              aria-hidden="true"
            >
              {hoveredRow.id} · {robotStatusLabel(hoveredRow.status)}
            </div>
          )}
        </div>
      </div>
      <VisuallyHidden>
        <span role="status" data-testid="robot-grid-announcement">
          {announcement}
        </span>
      </VisuallyHidden>
      <div className={styles.footer}>
        <ul className={styles.legend} aria-label="Legend">
          {legend.map((status) => (
            <li key={status} className={styles.legendItem}>
              <span className={styles.swatch} data-status={status} aria-hidden="true" />
              {robotStatusLabel(status)}
            </li>
          ))}
          <li className={styles.legendItem}>
            <span className={styles.swatch} data-stale="true" aria-hidden="true" />
            Last known
          </li>
        </ul>
        <p id="robot-grid-keys" className={styles.keys}>
          <KeyHint keys={['←', '↑', '→', '↓']} /> move · <KeyHint keys={['Enter']} /> open ·{' '}
          <KeyHint keys={['g']} /> table
        </p>
      </div>
      {notice}
    </div>
  );
}
