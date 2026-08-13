import { test, expect } from "@playwright/test";

test("home page renders bilingual content", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByText("Printer MPS")).toBeVisible();
});