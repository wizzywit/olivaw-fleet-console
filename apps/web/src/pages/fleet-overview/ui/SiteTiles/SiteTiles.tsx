import { StatTile } from '@/shared/ui';
import type { SiteTileView } from '../../use-cases/useFleetOverview';
import styles from './SiteTiles.module.css';

export function SiteTiles({
  tiles,
  onToggle,
}: {
  tiles: SiteTileView[];
  onToggle: (siteId: string) => void;
}) {
  return (
    <section aria-label="Sites" className={styles.tiles}>
      {tiles.map((tile) => (
        <StatTile
          key={tile.id}
          label={tile.name}
          value={tile.totalLabel}
          detail={tile.detail}
          description={tile.description}
          isPressed={tile.isSelected}
          onPress={() => {
            onToggle(tile.id);
          }}
          visual={
            <span className={styles.bar} aria-hidden="true">
              {tile.breakdown.map((entry) => (
                <span key={entry.status} className={styles[entry.status]} style={{ flexGrow: entry.count }} />
              ))}
            </span>
          }
          tooltip={
            <ul className={styles.breakdown} aria-hidden="true">
              {tile.breakdown.map((entry) => (
                <li key={entry.status} className={styles.breakdownRow}>
                  <span className={styles[entry.status]} data-swatch="true" />
                  <span className={styles.breakdownLabel}>{entry.label}</span>
                  <span className={styles.breakdownCount}>{entry.countLabel}</span>
                  <span className={styles.breakdownPercent}>{entry.percentLabel}</span>
                </li>
              ))}
            </ul>
          }
        />
      ))}
    </section>
  );
}
