# IBGO API Endpoint Verification Summary

**Date:** 2025-10-26
**Status:** ✅ Completed

## Overview

Successfully verified and configured API endpoints for **31 IBGO/Interbook municipalities** with access to **6,981 associations** in total.

## API Endpoint Pattern

All IBGO municipalities use the same API endpoint structure:

```
https://{subdomain}/APIAssociationRegister/GetAssociationsList/
```

Where `{subdomain}` can be:
- `{municipality}.ibgo.se` (most common)
- `{municipality}.interbookfri.se` (some municipalities)
- `ibgo.{municipality}.se` (a few municipalities)
- `interbook.{municipality}.se` (rare)

## Verified Municipalities

| # | Municipality | Register URL | Associations | Status |
|---|-------------|--------------|--------------|--------|
| 1 | Ale | https://ale.ibgo.se/AssociationRegister | 187 | ✅ Verified |
| 2 | Älvsbyn | https://alvsbyn.interbookfri.se/#/AssociationRegister | 95 | ✅ Verified |
| 3 | Åmål | https://saffle.ibgo.se/#/AssociationRegister | 130 | ✅ Verified |
| 4 | Ånge | https://ange.ibgo.se/AssociationRegister | 119 | ✅ Verified |
| 5 | Arvika | https://arvika.ibgo.se/ | 290 | ✅ Verified |
| 6 | Åtvidaberg | https://atvidaberg.interbookfri.se/#/AssociationRegister | 22 | ✅ Verified |
| 7 | Avesta | https://avesta.ibgo.se/#/AssociationRegister | 222 | ✅ Verified |
| 8 | Bengtsfors | https://ibgo.bengtsfors.se/AssociationRegister | 72 | ✅ Verified |
| 9 | Borlänge | https://ibgo.borlange.se/AssociationRegister | 344 | ✅ Verified |
| 10 | Botkyrka | https://botkyrka.ibgo.se/AssociationRegister | 300 | ✅ Verified |
| 11 | Burlöv | https://ibgo.burlov.se/AssociationRegister | 71 | ✅ Verified |
| 12 | Degerfors | https://degerfors.ibgo.se/#/AssociationRegister | 120 | ✅ Verified |
| 13 | Eda | https://eda.ibgo.se/#/ | 53 | ✅ Verified |
| 14 | Finspång | https://finspang.ibgo.se/#/AssociationRegister | 106 | ✅ Verified |
| 15 | Gnesta | https://gnesta.interbookfri.se/ | 75 | ✅ Verified |
| 16 | Gotland | https://gotland.ibgo.se/#/AssociationRegister | 438 | ✅ Verified |
| 17 | Hammarö | https://ibgo.hammaro.se/AssociationRegister | 75 | ✅ Verified |
| 18 | Katrineholm | https://katrineholm.ibgo.se/AssociationRegister | 212 | ✅ Verified |
| 19 | Kinda | https://kinda.interbookfri.se/#/AssociationRegister | 113 | ✅ Verified |
| 20 | Kristinehamn | https://kristinehamn.ibgo.se/#/AssociationRegister | 128 | ✅ Verified |
| 21 | Linköping | https://ibgo.linkoping.se/#/AssociationRegister | 417 | ✅ Verified |
| 22 | Ljusdal | https://interbook.ljusdal.se/AssociationRegister | 194 | ✅ Verified |
| 23 | Motala | https://ibgo.motala.se/AssociationRegister | 286 | ✅ Verified |
| 24 | Nybro | https://ibgo.nybro.se/#/AssociationRegister | 219 | ✅ Verified |
| 25 | Örebro | https://orebro.ibgo.se/ | 519 | ✅ Verified |
| 26 | Örnsköldsvik | https://ornskoldsvik.ibgo.se/AssociationRegister | 585 | ✅ Verified |
| 27 | Säffle | https://saffle.ibgo.se/#/ | 130 | ✅ Verified |
| 28 | Skellefteå | https://ibgo.skelleftea.se/AssociationRegister | 789 | ✅ Verified |
| 29 | Torsby | https://torsby.ibgo.se/#/AssociationRegister | 239 | ✅ Verified |
| 30 | Trosa | https://trosa.ibgo.se/ | 63 | ✅ Verified |
| 31 | Varberg | https://varberg.ibgo.se/#/AssociationRegister | 368 | ✅ Verified |

**Total Associations:** 6,981

## Excluded Municipality

| Municipality | Register URL | Reason |
|-------------|--------------|--------|
| Haninge | https://haninge.rbok.se/foreningsregister | Uses RBOK system, not IBGO |

## Database Updates

All 31 verified municipalities have been updated in the `Municipality` table with:

- **registryEndpoint**: Direct API endpoint URL
- **registerUrl**: Web interface URL
- **platform**: "IBGO"
- **registerStatus**: "verified"

## API Response Format

The IBGO API returns JSON in the following format:

```json
{
  "TotalNumberOfElements": 187,
  "Customers": [
    {
      "Id": 563,
      "Name": "Association Name",
      "WebSite": "https://example.com",
      "DistrictNames": ["District"],
      "AssociationCategoryName": "Category",
      "Address": "Street Address",
      "ZipCode": "12345",
      "City": "City",
      "Phone": "0123-456789",
      "Mobile": "0701234567",
      "Email": "contact@example.com",
      "PublicInformation": "Description",
      "LeisureActivityCard": false,
      "CustomerOccupations": [
        {"Id": 1, "Name": "Activity"}
      ],
      "CustomerContactPeople": [
        {
          "Id": 1,
          "OccupationId": 2,
          "Occupation": "Role",
          "Name": "First",
          "Surname": "Last",
          "Email": "person@example.com",
          "Mobile": "0701234567"
        }
      ]
    }
  ]
}
```

## Scripts Created

1. **check_ibgo_endpoints.ts** - Main verification script
2. **update_ibgo_endpoints_to_db.ts** - Database update script
3. **test_missing_ibgo.ts** - Test missing municipalities
4. **add_missing_ibgo_to_db.ts** - Add missing to database
5. **check_ibgo_endpoints.bat** - Windows batch file

## Performance Metrics

- **Average API response time**: ~350ms
- **Fastest response**: 82ms (Haninge - failed)
- **Slowest response**: 703ms (Bengtsfors)
- **Success rate**: 96.9% (31/32 municipalities)

## Next Steps

1. Create IBGO scraper script based on API endpoints
2. Implement bulk scraping for all 31 municipalities
3. Transform API data to standard JSON format
4. Import to database using existing import scripts

## Notes

- All endpoints are publicly accessible (no authentication required)
- Data is returned in Swedish
- Contact information may be incomplete for some associations
- Some associations have multiple contact persons with roles
