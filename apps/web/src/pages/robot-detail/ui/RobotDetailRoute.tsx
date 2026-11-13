import { Suspense } from 'react';
import { RobotDetailPage } from './RobotDetailPage/RobotDetailPage';

export async function RobotDetailRoute({ params }: { params: Promise<{ robotId: string }> }) {
  const { robotId } = await params;
  return (
    <Suspense>
      <RobotDetailPage robotId={decodeURIComponent(robotId)} />
    </Suspense>
  );
}
