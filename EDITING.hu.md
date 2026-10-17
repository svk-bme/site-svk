[English](EDITING.md) · **Magyar**

<!-- Forrás: EDITING.md. Az angol változat a mérvadó. -->

# A weboldal szerkesztése

Hogyan lehet eseményt, tagot, partnert, oldalszöveget, űrlapot, levelet és a toborzási időszakot módosítani az
`svk.bme.hu`-n. Programozni nem kell hozzá.

> Állapot: a böngészős szerkesztő az `svk.bme.hu/admin` címen elkészült, de a belépést egyszer be kell állítania az
> infrastruktúra-felelősnek (lásd README). Addig a lenti „Szerkesztő nélkül” rész szerint lehet szerkeszteni.
> Képernyőképek a szerkesztő elindulásakor kerülnek ide.

## Mielőtt elkezded

- Kell egy fiók a `git.sch.bme.hu`-n (SCH-fiókkal lehet belépni) és **Developer** szerep az `svk` csoportban.
  Ezt a körvezetőtől kérheted.
- A képeket előre készítsd elő: méretezd át őket (a hosszabbik oldal legfeljebb 2000 px), az eredetiket tartsd az SVK Drive-ján.

## A szerkesztővel

1. Nyisd meg az `svk.bme.hu/admin` oldalt, és lépj be a `git.sch.bme.hu`-fiókoddal.
2. Válassz bal oldalt egy gyűjteményt (lásd a lenti táblázatot).
3. Minden szövegnek van egy **Magyar** és egy **English** mezője. A magyar kötelező; ha az angol üres, a magyar szöveg jelenik meg.
4. Ments. Az oldal néhány percen belül frissül. Minden mentés egy commit, így visszavonható.

| Gyűjtemény | Mi van benne |
| --- | --- |
| **Events** (Események) | Események időponttal, helyszínnel, előadóval, leírással, képpel; jelentkezés, emlékeztető és visszaigazoló levél |
| **Members** (Tagok) | A Rólunk oldalon látható tagok |
| **Partners** (Partnerek) | Partnerlogók a Cégeknek oldalon |
| **Pages** (Oldalak) | A Kezdőlap, Rólunk, Cégeknek, Események, Csatlakozz és Adatkezelés oldal szövegei |
| **Settings** (Beállítások) | Toborzási időszak, kapcsolattartási e-mail, közösségi linkek |
| **Forms** (Űrlapok) | Minden űrlap célja, adatmegőrzése, hozzájárulási és köszönőszövege (az Adatkezelés oldalon is megjelenik) |
| **Quick questions** (Gyors kérdések) | Választható kérdések az érdeklődési és a jelentkezési űrlapon |
| **Emails** (Levelek) | Érdeklődés megerősítése, „elindult a toborzás”, törlés megerősítése, az érdeklődői levelek lábléce |
| **Email link pages** (Levéllink-oldalak) | Az oldalak, amelyeket a megerősítő, leiratkozó és törlő linkek megnyitnak; semmi nem történik, amíg a látogató meg nem nyomja a gombot |
| **Result pages** (Eredményoldalak) | Az ezek után megjelenő oldalak (megerősítve, leiratkozva, törölve, a link már nem érvényes) |

A Markdown-mezőkben használható a `**félkövér**`, a `[link](https://…)`, a felsorolás és a `## címsor`.
A dátumok és időpontok budapesti idő szerint értendők; a nyári és téli időszámítást az oldal magától kezeli.
Minden levélnél van **Send a test copy to** mező: ha beírod a címed, a szöveg minden módosításakor kapsz egy tesztpéldányt (mindkét nyelven).

## Események

- **Draft** (piszkozat) bekapcsolva: az esemény nem jelenik meg. (Előnézeti oldal a `preview.svk.bme.hu` címen tervben van.)
- **Start / End** (kezdés / vége): a vége nem kötelező; ilyenkor a naptárfájl a Beállításokban megadott alapértelmezett hosszal számol.
- **External link** (külső link): az eseménykártya ide mutat az eseményoldal helyett (pl. a MeetUp oldalára).
- Az események a befejezésük utáni reggelre maguktól átkerülnek a „Korábbi események” közé, évenként csoportosítva.
- Minden eseményoldalon van **Hozzáadás a naptárhoz** link; a teljes program a `/events.ics` címen iratkozható fel.

**Jelentkezés** (az űrlapszolgáltatás kell hozzá; addig az űrlap helyén „hamarosan” felirat áll):

1. Nyisd meg az esemény **Registration** részét, és kapcsold be a **Registration on this site** kapcsolót.
2. Nem kötelező: **Capacity** (létszám), **Opens** (nyitás), **Closes** (zárás; ha üres, az esemény kezdetekor zár).
3. A nevet, e-mail-címet, tanulmányokat és a hozzájárulást mindig kérjük. Szükség esetén adj hozzá **Extra questions**
   (további kérdések) elemeket: kérdés, típus (rövid szöveg, hosszú szöveg, egy választás, több választás, jelölőnégyzet) és opciók.
   Ha már jelentkeztek, ne írd át a kérdést; inkább vegyél fel újat (a válaszokat kérdésenként tároljuk), vagy az első
   jelentkezés előtt töltsd ki a **Column key** / **Stored value** mezőt, így a későbbi átnevezés sem gond.
4. Az oldal magától mutatja az állapotot: még nem nyílt meg, nyitva, betelt, lezárult, lezajlott.

**Emlékeztető levél:** kapcsold be, add meg, hány órával a kezdés előtt menjen ki, és írd meg a tárgyát és szövegét.
Helyőrzők: `{name}`, `{event_title}`, `{date}`, `{place}`, `{event_url}`. A **jelentkezés visszaigazolása** levél ugyanígy működik.

## Toborzási időszak

A Settings → **Recruitment** rész vezérli a Csatlakozz oldalt:

| Mező | Jelentése |
| --- | --- |
| **Status** | *Closed* (zárva): az oldal a „Text while closed” szöveget és az érdeklődési űrlapot mutatja. *Open* (nyitva): a „Text while open” szöveget és a jelentkezési űrlapot |
| **Season opens / closes** | *Open* állapotban csak e két dátum között lehet jelentkezni; ezen kívül az érdeklődési űrlap látszik. Zárva az oldal ezeket mutatja a következő időszakként |

Az oldal minden éjjel újraépül, így a dátumok a következő reggelre maguktól érvénybe lépnek.
Egy tipikus év: állítsd be korán a következő időszak dátumait *Closed* állapottal; a kezdés előtt kapcsolj *Open*-re.

Amikor az időszak elindul, az érdeklődői listán mindenki megkapja a **Recruitment is open** levelet (Emails) egy személyes
linkkel, amely a korábbi válaszaival kitöltve nyitja meg a jelentkezési űrlapot. Ha egy adott napon szeretnéd kiküldeni,
töltsd ki a **Send on** dátumot.

## Űrlapok és adatkezelés

- Minden űrlap mutatja a célját, az adatmegőrzés idejét és egy linket az Adatkezelés oldalra. Ezek a szövegek a **Forms** alatt vannak.
  Az Adatkezelés oldal innen magától felsorolja az összes űrlapot, és az „adataim törlése” űrlappal zárul.
- Ha az adatmegőrzés idejét módosítod, a **Retention (in words)** és a **Retention (for the form service)** mezőt is írd át.
- A **Same email address again** dönti el, mi történjen, ha valaki kétszer küldi el az űrlapot: elutasítjuk, frissítjük a korábbi válaszait, vagy engedjük.
- A **Quick questions** a **Ask on** mezőben kiválasztott űrlapo(ko)n jelennek meg.

## Szerkesztő nélkül

1. Nyisd meg a `git.sch.bme.hu/svk/site-svk` projektet, és menj az `src/content/` mappába (például `src/content/events/`).
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
