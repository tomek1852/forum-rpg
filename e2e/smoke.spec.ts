import { expect, test } from "@playwright/test";

test("homepage exposes authentication calls to action", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: /konto/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /zaloguj/i })).toBeVisible();
});
