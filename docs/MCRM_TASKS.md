Läs först @.prompts/start.prompt.md

## Ditt uppdrag

### Start:

- Läs @.prompts\start.prompt.md . 
- Läs worklog skriven med gårdagens datum @docs\worklogs\25-11-08_Worklog.md

### Ditt uppdrag:

+ Att analysera föreningssidans modaler
+ Att skapa en omfattande plan utifrån 
+ Att säkerställa full funktionalitet i dessa



## Context

- På föreningssidan (associations) finns ett antal modaler implementerade - men detta är slarvigt genomfört varför vi nu måste säkerställa funktionalitet i alla modalers respekitve fält
- Gå igenom varje modal. Testa varje fält, verifiera att data sparas och att data uppdateras.
- Då din implementation är klar ber du mig bygga om
- Därefter gör du test med filen @web\tests\crm-kommuner-foreningar.spec.ts. 

Ditt uppdrag: samtliga modaler ovan ska fungera och kunna uppdatera databasen med relevant information.

**Har du några frågor till mig gällande ditt uppdrag?**









- Systemet jobbar mot en frontend som vi via ftp publicerar till ett webhotell hos leverantören loopia. 
- Systemet ska kopplas mot loopias databas. 
- Du finner information om detta i .env-filerna, docker compose, claude.md mm.
- Designen får under inga omständigheter ändras.
- Mockdata är absolut förbjuden och ska elimineras och ersättas med korrekt koppling mot databasen

## Ditt uppdrag

Designen har blivit uppdaterad - men n har vi istället två nya problem:

### Menyval Kommuner:

- Här saknas data helt. 
- Det verkar inte alls finnas någon koppling till databasen.
- Denna måste du koppla mot loopias databas
- Du ska sedan se data ifylld i samtliga kolumner och dropdowns, funktioner osv.1

Viktiga kolumner:

* Föreningsregister: Här ska **systemtyp **skrivas ut ( RBOK, FRI, etc) -  hämtas från Municipality.platform och **SKA LÄNKAS** till föreningsregistret Municipality.register.Url

* Kartan längst till höger MÅSTE fungera. Du SKA HÄMTA Municipality.longitude och Municipality.latitude. Orten ska vara **centrerad** på bilden. Granska bilden om orten ligger MITT I INDISKA OCEANEN så har du bytt plats på longitude och latitude
* Designen finns i kodbasen i /figma om du skulle fundera på den och på länken https://www.figma.com/make/KAtuDucijPTgOLMaNiN6Fc/CRM-System-Design-Proposal?node-id=0-1&p=f&t=9gYoedIGUjfFosqf-0&fullscreen=1 finns rätt design

### Menyval Föreningar

- Denna sida har havererat helt och det går inte att komma in på den alls
- Felsök vad detta beror på och därefter SÄKERSTÄLL ATT HELA SIDAN FUNGERAR SOM TÄNKT. Alla kolumner fält knappar och annat ska ha kopplingar mot databasen.

Då du är klar:
**Du SKA göra ett test och du MÅSTE använda denna codegen som jag vet fungerar och loggar in:**

E:\projects\CRM\web\codegen\crm.codegen.full.site.walktrhough.spec.ts

Du ska skapa ett test utifrån detta för att kontrollera:

1. Har Kommunerna rätt data??!
2. Fungerar Föreningssidan till 100%
3. **Du ska INTE GÖRA världens största och bästa test** - du ska BARA ta reda på detta.

### ACTIONS

1. Skapa testet och kör detta - ser du att Kommunerna saknar data och Föreningssidan är tom? Då är det rätt.
2. Åtgärda problemen som bekrevs
3. Kör testet igen
4. Iterera över detta tills samtliga problem är lösat.

**Till slut:**

Du får **ABSOLUT INTE** ändra testet så att det går igenom eller **FUSKA LJUGA ELLER FARA MED OSANNING.**

Du **SKA** lösa alla delar i denna uppgift.

**Ställ mig först frågor,** gör därefter en detaljerad **plan** och **task list ** att se till att detta fixar sig.





| Checkbox | Kommun      | Förening                   | Status | Pipeline    | Kontakt        | Föreningstyp | Taggar        | Uppdaterad |
| :------- | :---------- | :------------------------- | :----- | :---------- | :------------- | :----------- | :------------ | :--------- |
|          | Malmö       | Malmö Fotbollsklubb        | Aktiv  | Kontaktad   | Lars Andersson | Sport        | FotbollUngdom | 2025-11-03 |
|          | Lund        | Lunds Naturvänner          | Aktiv  | Lead        | Maria Svensson | Miljö        | NaturMiljö    | 2025-11-05 |
|          | Helsingborg | Helsingborg Teaterförening | Aktiv  | Förhandling | Erik Johansson | Kultur       | TeaterKultur  | 2025-11-01 |

- [ ] <- Checkbox: 

- Kommun

- Förening (Länk till föreningens hemsida)

- Status (om kund till medlemsregistret)

- Pipeline: Försäljjningsstatus

- Kontaktperson (Namn, Epost, Telefon. Om första person finns ta den annars ta den som finns)

- Föreningstyp (lista från föreningstyperna)

- Taggar

- Antal medlemmar

  

Kommun

Felaktig design

#### Kommunlista

Visar 10 av 10 kommuner

|      | Kommunnamn  | Kommunkod | Landskap      | Län                  | Länskod | Region                   | Befolkning | Antal föreningar | Aktiva föreningar | Föreningsregister                                  |
| :--- | :---------- | :-------- | :------------ | :------------------- | :------ | :----------------------- | :--------- | :--------------- | :---------------- | :------------------------------------------------- |
|      | Göteborg    | 1480      | Västergötland | Västra Götalands län | 14      | Västra Götalandsregionen | 583 000    | 1654             | 1123              | [Öppna](https://foreningsregistret.se/goteborg)    |
|      | Helsingborg | 1283      | Skåne         | Skåne län            | 12      | Region Skåne             | 149 000    | 567              | 398               | [Öppna](https://foreningsregistret.se/helsingborg) |

- Kommunnamn - länka till kommunens hemsida
- Föreningsregister (RBOK, FRI, etc) - länka till föreningssidan

Klick ger öppnad högervy

