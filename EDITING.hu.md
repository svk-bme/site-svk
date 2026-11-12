[English](EDITING.md) · **Magyar**

<!-- Forrás: EDITING.md. Az angol változat a mérvadó. -->

# A weboldal szerkesztése

Hogyan lehet eseményt, tagot, partnert, oldalszöveget, űrlapot és a toborzási időszakot módosítani az
SVK weboldalán. Programozni nem kell hozzá.

> Állapot: a böngészős szerkesztő a weboldal `/admin` címén elkészült, de a belépést egyszer be kell állítania az
> infrastruktúra-felelősnek (lásd README). Addig a lenti „Szerkesztő nélkül” rész szerint lehet szerkeszteni.
> Képernyőképek a szerkesztő elindulásakor kerülnek ide.

## Mielőtt elkezded

- Kell egy fiók a `git.sch.bme.hu`-n (SCH-fiókkal lehet belépni) és **Developer** szerep az `svk` csoportban.
  Ezt a körvezetőtől kérheted.
- A képeket előre készítsd elő: méretezd át őket (a hosszabbik oldal legfeljebb 2000 px), az eredetiket tartsd az SVK Drive-ján.

## A szerkesztővel

1. Nyisd meg a weboldal `/admin` oldalát (az oldal címe után `/admin`), és lépj be a `git.sch.bme.hu`-fiókoddal.
2. Válassz bal oldalt egy gyűjteményt (lásd a lenti táblázatot).
3. Minden szövegnek van egy **Magyar** és egy **English** mezője. A magyar kötelező; ha az angol üres, a magyar szöveg jelenik meg.
4. Ments. Az oldal néhány percen belül frissül. Minden mentés egy commit, így visszavonható.

| Gyűjtemény | Mi van benne |
| --- | --- |
| **Events** (Események) | Események időponttal, helyszínnel, előadóval, leírással, képpel, és a jelentkezési űrlap linkje |
| **Members** (Tagok) | A Rólunk oldalon látható tagok |
| **Partners** (Partnerek) | Partnerlogók a Cégeknek oldalon |
| **Pages** (Oldalak) | A Kezdőlap, Rólunk, Cégeknek, Események, Csatlakozz és Adatkezelés oldal szövegei |
| **Settings** (Beállítások) | Toborzási időszak, kapcsolattartási e-mail, közösségi linkek |
| **Forms** (Űrlapok) | Minden űrlap célja, a kért adatok, az adatmegőrzés és a visszavonás módja (az Adatkezelés oldalon is), valamint a Google-űrlap linkje |

A Markdown-mezőkben használható a `**félkövér**`, a `[link](https://…)`, a felsorolás és a `## címsor`.
A dátumok és időpontok budapesti idő szerint értendők; a nyári és téli időszámítást az oldal magától kezeli.

## Események

- **Draft** (piszkozat) bekapcsolva: az esemény nem jelenik meg. (Külön előnézeti oldal tervben van.)
- **Start / End** (kezdés / vége): a vége nem kötelező; ilyenkor a naptárfájl a Beállításokban megadott alapértelmezett hosszal számol.
- **External link** (külső link): az eseménykártya ide mutat az eseményoldal helyett (pl. a MeetUp oldalára).
- **Registration form** (jelentkezési űrlap): az esemény Google-űrlapjának linkje (lásd lent). Az esemény kezdetéig látszik az eseményoldalon.
- Az események a befejezésük utáni reggelre maguktól átkerülnek a „Korábbi események” közé, évenként csoportosítva.
- Minden eseményoldalon van **Hozzáadás a naptárhoz** link; a teljes program a `/events.ics` címen iratkozható fel.

## Toborzási időszak

A Settings → **Recruitment** rész vezérli a Csatlakozz oldalt:

| Mező | Jelentése |
| --- | --- |
| **Status** | *Closed* (zárva): az oldal a „Text while closed” szöveget és az érdeklődési űrlapot mutatja. *Open* (nyitva): a „Text while open” szöveget és a jelentkezési űrlapot |
| **Season opens / closes** | *Open* állapotban a jelentkezési űrlap csak e két dátum között látszik; ezen kívül az érdeklődési űrlap. Zárva az oldal ezeket mutatja a következő időszakként |

Az oldal minden éjjel újraépül, így a dátumok a következő reggelre maguktól érvénybe lépnek.
Egy tipikus év: állítsd be korán a következő időszak dátumait *Closed* állapottal; a kezdés előtt kapcsolj *Open*-re.

**Amikor az időszak elindul,** írj az érdeklődői listán mindenkinek: nyisd meg az érdeklődési űrlap választábláját, és küldd
el a jelentkezési linket a benne lévő címekre (például Gmail körlevéllel vagy titkos másolatban). Írd meg, hogy válaszban
kérhetik a listáról való törlésüket, és töröld, aki kéri.

## Űrlapok (Google Forms)

Az űrlapok Google-űrlapok. Az oldal mindegyik mellett kiírja a célját, az adatmegőrzést és egy linket az Adatkezelés
oldalra; maga az űrlap csak akkor töltődik be, ha a látogató az **Űrlap megjelenítése** gombra kattint.

| Űrlap | Hová kerül a linkje |
| --- | --- |
| Kapcsolatfelvétel (cégek) | Forms → Partner contact → Google Form |
| Érdeklődés (zárt toborzás) | Forms → Interest → Google Form |
| Jelentkezés (nyitott toborzás) | Forms → Application → Google Form |
| Eseményre jelentkezés | Events → az esemény → Registration form |

**Űrlap készítése**

1. Az **SVK Google-fiókjában**, az SVK Drive-ján készítsd, soha ne személyes fiókban (az űrlap a tulajdonosával együtt távozik).
2. Azokat az adatokat kérd, amelyeket a **Forms** alatti szövegek felsorolnak (név, e-mail, …). Ha kérdést adsz hozzá vagy veszel ki,
   a **What is collected** szöveget is frissítsd.
3. Adj hozzá egy kötelező hozzájárulási jelölőnégyzetet, pl. *Hozzájárulok, hogy az SVK a fenti adataimat … kezelje*, és tedd
   az Adatkezelés oldal linkjét az űrlap leírásába.
4. Válaszok fül → **Összekapcsolás a Táblázatokkal**, az SVK Drive-ján. Ha valakinek válaszolnia kell (kapcsolatfelvétel),
   kapcsold be neki az **E-mail-értesítés új válaszokról** opciót.
5. Angol változat: készíts másolatot az űrlapról (⋮ → Másolat készítése), fordítsd le, és a linkjét az **English** mezőbe tedd.
   Ha az angol mező üres, az angol oldalon a magyar űrlap jelenik meg.
6. **Küldés → link ikon**, másold a **hosszú** linket (`https://docs.google.com/forms/d/e/…/viewform`, az *URL rövidítése*
   ne legyen bejelölve), és illeszd be a CMS-be.
7. Az űrlap beállításaiban (Beállítások → Válaszok) a **Korlátozás egy válaszra** legyen kikapcsolva, a **Közzététel → Válaszadók
   kezelése** alatt pedig **Bárki, aki rendelkezik a linkkel** legyen beállítva. Különben a Google bejelentkezést kér, és az űrlap
   nem jelenhet meg az oldalon (kivétel a jelentkezési űrlap: fájlfeltöltéshez mindig be kell jelentkezni).

Az oldalon az űrlap kitölti a képernyőt, és a keretén belül görgethető: a Google nem árulja el az oldalnak, milyen magas egy űrlap.

Fájlt (jelentkezés) csak Google-fiókkal bejelentkezve lehet feltölteni; ezt a Google Forms kéri. A jelentkezési űrlap szövege
szól erről a jelentkezőknek.

**Űrlap lezárása:** Válaszok fül → **Válaszok elfogadása** kikapcsolása. A Google Forms nem tud létszámkorlátot vagy
zárási dátumot: korlátozott létszámú eseménynél figyeld a válaszok számát, és zárd le az űrlapot, amikor betelt.

## Adatkezelés: amit megígérünk

Az oldal azt ígéri, amit a **Retention** szövegek mondanak; automatikusan semmi nem törlődik, ezt a csapat végzi:

| Adat | Törlés |
| --- | --- |
| Eseményjelentkezések | 90 nappal az esemény után |
| Érdeklődői lista | A következő toborzási időszak végén, de legkorábban 12 hónappal a feliratkozás után |
| Jelentkezések (és a feltöltött fájlok) | 3 hónappal az időszak lezárulta után; a felvett tagok adatai az SVK belső nyilvántartásába kerülnek |
| Céges megkeresések | 2 évvel az utolsó kapcsolatfelvétel után |

Töröld a sorokat a választáblából **és** a Google Formsban (Válaszok fül), a feltöltött fájlokat pedig a Drive-ról.
Jó szokás minden félév elején átnézni.

**Ha valaki kéri az adatai törlését** (az Adatkezelés oldal szerint a kapcsolattartási címre ír): keresd meg a címét minden
választáblában, töröld, amit találsz (sorok, válaszok az űrlapban, feltöltött fájlok), és válaszolj neki, ha kész.
Ha az adatmegőrzés idejét módosítod, az űrlap **Retention** szövegét is írd át.

## Szerkesztő nélkül

1. Nyisd meg ezt a projektet a `git.sch.bme.hu`-n, és menj az `src/content/` mappába (például `src/content/events/`).
2. Egy bejegyzés módosításához nyisd meg a YAML-fájlját, és kattints az **Edit** gombra. Új bejegyzéshez másolj le egy
   meglévő fájlt, és nevezd át (a fájlnévből lesz a webcím: `my-event.yaml` → `/events/my-event`).
3. A mezőnevek utáni értékeket módosítsd. A mezőneveket és a behúzást hagyd változatlanul.
   A dátumok és időpontok így néznek ki: `2026-11-12T18:00` (budapesti idő).
4. Írj egy rövid leírást a változtatásról, és **Commit** a `main` ágba.
5. Az oldal néhány percen belül frissül. Ha nem, a build hibát talált a fájlban; szólj az infrastruktúra-felelősnek.

## Szabályok

- A magyar kötelező, az angol erősen ajánlott.
- Bejegyzésenként egy kép, ahol a mező kéri; olyan kép ne kerüljön fel, amit az oldal nem jelenít meg.
- Ha egy esemény vagy tag lekerül az oldalról, a képeit vidd át az SVK Drive-jára, ha érdemes megtartani őket.
- Bizonytalan vagy? Kérdezz, mielőtt közzéteszed. Minden változtatás visszavonható, de addig a látogatók is láthatják.
