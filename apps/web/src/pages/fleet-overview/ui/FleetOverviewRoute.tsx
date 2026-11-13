import { Suspense } from 'react';
import { FleetOverviewPage } from './FleetOverviewPage/FleetOverviewPage';

export function FleetOverviewRoute() {
  return (
    <Suspense>
      <FleetOverviewPage />
    </Suspense>
  );
}
