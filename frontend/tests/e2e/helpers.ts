import { test as base, expect, type Page } from "@playwright/test";

const API_URL = process.env.API_URL ?? "http://localhost:8000/api";

type TestUser = {
  email: string;
  password: string;
  name: string;
  company_name: string;
  token?: string;
};

export async function registerUser(page: Page, user: TestUser): Promise<void> {
  const res = await page.request.post(`${API_URL}/register`, {
    data: {
      name: user.name,
      email: user.email,
      password: user.password,
      password_confirmation: user.password,
      company_name: user.company_name,
    },
  });
  const body = await res.json();
  user.token = body.token;
}

export async function loginUser(page: Page, user: TestUser): Promise<void> {
  const res = await page.request.post(`${API_URL}/login`, {
    data: { email: user.email, password: user.password },
  });
  const body = await res.json();
  user.token = body.token;
}

export async function setToken(page: Page, token: string): Promise<void> {
  await page.evaluate((t) => localStorage.setItem("mps_token", t), token);
}

export function randomEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@e2e.test`;
}
