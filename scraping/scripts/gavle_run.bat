@echo off
cd /d "%~dp0\..\..\.."
REM Gävle Municipal Association Registry Scraper
REM Platform: FRI Webb-Förening
REM URL: https://fri.gavle.se/forening/

echo ============================================
echo   Gävle Association Registry Scraper
echo   Platform: FRI Webb-Förening
echo ============================================
echo.

echo Starting scraper...
npx tsx scraping/scripts/gavle_scrape.ts

echo.
echo ============================================
echo   Scraping Complete
echo ============================================
echo.
echo Output files are in: scraping\json\
echo Log file: scraping\logs\gavle_log_YYYY-MM-DD.log
echo.

pause
