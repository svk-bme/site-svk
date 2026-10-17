[English](README.md) · **Magyar**

<!-- Forrás: README.md. Az angol változat a mérvadó. -->

# site-svk

A Schönherz Vállalati Kapcsolatok (SVK) weboldala az `svk.bme.hu` címen: statikus Astro-oldal magyarul és angolul.

Az SVK webes infrastruktúrájának része. Konvenciók: [svk/infra › CONVENTIONS.hu.md](https://git.sch.bme.hu/svk/infra/-/blob/main/CONVENTIONS.hu.md).

## Mire való

Bemutatja az SVK eseményeit, tagjait és partnereit. Minden tartalom fájlként ebben a repóban van, és böngészőből
szerkeszthető (lásd: [EDITING.hu.md](EDITING.hu.md)). Az elkészült oldal egyszerű statikus fájlokból áll, így bármilyen statikus tárhelyen fut.

## Helyi futtatás

```sh
npm ci
npm run dev      # http://localhost:4321
npm run build    # a statikus kimenet a dist/ mappába kerül
```

Node 22 LTS kell hozzá. <a tényleges parancsokhoz igazítandó>

## Telepítés

- **Most:** minden `main`-be küldött változás a `git.sch.bme.hu`-ról átkerül a `github.com/svk-bme/site-svk` tükörbe, ahol
  a GitHub Actions megépíti az oldalt, és kiteszi GitHub Pagesre az `svk.bme.hu` címre. Ha egy változás nem jelenik meg, az Actions fülön látszik, miért.
- **Később:** az SVK VM maga húzza le és építi meg az oldalt (lásd: `svk/infra`).
- **Visszaállítás:** a hibás commitot kell visszavonni (revert) a `main`-en.

## Nyelvek

- A magyar a gyökérben (`/events`), az angol a `/en/` alatt (`/en/events`).
- Felületi szövegek: <az üzenetfájlok helye>. Tartalom: minden bejegyzésnek van magyar és angol mezője; ha az angol üres, a magyar jelenik meg.

## Kapcsolat

- Tartalom: az SVK körvezetője vagy bármelyik szerkesztő.
- Kód és telepítés: az SVK infrastruktúra-felelőse.
- Éles hiba esetén: [svk/infra › RUNBOOK.md](https://git.sch.bme.hu/svk/infra/-/blob/main/RUNBOOK.md).
