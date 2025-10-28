# OTHER Scraping Guide

## Overview

This guide covers scraping from miscellaneous sources that don't fit into the standard platforms (FRI, RBOK, IBGO, Actor Smartbook). Examples include:

- PDF files
- Custom municipal websites
- CSV/Excel files
- One-off custom solutions

## JSON and Output Format

**Följ noggrant** reglerna i `E:\projects\CRM\scraping\docs\JSON_STANDARD.md`

**  Viktigt**: All scrapers ska generera endast **Pretty JSON** (indenterad array). JSONL-format används inte längre.

### Filename Pattern

```
{municipality}_OTHER_{YYYY-MM-DD}_{HH-MM}.json
```

**Output-platser**:
- JSON-filer: `scraping/json/`
- Loggar: `scraping/logs/{municipality}.log` (appendar)

**Examples**:
- `scraping/json/ExampleCity_OTHER_2025-10-27_10-30.json`

**Filhantering**:
- Filer skrivs över vid nya körningar (ej versionerade)
- Importeraren läser endast den senaste filen baserat på filnamnet
- SOURCE_SYSTEM (`OTHER`) eller ett mer specifikt systemnamn inkluderas i filnamnet

### JSON Structure

Följer `JSON_STANDARD.md`:

- `source_system`: Sätt till `"OTHER"` eller ett mer specifikt namn
- `municipality`: Kommunnamn
- `association.*`: Standard association-fält
- `contacts[]`: Standard contact-struktur
- `description.sections[].title` och `description.sections[].data`: Strukturerad data
- `extras`: Plats för source-specifik metadata

## General Guidelines

1. Följ JSON_STANDARD.md för all output
2. Använd SOURCE_SYSTEM = "OTHER" eller skapa ett specifikt namn för källan
3. Dokumentera scraping-processen i kommentarer
4. Inkludera fel-hantering och logging
5. Validera mot JSON schema innan export

## Related Files

- Standard: `JSON_STANDARD.md`
- Lessons learned: `lessons/lessons_misc.md`
