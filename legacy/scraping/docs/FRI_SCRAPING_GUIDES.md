# FRI (Årjäng) — Targeted Agent Instruction

**Scope:** Correct the extraction errors seen in Årjäng’s FRI instance. Keep values in **original Swedish**; only keys are normalized to `snake_case`. No machine translation. No footer scraping.

---

## 1) Page Scoping & Language

* **Never translate** page text. Preserve Swedish values exactly as shown on the site.
* **Scope all reads** to the main content container above the section “Länkar” and **exclude** header, breadcrumb, banners (“Information”), print links (“Skriv ut”), login blocks (“Logga in …”), and the entire page footer (including contact info like `foreningsservice@arjang.se`).
* When extracting paragraphs for `free_text`, **only** read from the main content area; ignore anything inside `footer`, `nav`, or alert/notice panels.

---

## 2) Address (street / postal_code / city) — **Must populate from detail page, left table**

**Where:** Detail page → section “Allmänt” → **left** table (the table whose header cell equals the association’s name, e.g. “Bufff Värmland”).
**Row label(s):** `Adress` (primary). Also check for `Postadress`, `Postnr`, `Ort` variants if present.

**Parsing rules (order):**

1. Read the value from the `Adress` row as a single string. Example:
   `Drottninggatan 38, 652 25, Karlstad`
2. **Regex postal code:** first match `\b\d{3}\s?\d{2}\b` → `postal_code`.
3. **Split street/city:**

   * If value contains commas: split on commas, trim.

     * `street_address` = first part (before the first comma) → `Drottninggatan 38`
     * The part that holds the matched postal code becomes `postal_code` (normalize spacing to `NNN NN`), and the **next** non-empty part becomes `city` → `Karlstad`.
   * If there are separate rows (`Postnr`, `Ort`), use them directly to fill `postal_code` / `city`.
4. If multiple postal codes appear, take the **first** valid Swedish `NNN NN`.
5. If nothing is confidently parsed, keep components `null` but still store the raw string in `description.sections[*].data.address_raw`.

**Mapping:**

* `association.street_address`, `association.postal_code`, `association.city`
* Also store the unparsed value as `address_raw` in the “Övrig information” section’s `data` **in addition** to the parsed fields.

---

## 3) Association Email & Homepage — **From left table only**

* **Email (föreningsnivå):** from left table row `E-postadress`. Lower-case it. → `association.email`.
* **Homepage:** from left table row `Hemsida` (use the actual link `href`). → `association.homepage_url`.
* **Do not** infer email/URL from the page body or footer.

---

## 4) Contact Person & Phones — **From right table only**

**Where:** Detail page → section “Allmänt” → **right** table whose header equals `Kontaktperson`.

**Extraction:**

* **Name:** row 1 (the first data row without a label) → `contacts[*].contact_person_name`.
* **Phones:** read **only** labeled rows inside this right table:

  * `Hem` → prefer as `contact_person_phone` **if it’s the only phone**.
  * `Arbete` / `Mobil` → if multiple exist, choose **Mobil** as `contact_person_phone`; otherwise take the first available. (You may also keep the others in `extras.contact_phones = { home, work, mobile }`.)
* **Email:** row `E-postadress` (lower-case) → `contacts[*].contact_person_email`.
* **Role:** if any label or header indicates a role, set `contact_person_role`; otherwise `null`.

**Prohibitions:**

* **Never** read phone/email from:

  * the page footer,
  * global banners,
  * unrelated tables.
* **Do not** set `association.phone` from contact-person fields. Leave `association.phone = null` unless the **left** table contains a clear association-level phone row.

---

## 5) “Övrig information” (Other information) — keep as is + merge

* Continue to capture the two-column table under heading `Övrig information` / `Other information` into
  `association.description.sections[*].data` using the existing label normalization.
* Keep `verksamhet` both as raw string `verksamhet_raw` and merge split activities (`,`, `;`) into `association.activities` (case-insensitive de-duplication, preserve original casing).
* Also propagate mapped keys to top-level as before (`org_number`, `email`, `homepage_url`, etc.) **but retain the original key/value in `sections[*].data`.**

---

## 6) Free-text description — **Do not capture login/utility text**

* Populate `association.description.free_text` **only** from:

  * the row `Kort beskrivning` if its value is narrative; and/or
  * paragraph blocks in the **main** content area immediately surrounding the detail tables.
* **Explicitly exclude** any text containing (case-insensitive):
  `Logga in`, `Skriv ut`, `Aktuella bokningar`, `Sök lediga tider/bokningar`, municipal service contact lines, cookie notices, and footer content.

---

## 7) Pagination (Årjäng FRI)

* Recognize Swedish controls: `Nästa`, `Sista`, and the “Sida X/Y” marker.
  Implement page info via regex: `/Sida\s+(\d+)\s*\/\s*(\d+)/i`.
  Stop when `Nästa` is absent/disabled **or** when `current === total`.
* `pagination_model = "numeric_plus_next_last"`.

---

## 8) Normalization & Anti-patterns

* Keys: normalized to `snake_case` (existing mapping table).
* Values: **original Swedish**, trimmed; no translation; no aggressive reformatting.
* **Do not** pull contact or phone/email from generic `<body>` regexes.
* **Do not** set address fields from unrelated elements; parse **only** from `Adress`/postal rows in the left table.

---

## 9) Field-level Acceptance (sample “Bufff Värmland”)

When the page shows (visually verified):

* `Adress`: `Drottninggatan 38, 652 25, Karlstad`
* `Kontaktperson`: `Anette Berggren` with `Mobil` `073 151 01 82` and e-post `a.berggren@berg...`

**Then the record must contain:**

```json
"association": {
  "street_address": "Drottninggatan 38",
  "postal_code": "652 25",
  "city": "Karlstad",
  "email": "varmland@bufff.se",               // from left table E-postadress (if present)
  "homepage_url": "http://www.bufff.se",     // from left table Hemsida
  "phone": null                               // unless a left-table association phone exists
},
"contacts": [
  {
    "contact_person_name": "Anette Berggren",
    "contact_person_role": null,
    "contact_person_email": "a.berggren@bergslagsgardar.se",
    "contact_person_phone": "073 151 01 82"
  }
]
```

---

## 10) Minimal Selector Hints (robust, language-safe)

* Detail tables: `page.locator('table.compact-table, table.clean')`
* Left table (association): **the one whose first header cell equals the association name (exact match)**.
* Right table (contact): **the sibling table whose header cell equals `/Kontaktperson/i`**.
* Labels in rows: use `(th, td).nth(0)` for label; `(td).nth(1)` for value; also support single-cell `Label | Value`.

---

## 11) Done Criteria

* `street_address`, `postal_code`, `city` are **not null** whenever `Adress` exists.
* Phones come **only** from the `Kontaktperson` table (no footer contamination).
* `free_text` contains **no** login/utility/footer strings.
* All original two-column rows preserved under `association.description.sections[*].data`.

---

## 12) Output Format

**⚠️ Viktigt**: FRI scrapers genererar endast **Pretty JSON** (indenterad array). JSONL-format används inte längre.

### Filename Pattern

```
{municipality}_FRI_{YYYY-MM-DD}_{HH-MM}.json
```

**Output-platser**:
- JSON-filer: `scraping/json/`
- Loggar: `scraping/logs/{municipality}.log` (appendar)

**Examples**:
- `scraping/json/Årjäng_FRI_2025-10-27_06-20.json`
- `scraping/json/Arboga_FRI_2025-10-27_06-14.json`
- `scraping/json/Sollentuna_FRI_2025-10-26_10-30.json`

**Filhantering**:
- Filer skrivs över vid nya körningar (ej versionerade)
- Importeraren läser endast den senaste filen baserat på filnamnet
- SOURCE_SYSTEM (`FRI`) inkluderas i filnamnet för att undvika cross-contamination

### JSON Structure

Följer `JSON_STANDARD.md` med dessa FRI-specifika detaljer:

**Description structure**:
```json
"description": {
  "free_text": "Narrative text from detail page",
  "sections": [
    {
      "title": "Övrig information",
      "data": {
        "founded_year": 1945,
        "fiscal_year_starts_mmdd": "0101",
        "national_affiliation": "Riksorganisation namn",
        "verksamhet_raw": "Fotboll, Ungdomsverksamhet",
        "short_description": null,
        "address_raw": "Drottninggatan 38, 652 25, Karlstad"
      }
    }
  ]
}
```

**Viktigt**:
- `sections[].title` (inte `label`) används för sektionsrubriker
- `sections[].data` är ett objekt med normaliserade nycklar enligt LABEL_MAPPING
- Address-parsing extraherar `street_address`, `postal_code`, `city` till toppnivå men behåller rådata i `address_raw`
- Verksamhet splitas och mergeas till `association.activities[]` men rådata sparas i `verksamhet_raw`
