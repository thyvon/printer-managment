import { test, expect } from "@playwright/test";
import { registerUser, randomEmail } from "./helpers";

const user = {
  email: randomEmail(),
  password: "Test1234!",
  name: "Settings User",
  company_name: "Settings Co",
};

let token: string;

test.describe("Settings", () => {
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

  test("settings page loads with profile and password forms", async ({ page }) => {
    await page.goto("/en/settings");
    await expect(page.getByText("Profile")).toBeVisible();
    await expect(page.getByText("Password")).toBeVisible();
  });

  test("profile form shows current user data", async ({ page }) => {
    await page.goto("/en/settings");
    await expect(page.getByLabel("Name")).toHaveValue("Settings User");
    await expect(page.getByLabel("Email")).toHaveValue(user.email);
  });

  test("update profile name", async ({ page }) => {
    await page.goto("/en/settings");
    await page.getByLabel("Name").clear();
    await page.getByLabel("Name").fill("Updated Name");
    await page.getByRole("button", { name: /save/i }).first().click();

    await expect(page.getByText("Profile updated successfully")).toBeVisible();
  });

  test("change password", async ({ page }) => {
    await page.goto("/en/settings");

    await page.getByLabel("Current Password").fill(user.password);
    await page.getByLabel("New Password").fill("NewPass123!");
    await page.getByLabel("Confirm Password").fill("NewPass123!");
    await page.getByRole("button", { name: /save/i }).last().click();

    await expect(page.getByText("Password changed successfully")).toBeVisible();
  });
});
