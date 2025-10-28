# OTHER Scraping Guide

## Overview

This guide covers scraping from miscellaneous sources that don't fit into the standard platforms (FRI, RBOK, IBGO, Actor Smartbook). Examples include:

- PDF files
- Custom municipal websites
- CSV/Excel files
- One-off custom solutions

## JSON and Output Format

**F�lj noggrant** reglerna i `E:\projects\CRM\scraping\docs\JSON_STANDARD.md`

**� Viktigt**: All scrapers ska generera endast **Pretty JSON** (indenterad array). JSONL-format anv�nds inte l�ngre.

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
- Filer skrivs �ver vid nya k�rningar (ej versionerade)
- Importeraren l�ser endast den senaste filen baserat p� filnamnet
- SOURCE_SYSTEM (`OTHER`) eller ett mer specifikt systemnamn inkluderas i filnamnet

### JSON Structure

F�ljer `JSON_STANDARD.md`:

- `source_system`: S�tt till `"OTHER"` eller ett mer specifikt namn
- `municipality`: Kommunnamn
- `association.*`: Standard association-f�lt
- `contacts[]`: Standard contact-struktur
- `description.sections[].title` och `description.sections[].data`: Strukturerad data
- `extras`: Plats f�r source-specifik metadata

## General Guidelines

1. F�lj JSON_STANDARD.md f�r all output
2. Anv�nd SOURCE_SYSTEM = "OTHER" eller skapa ett specifikt namn f�r k�llan
3. Dokumentera scraping-processen i kommentarer
4. Inkludera fel-hantering och logging
5. Validera mot JSON schema innan export

## Related Files

- Standard: `JSON_STANDARD.md`
- Lessons learned: `lessons/lessons_misc.md`
