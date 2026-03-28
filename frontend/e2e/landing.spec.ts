import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display FlashPay branding and hero section", async ({ page }) => {
    await expect(page.locator("h1")).toContainText(/FlashPay/i);
    await expect(page).toHaveTitle(/FlashPay/i);
  });

  test("should show all 4 tool cards", async ({ page }) => {
    await expect(page.getByText(/Image Generator/i)).toBeVisible();
    await expect(page.getByText(/Text Summariser/i)).toBeVisible();
    await expect(page.getByText(/PDF Analyser/i)).toBeVisible();
    await expect(page.getByText(/Code Generator/i)).toBeVisible();
  });

  test("should show wallet connect button", async ({ page }) => {
    await expect(page.getByText(/Connect.*Wallet/i)).toBeVisible();
  });

  test("should show price badges on tool cards", async ({ page }) => {
    await expect(page.getByText(/0\.005.*USDC/i)).toBeVisible();
    await expect(page.getByText(/0\.001.*USDC/i)).toBeVisible();
    await expect(page.getByText(/0\.002.*USDC/i)).toBeVisible();
    await expect(page.getByText(/0\.003.*USDC/i)).toBeVisible();
  });

  test("should navigate to tool pages from cards", async ({ page }) => {
    await page.getByText(/Image Generator/i).click();
    await expect(page).toHaveURL(/tools\/image/);
  });
});
