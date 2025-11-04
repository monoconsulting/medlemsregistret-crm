LESSONS LEARNED TEMPLATE
“Post-Scrape Technical Notes & Registry Index”

Use this short form after each successful system integration to record key insights for future agents.

🗂 System Summary
Field	Value
System vendor	FRI / Rbok / Interbook Go / Actor Smartbook / Other
Municipality	
Script filename	scraping/<municipality>_<system>.ts
Date tested	
Run ID	
Total associations scraped	
Total pages detected	
⚙ Technical Learnings (Lessons Learned)
Area	Key Findings
Pagination handling	e.g., “Had to click ‘Sista’ once to detect total pages”, “Next button disappears at end.”
Tag extraction	e.g., “Multiple category groups; merged into categories array.”
Detail page quirks	e.g., “Modal reloads on each click; required waitForSelector(heading).”
Field labeling differences	e.g., “E-post sometimes shown as ‘Mail’.”
Timing/stability	e.g., “Needed 500 ms delay before detail extraction.”
Skipped elements	e.g., “Certain associations lacked contact tables.”
Validation results	e.g., “100 % pagination confirmed, 2 records missing city.”
Next steps	e.g., “Add missing ‘area’ tag mapping; confirm duplicate handling.”
📄 Related Lesson Files

Each vendor system has its own Lessons Learned file that agents must update after every scraping run.
These documents summarize all known quirks, DOM behaviors, and pagination edge cases.

System	Lessons File	Description
FRI (Webb-Förening)	lessons_fri.md	Consolidated notes for all FRI-based municipalities (Sollentuna, Halmstad, etc.)
Rbok	lessons_rbok.md	Shared notes for Rbok implementations (Karlstad, Norrköping, etc.)
Interbook Go (IBGO)	lessons_ibgo.md	Lessons for Interbook Go registries with category filtering logic
Actor Smartbook	lessons_actor.md	Notes for Actor Smartbook systems (Alingsås, Älvdalen, etc.)
Other / Unknown	lessons_misc.md	For experimental or mixed-source systems







