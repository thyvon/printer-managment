import { test, expect } from "@playwright/test";
import { registerUser, randomEmail } from "./helpers";

const user = {
  email: randomEmail(),
  password: "Test1234!",
  name: "Invoice User",
  company_name: "Invoice Co",
};

let token: string;

test.describe("Invoices", () => {
  test.beforeAll(async ({ request }) => {
    const res = await request.post("http://localhost:8000/api/register", {
      data: {
        name: user.name,
        email: user.email,
        password: user.password,
        password_confirmation: user.password,
        company_name: user.company_name,
      },
    });
    const body = await res.json();
    token = body.token;
  });

  test.beforeEach(async ({ page }) => {
    await page.evaluate((t) => localStorage.setItem("mps_token", t), token);
  });

  test("invoices page loads", async ({ page }) => {
    await page.goto("/en/invoices");
    await expect(page.getByText("Invoices")).toBeVisible();
    await expect(page.getByText("Generate invoice")).toBeVisible();
  });

  test("invoices page shows empty state", async ({ page }) => {
    await page.goto("/en/invoices");
    await expect(page.getByText("No invoices yet")).toBeVisible();
  });
});
