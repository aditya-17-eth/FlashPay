import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("should display metrics cards", async ({ page }) => {
    await expect(page.getByText(/Total Users|Users/i)).toBeVisible();
    await expect(page.getByText(/Total Runs|Runs/i)).toBeVisible();
    await expect(page.getByText(/USDC.*Volume|Volume/i)).toBeVisible();
  });

  test("should show per-tool breakdown", async ({ page }) => {
    await expect(page.getByText(/Image|Summarise|PDF|Code/i)).toBeVisible();
  });

  test("should display transaction log", async ({ page }) => {
    // Transaction table headers should be visible
    await expect(page.getByText(/Nonce|Tool|Payer|Amount|Status/i)).toBeVisible();
  });

  test("should render activity chart area", async ({ page }) => {
    // Recharts renders an SVG — check for the chart container
    const chartArea = page.locator(".recharts-wrapper, [class*=chart], svg");
    await expect(chartArea.first()).toBeVisible();
  });
});
