import { test, expect } from "@playwright/test";

test.describe("AI Assistant", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/assistant");
  });

  test("should display free badge", async ({ page }) => {
    await expect(page.getByText(/free/i)).toBeVisible();
  });

  test("should show welcome message on first load", async ({ page }) => {
    await expect(
      page.getByText(/FlashPay.*assistant|help.*decide|tool/i)
    ).toBeVisible();
  });

  test("should have chat input and send button", async ({ page }) => {
    const input = page.getByPlaceholder(/message|type|ask/i);
    await expect(input).toBeVisible();
    await expect(page.getByRole("button", { name: /send/i })).toBeVisible();
  });

  test("should not require wallet connection", async ({ page }) => {
    // The assistant is free — it should work without Freighter
    const input = page.getByPlaceholder(/message|type|ask/i);
    await input.fill("Hello, what can you do?");
    await page.getByRole("button", { name: /send/i }).click();

    // User message should appear in chat
    await expect(page.getByText("Hello, what can you do?")).toBeVisible();
  });
});
