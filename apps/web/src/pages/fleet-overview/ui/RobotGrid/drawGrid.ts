import type { RobotStatus } from '@/entities/robot';
import type { RobotRowView } from '../../use-cases/useFleetOverview';
import type { GridLayout } from '../../use-cases/useRobotGrid';

export interface GridColors {
  status: Record<RobotStatus, string>;
  surface: string;
  text: string;
  muted: string;
  focus: string;
  font: string;
}

const statusTokens: Record<RobotStatus, string> = {
  working: '--working-solid',
  charging: '--charging-solid',
  idle: '--idle-solid',
  attention: '--attention-solid',
  offline: '--offline-solid',
};

export function readGridColors(element: Element): GridColors {
  const style = getComputedStyle(element);
  const token = (name: string) => style.getPropertyValue(name).trim();
  return {
    status: {
      working: token(statusTokens.working),
      charging: token(statusTokens.charging),
      idle: token(statusTokens.idle),
      attention: token(statusTokens.attention),
      offline: token(statusTokens.offline),
    },
    surface: token('--surface'),
    text: token('--text'),
    muted: token('--text-muted'),
    focus: token('--focus-ring'),
    // Canvas cannot resolve CSS variables, so the font comes from the computed style.
    font: `600 12px ${style.fontFamily}`,
  };
}

// Every status has its own shape as well as its colour, so status never depends on colour alone.
function drawShape(ctx: CanvasRenderingContext2D, status: RobotStatus, x: number, y: number, size: number) {
  const mid = size / 2;
  ctx.beginPath();
  if (status === 'attention') {
    ctx.moveTo(x + mid, y);
    ctx.lineTo(x + size, y + size);
    ctx.lineTo(x, y + size);
    ctx.closePath();
    ctx.fill();
  } else if (status === 'charging') {
    ctx.arc(x + mid, y + mid, mid, 0, Math.PI * 2);
    ctx.fill();
  } else if (status === 'idle') {
    ctx.rect(x + size * 0.2, y + size * 0.2, size * 0.6, size * 0.6);
    ctx.fill();
  } else if (status === 'offline') {
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
  } else {
    ctx.rect(x, y, size, size);
    ctx.fill();
  }
}

function drawHatch(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath();
  for (let offset = -size; offset < size; offset += 4) {
    ctx.moveTo(x + Math.max(0, offset), y + Math.max(0, -offset));
    ctx.lineTo(x + Math.min(size, size + offset), y + Math.min(size, size - offset));
  }
  ctx.stroke();
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  layout: GridLayout,
  rowAt: (index: number) => RobotRowView | undefined,
  colors: GridColors,
  focusIndex: number | null,
) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.font = colors.font;
  ctx.textBaseline = 'top';
  for (const section of layout.sections) {
    ctx.fillStyle = colors.text;
    ctx.fillText(`${section.name} · ${String(section.count)}`, 0, section.y + 4);
  }
  for (const cell of layout.cells) {
    const row = rowAt(cell.index);
    if (row === undefined) continue;
    ctx.fillStyle = colors.status[row.status];
    ctx.strokeStyle = colors.status[row.status];
    drawShape(ctx, row.status, cell.x, cell.y, layout.cell);
    if (row.isStale) {
      ctx.strokeStyle = colors.muted;
      ctx.lineWidth = 1;
      drawHatch(ctx, cell.x, cell.y, layout.cell);
    }
  }
  const focused = focusIndex === null ? undefined : layout.cells[focusIndex];
  if (focused !== undefined) {
    ctx.strokeStyle = colors.focus;
    ctx.lineWidth = 2;
    ctx.strokeRect(focused.x - 2, focused.y - 2, layout.cell + 4, layout.cell + 4);
  }
}
