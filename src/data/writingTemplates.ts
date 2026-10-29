/**
 * Šablony slohových útvarů – kostra textu s připravenými obraty, do které se jen doplní obsah.
 * Úprava úředního dopisu podle Internetové jazykové příručky ÚJČ (ČSN 01 6910):
 * předmět bez slova „Věc“, místo a datum bez čárky, oslovení v 5. pádě s čárkou a text dál malým písmenem,
 * „S pozdravem“ bez interpunkce, Vy/Váš velkým písmenem.
 */

export interface TemplateVariant {
  id: string;
  label: string;
  /** Kostra textu; [v hranatých závorkách] je to, co se doplní */
  text: string;
}

export interface WritingTemplate {
  form: string;
  variants: TemplateVariant[];
  /** Hotové obraty podle části textu */
  phrases: { part: string; items: string[] }[];
}

export const WRITING_TEMPLATES: WritingTemplate[] = [
  {
    form: 'uvaha',
    variants: [
      {
        id: 'uvaha',
        label: 'Úvaha',
        text: `[Název úvahy – často otázka]

[Úvod: představ problém a polož otázku. Např.: Kdo z nás se ještě nezamyslel nad tím, zda …? Na první pohled se zdá, že …, ale je to opravdu tak?]

[1. odstavec stati: argument PRO. Na jedné straně je pravda, že … Dobře to ukazuje příklad …]

[2. odstavec stati: argument PROTI. Na druhé straně však nelze přehlédnout, že … Sám jsem zažil situaci, kdy …]

[3. odstavec stati: zvážení obou pohledů, další příklad, případně citát nebo zkušenost z četby.]

[Závěr: vlastní stanovisko. Domnívám se tedy, že … Možná by stálo za to, abychom …]`,
      },
    ],
    phrases: [
      { part: 'Úvod', items: ['Kdo z nás se ještě nezamyslel nad tím, …?', 'V poslední době se stále častěji mluví o …', 'Na první pohled se zdá, že …'] },
      { part: 'Stať', items: ['Na jedné straně … , na druhé straně …', 'Je pravda, že …, avšak …', 'Dobrým příkladem je …', 'Nelze však přehlédnout, že …', 'Z toho vyplývá, že …'] },
      { part: 'Závěr', items: ['Domnívám se tedy, že …', 'Na závěr bych rád zdůraznil, že …', 'Odpověď na otázku z názvu proto není jednoduchá, ale …'] },
    ],
  },
  {
    form: 'vypravovani',
    variants: [
      {
        id: 'vypravovani',
        label: 'Vypravování',
        text: `[Název – neprozrazuj pointu]

[Úvod (expozice): kdo, kdy, kde. Bylo to jednoho … odpoledne, když …]

[Zápletka: co se stalo neobvyklého. Najednou …]

[Rozvíjení děje: přímá řeč, pocity postav, popis prostředí.
„…,“ řekl …
„…?“ zeptala se …]

[Vyvrcholení: nejnapínavější okamžik, krátké věty, historický prézens. V tu chvíli se ozve …]

[Rozuzlení a závěr: jak to dopadlo, pointa. Od té doby …]`,
      },
    ],
    phrases: [
      { part: 'Začátek', items: ['Bylo to jednoho … rána, když …', 'Nikdy nezapomenu na den, kdy …', 'Všechno začalo nenápadně.'] },
      { part: 'Napětí', items: ['Najednou …', 'V tu chvíli se ozvalo …', 'Srdce mi bušilo až v krku.', 'Ani jsem nedýchal.'] },
      { part: 'Přímá řeč', items: ['„Pojď sem,“ řekl tiše.', '„Co tady děláš?“ zeptala se.', 'Zavolal: „Pozor!“'] },
      { part: 'Závěr', items: ['Od té doby …', 'Dodnes se tomu směju, ale tehdy …', 'A tak jsem se naučil, že …'] },
    ],
  },
  {
    form: 'popis',
    variants: [
      {
        id: 'popis-predmet',
        label: 'Popis předmětu / místa',
        text: `[Název – co popisuješ]

[Úvod: co popisuješ a proč. … je … , který/která …]

[Celkový vzhled: tvar, velikost, barva, materiál.]

[Části od hlavních k vedlejším (shora dolů / zleva doprava): Na horní straně se nachází … Pod ním je umístěn … Vpravo …]

[Závěr: k čemu slouží, celkový dojem.]`,
      },
      {
        id: 'popis-postup',
        label: 'Popis pracovního postupu',
        text: `[Název – Jak …]

[Úvod: co se bude dělat a k čemu to je.]

Potřebujeme: [pomůcky, materiál]

[Nejprve …]
[Poté …]
[Jakmile …, …]
[Nakonec …]

[Závěr: výsledek, upozornění, rada.]`,
      },
    ],
    phrases: [
      { part: 'Umístění', items: ['Na horní straně se nachází …', 'Uprostřed je umístěn …', 'Po levé straně …', 'Pod ním …'] },
      { part: 'Postup', items: ['Nejprve …', 'Poté / Potom …', 'Jakmile …, …', 'Nakonec …', 'Dbejte na to, aby …'] },
      { part: 'Místo „je / má“', items: ['nachází se', 'tvoří ho', 'zdobí ho', 'vyčnívá', 'je opatřen'] },
    ],
  },
  {
    form: 'charakteristika',
    variants: [
      {
        id: 'charakteristika',
        label: 'Charakteristika osoby',
        text: `[Název – kdo to je]

[Úvod: kdo to je a jaký k němu mám vztah. … je …, kterého/kterou znám …]

[Vnější charakteristika (stručně): postava, obličej, oblečení, typické gesto.]

[Vnitřní charakteristika: vlastnosti, každá doložená příkladem z chování. Je velmi …, což se ukázalo, když …]

[Zájmy, schopnosti, jak se chová k ostatním.]

[Závěr: celkový dojem, co pro mě znamená.]`,
      },
    ],
    phrases: [
      { part: 'Vlastnost + doklad', items: ['Je velmi …, což se ukázalo, když …', 'Jeho / její největší předností je …', 'Občas bývá …, ale …'] },
      { part: 'Závěr', items: ['Celkově je to člověk, který …', 'Vážím si na něm / na ní hlavně …'] },
    ],
  },
  {
    form: 'dopis',
    variants: [
      {
        id: 'dopis-uredni',
        label: 'Úřední dopis (žádost, stížnost, reklamace)',
        text: `[Jméno Příjmení]
[Ulice číslo]
[PSČ Obec]

[Název instituce / firmy]
[oddělení nebo jméno adresáta]
[Ulice číslo]
[PSČ Obec]

[Místo] [den. měsíc. rok]

[Předmět dopisu – např. Žádost o …]

Vážená paní, vážený pane,

[obracím se na Vás s žádostí o … / dovoluji si Vás požádat o … – text pokračuje po oslovení malým písmenem]

[Důvod a konkrétní údaje: co, kdy, kde, číslo smlouvy nebo dokladu.]

[Požadavek: Žádám Vás proto o … / Prosím o vyřízení do …]

Děkuji za vyřízení a těším se na Vaši odpověď.

S pozdravem

[podpis]
[Jméno Příjmení]

Přílohy
[příloha 1]
[příloha 2]`,
      },
      {
        id: 'dopis-motivacni',
        label: 'Motivační dopis',
        text: `[Jméno Příjmení]
[Ulice číslo]
[PSČ Obec]
[telefon, e-mail]

[Název firmy]
[personální oddělení]
[Ulice číslo]
[PSČ Obec]

[Místo] [den. měsíc. rok]

[Žádost o místo … / Motivační dopis – pozice …]

Vážená paní, vážený pane,

[na Vašich webových stránkách jsem se dočetl, že hledáte … Rád bych se o toto místo ucházel.]

[Proč se hodím: vzdělání, praxe, dovednosti – konkrétně.]

[Proč právě tato firma: co mě na ní zaujalo.]

[Závěr: Uvítal bych možnost osobního setkání, na kterém bych Vám své předpoklady rád představil.]

S pozdravem

[podpis]
[Jméno Příjmení]

Příloha
[životopis]`,
      },
      {
        id: 'dopis-osobni',
        label: 'Osobní dopis',
        text: `[Místo] [den. měsíc. rok]

Milý [oslovení v 5. pádě – např. Milý Petře / Milá Jano],

[úvod: poděkování za dopis, omluva za pozdní odpověď nebo otázka, jak se má]

[Co je u mě nového – události, zážitky.]

[Reakce na jeho / její novinky, otázky.]

[Závěr: přání, pozvání, prosba o odpověď.]

[Pozdrav – např. Měj se hezky / Zdraví Tě]
[jméno]

P. S. [dodatek]`,
      },
    ],
    phrases: [
      { part: 'Úvod (úřední)', items: ['obracím se na Vás s žádostí o …', 'dovoluji si Vás požádat o …', 'na základě Vašeho inzerátu …', 'dne … jsem si u Vás zakoupil …'] },
      { part: 'Požadavek', items: ['Žádám Vás proto o …', 'Prosím o vyřízení reklamace do 30 dnů.', 'Byl bych Vám vděčný, kdybyste …'] },
      { part: 'Závěr (úřední)', items: ['Děkuji za vyřízení.', 'Těším se na Vaši odpověď.', 'Předem děkuji za kladné vyřízení.', 'S pozdravem (bez interpunkce)'] },
      { part: 'Úprava', items: ['místo a datum bez čárky: Brno 3. 11. 2026', 'předmět bez slova „Věc“', 'po oslovení s čárkou dál malým písmenem', 'Vy, Vám, Váš velkým písmenem'] },
    ],
  },
  {
    form: 'clanek',
    variants: [
      {
        id: 'zprava',
        label: 'Zpráva',
        text: `[Titulek – výstižně, co se stalo]

[Perex: 1–2 věty s tím nejdůležitějším – co, kdo, kdy, kde.]

[Podrobnosti: jak a proč. Podle … / Jak uvedl …]

[Doplňující informace, citace účastníka nebo odborníka.]

[Závěr: co bude dál.]`,
      },
      {
        id: 'reportaz',
        label: 'Reportáž',
        text: `[Titulek]

[Vstup přímo z místa, přítomný čas: Je sobota, osm hodin ráno a před … už stojí …]

[Atmosféra: co vidím, slyším, cítím.]

[Rozhovor s účastníky – přímá řeč:
„…,“ říká …]

[Další dění, fakta o akci.]

[Závěr: dojem, výhled.]`,
      },
    ],
    phrases: [
      { part: 'Zpráva', items: ['Jak uvedl …', 'Podle informací …', 'Akce se uskuteční dne …'] },
      { part: 'Reportáž', items: ['Je … a před … už stojí …', 'Všude kolem je cítit …', '„…,“ usmívá se …'] },
    ],
  },
  {
    form: 'fejeton',
    variants: [
      {
        id: 'fejeton',
        label: 'Fejeton',
        text: `[Vtipný nebo dvojznačný název]

[Vstup: všední situace nebo aktualita, se kterou se čtenář ztotožní.]

[Rozvedení s nadsázkou a ironií, odbočky, slovní hříčky.]

[Zobecnění – co to říká o nás všech.]

[Pointa: překvapivý konec, často návrat k začátku.]`,
      },
    ],
    phrases: [{ part: 'Obraty', items: ['Znáte to: …', 'Jistě, mohl bych …, ale …', 'A tak se ptám: …', 'Nakonec jsem pochopil, že …'] }],
  },
  {
    form: 'vyklad',
    variants: [
      {
        id: 'vyklad',
        label: 'Výklad',
        text: `[Název – téma]

[Úvod: vymezení tématu, definice pojmu. … je …, který …]

[1. odstavec: příčiny / vznik.]

[2. odstavec: jak to funguje, souvislosti, příklady.]

[3. odstavec: důsledky, význam, využití.]

[Závěr: shrnutí.]`,
      },
    ],
    phrases: [
      { part: 'Logické návaznosti', items: ['Pojmem … rozumíme …', 'Příčinou je …', 'V důsledku toho …', 'Z toho vyplývá, že …', 'Na rozdíl od …'] },
      { part: 'Závěr', items: ['Lze tedy shrnout, že …', 'Celkově je … významný hlavně proto, že …'] },
    ],
  },
  {
    form: 'recenze',
    variants: [
      {
        id: 'recenze',
        label: 'Recenze',
        text: `[Název recenze – může hodnotit]

[Základní údaje: název díla, autor / režisér, žánr, rok, nakladatelství / studio.]

[Stručné přiblížení obsahu – bez prozrazení konce.]

[Hodnocení – silné stránky s doložením (postavy, děj, jazyk / herci, kamera, hudba).]

[Hodnocení – slabé stránky s doložením.]

[Závěr: doporučení, pro koho je dílo, případně hodnocení v procentech.]`,
      },
    ],
    phrases: [
      { part: 'Hodnocení', items: ['Největší silou díla je …', 'Za pozornost stojí …', 'Poněkud slabší je …', 'Škoda, že …'] },
      { part: 'Doporučení', items: ['Dílo doporučuji především …', 'Kdo má rád …, nebude zklamán.'] },
    ],
  },
  {
    form: 'proslov',
    variants: [
      {
        id: 'proslov',
        label: 'Projev / proslov',
        text: `Vážení [hosté / rodiče], milí [spolužáci],

[úvod: proč jsme se sešli – dovolte mi, abych …]

[Hlavní sdělení: vzpomínka, příběh, poděkování konkrétním lidem.]

[Obrat k posluchačům: Jistě si všichni pamatujete, jak …]

[Závěr: přání, výzva.]

Děkuji za pozornost.`,
      },
    ],
    phrases: [
      { part: 'Úvod', items: ['Dovolte mi, abych Vás jménem … přivítal.', 'Sešli jsme se dnes, abychom …'] },
      { part: 'Obrat k posluchačům', items: ['Jistě si všichni pamatujete …', 'Zkuste si představit …', 'Kdo z vás by tehdy řekl, že …?'] },
      { part: 'Závěr', items: ['Přeji Vám …', 'Děkuji za pozornost.'] },
    ],
  },
];

export const templateFor = (form: string) => WRITING_TEMPLATES.find((t) => t.form === form);
