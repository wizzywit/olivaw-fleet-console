import type { LocationMapView } from '../../use-cases/useRobotDetail';
import styles from './LocationMap.module.css';

export function LocationMap({ map }: { map: LocationMapView }) {
  return (
    <section aria-labelledby="location-heading" className={styles.panel}>
      <h2 id="location-heading" className={styles.heading}>
        Location <span className={styles.meta}>{map.name}</span>
      </h2>
      <div role="img" aria-label={map.description} className={styles.map}>
        {map.zones.map((zone) => (
          <div
            key={zone.id}
            className={styles.zone}
            style={{
              left: `${zone.left}%`,
              top: `${zone.top}%`,
              width: `${zone.widthPercent}%`,
              height: `${zone.heightPercent}%`,
            }}
          >
            <span className={styles.zoneName}>{zone.name}</span>
          </div>
        ))}
        {map.docks.map((dock) => (
          <span
            key={dock.id}
            className={styles.dock}
            style={{ left: `${dock.left}%`, top: `${dock.top}%` }}
          />
        ))}
        <span className={styles.robot} style={{ left: `${map.robot.left}%`, top: `${map.robot.top}%` }}>
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            style={{ transform: `rotate(${map.robot.headingDeg + 90}deg)` }}
          >
            <path d="M5 1 8 8 5 6.5 2 8z" fill="currentColor" />
          </svg>
        </span>
      </div>
    </section>
  );
}
