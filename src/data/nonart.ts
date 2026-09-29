import type { NonArtText } from '../types';

/**
 * Cvičné neumělecké texty (autorské texty vytvořené pro aplikaci).
 * Slouží k tréninku analýzy neuměleckého textu podle osnovy.
 */
export const NONART_TEXTS: NonArtText[] = [
  {
    id: 'zprava-knihovna',
    title: 'Zpráva: Knihovna prodlouží otevírací dobu',
    excerpts: [
      {
        label: 'Výňatek',
        text:
          'Městská knihovna od 1. října prodlouží otevírací dobu. Ve všední dny bude otevřeno od 9 do 19 hodin, v sobotu od 9 do 13 hodin. Podle ředitelky knihovny reaguje instituce na zvýšený zájem studentů, kteří v knihovně připravují maturitní práce. „Studovna byla v posledních měsících často plná už v poledne,“ uvedla ředitelka. Prodloužení provozu bude stát zhruba 180 tisíc korun ročně; peníze poskytne město. Knihovna zároveň plánuje rozšířit počet míst ve studovně o dvacet. Vedení knihovny předpokládá, že změna přiláká i pracující čtenáře.',
      },
    ],
    mainIdea: 'Městská knihovna od října prodlužuje otevírací dobu kvůli zvýšenému zájmu studentů.',
    communication:
      'Účel: informovat veřejnost o změně otevírací doby. Adresát: široká veřejnost, čtenáři knihovny, studenti. Autor: novinář (neosobní, objektivní podání).',
    factsVsOpinions: [
      { statement: 'Ve všední dny bude otevřeno od 9 do 19 hodin.', isFact: true, why: 'Ověřitelný údaj.' },
      { statement: 'Prodloužení provozu bude stát zhruba 180 tisíc korun ročně.', isFact: true, why: 'Číselný údaj, který lze ověřit v rozpočtu.' },
      { statement: 'Změna přiláká i pracující čtenáře.', isFact: false, why: 'Jde o předpoklad (domněnku) vedení knihovny – slovo „předpokládá“.' },
    ],
    essential:
      'Podstatné: nová otevírací doba, datum změny, důvod (zájem studentů). Méně podstatné: citace o plné studovně, náklady, plán rozšíření studovny.',
    interpretations:
      'Text lze číst jako čistě informativní zprávu; někdo může v uvedení nákladů vidět i nenápadné upozornění na to, kolik služba stojí město.',
    style: 'publicistický',
    procedure: 'informační',
    form: 'zpráva',
    composition:
      'Obrácená pyramida – nejdůležitější informace na začátku (co, kdy), poté podrobnosti (časy), důvod, citace, náklady a výhled.',
    language:
      'Spisovný, neutrální jazyk; věcnost, přesné údaje (data, časy, čísla); citace přímé řeči zdroje; oznamovací věty; neosobní podání.',
  },
  {
    id: 'komentar-mobily',
    title: 'Komentář: Zakázat mobily ve školách?',
    excerpts: [
      {
        label: 'Výňatek',
        text:
          'Debata o zákazu mobilních telefonů ve školách se znovu rozhořela. Zastánci zákazu tvrdí, že telefony rozptylují pozornost a zhoršují vztahy mezi spolužáky. Nelze jim upřít, že o přestávkách dnes často vládne ticho skloněných hlav. Jenže je zákaz opravdu řešením? Telefon není zlo samo o sobě – je to nástroj, se kterým se musíme naučit zacházet. Škola, která ho jen zakáže, se vzdává příležitosti vychovat studenty k rozumnému používání technologií. Myslím, že rozumnější než plošný zákaz jsou jasná pravidla: telefon v hodině ano, ale jen tehdy, když ho učitel využije ke zjišťování informací. Zakazovat je snadné; učit je těžší, ale smysluplnější.',
      },
    ],
    mainIdea: 'Autor nesouhlasí s plošným zákazem mobilů ve školách a navrhuje místo zákazu jasná pravidla a výchovu k rozumnému používání.',
    communication:
      'Účel: přesvědčit čtenáře o autorově názoru, podnítit diskusi. Adresát: čtenáři novin – rodiče, učitelé, studenti. Autor: komentátor, vyjadřuje subjektivní názor (1. osoba – „myslím“).',
    factsVsOpinions: [
      { statement: 'Debata o zákazu mobilních telefonů se znovu rozhořela.', isFact: true, why: 'Konstatování dění, které lze ověřit.' },
      { statement: 'Telefon není zlo samo o sobě.', isFact: false, why: 'Hodnotící výrok – názor autora.' },
      { statement: 'Učit je těžší, ale smysluplnější.', isFact: false, why: 'Subjektivní hodnocení.' },
    ],
    essential:
      'Podstatné: autorův postoj (proti plošnému zákazu) a návrh (pravidla, výchova). Méně podstatné: obraz „ticha skloněných hlav“ – ilustrace.',
    interpretations:
      'Lze číst jako obhajobu technologií, ale i jako kritiku školy, která volí snadná řešení. Někdo může autorovi vytknout, že argumenty zastánců zákazu zlehčuje.',
    style: 'publicistický',
    procedure: 'úvahový',
    form: 'komentář',
    composition:
      'Úvod (aktuální debata) – argumenty zastánců zákazu – obrat (řečnická otázka „Jenže…“) – autorův protiargument a návrh – pointa (antiteze „zakazovat je snadné; učit je těžší“).',
    language:
      'Spisovný jazyk s expresivními prvky („debata se rozhořela“), metafora („ticho skloněných hlav“), řečnická otázka, 1. osoba (subjektivita), antiteze v závěru, hodnotící výrazy.',
  },
  {
    id: 'vyklad-balada',
    title: 'Výklad: Co je balada',
    excerpts: [
      {
        label: 'Výňatek',
        text:
          'Balada je lyricko-epický žánr, který vznikl v lidové slovesnosti. Vypráví příběh (epická složka), avšak se silným citovým zabarvením a zpravidla ve verších (lyrická složka). Pro baladu je typický ponurý děj s tragickým koncem, jehož příčinou bývá porušení nějakého zákazu nebo řádu. Děj má rychlý spád a velkou úlohu v něm hrají dialogy, které baladu přibližují dramatu. Často se objevují nadpřirozené bytosti. V české literatuře baladu umělecky rozvinul K. J. Erben ve sbírce Kytice (1853), na kterou navázali například J. Neruda a J. Wolker.',
      },
    ],
    mainIdea: 'Text vysvětluje pojem balada – její znaky, původ a zastoupení v české literatuře.',
    communication:
      'Účel: poučit, vysvětlit odborný pojem. Adresát: studenti, zájemci o literaturu. Autor: odborník / autor učebnice; neosobní, objektivní podání.',
    factsVsOpinions: [
      { statement: 'Kytice vyšla roku 1853.', isFact: true, why: 'Ověřitelný údaj.' },
      { statement: 'Balada je lyricko-epický žánr.', isFact: true, why: 'Odborná definice, obecně přijímaná.' },
    ],
    essential:
      'Podstatné: definice balady a její znaky (lyricko-epický žánr, tragický konec, porušení řádu, dialogy). Méně podstatné: výčet autorů navazujících na Erbena.',
    interpretations: 'Text je jednoznačný – odborný výklad má minimalizovat různé způsoby čtení.',
    style: 'odborný',
    procedure: 'výkladový',
    form: 'výklad (odborný text / heslo v učebnici)',
    composition:
      'Definice pojmu – vysvětlení složek (epická, lyrická) – typické znaky – příklady z literatury. Logická, na sebe navazující stavba.',
    language:
      'Spisovný jazyk, odborné termíny (lyricko-epický, žánr, epická složka), přesnost, neosobní vazby, složitější souvětí, vysvětlivky v závorkách, jmenné vyjadřování.',
  },
  {
    id: 'zadost-studovna',
    title: 'Žádost o zapůjčení studovny',
    excerpts: [
      {
        label: 'Výňatek',
        text:
          'Vážená paní ředitelko,\n\nobracím se na Vás jménem studentů třídy 4. B s žádostí o zapůjčení školní studovny v odpoledních hodinách v období od 1. března do 15. května. Studovnu bychom využívali ke společné přípravě na ústní maturitní zkoušku z českého jazyka a literatury, vždy v úterý a ve čtvrtek od 14.30 do 16.30 hodin. Za pořádek a dodržování provozního řádu ručí níže podepsaný předseda třídy.\n\nPředem děkuji za kladné vyřízení žádosti.\n\nS pozdravem\nJan Novák, předseda třídy 4. B',
      },
    ],
    mainIdea: 'Předseda třídy žádá ředitelku školy o zapůjčení studovny pro přípravu na maturitu.',
    communication:
      'Účel: získat povolení (žádost). Adresát: ředitelka školy (konkrétní osoba v nadřízeném postavení). Autor: předseda třídy za celou třídu. Oficiální, písemná komunikace.',
    factsVsOpinions: [
      { statement: 'Studovnu bychom využívali v úterý a ve čtvrtek.', isFact: true, why: 'Konkrétní údaj o plánu (ověřitelné sdělení).' },
    ],
    essential: 'Podstatné: kdo žádá, o co, v jakém období a čase, za jakým účelem. Méně podstatné: zdvořilostní formule.',
    interpretations: 'Administrativní text má být jednoznačný – prostor pro různé výklady je minimální.',
    style: 'administrativní',
    procedure: 'informační',
    form: 'žádost (úřední dopis)',
    composition:
      'Oslovení – předmět žádosti – odůvodnění a podrobnosti (termíny, čas) – záruka – poděkování – pozdrav a podpis. Ustálená forma.',
    language:
      'Spisovný jazyk, ustálené zdvořilostní formule („Vážená paní ředitelko“, „Předem děkuji za kladné vyřízení“), vykání (velké V), přesné údaje, věcnost, stručnost.',
  },
  {
    id: 'reklama-a-test',
    title: 'Dva výňatky: reklama × spotřebitelský test',
    excerpts: [
      {
        label: 'Výňatek A',
        text:
          'Nová aplikace StudyMax – maturita bez stresu! Díky chytrému algoritmu se naučíte za týden víc než ostatní za měsíc. Už žádné probdělé noci. Stáhněte si ji ještě dnes a první měsíc máte zdarma!',
      },
      {
        label: 'Výňatek B',
        text:
          'V našem testu jsme porovnali pět studijních aplikací. Aplikace StudyMax nabízí přehledné opakovací kartičky, obsah pro českou literaturu však místy obsahuje nepřesnosti. Tvrzení výrobce o „týdnu místo měsíce“ nelze ověřit – výrobce nám nepředložil žádnou studii. Po prvním měsíci stojí aplikace 199 Kč měsíčně.',
      },
    ],
    relation:
      'Oba výňatky se týkají stejné aplikace. A je reklama – chce přesvědčit ke stažení a přehání; B je spotřebitelský test – věcně hodnotí a zpochybňuje tvrzení reklamy (nelze ověřit, placená po prvním měsíci).',
    mainIdea:
      'A: aplikace StudyMax slibuje snadné a rychlé učení. B: aplikace má dobré funkce, ale obsah má nepřesnosti a tvrzení reklamy nejsou podložená.',
    communication:
      'A – účel: přesvědčit, prodat; adresát: studenti; autor: výrobce. B – účel: objektivně informovat a hodnotit; adresát: spotřebitelé; autor: redakce spotřebitelského časopisu.',
    factsVsOpinions: [
      { statement: 'Naučíte se za týden víc než ostatní za měsíc.', isFact: false, why: 'Reklamní tvrzení, které podle testu nelze ověřit.' },
      { statement: 'Po prvním měsíci stojí aplikace 199 Kč měsíčně.', isFact: true, why: 'Ověřitelný údaj o ceně.' },
      { statement: 'Aplikace nabízí přehledné opakovací kartičky.', isFact: false, why: 'Hodnocení testujících („přehledné“) – názor, i když podložený testem.' },
    ],
    essential:
      'Podstatné: v A slib rychlého učení a nabídka zdarma; v B zjištěné nedostatky, neověřitelnost slibu a cena. Nepodstatné: „žádné probdělé noci“ – emocionální apel.',
    interpretations:
      'Reklamu lze číst naivně jako slib, nebo kriticky jako manipulaci (hyperbola, apel na strach ze stresu). Test může působit neutrálně, ale i on hodnotí.',
    style: 'publicistický (A – reklamní text; B – publicistický hodnotící text)',
    procedure: 'A – informační s prvky přesvědčování (apelový); B – informační a úvahový (hodnotící)',
    form: 'A – reklama; B – spotřebitelský test (recenze)',
    composition:
      'A: slogan – slib výhody – odstranění problému – výzva k akci. B: uvedení testu – klady – zápory a zpochybnění reklamy – cena.',
    language:
      'A: expresivní, hyperbola („za týden víc než za měsíc“), imperativ („Stáhněte si“), zvolací věty, oslovení adresáta (vykání v 2. osobě). B: věcný, spisovný jazyk, 1. osoba plurálu („porovnali jsme“), přesné údaje, uvozovky pro citaci tvrzení.',
  },
  {
    id: 'fejeton-maturita',
    title: 'Fejeton: O tom, jak jsem se učil na maturitu',
    excerpts: [
      {
        label: 'Výňatek',
        text:
          'Měl jsem plán. Plány mám rád, protože vypadají tak hezky na papíře. Každý den tři knihy, v neděli opakování, v pondělí pojmy. Plán visel nad stolem a já ho pravidelně obdivoval. Obdivoval jsem ho v pondělí, v úterý i ve středu, jenom jsem ho nestihl dodržovat. Ve čtvrtek jsem zjistil, že Máj nenapsal Erben a že Kytice není román, což považuji za slušný pokrok. V pátek jsem pochopil, že nejlepší plán je ten, který se dá stihnout. A tak jsem si napsal nový: jedna kniha denně. Visí vedle toho starého. Oba jsou moc hezké.',
      },
    ],
    mainIdea:
      'Autor s humorem popisuje, jak nerealistický plán učení selhal, a dochází k tomu, že lepší je plán, který se dá opravdu splnit.',
    communication:
      'Účel: pobavit a zároveň přimět k zamyšlení. Adresát: čtenáři novin/časopisu, studenti. Autor: fejetonista píšící v 1. osobě, s nadhledem a ironií.',
    factsVsOpinions: [
      { statement: 'Máj nenapsal Erben a Kytice není román.', isFact: true, why: 'Ověřitelné literární fakty.' },
      { statement: 'Plány vypadají hezky na papíře.', isFact: false, why: 'Ironické hodnocení, názor autora.' },
    ],
    essential:
      'Podstatné: selhání přehnaného plánu a ponaučení (plán musí být splnitelný). Méně podstatné: konkrétní dny v týdnu a vtipné detaily.',
    interpretations:
      'Lze číst jako vtipnou historku, jako sebeironii, i jako radu, jak se učit. Závěr („Oba jsou moc hezké“) lze chápat tak, že autor nový plán také neplní – ironická pointa.',
    style: 'publicistický (s prvky uměleckého stylu)',
    procedure: 'vyprávěcí a úvahový',
    form: 'fejeton',
    composition:
      'Úvod (plán) – rozvedení (obdivování plánu místo plnění, gradace dnů v týdnu) – poznání – ironická pointa na konci.',
    language:
      'Hovorovější, ale spisovný jazyk, krátké věty, ich-forma, ironie a sebeironie, opakování („obdivoval“), gradace (pondělí, úterý, středa), pointa.',
  },
];

export const NONART_MAP = Object.fromEntries(NONART_TEXTS.map((x) => [x.id, x])) as Record<string, NonArtText>;
