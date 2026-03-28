import { test, expect } from "@playwright/test";

test.describe("Image Generator Tool", () => {
  test("should load page with input and price badge", async ({ page }) => {
    await page.goto("/tools/image");
    await expect(page.getByText(/0\.005.*USDC/i)).toBeVisible();
    await expect(page.getByPlaceholder(/describe|prompt/i)).toBeVisible();
  });

  test("should show generate button", async ({ page }) => {
    await page.goto("/tools/image");
    await expect(page.getByRole("button", { name: /generate/i })).toBeVisible();
  });
});

test.describe("Text Summariser Tool", () => {
  test("should load page with textarea and mode selector", async ({ page }) => {
    await page.goto("/tools/summarise");
    await expect(page.getByText(/0\.001.*USDC/i)).toBeVisible();
    await expect(page.getByText(/Summarise|Rewrite|Bullet/i)).toBeVisible();
  });
});

test.describe("PDF Analyser Tool", () => {
  test("should load page with upload zone", async ({ page }) => {
    await page.goto("/tools/pdf");
    await expect(page.getByText(/0\.002.*USDC/i)).toBeVisible();
    await expect(page.getByText(/upload|drag|drop|PDF/i)).toBeVisible();
  });
});

test.describe("Code Generator Tool", () => {
  test("should load page with description input and language dropdown", async ({
    page,
  }) => {
    await page.goto("/tools/code");
    await expect(page.getByText(/0\.003.*USDC/i)).toBeVisible();
    // Check for language selection
    await expect(page.getByText(/JavaScript|TypeScript|Python/i)).toBeVisible();
  });
});
