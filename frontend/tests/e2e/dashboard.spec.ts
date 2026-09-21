import { test, expect } from "@playwright/test";
import { registerUser, randomEmail } from "./helpers";

const user = {
  email: randomEmail(),
  password: "Test1234!",
  name: "Dashboard User",
  company_name: "Dashboard Co",
};

let token: string;

test.describe("Dashboard", () => {
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

  test("dashboard loads with stat cards", async ({ page }) => {
    await page.goto("/en/dashboard");
    await expect(page.getByText("Dashboard")).toBeVisible();
    await expect(page.getByText("Customers")).toBeVisible();
    await expect(page.getByText("Sites")).toBeVisible();
    await expect(page.getByText("Printers")).toBeVisible();
    await expect(page.getByText("Active contracts")).toBeVisible();
  });

  test("dashboard shows usage trend chart", async ({ page }) => {
    await page.goto("/en/dashboard");
    await expect(page.getByText("Usage trend")).toBeVisible();
  });

  test("dashboard shows billing summary", async ({ page }) => {
    await page.goto("/en/dashboard");
    await expect(page.getByText("Billed this month")).toBeVisible();
  });

  test("dashboard shows low stock toners widget", async ({ page }) => {
    await page.goto("/en/dashboard");
    await expect(page.getByText("Low Stock Toners")).toBeVisible();
  });

  test("dashboard shows open tickets widget", async ({ page }) => {
    await page.goto("/en/dashboard");
    await expect(page.getByText("Open Tickets")).toBeVisible();
  });
});
