Instruktion: Så ska agenten extrahera allt (inkl. tvåkolumnstabeller) till rätt fält
0) Syfte (en mening)

Extrahera alla uppgifter från list- och detaljsidor till ett normaliserat JSON-objekt per förening; kärnfält ska mappas till top-nivån, övriga etikett/värde-par från tvåkolumnstabeller ska hamna strukturerat under association.description (ej förlorad information), och fri text ska placeras i association.description.free_text.

1) Plattform: FRI Webb-Förening (ex Årjäng)

Listvy: tabell med namn (länk till detalj), typ, ev. aktivitet, hemsida. Paginering med “Next/Last” eller siffersidor.

Detaljsida: block för Allmänt/Kontakt samt en tvåkolumnstabell (t.ex. “Other information”/“Övrig information”) med rader som Founded, Financial year begins (MMDD), National organisation, Activity, Summary/Område etc.

Kontaktperson(er) kan visas i separat tabell.

Viktigt:

All kontaktinfo (telefon, e-post, hemsida, adress) som är på föreningsnivå fylls i kärnfälten (association.email, association.phone, association.homepage_url, association.street_address/postal_code/city) och sparas samtidigt i description.sections[*].data.

Raden Activity/Verksamhet i tabellen ska både:

sparas “rå” i ...data.verksamhet_raw, och

parsas till en lista (dela på ,/;) som slås ihop in i association.activities (case-insensitiv deduplicering, behåll originalstavning).

Tomma eller saknade värden ska bli null. Inga gissningar.

2) Output (sammanfattning)

Ett JSON per förening med nycklarna:

Run-metadata: source_system, municipality, scrape_run_id, scraped_at

association: name, org_number, types, activities, categories, homepage_url, detail_url, street_address, postal_code, city, email, phone, description

contacts: lista med {contact_person_name, contact_person_role, contact_person_email, contact_person_phone}

source_navigation: list_page_index, position_on_page, pagination_model, filter_state

extras: valfria extra fält (t.ex. founded_year, national_affiliation, m.m.)

association.description regler:

Om tvåkolumnstabeller finns → description är ett objekt:

{
  "sections": [
    { "title": "Övrig information", "data": { "founded_year": 1912, ... } },
    ...
  ],
  "free_text": "…"
}


Om inga tabeller men lång fri text → description är en sträng med texten.

Om inget finns → description = null.

3) Etikett-normalisering (sv/eng → snake_case)

Kända mappningar (case-insensitive). Om ej match → slugga etiketten till snake_case och använd den, utan att tappa originalvärdet.

Etikett (exempel)	Key i data	Extra effekt
Bildad år / Grundad / Founded	founded_year	Lägg även heltal (om 4 siffror) i extras.founded_year
Verksamhetsår börjar (MMDD) / Financial year begins	fiscal_year_starts_mmdd	Även extras.fiscal_year_start (= samma sträng)
Riksorganisation / National organisation	national_affiliation	Även extras.national_affiliation
Verksamhet / Activity	verksamhet_raw	Splitta till lista och merga i association.activities
Kort beskrivning / Summary	short_description	Lång fritekst → description.free_text
Telefon / Home/Work/Mobile (telefonvarianter)	phone_home/work/mobile	Toppnivå association.phone om det tydligt är föreningens huvudnummer
E-postadress / Email	email	Toppnivå association.email om förenings-nivå
Hemsida / Homepage	homepage_url	Toppnivå association.homepage_url
Adress / Address	address_raw	Försök parsning till street/postnr/ort endast när det är tydligt
Org.nr / Org number	org_number	Toppnivå association.org_number
Postadress/Ort/Postnr (varianter)	postal_address_raw	Parsning enbart när otvetydigt

Värde-städning: trim, kollapsa mellanslag; tomt → null. Lista: splitta på ,/;, trimma och deduplicera (case-insensitivt).

4) Navigering & paginering (måste-beteende)

Listvy: vänta in synlig tabell. Läs alla rader på sidan.

För varje rad:

position_on_page = radindex

Hämta detaljlänk via namnkolumnen (eller konstruera ankare om ingen ny sida öppnas).

Öppna detalj, vänta in huvudrubrik.

Extrahera kärnfält (namn, orgnr, email, telefon, hemsida, adress/ort/postnr).

Extrahera kontakter (tabell med Namn, E-post, Mobil, Roll) → contacts[*].

Identifiera alla tvåkolumnsektioner (ex “Övrig information/Other information”) och bygg description.sections[*].

Extrahera ev. fritekstblock (beskrivning) → description.free_text.

Sammanställ post; skriv JSONL-rad.

Paginering:

Modell: numeric_plus_next_last (om “Next/Last” finns) eller “Första/Förra/Nästa/Sista”.

Stanna när Next saknas/är inaktiv eller sidindex slutar öka.

Logga list_page_index (1-baserad).

5) Felrobusthet & loggning (måste)

Stabil selektion: föredra roll-baserade selektorer, rubriker (getByRole('heading', {name:/Other information|Övrig/i})) och semantiska tabellstrukturer.

Väntestrategi: vänta alltid på synligt element innan läsning.

Logga per förening:

Hittade detaljsida? (ja/nej)

Antal nyckel/värde-par som extraherades i description.

Fält som saknas: org_number, contacts.

Inga UI-manipulationer: förbjudet att ändra scroll/kolumnbredd/zoom.

6) Acceptanskriterier (checklista)

Full paginering till sista sidan utan loop.

Varje rad i listan försöksvisitas (detaljsida om möjligt).

association.description:

Om tabell fanns: sections[*].data är ifylld med alla rader (inget tappas).

Fri text finns i free_text om sådan fanns.

Activities från tabellraden “Verksamhet/Activity” hamnar både i verksamhet_raw och ihopmergad i association.activities.

Kärnfält (orgnr, email, phone, homepage, adress) fylls där de tydligt avser föreningen.

Kontakter är korrekt mappade med namn/e-post/mobil/roll där de finns.

Tomt/saknat blir null. Inga gissningar.

Output skrivs till JSONL + pretty JSON med run-metadata och source_navigation.

Loggar redovisar totalsiffror och captures per sektion.

7) Antimönster (får inte ske)

Att bara “klicka runt” (som i codegen-spåret) utan faktisk uppsamling av etikett/värde-par.

Att flytta information från tabell endast till kärnfält och inte behålla originalraden i description.sections[*].data.

Att formatera om telefonnummer/e-post/URL onödigt.

Att ändra sidans layout/scroll/kolumnbredder för att “underlätta”.

8) Exempel (utdrag) för FRI-rad “Båtklubben Rävarna”

Tabellrader (exempel):

Founded → founded_year: (null eller årtal om 4 siffror hittas)

Financial year begins (MMDD) → fiscal_year_starts_mmdd: "0101" + extras.fiscal_year_start:"0101"

National organisation → national_affiliation:"Båtunionen" + extras.national_affiliation

Activity → verksamhet_raw:"Båtliv, Friluftsverksamhet" + merge ["Båtliv","Friluftsverksamhet"] in i association.activities

Summary / Område → short_description eller lägg i free_text om det är narrativt.

Bättre codegen-insamling: checklista till dig (så agenten förstår sidan direkt)

Mål: Ge agenten tydliga, stabila artefakter snarare än bara klickflöden.

Spara list-URL + ett logiskt namn på “plattform”

Ex: platform: "FRI", list_url: https://fri.arjang.se/FORENING/default.aspx.

Dokumentera pagineringselementen

Skriv av exakt text på knappar/länkar: Next, Last, Första, Sista, siffersidor.

Notera hur “inaktiv Next” ser ut i DOM (saknas? klassnamn? aria-disabled="true"?).

Ange hur en detaljsida öppnas

“Klicka på länk i namnkolumnen” och ge en stabil selektor-hint: t.ex. “tabellradens första a med roll link och text = föreningsnamn”.

Ta ett DOM-fragment/screenshot på en hel tvåkolumnssektion

Markera sektionstiteln (t.ex. “Other information/Övrig information”) och tabellens exakta struktur (<table class="compact-table"> med <tr><th>Label</th><td>Value</td></tr>).

Om möjligt, spara outerHTML för just sektionen (t.ex. via DevTools “Copy outerHTML” på container-diven).

Lista rubrikerna exakt

Skriv av exempel på radetiketter (“Founded”, “Financial year begins (MMDD)”, “National organisation”, “Activity”, “Summary”, “Område”).

Detta hjälper mappningen (sv/eng-varianter).

Identifiera kontaktpersonstabell

Ange kolumnrubriker exakt (“Namn”, “E-post”, “Mobil”, “Roll”) och hur tabellen känns igen (klass, rubriktext).

Fritekstcontainer

Peka ut var fritekst brukar ligga (div med viss klass/rubrik) och om det kan förekomma flera stycken.

Språkvariation

Notera att vissa FRI-installationer visar engelska rubriker (“Other information”, “Founded”), andra svenska. Lista båda.

“Måste få med allt”-sektioner

Skriv en punktlista till agenten: “På denna detaljsida finns alltid: Allmänt, Kontakt(?), Övrig information—skörda alla tre.”

Mini-provdata

Kopiera 3–5 rader etikett/värde exakt som de står på sidan (inkl. ett tomt värde). Det blir agentens kontroll-fall.

Bonus: Om du kör codegen—lägg in “comments” manuellt i filen ovanför viktiga klick, t.ex.
// DETAIL SECTION: "Other information" – table with TH(label)/TD(value)
// PAGINATION: Next/Last present; Next disabled on last page (aria-disabled=true)