# Actor Smartbook API Endpoint Verification Summary

**Date**: 2025-10-26
**Task**: Verify and configure API endpoints for Actor Smartbook municipalities

## Overview

Verified API endpoints for 23 municipalities using Actor Smartbook platform. Successfully identified and configured 22 working API endpoints in the database.

## Methodology

1. **Discovery**: Extracted municipality list from CSV file containing Actor Smartbook registry URLs
2. **Verification**: Tested both list and detail API endpoints for each municipality:
   - List endpoint: `GET /Associations/1/10`
   - Detail endpoint: `POST /GetAssociation` with `{id: number}`
3. **Database Update**: Updated `Municipality.registryEndpoint` field for verified municipalities

## Results Summary

### ✅ Working API Endpoints: 22 municipalities

| Municipality | Base URL | Total Associations |
|--------------|----------|-------------------|
| Alingsås | https://alingsas.actorsmartbook.se | 242 |
| Älvdalen | https://alvdalen.actorsmartbook.se | 95 |
| Åstorp | https://astorp.actorsmartbook.se | 83 |
| Boden | https://boden.actorsmartbook.se | 224 |
| Bollnäs | https://bollnas.actorsmartbook.se | 169 |
| Borås | https://boras.actorsmartbook.se | 313 |
| Falun | https://falun.actorsmartbook.se | 788 |
| Gislaved | https://gislaved.actorsmartbook.se | 322 |
| Gnosjö | https://gnosjo.actorsmartbook.se | 72 |
| Hedemora | https://hedemora.actorsmartbook.se | 200 |
| Huddinge | https://huddinge.actorsmartbook.se | 264 |
| Hultsfred | https://hultsfred.actorsmartbook.se | 185 |
| Hylte | https://hylte.actorsmartbook.se | 97 |
| Jönköping | https://jonkoping.actorsmartbook.se | 671 |
| Kiruna | https://kiruna.actorsmartbook.se | 247 |
| Lidköping | https://lidkoping.actorsmartbook.se | 341 |
| Mora | https://mora.actorsmartbook.se | 121 |
| Ronneby | https://ronneby.actorsmartbook.se | 239 |
| Sandviken | https://sandviken.actorsmartbook.se | 304 |
| Sävsjö | https://savsjo.actorsmartbook.se | 95 |
| Sollefteå | https://solleftea.actorsmartbook.se | 282 |
| Sundsvall | https://sundsvall.actorsmartbook.se | 440 |

**Total associations available**: 5,759

### ⚠️ Special Cases: 1 municipality

- **Lysekil** (https://lysekil.actorsmartbook.se): List endpoint works but reports 0 associations

### ❌ Excluded from verification

The following municipalities from the CSV were excluded as they don't use standard Actor Smartbook URLs:

- **Bjurholm**: https://www.bjurholm.se/uppleva-och-gora/foreningar/foreningsregister (different platform)
- **Borgholm**: https://bokning.borgholm.se/AssociationRegister (different platform)
- **Kalix**: https://forening.kalix.se/forening/ (different platform)

## Database Updates

### Update Summary

- **Updated**: 20 municipalities
- **Already configured**: 2 municipalities (Borås, Sollefteå)
- **Total with endpoints**: 22 municipalities

### SQL Updates Applied

All 22 municipalities now have the `registryEndpoint` field populated in the `Municipality` table, enabling automated API-based scraping.

Example:
```sql
UPDATE Municipality SET registryEndpoint = 'https://falun.actorsmartbook.se' WHERE name = 'Falun';
```

## Performance Implications

### API Scraping Benefits

Based on Borås performance benchmarks:
- **API method**: ~163ms per association
- **DOM method**: ~2-3 seconds per association
- **Speed improvement**: 10-20x faster

### Estimated Scraping Times

| Municipality | Associations | Estimated Time (API) | Estimated Time (DOM) |
|--------------|-------------|---------------------|---------------------|
| Falun | 788 | ~2.1 minutes | ~40 minutes |
| Jönköping | 671 | ~1.8 minutes | ~34 minutes |
| Sundsvall | 440 | ~1.2 minutes | ~22 minutes |
| Lidköping | 341 | ~55 seconds | ~17 minutes |
| Gislaved | 322 | ~52 seconds | ~16 minutes |
| Borås | 313 | ~51 seconds | ~16 minutes |
| Sandviken | 304 | ~50 seconds | ~15 minutes |

**Total for all 5,759 associations**:
- API method: ~15.5 minutes
- DOM method: ~5 hours

## Files Generated

1. **Verification Results**: `scraping/json/actor_endpoint_verification.json`
   - Detailed test results for each municipality
   - Includes API response data and error messages

2. **Scripts Created**:
   - `crm-app/scripts/check_actor_endpoints.ts` - Check current database state
   - `crm-app/scripts/verify_actor_endpoints.ts` - Verify API endpoints
   - `crm-app/scripts/update_actor_endpoints.ts` - Update database

## Next Steps

### Ready for Scraping

All 22 municipalities with working endpoints are ready for data collection using the API scraper template from [boras_api_scrape.ts](../scripts/boras_api_scrape.ts).

### Priority Municipalities (by association count)

1. **Falun** - 788 associations
2. **Jönköping** - 671 associations
3. **Sundsvall** - 440 associations
4. **Lidköping** - 341 associations
5. **Gislaved** - 322 associations

### Recommended Actions

1. Create API scrapers for high-priority municipalities
2. Run scraping in batches to avoid rate limiting
3. Import scraped data to database
4. Verify data quality and completeness
5. Document any municipality-specific variations

### Lysekil Investigation

Lysekil reports 0 associations via API. Investigate:
- Check if associations were recently deleted
- Verify if different API version is in use
- Try DOM scraping as fallback

## Documentation Updates

Updated the following documentation:
- [ACTORS_SMARTBOOK_SCRAPING_GUIDES.md](ACTORS_SMARTBOOK_SCRAPING_GUIDES.md) - Added all 22 municipalities to the table

## Reference

- **API Documentation**: See [ACTORS_SMARTBOOK_SCRAPING_GUIDES.md](ACTORS_SMARTBOOK_SCRAPING_GUIDES.md) for API usage
- **Lessons Learned**: See [lessons_actor.md](lessons/lessons_actor.md) for implementation notes
- **Borås Case Study**: See [boras_api_scrape.ts](../scripts/boras_api_scrape.ts) for working example
