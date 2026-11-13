'use client';

import Link from 'next/link';
import { RobotStatusBadge, type AttentionReason } from '@/entities/robot';
import { AppHeader } from '@/widgets/app-header';
import { LiveConnectionBanner } from '@/widgets/live-connection-banner';
import { Banner, BatteryMeter, Button, EmptyState, Skeleton } from '@/shared/ui';
import { useRobotDetail, type RobotAlertView } from '../../use-cases/useRobotDetail';
import { ErrorList } from '../ErrorList/ErrorList';
import { LocationMap } from '../LocationMap/LocationMap';
import { RawMessagePanel } from '../RawMessagePanel/RawMessagePanel';
import { StateTiles } from '../StateTiles/StateTiles';
import styles from './RobotDetailPage.module.css';

const alertCopy: Record<AttentionReason, { title: string; body: (alert: RobotAlertView) => string }> = {
  'battery-critical': {
    title: 'Battery critical',
    body: (alert) => `${alert.batteryLabel} and not charging. Send it to a dock.`,
  },
  'emergency-stop': {
    title: 'Emergency stop',
    body: () => 'An emergency stop is active. Check the area, then release it on site.',
  },
  'error-reported': {
    title: 'Error reported',
    body: (alert) => alert.errorText ?? 'The robot reported an error.',
  },
  stuck: {
    title: 'Stopped with a task',
    body: (alert) =>
      `Not moving for more than 2 minutes${alert.taskId === null ? '' : ` with order ${alert.taskId}`}.`,
  },
};

export function RobotDetailPage({ robotId }: { robotId: string }) {
  const detail = useRobotDetail(robotId);
  return (
    <>
      <AppHeader />
      <main className={styles.main}>
        <LiveConnectionBanner />
        <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
          <Link href="/">Fleet</Link> / <span aria-current="page">{robotId}</span>
        </nav>
        {detail.state === 'loading' && <Skeleton width="100%" height="320px" />}
        {detail.state === 'not-found' && (
          <EmptyState
            title="Robot not found"
            description={`No robot with the id ${robotId} is reporting to this console.`}
            actions={<Link href="/">Back to the fleet</Link>}
          />
        )}
        {detail.state === 'error' && (
          <EmptyState
            title="The robot could not be loaded"
            description="The fleet service did not answer. Try again in a moment."
            actions={
              <Button variant="secondary" onPress={detail.retry}>
                Retry
              </Button>
            }
          />
        )}
        {detail.state === 'ready' && (
          <>
            <div className={styles.header}>
              <div>
                <div className={styles.titleRow}>
                  <h1 className={styles.title}>{detail.header.id}</h1>
                  <RobotStatusBadge status={detail.header.status} isStale={detail.header.isStale} />
                </div>
                <p className={styles.subtitle}>{detail.header.subtitle}</p>
              </div>
              <div className={styles.actions}>
                <Button
                  size="touch"
                  isDisabled={!detail.commands.canSend}
                  onPress={() => {
                    detail.commands.send('send-to-dock');
                  }}
                >
                  Send to dock
                </Button>
                <Button
                  size="touch"
                  variant="secondary"
                  isDisabled={!detail.commands.canSend}
                  onPress={() => {
                    detail.commands.send('pause');
                  }}
                >
                  Pause
                </Button>
              </div>
            </div>
            {/* Always rendered with a reserved line, so feedback never pushes the page down. */}
            <p role="status" data-testid="command-feedback" className={styles.feedback}>
              {detail.commands.feedback?.isError === true ? (
                <span role="alert">{detail.commands.feedback.text}</span>
              ) : (
                detail.commands.feedback?.text
              )}
            </p>
            {detail.alert !== null && (
              <Banner tone="attention" role="alert" title={alertCopy[detail.alert.reason].title}>
                {alertCopy[detail.alert.reason].body(detail.alert)}
              </Banner>
            )}
            <StateTiles
              tiles={[
                {
                  label: 'Battery',
                  value: (
                    <BatteryMeter
                      percent={detail.battery.percent}
                      criticalPercent={detail.battery.criticalPercent}
                      charging={detail.battery.charging}
                      isCritical={detail.battery.isCritical}
                      isStale={detail.header.isStale}
                    />
                  ),
                  hint: detail.battery.charging ? 'charging' : 'not charging',
                },
                ...detail.tiles,
              ]}
            />
            <div className={styles.columns}>
              {detail.locationMap !== null && <LocationMap map={detail.locationMap} />}
              <ErrorList errors={detail.errors} onRetry={detail.retryDetail} />
            </div>
            {detail.raw !== null && <RawMessagePanel raw={detail.raw} />}
          </>
        )}
      </main>
    </>
  );
}
