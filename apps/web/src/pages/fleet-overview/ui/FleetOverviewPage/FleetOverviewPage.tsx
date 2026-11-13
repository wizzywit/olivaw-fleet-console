'use client';

import type { ReactNode } from 'react';
import { StatusFilterChips } from '@/features/filter-fleet';
import { AppHeader } from '@/widgets/app-header';
import { LiveConnectionBanner } from '@/widgets/live-connection-banner';
import { Button, EmptyState, SegmentedControl, Skeleton } from '@/shared/ui';
import { useFleetOverview } from '../../use-cases/useFleetOverview';
import { useViewMode, useViewModeShortcut } from '@/features/switch-fleet-view';
import { AttentionList } from '../AttentionList/AttentionList';
import { RobotGrid } from '../RobotGrid/RobotGrid';
import { RobotTable } from '../RobotTable/RobotTable';
import { SiteTiles } from '../SiteTiles/SiteTiles';
import styles from './FleetOverviewPage.module.css';

const viewIcons: Record<string, ReactNode> = {
  table: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="3" width="12" height="10" rx="1.5" />
      <path d="M2 6.5h12M2 10h12" />
    </svg>
  ),
  grid: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="9" y="2" width="5" height="5" rx="1" />
      <rect x="2" y="9" width="5" height="5" rx="1" />
      <rect x="9" y="9" width="5" height="5" rx="1" />
    </svg>
  ),
};

export function FleetOverviewPage() {
  const overview = useFleetOverview();
  const viewMode = useViewMode();
  useViewModeShortcut();
  // Floats over the list and its live region is always present, so the notice never pushes the list down.
  const heldNotice = (
    <div role="status" data-testid="order-held-notice" className={styles.heldSlot}>
      {overview.pendingChanges > 0 && (
        <div className={styles.held}>
          Order paused while you work · {overview.pendingChanges}{' '}
          {overview.pendingChanges === 1 ? 'update' : 'updates'}
          <Button variant="secondary" onPress={overview.resort}>
            Re-sort
          </Button>
        </div>
      )}
    </div>
  );
  return (
    <>
      <AppHeader />
      <main className={styles.main}>
        <LiveConnectionBanner />
        <h1 className={styles.title}>Fleet</h1>
        {overview.state === 'loading' && (
          <div className={styles.loading} aria-busy="true" aria-label="Loading the fleet">
            <Skeleton width="100%" height="96px" />
            <Skeleton width="100%" height="160px" />
            <Skeleton width="100%" height="320px" />
          </div>
        )}
        {overview.state === 'error' && (
          <EmptyState
            title="The fleet could not be loaded"
            description="The console could not reach the fleet service. Check that ingest is running, then try again."
            actions={<Button onPress={overview.retry}>Try again</Button>}
          />
        )}
        {overview.state === 'ready' && (
          <>
            <SiteTiles tiles={overview.siteTiles} onToggle={overview.toggleSite} />
            <AttentionList groups={overview.attentionGroups} total={overview.attentionTotal} />
            <section aria-labelledby="robots-heading" className={styles.robots}>
              <div className={styles.toolbar}>
                <h2 id="robots-heading" className={styles.subtitle}>
                  Robots
                </h2>
                <StatusFilterChips counts={overview.statusCounts} total={overview.statusTotal} />
                <div className={styles.viewSwitch}>
                  <SegmentedControl
                    label="View"
                    items={viewMode.options.map((option) => ({ ...option, icon: viewIcons[option.id] }))}
                    selectedId={viewMode.view}
                    onChange={viewMode.selectView}
                  />
                </div>
              </div>
              {overview.rows.length === 0 ? (
                <EmptyState
                  title="No robots match these filters"
                  description={`None of the ${overview.totalRobots} robots match. Remove a filter to see more.`}
                  actions={
                    overview.isFiltered ? (
                      <Button variant="secondary" onPress={overview.clearFilters}>
                        Clear filters
                      </Button>
                    ) : undefined
                  }
                />
              ) : viewMode.view === 'grid' ? (
                <RobotGrid
                  rows={overview.rows}
                  sites={overview.sites}
                  onOpen={overview.openRobot}
                  onHeldChange={overview.setHeld}
                  notice={heldNotice}
                />
              ) : (
                <RobotTable
                  rows={overview.rows}
                  criticalBatteryPercent={overview.criticalBatteryPercent}
                  now={overview.now}
                  onOpen={overview.openRobot}
                  onHeldChange={overview.setHeld}
                  describeRow={overview.describeRow}
                  lastReportLabel={overview.lastReportLabel}
                  notice={heldNotice}
                />
              )}
            </section>
          </>
        )}
      </main>
    </>
  );
}
