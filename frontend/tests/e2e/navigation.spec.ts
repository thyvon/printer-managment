import { test, expect } from "@playwright/test";
import { registerUser, setToken, randomEmail } from "./helpers";

const user = {
  email: randomEmail(),
  password: "Test1234!",
  name: "Nav User",
  company_name: "Nav Company",
};

test.beforeAll(async () => {
  // Register will be done per test via API
});

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    const res = await page.request.post("http://localhost:8000/api/register", {
      data: {
        name: user.name,
        email: user.email,
        password: user.password,
        password_confirmation: user.password,
        company_name: user.company_name,
      },
    });
    const body = await res.json();
    await page.evaluate((t) => localStorage.setItem("mps_token", t), body.token);
  });

  const navPages = [
    { name: "Dashboard", url: "/dashboard" },
    { name: "Customers", url: "/customers" },
    { name: "Contacts", url: "/contacts" },
    { name: "Sites", url: "/sites" },
    { name: "Printers", url: "/printers" },
    { name: "Collectors", url: "/collectors" },
    { name: "Maintenance", url: "/maintenance" },
    { name: "Toners", url: "/toners" },
    { name: "Contracts", url: "/contracts" },
    { name: "Invoices", url: "/invoices" },
    { name: "Usage", url: "/usages" },
    { name: "Reports", url: "/reports" },
  ];

  for (const nav of navPages) {
    test(`sidebar link navigates to ${nav.name}`, async ({ page }) => {
      await page.goto("/en/dashboard");
      await page.getByRole("link", { name: nav.name }).first().click();
      await expect(page).toHaveURL(new RegExp(`/en${nav.url}`));
    });
  }

  test("settings page is accessible", async ({ page }) => {
    await page.goto("/en/settings");
    await expect(page.getByText("Settings")).toBeVisible();
  });

  test("locale switcher changes language", async ({ page }) => {
    await page.goto("/en/dashboard");
    const switcher = page.getByRole("combobox");
    await switcher.click();
    await page.getByRole("option", { name: /ភាសាខ្មែរ/i }).click();
    await expect(page).toHaveURL(/\/km\//);
  });
});
