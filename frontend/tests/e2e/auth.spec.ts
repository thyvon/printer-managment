import { test, expect } from "@playwright/test";
import { registerUser, setToken, randomEmail } from "./helpers";

const user: { email: string; password: string; name: string; company_name: string; token?: string } = {
  email: randomEmail(),
  password: "Test1234!",
  name: "E2E User",
  company_name: "E2E Company",
};

test.describe("Authentication", () => {
  test("register creates account and redirects to dashboard", async ({ page }) => {
    await registerUser(page, user);
    await setToken(page, user.token!);

    await page.goto("/en/dashboard");
    await expect(page.getByText("E2E Company")).toBeVisible();
    await expect(page.getByText("Dashboard")).toBeVisible();
  });

  test("login with valid credentials", async ({ page }) => {
    await page.goto("/en/login");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();

    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Password").fill(user.password);
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText("E2E Company")).toBeVisible();
  });

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/en/login");
    await page.getByLabel("Email").fill("wrong@example.com");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByText(/incorrect/i)).toBeVisible();
  });

  test("logout clears session and redirects to login", async ({ page }) => {
    await page.goto("/en/login");
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Password").fill(user.password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.getByRole("button", { name: /log out/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/en/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
