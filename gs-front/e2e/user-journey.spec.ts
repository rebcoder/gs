import { test, expect, APIRequestContext, Page } from '@playwright/test';

/**
 * Full user-journey E2E test: buyer registers, browses, books an appointment; seller logs in,
 * creates a sale, sees it listed, and updates their profile.
 *
 * Requires the backend running locally first (`docker compose up -d gs-back` from the repo root, or
 * `cd gs-back && ./mvnw spring-boot:run`) - see e2e/README.md.
 *
 * Each describe block shares one page/browser context across its tests (rather than Playwright's
 * default fresh-context-per-test) so the login established in an early step carries through the rest
 * of that journey, the same way a real user's session would.
 */

const API_BASE = 'http://localhost:8081';
const rand = () => Math.floor(Math.random() * 1_000_000);

async function seedDemoData(request: APIRequestContext) {
  await request.post(`${API_BASE}/api/test/seed-demo`);
}

async function getFirstSaleId(request: APIRequestContext): Promise<number> {
  const res = await request.get(`${API_BASE}/api/garage-sales`);
  const sales = await res.json();
  expect(sales.length).toBeGreaterThan(0);
  return sales[0].id;
}

// Seed once, before either journey, rather than per-describe-block - re-seeding mid-run raced with
// the buyer journey's own requests when each block seeded independently (Playwright doesn't
// guarantee a later describe block's beforeAll waits for an earlier block's tests to fully finish).
test.beforeAll(async ({ request }) => {
  await seedDemoData(request);
});

test.describe('Buyer journey', () => {
  const suffix = rand();
  const email = `e2ebuyer${suffix}@example.com`;
  const password = 'TestPass123!';
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('register a new buyer account (and get logged in)', async () => {
    await page.goto('/register');
    await page.fill('input[formcontrolname="firstName"]', 'E2E');
    await page.fill('input[formcontrolname="lastName"]', 'Buyer');
    await page.fill('input[formcontrolname="email"]', email);
    await page.fill('input[formcontrolname="phone"]', '+15550001234');
    await page.fill('input[formcontrolname="password"]', password);
    await page.fill('input[formcontrolname="confirmPassword"]', password);
    await page.locator('mat-checkbox').click();
    await page.locator('button.register-button').click();
    // Registration logs the user in immediately and redirects to /browse.
    await expect(page).toHaveURL(/\/browse/, { timeout: 10_000 });
    await expect(page.getByRole('button', { name: 'Profile' })).toBeVisible({ timeout: 10_000 });
  });

  test('browse sales and open a sale detail', async ({ request }) => {
    const saleId = await getFirstSaleId(request);
    await page.goto('/browse');
    await expect(page.getByText('Demo Garage Sale').first()).toBeVisible({ timeout: 10_000 });

    await page.goto(`/sale/${saleId}`);
    await expect(page.getByRole('heading', { name: 'Vintage Lamp' })).toBeVisible({ timeout: 10_000 });
  });

  test('book an appointment', async ({ request }) => {
    const saleId = await getFirstSaleId(request);
    const saleRes = await request.get(`${API_BASE}/api/garage-sales/${saleId}`);
    const sale = await saleRes.json();

    await page.goto(`/sale/${saleId}`);
    await page.locator('button:has-text("Book a Time Slot")').click();

    const date = new Date(sale.saleDate);
    const dateStr = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
    await page.fill('input[formcontrolname="preferredDate"]', dateStr);
    // Deliberately not pressing Escape here: typing into the datepicker-bound input doesn't open its
    // calendar overlay (only the toggle icon does), so Escape has nothing to dismiss - it instead
    // closes the enclosing MatDialog itself, which took a while to figure out.

    // Selecting a date triggers an async slot-availability check that re-renders the slot list, so
    // a click immediately on first-visible can hit a node that gets detached mid-click. Wait for that
    // re-render to settle before interacting.
    const slotButtons = page.locator('.slot-button');
    await expect(slotButtons.first()).toBeVisible({ timeout: 10_000 });
    await page.waitForLoadState('networkidle');
    await slotButtons.first().click({ timeout: 10_000 });

    const submit = page.locator('button:has-text("Confirm Booking"), button:has-text("Book"), button:has-text("Submit")').last();
    await submit.click();

    // On success the app itself navigates to /appointments (see book-appointment-dialog.component.ts)
    // - wait for that rather than racing it with our own page.goto in the next test.
    await expect(page).toHaveURL(/\/appointments/, { timeout: 10_000 });
  });

  test('see the booking under My Appointments', async () => {
    // Already on /appointments from the previous step's post-booking redirect - re-asserting the URL
    // (rather than re-navigating) avoids racing the app's own in-flight navigation from that redirect.
    await expect(page).toHaveURL(/\/appointments/);
    await expect(page.getByText('Demo Garage Sale').first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Seller journey', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('log in as the demo seller', async () => {
    await page.goto('/login');
    await page.fill('input[formcontrolname="username"]', 'demo_user');
    await page.fill('input[formcontrolname="password"]', 'demo123');
    await page.locator('button:has-text("SIGN IN")').click();
    await expect(page.getByRole('button', { name: 'Profile' })).toBeVisible({ timeout: 10_000 });
  });

  test('create a new sale', async () => {
    const saleName = `E2E Test Sale ${rand()}`;
    await page.goto('/create-sale');
    await page.fill('input[formcontrolname="saleName"]', saleName);
    await page.fill('textarea[formcontrolname="description"]', 'Created by the automated E2E suite');
    await page.fill('input[formcontrolname="saleDate"]', '2026-09-20');
    await page.fill('input[formcontrolname="startTime"]', '10:00');
    await page.fill('input[formcontrolname="endTime"]', '15:00');
    await page.fill('input[formcontrolname="city"]', 'TestCity');
    await page.fill('input[formcontrolname="area"]', 'TestArea');
    await page.locator('button:has-text("Create Sale")').click();
    await page.waitForTimeout(1500);

    await page.goto('/my-sales');
    await expect(page.getByText(saleName)).toBeVisible({ timeout: 10_000 });
  });

  test('update profile', async () => {
    await page.goto('/profile');
    await page.locator('textarea').first().fill('Updated by the automated E2E suite');
    await page.locator('button:has-text("Save Changes")').click();
    await page.waitForTimeout(1000);
  });
});
