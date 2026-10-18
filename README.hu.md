[English](README.md) · **Magyar**

<!-- Forrás: README.md. Az angol változat a mérvadó. -->

# site-svk

A Schönherz Vállalati Kapcsolatok (SVK) weboldala: statikus Astro-oldal magyarul és angolul.
A nyilvános címe az `src/content/settings/site.yaml` `site_url` mezője; a kód sehol máshol nem feltételez címet vagy gyökérútvonalat.

Az SVK webes infrastruktúrájának része. Konvenciók: [svk/infra › CONVENTIONS.hu.md](https://git.sch.bme.hu/svk/infra/-/blob/main/CONVENTIONS.hu.md).
Specifikáció: [SPEC.md](SPEC.md). Hogyan kapja meg a `service-forms` az oldal űrlapjait: [FORMS.md](FORMS.md).

## Mire való

Bemutatja, kik vagyunk, az SVK eseményeit (naptárfájllal és jelentkezéssel), tagjait és partnereit, tartalmazza a
cégeknek szóló kapcsolatfelvételi űrlapot, és a Csatlakozz oldalt, amely a toborzási időszaktól függően érdeklődési
vagy jelentkezési űrlapot mutat. Minden tartalom fájlként ebben a repóban van, és böngészőből szerkeszthető
(lásd: [EDITING.hu.md](EDITING.hu.md)). Az elkészült oldal egyszerű statikus fájlokból áll, így bármilyen statikus
tárhelyen fut. Minden, amit a látogatók beküldenek, a `service-forms`-hoz kerül, amely az oldal `/forms.json` fájljából dolgozik; amíg
ennek a címe nincs beállítva, az űrlapok helyén „hamarosan” felirat áll. A levelekben lévő linkek a `/confirm`,
`/unsubscribe` és `/delete` oldalra vezetnek, amelyek csak akkor lépnek, ha a látogató megnyomja a gombot.

## Helyi futtatás

```sh
npm ci
npm run dev          # http://localhost:4321
npm run build        # típusellenőrzés + statikus kimenet a dist/ mappába
npm run preview      # a dist/ kiszolgálása
npm test             # egységtesztek (dátumok és időzónák)
```

Node 24 LTS kell hozzá (`.nvmrc`). Opcionális környezeti változók a buildhez:

| Változó | Hatása |
| --- | --- |
| `SHOW_DRAFTS=true` | A piszkozat események is megjelennek (előnézeti oldal) |
| `FORMS_API_URL` | Felülírja a beállításokban megadott űrlapszolgáltatás-címet |
| `SITE_URL` | Felülírja a beállításokban megadott oldalcímet (pl. előnézeti oldalhoz) |
| `BASE_PATH` | Az oldal egy útvonal alatt fut, pl. `/<repo>` (alapértelmezés: a gyökér) |

Minden belső URL a `src/i18n/index.ts` `withBase()` / `localePath()` függvényén megy át, amelyek az `import.meta.env.BASE_URL`-t
használják; a szerkesztők által Markdownban írt, `/`-rel kezdődő linkek is megkapják az útvonalat.

## Felépítés

```
src/
  content/              minden tartalom, a CMS-ben szerkeszthető (bejegyzésenként egy YAML-fájl, mellette a képek)
    events/ members/ partners/ questions/   gyűjtemények, amelyekhez a szerkesztők új elemet adnak
    pages/ forms/ emails/                   állandó szövegek: oldalak, űrlapszövegek, levélsablonok
    actions/ notices/                       a levelek linkjeinek oldalai (/confirm, ...) és az utánuk következő eredményoldalak
    settings/site.yaml                      toborzási időszak, kapcsolat, közösségi linkek, űrlapszolgáltatás címe
  content.config.ts     minden tartalomtípus sémája (hibás tartalomnál a build érthető hibával leáll)
  i18n/                 felületi szövegek (hu.json, en.json) és nyelvi segédfüggvények
  lib/                  események, űrlapok (definíciók → oldalak; forms-json.ts → /forms.json), időzónák, naptárfájlok
  views/                a két nyelv közös oldaltörzsei; a pages/ csak az URL-eket köti hozzájuk
  components/           fejléc, lábléc, eseménykártya, általános űrlap, jelentkezési blokk
  scripts/forms.ts      az űrlapok böngészőoldali része
  styles/               tokens.css (színek, betűk, térközök), base.css, components.css
src/cms/config.yml      Sveltia CMS-beállítás (a content.config.ts tükre); az src/pages/admin/ adja a szerkesztő oldalát és beállítását
integrations/           sveltia-cms.mjs: a szerkesztőt az oldal maga szolgálja ki (CDN nélkül)
```

A stílusok csak a `tokens.css` változóit és a `components.css` osztályait használják, így egy design system
az oldalak logikájának módosítása nélkül lecserélheti őket.

## Telepítés

- **Most:** minden `main`-be küldött változás a `git.sch.bme.hu`-ról átkerül az SVK GitHub-szervezetébe (azonos repónévvel,
  lásd CONVENTIONS), ahol a GitHub Actions (`.github/workflows/deploy.yml`) megépíti az oldalt, és kiteszi GitHub Pagesre.
  Minden éjjel is újraépül, így az események időben kerülnek a korábbiak közé, és a toborzási időszak a megadott
  dátumokon vált. Ha egy változás nem jelenik meg, az Actions fülön látszik, miért.
  Egyszeri beállítás: *Settings → Pages → Source: GitHub Actions*, és az egyéni domain a *Settings → Pages* alatt
  (Actions-alapú telepítésnél nem kell CNAME-fájl). A workflow a `SITE_URL`-t és a `BASE_PATH`-t az `actions/configure-pages`-től
  kapja: egyéni domain nélkül `https://<owner>.github.io` és `/<repo>`, egyéni domainnel a domain és a gyökér.
  A kód egyiket sem feltételezi.
  A GitHub 60 nap commit nélkül szünetelteti az ütemezett futásokat; ilyenkor az Actions fülön újra kell engedélyezni.
- **Később:** az SVK VM maga húzza le és építi meg az oldalt (lásd: `svk/infra`).
- **Visszaállítás:** a hibás commitot kell visszavonni (revert) a `main`-en.

**Belépés a CMS-be** (`/admin`): a `git.sch.bme.hu`-n létre kell hozni egy OAuth-alkalmazást (`svk` csoport → Settings →
Applications, redirect URI `<az oldal címe>/admin/`, scope `api`, nem bizalmas), és az Application ID-ját beírni az
`src/cms/config.yml` `backend.app_id` mezőjébe. Az oldal címét és az útvonalat a build tölti ki (`/admin/config.yml`). Addig a szerkesztők személyes hozzáférési tokennel léphetnek be.

**A szerkesztőt az oldal maga szolgálja ki.** A `@sveltia/cms` rögzített verziójú npm-függőség; az `integrations/sveltia-cms.mjs`
átmásolja az `/admin/cms/` alá, és mindent, amit futás közben betölt (kódrészek, felületi fordítások, betűtípusok, néhány npm-csomag),
a `node_modules`-ból vett helyi másolatokra irányít. Ha CDN-cím marad benne, a build leáll. Az `/admin` Content Security Policyje
csak ezt az oldalt és a CMS-beállítás `backend` részében megadott git-szervert engedi (`<meta>` tagként, mert a GitHub Pages nem tud fejlécet küldeni).
Nincs helyben, mert ez a CMS-beállítás nem használja: kódkiemelés, dátum-lokalizáció, térkép, PDF-előnézet, HEIC/WebP-átalakítás.

A szerkesztő frissítése: `npm install --save-exact @sveltia/cms@<verzió>`, majd `npm run build`. Ha a build betűtípust vagy csomagot
nevez meg, telepítsd a `@fontsource` csomagot a hibában szereplő verzióval, vagy vedd fel a csomagot a `runtimePackages` közé.
Pusholás előtt nyisd meg az `/admin` oldalt, és nézd meg a böngésző konzolján, van-e CSP-üzenet.

## Nyelvek

- A magyar a gyökérben (`/events`), az angol a `/en/` alatt (`/en/events`). A régi `/event/<slug>` címek átirányítanak.
- Felületi szövegek: `src/i18n/hu.json` és `src/i18n/en.json`. Tartalom: minden bejegyzésben `{ hu, en }` mezők;
  ha az angol üres, a magyar jelenik meg.

## Kapcsolat

- Tartalom: az SVK körvezetője vagy bármelyik szerkesztő.
- Kód és telepítés: az SVK infrastruktúra-felelőse.
- Éles hiba esetén: [svk/infra › RUNBOOK.md](https://git.sch.bme.hu/svk/infra/-/blob/main/RUNBOOK.md).
