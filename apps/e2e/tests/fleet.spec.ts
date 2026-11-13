import { expect, test, type APIRequestContext, type Page, type WebSocketRoute } from '@playwright/test';

// The console must show exactly the robots ingest serves.
const servedRobotCount = async (request: APIRequestContext) => {
  const fleet = (await (await request.get('http://127.0.0.1:4000/api/fleet')).json()) as {
    robots: unknown[];
  };
  return fleet.robots.length;
};

const liveStatus = (page: Page) =>
  page
    .getByRole('banner')
    .getByRole('status')
    .filter({ hasText: /Live|Connecting|Reconnecting|Offline/ });

test('the overview shows the live fleet', async ({ page, request }) => {
  await page.goto('/');
  await expect(liveStatus(page)).toHaveText('Live');
  await expect(page.getByRole('region', { name: 'Robots, sorted by urgency' })).toBeVisible();
  const served = await servedRobotCount(request);
  expect(served).toBeGreaterThan(250);
  await expect(page.getByRole('radio', { name: /^All/ })).toContainText(String(served));
  await expect(page.getByRole('region', { name: /Needs your attention/ }).getByRole('listitem')).toHaveCount(
    4,
  );
});

test('a robot opens from the keyboard and its detail stays live', async ({ page, request }) => {
  await page.goto('/');
  await expect(liveStatus(page)).toHaveText('Live');
  const table = page.getByRole('region', { name: 'Robots, sorted by urgency' });
  await table.focus();
  await page.keyboard.press('j');
  const announcement = page.getByTestId('robot-table-announcement');
  await expect(announcement).toContainText(`Row 2 of ${String(await servedRobotCount(request))}`);
  const robotId = /: ([A-Z]{3}-\d{4}),/.exec((await announcement.textContent()) ?? '')?.[1] ?? '';
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(new RegExp(`/robots/${robotId}$`));
  await expect(page.getByRole('heading', { level: 1, name: robotId })).toBeVisible();
  await expect(page.getByRole('img', { name: /map\. The robot is/ })).toBeVisible();
});

test('a lost connection is shown and the console recovers on its own', async ({ page }) => {
  const sockets: WebSocketRoute[] = [];
  await page.routeWebSocket(/\/live$/, (socket) => {
    socket.connectToServer();
    sockets.push(socket);
  });
  await page.goto('/');
  await expect(liveStatus(page)).toHaveText('Live');
  await sockets[0]?.close({ code: 1006, reason: 'test drops the connection' });
  await expect(liveStatus(page)).toContainText('Reconnecting');
  await expect(liveStatus(page)).toHaveText('Live', { timeout: 15_000 });
});
