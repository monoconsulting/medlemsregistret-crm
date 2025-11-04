@echo off
echo ========================================
echo FRI Test Scraper
echo ========================================
echo.
echo Testing with Forshaga (39 associations, ~90 seconds)
echo.
pause

cd /d "%~dp0\..\..\"
npx tsx scraping/scripts/generic_fri_scrape.ts Forshaga https://forening.forshaga.se/

echo.
echo ========================================
echo Test complete!
echo Check scraping/json/ for output file
echo ========================================
pause
