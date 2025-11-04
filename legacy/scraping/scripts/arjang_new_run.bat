@echo off
cd /d "%~dp0.."
echo Running Arjang FRI scraper...
npx tsx scraping/arjang_scrape_new.ts
pause
