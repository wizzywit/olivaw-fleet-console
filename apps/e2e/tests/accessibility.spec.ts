import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const wcagTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

// One readable line per violation, so a failure says what to fix without opening the trace.
async function violations(page: Page): Promise<string[]> {
  const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze();
  return results.violations.map(
    (violation) =>
      `${violation.id} (${violation.impact ?? 'unknown'}): ${violation.nodes
        .slice(0, 3)
        .map((node) => `${node.target.join(' ')} ${node.html.slice(0, 160)}`)
        .join(' | ')}`,
  );
}

async function firstRobotId(page: Page): Promise<string> {
  const fleet = (await (await page.request.get('http://127.0.0.1:4000/api/fleet')).json()) as {
    robots: { id: string }[];
  };
  return fleet.robots[0]?.id ?? '';
}

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`${colorScheme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ colorScheme });
    });

    test('the overview table has no WCAG violations', async ({ page }) => {
      await page.goto('/');
      await expect(page.getByRole('region', { name: 'Robots, sorted by urgency' })).toBeVisible();
      expect(await violations(page)).toEqual([]);
    });

    test('the grid view has no WCAG violations', async ({ page }) => {
      await page.goto('/?view=grid');
      await expect(page.getByRole('region', { name: 'Robots grid, grouped by site' })).toBeVisible();
      expect(await violations(page)).toEqual([]);
    });

    test('the command palette has no WCAG violations', async ({ page }) => {
      await page.goto('/');
      await expect(page.getByRole('region', { name: 'Robots, sorted by urgency' })).toBeVisible();
      await page.getByRole('button', { name: /^Open command palette/ }).click();
      await page.keyboard.type('0');
      await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeVisible();
      expect(await violations(page)).toEqual([]);
    });

    test('the robot detail has no WCAG violations', async ({ page }) => {
      const robotId = await firstRobotId(page);
      await page.goto(`/robots/${robotId}`);
      await expect(page.getByRole('heading', { level: 1, name: robotId })).toBeVisible();
      expect(await violations(page)).toEqual([]);
    });
  });
}
