# Maturitní trenér – ústní zkouška z literatury

Osobní studijní aplikace pro přípravu na **ústní maturitní zkoušku z českého jazyka a literatury**.
Učí jednotlivá díla z maturitního seznamu, opakuje je (spaced repetition), testuje je 11 různými způsoby
a simuluje skutečné zkoušení podle maturitní osnovy.

## Spuštění

```bash
npm install
npm run dev        # vývojový server (http://localhost:5173)
npm run build      # produkční build do dist/
npm run preview    # náhled produkčního buildu
npm test           # testy logiky (vitest)
```

Build je statický (`base: './'`, HashRouter) – složku `dist/` lze otevřít na libovolném statickém hostingu
(GitHub Pages, Netlify…) bez backendu.

## Android aplikace (APK) s upozorněními

Složka `android/` obsahuje malou nativní aplikaci: celá webová aplikace běží ve WebView
a Android k ní přidává **denní připomínku** (AlarmManager – funguje offline, obnoví se po
restartu telefonu), ukládání zálohy do *Stažených souborů* a výběr souboru pro import.

```bash
bash android/setup-tools.sh   # jednorázově: stáhne nástroje z Maven Central a android.jar
npm run android:build         # web → jeden HTML soubor → APK v android/build-apk/
```

Sestavení nepotřebuje Android Studio ani Gradle: `javac` → `dx` (dex) → ARSCLib (zdroje
a binární manifest) → apksig (podpis v2). APK je podepsané klíčem `android/keystore/`;
stejný klíč je potřeba i pro aktualizace, jinak by se aplikace musela odinstalovat (a data
by se ztratila). Připomínka přijde jen ve dny, kdy se uživatel ještě neučil; před maturitou
připomíná počet zbývajících dní.

## Co aplikace umí

| Oblast | Funkce |
|---|---|
| **Dnešní příprava** | přehled (knihy, série, pokrok, naučeno, k zopakování), doporučení na dnešek s odhadem času, rychlý start |
| **Moje knihy** | přidání ručně / ze šablony / z databáze, úprava, mazání, hledání, filtry, oblíbené, naučené, pokrok u každé knihy |
| **Přehled knihy** | kompletní příprava, „Naučit se za 10 minut“, maturitní otázky se vzorovými odpověďmi, vlastní poznámky, pokrok po oblastech |
| **Trénink** | režimy A–K: kartičky, ABC, pravda/lež, přiřazování (klik i drag & drop), doplňování, seřazování, identifikace díla / autora / pojmu, vlastní odpověď, mluvená odpověď (experimentální) |
| **Obtížnost** | 🟢 lehká, 🟡 střední, 🔴 těžká, 🔥 maturita |
| **Rychlé režimy** | Mám 5 / 15 / 30 / 60 minut, 🎲 náhodný trénink, 🔥 jen to, co neumím, 🔁 opakování |
| **Simulace maturity** | provede všemi 14 body osnovy, doplňující otázky zkoušejícího, hodnocení po částech a doporučení |
| **Otestovat celou maturitní otázku** | test po osnově s přehledem výsledků po částech |
| **Literární pojmy** | 90 pojmů – definice, vysvětlení, příklad, příklad z četby, okamžité otestování |
| **Neumělecký text** | cvičné texty a otázky pro I. a II. část analýzy |
| **Musím se doučit** | otázky označené „Neumím“ nebo zodpovězené špatně; zmizí po 2 správných odpovědích v řadě |
| **Můj pokrok** | statistiky, grafy, pokrok podle osnovy a knih, nejsilnější / nejslabší témata, odznaky |
| **Studijní plán** | plán po týdnech podle data maturity – lze upravovat (přesun knih, přidání, splněno) |
| **AI učitel** | volitelně přes Claude API (vlastní klíč) – zkouší a vysvětluje; bez klíče aplikace plně funguje |
| **Data** | vše v `localStorage`, export / import JSON, synchronizace mezi záložkami |

## Architektura

```
src/
  types.ts              datový model (kniha, otázka, pokrok, nastavení)
  data/
    osnova.ts           oblasti maturitní osnovy, kategorie seznamu, otázky zkoušejícího
    books/              databáze 19 děl (do18, st19, svet20, cz20) + šablony
    terms.ts            literární pojmy
    nonart.ts           cvičné neumělecké texty
  lib/
    generator.ts        generování otázek – z jedné informace vzniká více typů otázek
    text.ts             normalizace češtiny, tolerance překlepů, vyhodnocení volné odpovědi podle klíčových bodů
    progress.ts         spaced repetition (varianta SM-2), zvládnutí oblastí, série, XP a úrovně
    session.ts          adaptivní výběr otázek (slabé oblasti, otázky k opakování, „neumím“)
    insights.ts         doporučení, statistiky, odznaky, studijní plán
    quick.ts            předpřipravené tréninky (dnešní, X minut, náhodný…)
    storage.ts          ukládání, migrace, export / import
    speech.ts           rozpoznávání řeči (Web Speech API, čeština)
    ai.ts               AI učitel (Anthropic SDK, streamování)
  store.tsx             stav aplikace (React context) + automatické ukládání
  components/           UI prvky, layout, komponenty typů otázek, průběh a souhrn testu
  pages/                jednotlivé obrazovky
```

### Adaptivní učení

* Každá odpověď aktualizuje **zvládnutí oblasti** (kniha × oblast osnovy) – vážený průměr s útlumem,
  takže novější odpovědi mají větší váhu.
* Každá otázka má **plán opakování**: správně → interval se prodlužuje (1 → 3 → × ease dní),
  špatně → otázka se vrátí za 10 minut.
* Výběr otázek do tréninku upřednostňuje slabé oblasti, otázky po termínu opakování, nové otázky
  a položky ze seznamu „Musím se doučit“.

### Vyhodnocování vlastních odpovědí bez AI

Odpověď se porovná s **klíčovými body** (u knih ručně připravené pro hlubší otázky, u ostatních
automaticky vytvořené z textu). Porovnání ignoruje diakritiku a koncovky (jednoduchý stemming),
ukáže zmíněné a chybějící body a navrhne hodnocení; rozhoduje sebehodnocení uživatele.

## Obsah

Databáze děl je připravena pro maturitní seznam (19 děl). Obsahuje jen informace, u nichž je jistota;
nejisté detaily jsou vynechány. **Údaje vždy ověř se svým vyučujícím nebo v čítance** – každou knihu
lze v aplikaci upravit. Cvičné neumělecké texty jsou vytvořené pro aplikaci.

## AI učitel

V Nastavení lze vložit API klíč Claude (console.anthropic.com). Klíč se ukládá jen v prohlížeči,
není součástí exportu a posílá se výhradně do API Anthropic. Doporučeno pouze na vlastním zařízení.
