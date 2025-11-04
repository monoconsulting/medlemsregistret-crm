// utils/sanitize.ts
/**
 * Data hygiene utilities for municipal association scraping/import.
 *
 * Usage (example):
 *   import {
 *     nullIfEmpty, trimDeep, normalizeEmail, normalizeSwedishPhone,
 *     normalizePostalCodeSE, normalizeUrl, isPlausibleSwedishOrgNo,
 *     dedupeContacts, stripHtml, sanitizeForValidation
 *   } from "../utils/sanitize";
 */

/* ============================== *
 * Basic value transformers
 * ============================== */

/**
 * Convert empty/whitespace-only strings to null; pass through other values.
 *
 * @param s - Input string (or null/undefined).
 * @returns Null for empty values, otherwise a trimmed string.
 */
export const nullIfEmpty = (s?: string | null): string | null => {
  if (s === undefined || s === null) return null;
  const t = String(s).trim();
  return t.length ? t : null;
};

/**
 * Deep trim all string fields in an object/array.
 * - Recurses arrays and plain objects.
 * - Leaves primitives and Dates as-is (except strings, which are trimmed).
 *
 * @param input - Any JSON-like value (object/array/scalars).
 * @returns A deep-cloned structure with trimmed strings.
 */
export const trimDeep = <T = any>(input: T): T => {
  if (typeof input === "string") return input.trim() as unknown as T;
  if (Array.isArray(input)) return input.map((v) => trimDeep(v)) as unknown as T;
  if (input && typeof input === "object" && !(input instanceof Date)) {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(input as Record<string, any>)) {
      out[k] = trimDeep(v);
    }
    return out as T;
  }
  return input;
};

/* ============================== *
 * Field-specific normalizers
 * ============================== */

/**
 * Normalize/validate email:
 * - lowercases the address
 * - basic RFC-like pattern check
 * - returns null if invalid or empty
 *
 * @param email - Email string (any case/format).
 * @returns Lowercased valid email or null.
 */
export const normalizeEmail = (email?: string | null): string | null => {
  const e = nullIfEmpty(email);
  if (!e) return null;
  const lower = e.toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lower) ? lower : null;
};

/**
 * Normalize Swedish phone numbers to E.164 format where possible.
 * Rules:
 * - Remove spacing, dashes, parentheses.
 * - Keep existing leading '+' as-is.
 * - Leading '00' -> '+' (international)
 * - Leading '0' -> '+46' (national to +46)
 * - Leading '46' (no '+') -> '+46'
 *
 * @param phone - Raw phone string.
 * @returns E.164-like phone or null if empty.
 */
export const normalizeSwedishPhone = (phone?: string | null): string | null => {
  const p = nullIfEmpty(phone);
  if (!p) return null;
  let s = p.replace(/[()\s-]+/g, "");

  if (s.startsWith("+")) return s;               // already international
  if (s.startsWith("00")) return `+${s.slice(2)}`;
  if (s.startsWith("0")) return `+46${s.slice(1)}`;
  if (s.startsWith("46")) return `+${s}`;

  // Fallback: if it's just digits, return as-is
  return s;
};

/**
 * Normalize Swedish postal codes:
 * - Keep only digits; if exactly 5 digits, format as 'NNN NN'
 * - Otherwise, return input unchanged (but trimmed)
 *
 * @param pc - Raw postal code.
 * @returns Normalized 'NNN NN' or original/trimmed string, or null if empty.
 */
export const normalizePostalCodeSE = (pc?: string | null): string | null => {
  const s = nullIfEmpty(pc);
  if (!s) return null;
  const digits = s.replace(/\D/g, "");
  if (digits.length === 5) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return s;
};

/**
 * Normalize URLs:
 * - Ensure http/https scheme (default to https if missing)
 * - Remove common tracking parameters (utm_*, fbclid)
 * - Return null if invalid
 *
 * @param u - Raw URL string.
 * @returns Cleaned absolute URL string or null.
 */
export const normalizeUrl = (u?: string | null): string | null => {
  const s = nullIfEmpty(u);
  if (!s) return null;
  try {
    const url = new URL(s.match(/^https?:\/\//i) ? s : `https://${s}`);
    // strip trackers
    [...url.searchParams.keys()]
      .filter((k) => k.toLowerCase().startsWith("utm_") || k.toLowerCase() === "fbclid")
      .forEach((k) => url.searchParams.delete(k));
    return url.toString();
  } catch {
    return null;
  }
};

/**
 * Plausibility check for Swedish organization numbers (very lightweight).
 * - Keep only digits; require exactly 10 digits.
 * - Apply a Luhn-like mod10 check across 10 digits.
 *   (This is a pragmatic filter; canonical validation can be stricter.)
 *
 * @param org - Organization number string.
 * @returns True if plausible, false otherwise.
 */
export const isPlausibleSwedishOrgNo = (org?: string | null): boolean => {
  const s = nullIfEmpty(org);
  if (!s) return false;
  const digits = s.replace(/\D/g, "");
  if (digits.length !== 10) return false;

  // Luhn-like across all 10 digits (simple signal-noise filter)
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    let num = parseInt(digits[i], 10);
    // Double every other digit starting from index 0
    if (i % 2 === 0) num *= 2;
    if (num > 9) num -= 9;
    sum += num;
  }
  return sum % 10 === 0;
};

/**
 * Strip HTML tags from a string.
 *
 * @param s - Raw HTML/text.
 * @returns Plain text without tags, or null if empty.
 */
export const stripHtml = (s?: string | null): string | null => {
  const t = nullIfEmpty(s);
  if (!t) return null;
  return t.replace(/<[^>]*>/g, "").trim() || null;
};

/* ============================== *
 * Contact helpers
 * ============================== */

/** Lightweight input shape for contact records. */
export type ContactIn = {
  contact_person_name?: string | null;
  contact_person_role?: string | null;
  contact_person_email?: string | null;
  contact_person_phone?: string | null;
};

/**
 * Deduplicate contacts by (name|email|phone) signature after normalization.
 * - Trims strings
 * - Normalizes email/phone
 * - Uses a Set of signatures for uniqueness
 *
 * @param contacts - Array of contact inputs.
 * @returns Cleaned, deduplicated contacts.
 */
export const dedupeContacts = (contacts: ContactIn[] = []): ContactIn[] => {
  const seen = new Set<string>();
  const out: ContactIn[] = [];

  for (const c of contacts) {
    const name = nullIfEmpty(c.contact_person_name)?.toLowerCase() ?? "";
    const email = normalizeEmail(c.contact_person_email) ?? "";
    const phone = normalizeSwedishPhone(c.contact_person_phone) ?? "";
    const role = nullIfEmpty(c.contact_person_role);

    const key = [name, email, phone].join("|");
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      contact_person_name: name ? name[0].toUpperCase() + name.slice(1) : null,
      contact_person_role: role,
      contact_person_email: email || null,
      contact_person_phone: phone || null,
    });
  }

  return out;
};

/* ============================== *
 * One-shot sanitizer (optional)
 * ============================== */

/**
 * Minimal shape used by `sanitizeForValidation` for typed hints.
 * You can replace this with your actual TS types if available.
 */
type AssocShape = {
  detail_url?: string | null;
  name?: string | null;
  org_number?: string | null;
  homepage_url?: string | null;
  street_address?: string | null;
  postal_code?: string | null;
  city?: string | null;
  email?: string | null;
  phone?: string | null;
  description?: string | { free_text?: string | null; sections?: unknown };
};

type EntryShape = {
  source_system?: string | null;
  municipality?: string | null;
  scrape_run_id?: string | null;
  scraped_at?: string | Date | null;
  association?: AssocShape | null;
  contacts?: ContactIn[] | null;
  source_navigation?: unknown;
  extras?: Record<string, any> | null;
};

/**
 * Sanitize a raw scraped entry BEFORE Zod validation.
 * - Deep-trims strings everywhere
 * - Normalizes URLs, email, phone, postal code
 * - Strips HTML from description.free_text
 * - Flags invalid org number as extras.invalid_org_number = true
 * - Deduplicates contacts
 * - Converts empty scalars to null
 *
 * @param raw - Unknown raw JSON object from the scraper.
 * @returns Cleaned object safe to feed into your Zod schema.
 */
export const sanitizeForValidation = (raw: unknown): EntryShape => {
  const cleaned = trimDeep(raw) as EntryShape;

  // Scalar top-level hygiene
  cleaned.source_system = nullIfEmpty(cleaned.source_system);
  cleaned.municipality = nullIfEmpty(cleaned.municipality);
  cleaned.scrape_run_id = nullIfEmpty(cleaned.scrape_run_id);

  // Association-specific cleaning
  if (cleaned.association) {
    const a = cleaned.association;

    a.detail_url = normalizeUrl(a.detail_url);
    a.name = nullIfEmpty(a.name);
    a.org_number = nullIfEmpty(a.org_number);
    a.homepage_url = normalizeUrl(a.homepage_url);
    a.street_address = nullIfEmpty(a.street_address);
    a.postal_code = normalizePostalCodeSE(a.postal_code);
    a.city = nullIfEmpty(a.city);
    a.email = normalizeEmail(a.email);
    a.phone = normalizeSwedishPhone(a.phone);

    // Description: strip HTML in free_text if object form is used
    if (a.description && typeof a.description === "object" && "free_text" in a.description) {
      const obj = a.description as { free_text?: string | null; sections?: unknown };
      obj.free_text = stripHtml(obj.free_text);
      a.description = obj;
    }

    // Flag improbable org number (do not remove)
    if (a.org_number && !isPlausibleSwedishOrgNo(a.org_number)) {
      cleaned.extras = cleaned.extras ?? {};
      cleaned.extras.invalid_org_number = true;
    }
  }

  // Contacts: dedupe + normalize
  if (Array.isArray(cleaned.contacts)) {
    cleaned.contacts = dedupeContacts(cleaned.contacts);
  }

  return cleaned;
};
