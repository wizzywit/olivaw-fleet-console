'use client';

import { StatusFilterChips } from '@/features/filter-fleet';
import { AppHeader } from '@/widgets/app-header';
import { LiveConnectionBanner } from '@/widgets/live-connection-banner';
import { Button, EmptyState, Skeleton, ToggleChipGroup } from '@/shared/ui';
import { useFleetOverview } from '../../use-cases/useFleetOverview';
import { useViewMode } from '../../use-cases/useViewMode';
import { AttentionList } from '../AttentionList/AttentionList';
import { RobotTable } from '../RobotTable/RobotTable';
import { SiteTiles } from '../SiteTiles/SiteTiles';
import styles from './FleetOverviewPage.module.css';

export function FleetOverviewPage() {
  const overview = useFleetOverview();
  const viewMode = useViewMode();
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
                <ToggleChipGroup
                  label="View"
                  items={viewMode.options}
                  selectedId={viewMode.view}
                  onChange={viewMode.selectView}
                />
                {overview.pendingChanges > 0 && (
                  <div role="status" className={styles.held}>
                    Order paused while you work · {overview.pendingChanges}{' '}
                    {overview.pendingChanges === 1 ? 'update' : 'updates'}
                    <Button variant="secondary" onPress={overview.resort}>
                      Re-sort
                    </Button>
                  </div>
                )}
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
              ) : (
                <RobotTable
                  rows={overview.rows}
                  criticalBatteryPercent={overview.criticalBatteryPercent}
                  now={overview.now}
                  onOpen={overview.openRobot}
                  onHeldChange={overview.setHeld}
                />
              )}
            </section>
          </>
        )}
      </main>
    </>
  );
}
