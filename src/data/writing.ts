/** Písemná práce z češtiny – slohové útvary, ukázková zadání a kritéria sebehodnocení */

export interface WritingForm {
  id: string;
  name: string;
  /** Funkční styl a slohový postup */
  style: string;
  purpose: string;
  structure: string[];
  language: string[];
  pitfalls: string[];
}

export const WRITING_FORMS: WritingForm[] = [
  {
    id: 'uvaha',
    name: 'Úvaha',
    style: 'publicistický nebo odborný styl, úvahový postup',
    purpose: 'Zamyšlení nad problémem – autor zvažuje různé pohledy a dochází k vlastnímu závěru.',
    structure: ['úvod – představení problému, otázka', 'stať – argumenty pro a proti, příklady ze života, vlastní zkušenost', 'závěr – vlastní stanovisko, shrnutí, případně otevřená otázka'],
    language: ['řečnické otázky', 'subjektivní hodnocení, 1. osoba je možná', 'spojovací výrazy: na jedné straně – na druhé straně, přesto, proto, avšak, tudíž', 'spisovná čeština, obrazná pojmenování s mírou'],
    pitfalls: ['z úvahy se stane vypravování (jen příběh bez úvahy)', 'chybí vlastní závěr', 'argumenty bez příkladů', 'odbíhání od tématu'],
  },
  {
    id: 'vypravovani',
    name: 'Vypravování',
    style: 'umělecký styl, vyprávěcí postup',
    purpose: 'Poutavé vylíčení příběhu (skutečného nebo smyšleného) s napětím a pointou.',
    structure: ['úvod – kdo, kdy, kde (expozice)', 'zápletka a rozvíjení děje', 'vyvrcholení (napětí)', 'rozuzlení a závěr, pointa'],
    language: ['přímá řeč (správná interpunkce!)', 'dějová slovesa, střídání časů (historický prézens)', 'popis prostředí a pocitů postav, citově zabarvená slova', 'er-forma nebo ich-forma – držet ji v celém textu'],
    pitfalls: ['jen výčet událostí bez napětí', 'chybí pointa', 'chyby v interpunkci přímé řeči', 'nedodržená zadaná situace nebo délka'],
  },
  {
    id: 'popis',
    name: 'Popis (prostý, odborný, subjektivně zabarvený, popis pracovního postupu)',
    style: 'odborný / umělecký styl podle druhu, popisný postup',
    purpose: 'Zachycení vlastností předmětu, osoby, místa nebo děje (postupu).',
    structure: ['úvod – co popisujeme a proč', 'stať – postup od celku k částem (shora dolů, zleva doprava, od hlavního k vedlejšímu)', 'závěr – celkový dojem, význam, použití'],
    language: ['přídavná jména, podstatná jména, odborné termíny u odborného popisu', 'u postupu slovesa v rozkazovacím způsobu nebo 1. os. mn. č., časové spojky (nejprve, poté, nakonec)', 'subjektivní popis – obrazná pojmenování, přirovnání'],
    pitfalls: ['chaotické pořadí', 'opakování slovesa „je/má“', 'z popisu se stane vypravování'],
  },
  {
    id: 'charakteristika',
    name: 'Charakteristika',
    style: 'umělecký nebo prostě sdělovací styl, popisný a hodnoticí postup',
    purpose: 'Představení osoby – vnější (vzhled) a hlavně vnitřní (povaha, chování, zájmy).',
    structure: ['úvod – kdo to je, vztah k pisateli', 'vnější charakteristika (stručně)', 'vnitřní charakteristika – vlastnosti doložené konkrétními projevy a situacemi', 'závěr – celkové hodnocení, vztah k osobě'],
    language: ['přímá charakteristika (je hodný) × nepřímá (z jednání: vždy se rozdělí…)', 'přirovnání, rčení, přísloví', 'pestrá přídavná jména'],
    pitfalls: ['jen výčet vlastností bez dokladů', 'převažuje popis vzhledu', 'nevyvážené hodnocení'],
  },
  {
    id: 'dopis',
    name: 'Dopis (osobní / úřední), žádost, stížnost, motivační dopis',
    style: 'prostě sdělovací (osobní) / administrativní (úřední) styl',
    purpose: 'Písemná komunikace s konkrétním adresátem – sdělení, žádost, reklamace, omluva.',
    structure: ['úřední: odesílatel, adresát, místo a datum, věc, oslovení', 'text – důvod, konkrétní informace, požadavek', 'zdvořilostní závěr, pozdrav, podpis, případně přílohy'],
    language: ['oslovení s čárkou a vykáním (Vážená paní, … / Vážený pane, …)', 'zájmena Vy/Váš s velkým písmenem v dopise jednomu adresátovi', 'úřední – věcnost, ustálené obraty, bez citově zabarvených slov', 'osobní – může být hovorovější, ale stále spisovně'],
    pitfalls: ['chybějící formální náležitosti (věc, datum, podpis)', 'nevhodný tón vůči adresátovi', 'nejasný požadavek'],
  },
  {
    id: 'clanek',
    name: 'Článek / zpráva / reportáž',
    style: 'publicistický styl, informační (zpráva) nebo kombinovaný postup',
    purpose: 'Informovat veřejnost o události (zpráva – věcně), přiblížit ji zážitkově (reportáž) nebo ji rozebrat (článek, komentář).',
    structure: ['titulek (u zprávy i perex)', 'zpráva – obrácená pyramida: nejdůležitější informace na začátku (co, kdo, kdy, kde, jak, proč)', 'reportáž – dojmy z místa, přímá řeč účastníků, přítomný čas', 'závěr – shrnutí, výhled'],
    language: ['zpráva – objektivní, bez hodnocení', 'reportáž – živost, přítomný čas, popis atmosféry', 'publicismy, ale ne klišé'],
    pitfalls: ['chybí titulek', 'zpráva obsahuje názory pisatele', 'nevyvážené zdroje'],
  },
  {
    id: 'fejeton',
    name: 'Fejeton / sloupek',
    style: 'publicistický styl s uměleckými prvky, úvahový postup',
    purpose: 'Krátké vtipné zamyšlení nad běžnou událostí, často ironické, s překvapivou pointou.',
    structure: ['zajímavý vstup navazující na aktualitu nebo všední situaci', 'rozvedení s nadsázkou, odbočky', 'pointa – překvapivý závěr'],
    language: ['ironie, nadsázka, slovní hříčky', 'obrazná pojmenování, hovorové prvky záměrně', 'osobní tón'],
    pitfalls: ['chybí pointa', 'jen vtipkování bez myšlenky', 'nadměrná hovorovost'],
  },
  {
    id: 'vyklad',
    name: 'Výklad / odborný text',
    style: 'odborný styl, výkladový postup',
    purpose: 'Vysvětlení jevu, pojmu nebo postupu – příčiny, souvislosti, důsledky.',
    structure: ['úvod – vymezení tématu, definice', 'stať – vysvětlení příčin a souvislostí, příklady, členění do odstavců', 'závěr – shrnutí, význam'],
    language: ['odborné termíny, přesnost, věcnost', 'složitější souvětí s logickými spojkami (protože, proto, tudíž)', 'neosobní formulace, trpný rod'],
    pitfalls: ['subjektivní hodnocení', 'nevysvětlené pojmy', 'chybí logické návaznosti'],
  },
  {
    id: 'recenze',
    name: 'Recenze / kritika',
    style: 'publicistický styl, hodnoticí postup',
    purpose: 'Představit dílo (knihu, film, hru, koncert) a odůvodněně ho zhodnotit.',
    structure: ['základní údaje o díle (autor, název, žánr)', 'stručné přiblížení obsahu – bez prozrazení konce', 'hodnocení – silné a slabé stránky, zdůvodnění, srovnání', 'závěr – doporučení, pro koho je dílo'],
    language: ['hodnoticí výrazy, ale argumentované', 'odborné pojmy (režie, kamera, kompozice, postavy)', 'osobní postoj'],
    pitfalls: ['jen převyprávění děje', 'hodnocení bez zdůvodnění', 'prozrazení pointy'],
  },
  {
    id: 'proslov',
    name: 'Projev / proslov',
    style: 'řečnický styl',
    purpose: 'Text určený k přednesení publiku při určité příležitosti (zahájení, rozloučení, poděkování).',
    structure: ['oslovení publika', 'úvod – důvod setkání', 'hlavní sdělení, poděkování, příběh', 'závěr – přání, výzva, poděkování za pozornost'],
    language: ['oslovení (Vážení hosté, milí spolužáci)', 'řečnické otázky, opakování, obraty k posluchačům', 'přiměřená délka vět pro poslech'],
    pitfalls: ['chybí oslovení nebo závěr', 'neodpovídá příležitosti', 'příliš dlouhá souvětí'],
  },
];

export interface WritingPrompt {
  id: string;
  form: string;
  title: string;
  task: string;
}

/** Ukázková zadání pro trénink (vlastní, nejsou to oficiální zadání) */
export const WRITING_PROMPTS: WritingPrompt[] = [
  { id: 'p1', form: 'uvaha', title: 'Jsme otroky svých mobilů?', task: 'Napište úvahu na téma „Jsme otroky svých mobilů?“. Zvažte výhody i nevýhody a dojděte k vlastnímu závěru.' },
  { id: 'p2', form: 'uvaha', title: 'Má smysl studovat, když se vše dá vyhledat?', task: 'Napište úvahu o tom, zda má v době internetu a umělé inteligence smysl učit se fakta nazpaměť.' },
  { id: 'p3', form: 'uvaha', title: 'Co pro mě znamená svoboda', task: 'Napište úvahu na téma „Co pro mě znamená svoboda“. Opřete se o vlastní zkušenosti nebo příklady.' },
  { id: 'p4', form: 'vypravovani', title: 'Den, kdy vypadla elektřina', task: 'Napište vypravování, které začíná větou: „Ten den ve městě najednou zhasla všechna světla.“ Příběh musí mít zápletku a pointu, použijte přímou řeč.' },
  { id: 'p5', form: 'vypravovani', title: 'Setkání po letech', task: 'Napište vypravování o nečekaném setkání s člověkem, kterého jste dlouho neviděli. Použijte ich-formu.' },
  { id: 'p6', form: 'popis', title: 'Popis pracovního postupu: sestavení počítače', task: 'Napište popis pracovního postupu pro spolužáka, který bude poprvé sestavovat stolní počítač z dílů.' },
  { id: 'p7', form: 'popis', title: 'Místo, kam se rád vracím', task: 'Napište subjektivně zabarvený popis místa, kam se rád/a vracíte.' },
  { id: 'p8', form: 'charakteristika', title: 'Člověk, který mě ovlivnil', task: 'Napište charakteristiku člověka, který vás v životě ovlivnil. Vlastnosti dokládejte konkrétními situacemi.' },
  { id: 'p9', form: 'dopis', title: 'Žádost o brigádu', task: 'Napište motivační dopis do IT firmy, ve kterém žádáte o letní brigádu na pozici správce sítě. Dodržte formální náležitosti úředního dopisu.' },
  { id: 'p10', form: 'dopis', title: 'Reklamace notebooku', task: 'Napište reklamaci notebooku, který po třech měsících přestal nabíjet. Prodejce ji zamítl – žádáte o přezkoumání.' },
  { id: 'p11', form: 'dopis', title: 'Dopis kamarádovi', task: 'Napište osobní dopis kamarádovi, který se odstěhoval do zahraničí. Popište mu, co je u vás nového, a pozvěte ho na návštěvu.' },
  { id: 'p12', form: 'clanek', title: 'Den otevřených dveří', task: 'Napište článek do školního časopisu o dni otevřených dveří vaší školy. Nezapomeňte na titulek.' },
  { id: 'p13', form: 'clanek', title: 'Reportáž z hackathonu', task: 'Napište reportáž ze soutěže v programování, které jste se zúčastnili jako divák nebo soutěžící.' },
  { id: 'p14', form: 'fejeton', title: 'Chytrá domácnost', task: 'Napište fejeton o chytré domácnosti, která se rozhodla, že ví lépe než její majitel, co je pro něj dobré.' },
  { id: 'p15', form: 'vyklad', title: 'Jak funguje internet', task: 'Napište výklad pro žáky základní školy, který srozumitelně vysvětlí, jak se data dostanou z jednoho počítače na druhý přes internet.' },
  { id: 'p16', form: 'recenze', title: 'Recenze filmu nebo hry', task: 'Napište recenzi filmu, seriálu nebo počítačové hry, kterou jste nedávno viděli či hráli. Hodnocení zdůvodněte.' },
  { id: 'p17', form: 'proslov', title: 'Proslov na maturitním plese', task: 'Napište proslov, kterým za třídu poděkujete učitelům na maturitním plese.' },
  { id: 'p18', form: 'uvaha', title: 'Umělá inteligence – pomocník, nebo hrozba?', task: 'Napište úvahu, zda je umělá inteligence pro člověka spíše pomocníkem, nebo hrozbou.' },
];

export interface Criterion {
  id: string;
  label: string;
  hint: string;
}

/** Kritéria pro sebehodnocení (vlastní zjednodušení – každé 0–4 body) */
export const WRITING_CRITERIA: Criterion[] = [
  { id: 'zadani', label: 'Splnění zadání a obsah', hint: 'Držím se tématu a výchozí situace, obsah je dostatečně rozvinutý, splněna minimální délka.' },
  { id: 'utvar', label: 'Útvar a komunikační situace', hint: 'Text má znaky zadaného útvaru, odpovídá adresátovi a účelu, vhodný funkční styl.' },
  { id: 'pravopis', label: 'Pravopis', hint: 'i/y, velká písmena, mě/mně, interpunkce (čárky ve větě i souvětí, přímá řeč).' },
  { id: 'gramatika', label: 'Tvarosloví a stavba vět', hint: 'Správné tvary slov (abychom, byste), shoda podmětu s přísudkem, srozumitelná souvětí.' },
  { id: 'slovni', label: 'Slovní zásoba a volba výrazů', hint: 'Pestrá a přesná slova, bez zbytečného opakování a nevhodné hovorovosti.' },
  { id: 'kompozice', label: 'Kompozice a členění textu', hint: 'Úvod, stať, závěr; logické odstavce; text na sebe navazuje.' },
];

export const MIN_WORDS = 250;
export const WRITING_MINUTES = 120;
