[English](EDITING.md) · **Magyar**

<!-- Forrás: EDITING.md. Az angol változat a mérvadó. -->

# A weboldal szerkesztése

Hogyan lehet eseményt, tagot vagy partnert hozzáadni vagy módosítani az `svk.bme.hu`-n. Programozni nem kell hozzá.

> Állapot: a böngészős szerkesztő (CMS az `svk.bme.hu/admin` címen) még nincs beállítva. Addig
> a lenti „Amíg nincs kész a szerkesztő” rész szerint lehet szerkeszteni. Képernyőképek a szerkesztő elindulásakor kerülnek ide.

## Mielőtt elkezded

- Kell egy fiók a `git.sch.bme.hu`-n (SCH-fiókkal lehet belépni) és **Developer** szerep az `svk` csoportban.
  Ezt a körvezetőtől kérheted.
- A képeket előre készítsd elő: méretezd át őket (a hosszabbik oldal legfeljebb 2000 px), az eredetiket tartsd az SVK Drive-ján.

## A szerkesztővel (tervezett)

1. Nyisd meg az `svk.bme.hu/admin` oldalt, és lépj be a `git.sch.bme.hu`-fiókoddal.
2. Válassz egy gyűjteményt: **Események**, **Tagok** vagy **Partnerek**.
3. Töltsd ki a magyar mezőket. Az angolokat is töltsd ki; ha üresen hagyod őket, a magyar szöveg jelenik meg.
4. Ha a **Piszkozat** kapcsoló be van kapcsolva, a mentés nem kerül ki az oldalra. Az előnézet a `preview.svk.bme.hu` címen látható.
5. Kapcsold ki a **Piszkozat** kapcsolót, és ments. Az oldal néhány percen belül frissül.

## Amíg nincs kész a szerkesztő

1. Nyisd meg a `git.sch.bme.hu/svk/site-svk` projektet, és menj a tartalom mappájába: <mappa, pl. `src/content/events/`>.
2. Egy bejegyzés módosításához nyisd meg a fájlját, és kattints az **Edit** gombra. Új bejegyzéshez másolj le egy meglévő fájlt, és nevezd át.
3. A `---` sorok közötti szöveget (mezők) és alattuk a leírást módosítsd. A mezők nevét hagyd változatlanul.
4. Írj egy rövid leírást a változtatásról, és **Commit** a `main` ágba.
5. Az oldal néhány percen belül frissül. Ha nem, szólj az infrastruktúra-felelősnek.

## Szabályok

- A magyar kötelező, az angol erősen ajánlott.
- Bejegyzésenként egy kép, ahol a mező kéri; olyan kép ne kerüljön fel, amit az oldal nem jelenít meg.
- Ha egy esemény vagy tag lekerül az oldalról, a képeit vidd át az SVK Drive-jára, ha érdemes megtartani őket.
- Bizonytalan vagy? Kérdezz, mielőtt közzéteszed. Minden változtatás visszavonható, de addig a látogatók is láthatják.
