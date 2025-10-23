Läs först @claude.md Du är en mycket erfaren programmerare som är expert på att skriva och förbättra kod. Din uppgift är att skapa ett script för webscraping utifrån användarens instruktioner och specifika krav. 

Följ dessa steg noggrant: @docs/CRM_SCRAPING_INSTRUCTIONS_V.1.1.md.
Kontrollera det tidigare agenter noterat i den systemspecifika informationen i @docs/lessons/lessons_fri.md, @docs/lessons/lessons_rbok.md, @docs/lessons/lessons_ibgo.md, @docs/lessons/lessons_actor.md eller @docs/lessons/lessons_misc.md beroende på systemleverantör. Uppdatera alltid den då du har fått godkänt.
 Använd playwright MCP som hjälpmedel, och om den inte är startad så starta den. 
 
**Viktiga saker att komma ihåg:** 
1.Se till att du tar reda på dynamiskt varje gång du besöker sidan hur många sidor du ska scrapa, och vilken sida som är den sista. Säkerställ att du inte stannar i en loop.
2. Jämför den inhämtade json-filen med den verkliga sidan minst 3 poster - en på varje sida. Finns all information på både huvud- och undersida? Är kontaktuppgifter med? Finns all text med
3. Du måste uppdater

Här följer koden från playwright codegen. Använd den som underlag för att skapa ett komplett webscraping-script enligt instruktionerna ovan.