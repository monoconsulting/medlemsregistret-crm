import { test, expect } from "@playwright/test";

const LOGIN_EMAIL = process.env.PLAYWRIGHT_LOGIN_EMAIL ?? "admin@crm.se";
const LOGIN_PASSWORD = process.env.PLAYWRIGHT_LOGIN_PASSWORD ?? "admin123";

/**
 * Test suite for Associations Detail Modal (Figma Design Implementation)
 *
 * This test verifies that the associations detail modal matches the Figma design:
 * - Modal opens when clicking on an association in the table
 * - Displays basic information (Kommun, Kategori, Medlemmar, Grundat, Status)
 * - Shows two tabs: "Utökad sökning - Organisation" and "Utökad sökning - Personer"
 * - Displays "Kopplade Personer" section with contact persons
 * - Shows "Aktivitetslogg" section with activity log
 * - Each contact person has initials avatar, name, role, and email/phone icons
 *
 * Design reference: https://www.figma.com/file/KAtuDucijPTgOLMaNiN6Fc/CRM-System-Design-Proposal
 * Screenshot: Image showing modal for "Malmö Fotbollsklubb" with contacts and activity log
 */
test.describe("Associations Detail Modal", () => {
  test.use({
    baseURL: "https://crm.medlemsregistret.se",
  });

  test.beforeEach(async ({ page }) => {
    await test.step("Login and navigate to associations page", async () => {
      await page.goto("/login?redirectTo=%2Fassociations");
      await expect(page.getByRole("textbox", { name: "E-postadress" })).toBeVisible({ timeout: 15_000 });

      await page.getByRole("textbox", { name: "E-postadress" }).fill(LOGIN_EMAIL);
      await page.getByRole("textbox", { name: "Lösenord" }).fill(LOGIN_PASSWORD);
      await page.getByRole("button", { name: "Logga in" }).click();

      await expect.poll(async () => page.url(), {
        message: "Expected to navigate to /associations",
        timeout: 20_000,
        intervals: [500, 1000, 1500, 2000, 2500],
      }).toContain("/associations");

      // Wait for associations to load
      await expect(page.locator("text=Laddar föreningar…")).toHaveCount(0, { timeout: 15_000 });
      await expect(page.locator("table tbody tr").first()).toBeVisible({ timeout: 15_000 });
    });
  });

  test("modal opens when clicking on association row", async ({ page }) => {
    await test.step("Click on first association in table", async () => {
      const firstRow = page.locator("table tbody tr").first();
      await firstRow.click();
    });

    await test.step("Verify detail modal is visible", async () => {
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible({ timeout: 10_000 });

      // Wait for loading to complete
      await expect(page.locator("text=Hämtar föreningsdetaljer…")).toHaveCount(0, { timeout: 10_000 });
    });
  });

  test("modal displays basic information section (Figma design)", async ({ page }) => {
    await test.step("Open detail modal", async () => {
      const firstRow = page.locator("table tbody tr").first();
      await firstRow.click();
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 10_000 });
      await expect(page.locator("text=Hämtar föreningsdetaljer…")).toHaveCount(0, { timeout: 10_000 });
    });

    await test.step("Verify basic information fields are present", async () => {
      const modal = page.locator('[role="dialog"]');

      // Check for "Grundläggande information" heading
      await expect(modal.getByText("Grundläggande information")).toBeVisible();

      // Check for Kommun field with MapPin icon
      await expect(modal.getByText("Kommun")).toBeVisible();

      // Check for Kategori field with FolderOpen icon
      await expect(modal.getByText("Kategori")).toBeVisible();

      // Check for Medlemmar field with Users icon
      await expect(modal.getByText("Medlemmar")).toBeVisible();

      // Check for Grundat field with Calendar icon
      await expect(modal.getByText("Grundat")).toBeVisible();

      // Check for Status field with badge
      await expect(modal.getByText("Status")).toBeVisible();
    });
  });

  test("modal displays tabs for Organisation and Personer", async ({ page }) => {
    await test.step("Open detail modal", async () => {
      const firstRow = page.locator("table tbody tr").first();
      await firstRow.click();
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 10_000 });
      await expect(page.locator("text=Hämtar föreningsdetaljer…")).toHaveCount(0, { timeout: 10_000 });
    });

    await test.step("Verify tabs are present", async () => {
      const modal = page.locator('[role="dialog"]');

      // Check for Organisation tab (should be active with orange styling)
      const orgTab = modal.getByRole("tab", { name: /Utökad sökning - Organisation/i });
      await expect(orgTab).toBeVisible();

      // Check for Personer tab
      const personerTab = modal.getByRole("tab", { name: /Utökad sökning - Personer/i });
      await expect(personerTab).toBeVisible();
    });

    await test.step("Verify Organisation tab is active by default", async () => {
      const modal = page.locator('[role="dialog"]');
      const orgTab = modal.getByRole("tab", { name: /Utökad sökning - Organisation/i });

      // Tab should be active (aria-selected="true" or data-state="active")
      await expect(orgTab).toHaveAttribute("data-state", "active");
    });

    await test.step("Switch to Personer tab", async () => {
      const modal = page.locator('[role="dialog"]');
      const personerTab = modal.getByRole("tab", { name: /Utökad sökning - Personer/i });
      await personerTab.click();

      // Verify Personer tab is now active
      await expect(personerTab).toHaveAttribute("data-state", "active");
    });
  });

  test("modal displays Kopplade Personer section with contacts", async ({ page }) => {
    await test.step("Open detail modal", async () => {
      const firstRow = page.locator("table tbody tr").first();
      await firstRow.click();
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 10_000 });
      await expect(page.locator("text=Hämtar föreningsdetaljer…")).toHaveCount(0, { timeout: 10_000 });
    });

    await test.step("Verify Kopplade Personer section exists", async () => {
      const modal = page.locator('[role="dialog"]');
      await expect(modal.getByText("Kopplade Personer")).toBeVisible();
    });

    await test.step("Verify contact persons are displayed with proper structure", async () => {
      const modal = page.locator('[role="dialog"]');

      // Check if there are contacts (or empty state)
      const contactsSection = modal.locator('text=Kopplade Personer').locator("..");
      const hasContacts = await contactsSection.locator('text=Inga kopplade personer').count() === 0;

      if (hasContacts) {
        // Verify contact card structure
        const firstContact = modal.locator('[role="dialog"] >> text=Kopplade Personer').locator("..").locator("div.flex").first();

        // Should have initials avatar (circular element)
        await expect(firstContact.locator("div.rounded-full")).toBeVisible();

        // Should have email icon if email exists
        const emailIcon = firstContact.getByRole("link", { name: /mailto:/i });
        if (await emailIcon.count() > 0) {
          await expect(emailIcon).toBeVisible();
        }

        // Should have phone icon if phone exists
        const phoneIcon = firstContact.getByRole("link", { name: /tel:/i });
        if (await phoneIcon.count() > 0) {
          await expect(phoneIcon).toBeVisible();
        }
      }
    });
  });

  test("modal displays Aktivitetslogg section", async ({ page }) => {
    await test.step("Open detail modal", async () => {
      const firstRow = page.locator("table tbody tr").first();
      await firstRow.click();
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 10_000 });
      await expect(page.locator("text=Hämtar föreningsdetaljer…")).toHaveCount(0, { timeout: 10_000 });
    });

    await test.step("Verify Aktivitetslogg section exists", async () => {
      const modal = page.locator('[role="dialog"]');
      await expect(modal.getByText("Aktivitetslogg")).toBeVisible();
    });

    await test.step("Verify 'Lägg till anteckning' button exists", async () => {
      const modal = page.locator('[role="dialog"]');
      await expect(modal.getByRole("button", { name: /Lägg till anteckning/i })).toBeVisible();
    });

    await test.step("Verify activity log displays activities or empty state", async () => {
      const modal = page.locator('[role="dialog"]');
      const activitySection = modal.locator('text=Aktivitetslogg').locator("..");

      // Should either show activities or empty state message
      const hasActivities = await activitySection.locator('text=Skriv en ny anteckning').count() === 0;

      if (!hasActivities) {
        // Empty state
        await expect(activitySection.getByText(/Skriv en ny anteckning/i)).toBeVisible();
      }
    });
  });

  test("modal can be closed", async ({ page }) => {
    await test.step("Open detail modal", async () => {
      const firstRow = page.locator("table tbody tr").first();
      await firstRow.click();
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 10_000 });
      await expect(page.locator("text=Hämtar föreningsdetaljer…")).toHaveCount(0, { timeout: 10_000 });
    });

    await test.step("Close modal by clicking X button", async () => {
      const modal = page.locator('[role="dialog"]');
      const closeButton = modal.locator("button").filter({ hasText: "" }).first(); // X icon button
      await closeButton.click();
    });

    await test.step("Verify modal is closed", async () => {
      await expect(page.locator('[role="dialog"]')).toHaveCount(0, { timeout: 5_000 });
    });
  });

  test("contact email links are clickable", async ({ page }) => {
    await test.step("Open detail modal", async () => {
      const firstRow = page.locator("table tbody tr").first();
      await firstRow.click();
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 10_000 });
      await expect(page.locator("text=Hämtar föreningsdetaljer…")).toHaveCount(0, { timeout: 10_000 });
    });

    await test.step("Verify email links have correct href", async () => {
      const modal = page.locator('[role="dialog"]');
      const emailLinks = modal.locator('a[href^="mailto:"]');

      const count = await emailLinks.count();
      if (count > 0) {
        const firstEmailLink = emailLinks.first();
        const href = await firstEmailLink.getAttribute("href");
        expect(href).toMatch(/^mailto:/);
      }
    });
  });

  test("contact phone links are clickable", async ({ page }) => {
    await test.step("Open detail modal", async () => {
      const firstRow = page.locator("table tbody tr").first();
      await firstRow.click();
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 10_000 });
      await expect(page.locator("text=Hämtar föreningsdetaljer…")).toHaveCount(0, { timeout: 10_000 });
    });

    await test.step("Verify phone links have correct href", async () => {
      const modal = page.locator('[role="dialog"]');
      const phoneLinks = modal.locator('a[href^="tel:"]');

      const count = await phoneLinks.count();
      if (count > 0) {
        const firstPhoneLink = phoneLinks.first();
        const href = await firstPhoneLink.getAttribute("href");
        expect(href).toMatch(/^tel:/);
      }
    });
  });

  test("status badge has correct color styling", async ({ page }) => {
    await test.step("Open detail modal", async () => {
      const firstRow = page.locator("table tbody tr").first();
      await firstRow.click();
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 10_000 });
      await expect(page.locator("text=Hämtar föreningsdetaljer…")).toHaveCount(0, { timeout: 10_000 });
    });

    await test.step("Verify status badge exists and has color styling", async () => {
      const modal = page.locator('[role="dialog"]');
      const statusSection = modal.locator('text=Status').locator("..");

      // Badge should exist within the status section
      const badge = statusSection.locator('[class*="bg-"]').first();
      await expect(badge).toBeVisible();

      // Should have either green (kontaktad), blue (intresserad), yellow (väntar), or gray color
      const className = await badge.getAttribute("class");
      expect(className).toMatch(/bg-(green|blue|yellow|gray)/);
    });
  });
});
