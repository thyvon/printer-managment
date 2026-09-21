import { test, expect } from "@playwright/test";
import { registerUser, setToken, randomEmail } from "./helpers";

const user = {
  email: randomEmail(),
  password: "Test1234!",
  name: "CRUD User",
  company_name: "CRUD Company",
};

let token: string;

test.describe("Customer CRUD", () => {
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

  test("customers page loads with empty state", async ({ page }) => {
    await page.goto("/en/customers");
    await expect(page.getByText("Customers")).toBeVisible();
    await expect(page.getByText("New customer")).toBeVisible();
  });

  test("create a new customer", async ({ page }) => {
    await page.goto("/en/customers");
    await page.getByRole("button", { name: /new customer/i }).click();

    await page.getByLabel("Name").fill("Acme Corp");
    await page.getByLabel("Email").fill("acme@example.com");
    await page.getByLabel("Phone").fill("+85512345678");
    await page.getByLabel("Address").fill("123 Main St, Phnom Penh");

    await page.getByRole("button", { name: /save/i }).click();

    await expect(page.getByText("Acme Corp")).toBeVisible();
    await expect(page.getByText("acme@example.com")).toBeVisible();
  });

  test("edit an existing customer", async ({ page }) => {
    await page.goto("/en/customers");

    const row = page.getByRole("row").filter({ hasText: "Acme Corp" });
    await row.getByRole("button", { name: /edit/i }).click();

    await page.getByLabel("Name").clear();
    await page.getByLabel("Name").fill("Acme Corporation");
    await page.getByRole("button", { name: /save/i }).click();

    await expect(page.getByText("Acme Corporation")).toBeVisible();
  });

  test("delete a customer", async ({ page }) => {
    await page.goto("/en/customers");

    const row = page.getByRole("row").filter({ hasText: "Acme Corporation" });
    await row.getByRole("button", { name: /delete/i }).click();

    await page.getByRole("button", { name: /delete/i }).last().click();

    await expect(page.getByText("Acme Corporation")).not.toBeVisible();
  });
});
