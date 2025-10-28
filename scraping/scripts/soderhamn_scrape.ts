import { chromium, Browser, Page } from "playwright";
import type { Locator } from "playwright";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";
import {
  getScrapingPaths,
  createLogger,
  runDatabaseImport,
} from "../utils/scraper-base";
import { sanitizeForValidation } from "../utils/sanitize";

const SOURCE_SYSTEM = "RBOK";
const MUNICIPALITY_NAME = "S\u00F6derhamn";
const MUNICIPALITY_SLUG = "Soderhamn";
const BASE_URL = "https://soderhamn.rbok.se/foreningsregister";
const SCRAPE_RUN_ID = uuidv4();
const SCRAPED_AT = new Date().toISOString();

const paths = getScrapingPaths(MUNICIPALITY_SLUG, SOURCE_SYSTEM);
const OUTPUT_DIR = paths.outputDir;
const JSON_PATH = paths.jsonPath;
const LOG_PATH = paths.logPath;

const logger = createLogger(LOG_PATH);
const log = (message: string) => logger.info(message);

let totalAssociations = 0;
let missingOrgNumber = 0;
let missingContacts = 0;
const homepageDomains = new Set<string>();

interface DescriptionSection {
  title: string;
  data: Record<string, string | number | boolean | string[] | null>;
}

interface AssociationDescription {
  free_text: string | null;
  sections: DescriptionSection[];
}

type ContactRecord = {
  contact_person_name: string | null;
  contact_person_role: string | null;
  contact_person_email: string | null;
  contact_person_phone: string | null;
};

interface AssociationRecord {
  source_system: string;
  municipality: string;
  scrape_run_id: string;
  scraped_at: string;
  association: {
    name: string;
    org_number: string | null;
    types: string[];
    activities: string[];
    categories: string[];
    homepage_url: string | null;
    detail_url: string;
    street_address: string | null;
    postal_code: string | null;
    city: string | null;
    email: string | null;
    phone: string | null;
    description: AssociationDescription | null;
  };
  contacts: ContactRecord[];
  source_navigation: {
    list_page_index: number;
    position_on_page: number;
    pagination_model: string;
    filter_state: any;
  };
  extras: Record<string, any>;
}

interface ModalExtractionResult {
  description: AssociationDescription | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  orgNumber: string | null;
  homepage: string | null;
  categories: string[];
  activities: string[];
  targetGroups: string[];
  contacts: ContactRecord[];
  extras: Record<string, any>;
}

function normalizeString(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeArray(values: (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const normalized = normalizeString(value);
    if (!normalized) continue;
    const lower = normalized.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    result.push(normalized);
  }
  return result;
}

function extractDomain(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return null;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay(min: number = 200, max: number = 600): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return delay(ms);
}

function splitEmails(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[,;\s]+/)
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0 && email.includes("@"));
}

function parseList(lines: string[]): string[] {
  return normalizeArray(
    lines
      .flatMap((line) => line.split(/[,;\u2022\u2023\u25E6\u2043\u2219]/))
      .map((entry) => entry.replace(/^[\-–•·]\s*/, ""))
  );
}

function normalizePostalCode(raw: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 5) {
    return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  }
  return raw.trim();
}

function sanitizePhone(raw: string | null): string | null {
  if (!raw) return null;
  const stripped = raw.replace(/[^0-9+]/g, "");
  return stripped.length > 0 ? stripped : null;
}

async function waitForModalToDisappear(page: Page, modal: Locator): Promise<boolean> {
  const timeoutAt = Date.now() + 5000;
  while (Date.now() < timeoutAt) {
    const visible = await modal.isVisible().catch(() => false);
    const bodyHasModal = await page
      .evaluate(() => document.body.classList.contains("modal-open"))
      .catch(() => false);
    if (!visible && !bodyHasModal) {
      await delay(100);
      return true;
    }
    await delay(150);
  }
  return !(await modal.isVisible().catch(() => false));
}

async function writePrettyJson(records: AssociationRecord[]): Promise<void> {
  fs.writeFileSync(JSON_PATH, JSON.stringify(records, null, 2));
}

async function waitForListReady(page: Page): Promise<void> {
  await page.waitForSelector("table tbody tr", { state: "visible", timeout: 15000 });
  await delay(400);
}

async function dismissCookieBanner(page: Page): Promise<void> {
  const candidates = [
    page.getByRole("link", { name: /Acceptera|Accept|Godkänn/i }),
    page.getByRole("button", { name: /Acceptera|Accept|Godkänn|OK/i }),
  ];
  for (const candidate of candidates) {
    if ((await candidate.count()) > 0) {
      try {
        await candidate.first().click({ timeout: 5000 });
        await delay(300);
        return;
      } catch {
        // ignore and try next candidate
      }
    }
  }
}

async function hasNextPage(page: Page): Promise<boolean> {
  try {
    const nextLink = page.getByRole("link", { name: /Next|Nästa/i });
    if ((await nextLink.count()) === 0) return false;
    const isDisabled = await nextLink.evaluate((el) => {
      if (el.hasAttribute("disabled")) return true;
      if (el.getAttribute("aria-disabled") === "true") return true;
      if (el.classList.contains("disabled")) return true;
      return false;
    });
    return !isDisabled;
  } catch {
    return false;
  }
}

async function goToNextPage(page: Page): Promise<boolean> {
  try {
    const nextLink = page.getByRole("link", { name: /Next|Nästa/i });
    await nextLink.click({ timeout: 10000 });
    await randomDelay(250, 600);
    await waitForListReady(page);
    return true;
  } catch (error) {
    log(`Error navigating to next page: ${error}`);
    return false;
  }
}

async function closeModal(page: Page, associationName: string): Promise<void> {
  try {
    const modal = page.locator('[role="dialog"][aria-hidden="false"], .modal.show').first();
    await modal.waitFor({ state: "visible", timeout: 10000 });

    const closingSelectors = [
      "[data-bs-dismiss=\"modal\"]",
      "button:has-text(\"Stäng\")",
      "button:has-text(\"Close\")",
      "a:has-text(\"Stäng\")",
      "a:has-text(\"Close\")",
    ];

    for (const selector of closingSelectors) {
      const candidate = modal.locator(selector).first();
      if ((await candidate.count()) > 0 && (await candidate.isVisible())) {
        await candidate.click({ timeout: 3000 }).catch(() => {});
        if (await waitForModalToDisappear(page, modal)) return;
      }
    }

    const headerClose = modal.locator(".modal-header .btn-close, .modal-header button[aria-label]").first();
    if ((await headerClose.count()) > 0 && (await headerClose.isVisible())) {
      await headerClose.click({ timeout: 3000 }).catch(() => {});
      if (await waitForModalToDisappear(page, modal)) return;
    }

    for (let attempt = 0; attempt < 5; attempt++) {
      await page.keyboard.press("Escape");
      if (await waitForModalToDisappear(page, modal)) return;
      await delay(200);
    }
  } catch (err) {
    log(`Warning: Could not close modal for "${associationName}": ${err}`);
  }
}

function detectSectionHeading(line: string): { key: string; title: string } | null {
  const trimmed = line.trim().replace(/:$/, "");
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  if (/^verksamhet/.test(lower)) return { key: "activities", title: trimmed };
  if (/^målgrupp/.test(lower) || /^target/.test(lower)) return { key: "target_groups", title: trimmed };
  if (/^områd/.test(lower) || /^area/.test(lower)) return { key: "areas", title: trimmed };
  if (/^kontakt/.test(lower) || /^contact/.test(lower)) return { key: "contact", title: trimmed };
  if (/^adress/.test(lower) || /^address/.test(lower)) return { key: "address", title: trimmed };
  if (/^hemsida/.test(lower) || /^website/.test(lower) || /^webbplats/.test(lower)) return { key: "homepage", title: trimmed };
  if (/^org/.test(lower) || /organisationsnummer/.test(lower) || /organization number/.test(lower)) return { key: "org", title: trimmed };
  if (/^bankgiro/.test(lower) || /^plusgiro/.test(lower)) return { key: "bank", title: trimmed };
  return null;
}

function parsePostalDetails(lines: string[]): { street: string | null; postalCode: string | null; city: string | null } {
  let street: string | null = null;
  let postalCode: string | null = null;
  let city: string | null = null;
  for (const line of lines) {
    const normalized = normalizeString(line);
    if (!normalized) continue;
    if (!street) {
      street = normalized;
    }
    const match = normalized.match(/(\d{3}\s*\d{2})\s*(.*)/);
    if (match) {
      postalCode = normalizePostalCode(match[1]);
      const possibleCity = normalizeString(match[2]);
      if (possibleCity) city = possibleCity;
    }
  }
  if (!city && lines.length > 1) {
    const candidate = normalizeString(lines[1]);
    if (candidate && !/\d/.test(candidate)) {
      city = candidate;
    }
  }
  return { street, postalCode, city };
}

async function extractDetailModalData(page: Page, associationName: string): Promise<ModalExtractionResult> {
  const result: ModalExtractionResult = {
    description: null,
    email: null,
    phone: null,
    address: null,
    postalCode: null,
    city: null,
    orgNumber: null,
    homepage: null,
    categories: [],
    activities: [],
    targetGroups: [],
    contacts: [],
    extras: {},
  };

  try {
    const modal = page.locator('[role="dialog"][aria-hidden="false"], .modal.show').first();
    await modal.waitFor({ state: "visible", timeout: 10000 });
    await delay(400);

    const rawText = await modal.innerText();
    if (!rawText) {
      return result;
    }

    const lines = rawText
      .split(/\r?\n/)
      .map((line) => normalizeString(line))
      .filter((line): line is string => Boolean(line && line.length > 0));

    const descriptionLines: string[] = [];
    const sections: Array<{ key: string; title: string; lines: string[] }> = [];
    let currentSection: { key: string; title: string; lines: string[] } | null = null;

    for (const line of lines) {
      if (line.toLowerCase() === associationName.toLowerCase()) {
        continue;
      }
      const sectionInfo = detectSectionHeading(line);
      if (sectionInfo) {
        currentSection = { ...sectionInfo, lines: [] };
        sections.push(currentSection);
        continue;
      }
      if (!currentSection) {
        descriptionLines.push(line);
      } else {
        currentSection.lines.push(line);
      }
    }

    const descriptionSections: DescriptionSection[] = [];
    const pushSection = (title: string, data: Record<string, string | number | boolean | string[] | null>) => {
      descriptionSections.push({ title, data });
    };

    for (const section of sections) {
      if (section.lines.length === 0) continue;
      switch (section.key) {
        case "activities": {
          const activities = parseList(section.lines);
          if (activities.length > 0) {
            result.activities = activities;
            pushSection(section.title, { activities });
          } else {
            pushSection(section.title, { activities_raw: section.lines.join(", ") });
          }
          break;
        }
        case "target_groups": {
          const groups = parseList(section.lines);
          if (groups.length > 0) {
            result.targetGroups = groups;
            pushSection(section.title, { target_groups: groups });
            result.extras.target_groups = groups;
          } else {
            pushSection(section.title, { target_groups_raw: section.lines.join(", ") });
          }
          break;
        }
        case "areas": {
          const areas = parseList(section.lines);
          if (areas.length > 0) {
            result.categories = areas;
            pushSection(section.title, { areas });
          } else {
            pushSection(section.title, { areas_raw: section.lines.join(", ") });
          }
          break;
        }
        case "address": {
          const { street, postalCode, city } = parsePostalDetails(section.lines);
          result.address = result.address ?? street;
          result.postalCode = result.postalCode ?? postalCode;
          result.city = result.city ?? city;
          pushSection(section.title, {
            address_raw: section.lines.join(", "),
            street_address: street,
            postal_code: postalCode,
            city,
          });
          break;
        }
        case "homepage": {
          const urls = section.lines.filter((line) => /^https?:/i.test(line.trim()));
          if (urls.length > 0 && !result.homepage) {
            result.homepage = urls[0].trim();
          }
          pushSection(section.title, { homepage_raw: section.lines.join(", ") });
          break;
        }
        case "org": {
          const match = section.lines
            .map((line) => line.match(/(\d{6}-\d{4})/))
            .find((m) => m && m[1]);
          if (match && match[1]) {
            result.orgNumber = match[1];
          }
          pushSection(section.title, { org_number_raw: section.lines.join(", ") });
          break;
        }
        case "bank": {
          result.extras.bank_details = section.lines;
          pushSection(section.title, { bank_details: section.lines });
          break;
        }
        case "contact": {
          result.extras.contact_lines = section.lines;
          break;
        }
        default: {
          pushSection(section.title, { raw_text: section.lines.join(" ") });
        }
      }
    }

    const contactSection = sections.find((section) => section.key === "contact");
    if (contactSection) {
      const contactText = contactSection.lines.join("\n");
      const emails = splitEmails(contactText);
      const phoneMatch = contactText.match(/(0\d[\d\s\-]{5,})/);
      const phone = phoneMatch ? sanitizePhone(phoneMatch[1]) : null;
      const candidateNames = contactSection.lines
        .map((line) => normalizeString(line))
        .filter((line): line is string => Boolean(line && /[A-Za-zÅÄÖåäö]/.test(line) && !/@/.test(line) && !/^https?:/i.test(line)));

      const baseName = candidateNames.length > 0 ? candidateNames[0] : null;
      if (emails.length > 0) {
        emails.forEach((email, index) => {
          result.contacts.push({
            contact_person_name: index === 0 ? baseName : candidateNames[index] ?? null,
            contact_person_role: null,
            contact_person_email: email,
            contact_person_phone: index === 0 ? phone : null,
          });
        });
        result.email = emails[0];
      } else if (baseName || phone) {
        result.contacts.push({
          contact_person_name: baseName,
          contact_person_role: null,
          contact_person_email: null,
          contact_person_phone: phone,
        });
      }
      if (!result.phone && phone) {
        result.phone = phone;
      }
      if (!result.homepage) {
        const urlMatch = contactText.match(/https?:\/\/[\S]+/i);
        if (urlMatch) {
          result.homepage = urlMatch[0];
        }
      }
    }

    if (!result.homepage) {
      const linkLocator = modal.locator('a[href^="http"]');
      const hrefCandidate =
        (await linkLocator.count()) > 0
          ? await linkLocator.first().getAttribute("href").catch(() => null)
          : null;
      if (hrefCandidate && !hrefCandidate.startsWith("mailto:")) {
        result.homepage = hrefCandidate;
      }
    }

    if (!result.description && (descriptionLines.length > 0 || descriptionSections.length > 0)) {
      result.description = {
        free_text: descriptionLines.length > 0 ? descriptionLines.join("\n") : null,
        sections: descriptionSections,
      };
    } else if (result.description) {
      result.description.sections = descriptionSections;
    } else if (descriptionSections.length > 0) {
      result.description = {
        free_text: descriptionLines.length > 0 ? descriptionLines.join("\n") : null,
        sections: descriptionSections,
      };
    } else if (descriptionLines.length > 0) {
      result.description = {
        free_text: descriptionLines.join("\n"),
        sections: [],
      };
    }
  } catch (error) {
    log(`Warning: Error extracting modal data for ${associationName}: ${error}`);
  }

  return result;
}

async function scrapePage(page: Page, pageIndex: number): Promise<AssociationRecord[]> {
  const records: AssociationRecord[] = [];
  await waitForListReady(page);
  const rows = page.locator("table tbody tr");
  const rowCount = await rows.count();
  log(`Page ${pageIndex}: Found ${rowCount} associations`);

  for (let i = 0; i < rowCount; i++) {
    const row = rows.nth(i);
    try {
      const cells = row.locator("td");
      const nameCell = cells.nth(1);
      const associationName = normalizeString(await nameCell.textContent());
      if (!associationName) {
        log(`Page ${pageIndex}, Row ${i}: Missing association name`);
        continue;
      }

      const typeCell = cells.nth(2);
      const typeValue = normalizeString(await typeCell.textContent());
      const homepageCell = cells.nth(3);
      const homepageAnchors = homepageCell.locator('a[href^="http"]');
      const listHomepage =
        (await homepageAnchors.count()) > 0
          ? await homepageAnchors.first().getAttribute("href").catch(() => null)
          : null;

      const infoLocatorCandidates: Locator[] = [
        row.getByRole("link", { name: /visa mer information|mer information|show more information/i }),
        row.locator('a[title*="information" i]'),
        row.locator('a[aria-label*="information" i]'),
        row.locator('a.forening-link'),
      ];
      let infoLink: Locator | null = null;
      for (const candidate of infoLocatorCandidates) {
        if ((await candidate.count()) > 0) {
          infoLink = candidate.first();
          break;
        }
      }
      if (!infoLink) {
        log(`Page ${pageIndex}, Row ${i}: No info link found`);
        continue;
      }

      log(`Page ${pageIndex}, Row ${i}: Opening modal for "${associationName}"`);
      await infoLink.click({ timeout: 10000 });
      await randomDelay(200, 400);

      const modalData = await extractDetailModalData(page, associationName);
      await closeModal(page, associationName);
      await randomDelay(200, 400);

      const emailCandidates = splitEmails(modalData.email);
      const contacts: ContactRecord[] = [...modalData.contacts];
      if (emailCandidates.length > 1) {
        modalData.email = null;
        emailCandidates.forEach((email) => {
          if (!contacts.some((contact) => contact.contact_person_email === email)) {
            contacts.push({
              contact_person_name: null,
              contact_person_role: null,
              contact_person_email: email,
              contact_person_phone: null,
            });
          }
        });
      }

      const detailUrl = `${BASE_URL}?association=${encodeURIComponent(associationName)}`;

      const record: AssociationRecord = {
        source_system: SOURCE_SYSTEM,
        municipality: MUNICIPALITY_NAME,
        scrape_run_id: SCRAPE_RUN_ID,
        scraped_at: SCRAPED_AT,
        association: {
          name: associationName,
          org_number: modalData.orgNumber,
          types: normalizeArray([typeValue]),
          activities: modalData.activities,
          categories: modalData.categories,
          homepage_url: modalData.homepage || listHomepage,
          detail_url: detailUrl,
          street_address: modalData.address,
          postal_code: modalData.postalCode ? normalizePostalCode(modalData.postalCode) : null,
          city: modalData.city,
          email: modalData.email,
          phone: modalData.phone,
          description: modalData.description,
        },
        contacts,
        source_navigation: {
          list_page_index: pageIndex,
          position_on_page: i,
          pagination_model: "rbok_controls",
          filter_state: null,
        },
        extras: {
          ...modalData.extras,
          target_groups: modalData.targetGroups,
        },
      };

      totalAssociations += 1;
      if (!record.association.org_number) missingOrgNumber += 1;
      if (record.contacts.length === 0) missingContacts += 1;
      const domain = extractDomain(record.association.homepage_url);
      if (domain) homepageDomains.add(domain);

      records.push(record);
    } catch (error) {
      log(`Page ${pageIndex}, Row ${i}: Error processing association: ${error}`);
      try {
        await page.keyboard.press("Escape");
        await delay(200);
      } catch {
        // ignore
      }
    }
  }

  return records;
}

async function scrapeAllPages(page: Page): Promise<AssociationRecord[]> {
  const results: AssociationRecord[] = [];
  let pageIndex = 1;
  const firstPageRecords = await scrapePage(page, pageIndex);
  results.push(...firstPageRecords);

  while (await hasNextPage(page)) {
    pageIndex += 1;
    log(`Navigating to page ${pageIndex}`);
    const moved = await goToNextPage(page);
    if (!moved) break;
    const pageRecords = await scrapePage(page, pageIndex);
    results.push(...pageRecords);
    if (pageIndex >= 200) {
      log("Reached pagination safety limit (200 pages)");
      break;
    }
  }

  return results;
}

function shouldRunHeadless(): boolean {
  const flag = (process.env.PLAYWRIGHT_HEADLESS ?? "").toLowerCase();
  if (["false", "0", "no"].includes(flag)) return false;
  return true;
}

async function setItemsPerPage(page: Page): Promise<void> {
  const selectLocator = page.locator('select[aria-label*="Sidstorlek"], select[aria-label*="Default select example"], select').first();
  if ((await selectLocator.count()) === 0) {
    return;
  }
  try {
    await selectLocator.selectOption("100");
    await randomDelay(400, 800);
    await waitForListReady(page);
    log("Items per page set to 100");
  } catch (error) {
    log(`Could not change items per page: ${error}`);
  }
}

async function determineTotalAssociations(page: Page): Promise<number> {
  try {
    const lastLink = page.getByRole("link", { name: /Last|Sista/i });
    if ((await lastLink.count()) > 0) {
      await lastLink.click({ timeout: 10000 });
      await randomDelay(400, 700);
      await waitForListReady(page);
    }
    const paginationLabel = await page.locator("li.page-item.d-none.d-md-block label").last().textContent();
    const match = paginationLabel?.match(/(?:av|of)\s+(\d+)/i);
    if (match) {
      return parseInt(match[1], 10);
    }
  } catch (error) {
    log(`Could not determine total association count: ${error}`);
  }
  return 0;
}

async function navigateToFirstPage(page: Page): Promise<void> {
  try {
    const firstLink = page.getByRole("link", { name: /First|Första/i });
    if ((await firstLink.count()) > 0) {
      await firstLink.click({ timeout: 10000 });
      await randomDelay(400, 700);
      await waitForListReady(page);
      log("Returned to first page");
    }
  } catch (error) {
    log(`Could not navigate to first page: ${error}`);
  }
}

async function main(): Promise<void> {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  fs.writeFileSync(LOG_PATH, `Scrape started at ${SCRAPED_AT}\n`);
  fs.appendFileSync(LOG_PATH, `Run ID: ${SCRAPE_RUN_ID}\n`);
  fs.appendFileSync(LOG_PATH, `Municipality: ${MUNICIPALITY_NAME}\n`);
  fs.appendFileSync(LOG_PATH, `Source System: ${SOURCE_SYSTEM}\n\n`);

  const browser: Browser = await chromium.launch({ headless: shouldRunHeadless() });
  const context = await browser.newContext({ viewport: { width: 1760, height: 1256 } });
  const page = await context.newPage();

  try {
    log(`Navigating to ${BASE_URL}`);
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
    await randomDelay(600, 900);

    await dismissCookieBanner(page);

    const registerLink = page.locator('a[href="/foreningsregister"]').first();
    if ((await registerLink.count()) > 0) {
      await registerLink.click({ timeout: 10000 }).catch(() => {});
      await randomDelay(800, 1200);
    }

    await setItemsPerPage(page);

    const expectedTotal = await determineTotalAssociations(page);
    if (expectedTotal > 0) {
      log(`Total associations reported by pagination: ${expectedTotal}`);
    }

    await navigateToFirstPage(page);

    const records = await scrapeAllPages(page);

    if (expectedTotal > 0) {
      if (records.length === expectedTotal) {
        log(`✔ Scraped ${records.length} associations (matches expected count)`);
      } else {
        log(`⚠ Scraped ${records.length} associations but expected ${expectedTotal}`);
      }
    } else {
      log(`Scraped ${records.length} associations (expected count unavailable)`);
    }

    log("Sanitizing records for validation");
    const sanitized = records.map((record) => sanitizeForValidation(record)) as AssociationRecord[];

    log("Writing pretty JSON output");
    await writePrettyJson(sanitized);

    await runDatabaseImport(MUNICIPALITY_NAME, log);

    log("=== SCRAPE SUMMARY ===");
    log(`Total associations scraped: ${totalAssociations}`);
    log(`Records missing org_number: ${missingOrgNumber}`);
    log(`Records missing contacts: ${missingContacts}`);
    log(`Distinct homepage domains: ${homepageDomains.size}`);
    log(`JSON output: ${JSON_PATH}`);
    log(`Log output: ${LOG_PATH}`);
  } catch (error) {
    log(`FATAL ERROR: ${error}`);
    throw error;
  } finally {
    await browser.close();
    log("Browser closed. Scrape complete.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
