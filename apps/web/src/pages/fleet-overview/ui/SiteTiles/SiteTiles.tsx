import type { RobotStatus } from '@/entities/robot';
import { StatTile } from '@/shared/ui';
import type { SiteTileView } from '../../use-cases/useFleetOverview';
import styles from './SiteTiles.module.css';

const segments: RobotStatus[] = ['working', 'charging', 'idle', 'attention', 'offline'];

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
          isPressed={tile.isSelected}
          onPress={() => {
            onToggle(tile.id);
          }}
          visual={
            <span className={styles.bar} aria-hidden="true">
              {segments.map((status) => (
                <span key={status} className={styles[status]} style={{ flexGrow: tile.counts[status] }} />
              ))}
            </span>
          }
        />
      ))}
    </section>
  );
}
