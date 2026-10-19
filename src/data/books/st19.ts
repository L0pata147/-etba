import { ch, type BookSeed } from './helpers';

export const BOOKS_ST19: BookSeed[] = [
  {
    id: 'evzen-onegin',
    title: 'Evžen Oněgin',
    author: 'Alexandr Sergejevič Puškin',
    authorLife: '1799–1837',
    year: 'psáno 1823–1831, souborně 1833',
    category: 'st19',
    kind: 'lyricko-epika',
    genre: 'román ve verších',
    period: 'Romantismus (ruská literatura 1. pol. 19. století)',
    movement: 'Romantismus s prvky realismu',
    narratorShort: 'er-forma, vypravěč-autor s lyrickými odbočkami',
    settingShort: 'Petrohrad, ruský venkov, Moskva; 20. léta 19. století',
    theme:
      'Nenaplněná láska a promarněný život „zbytečného člověka“ – znuděného šlechtice, který odmítne lásku a později ji marně hledá; obraz ruské společnosti.',
    motifs: ['nuda a životní prázdnota', 'nenaplněná láska', 'dopis vyznání', 'souboj', 'přátelství', 'věrnost', 'venkov × velkoměsto', 'osud'],
    mainIdea:
      'Člověk, který nedokáže najít smysl života a opravdový cit, promarní své štěstí; když si chybu uvědomí, je už pozdě. Taťána naopak volí věrnost a povinnost.',
    mainCharacters: [
      ch('Evžen Oněgin', 'Mladý petrohradský šlechtic, znuděný světák; vzdělaný, ale citově prázdný – typ „zbytečného člověka“. Odmítne Taťánu, zabije přítele v souboji a nakonec se do Taťány marně zamiluje.'),
      ch('Taťána Larinová', 'Vážná, zasněná venkovská dívka, čte romány; napíše Oněginovi dopis s vyznáním lásky. Později je vdanou dámou z vyšší společnosti, která zůstane manželovi věrná.'),
      ch('Vladimír Lenskij', 'Mladý romantický básník, Oněginův přítel, snoubenec Olgy; vyzve Oněgina na souboj a zahyne.'),
      ch('Olga Larinová', 'Taťánina mladší sestra, veselá a povrchní; po Lenského smrti se brzy provdá za jiného.'),
    ],
    sideCharacters: [
      ch('Vypravěč', 'Oněginův přítel, autorova persona; komentuje děj a vkládá lyrické odbočky.'),
      ch('Taťánin manžel', 'Starší generál, kníže; Taťána si ho vzala na přání matky.'),
      ch('Chůva', 'Taťánina chůva, které se Taťána svěřuje se svou láskou.'),
      ch('Zareckij', 'Lenského sekundant při souboji.'),
    ],
    plot:
      'Znuděný petrohradský šlechtic Evžen Oněgin zdědí po strýci statek na venkově. Spřátelí se s mladým básníkem Lenským, který ho uvede k rodině Larinových. Starší dcera Taťána se do Oněgina zamiluje a napíše mu dopis s vyznáním. Oněgin ji chladně odmítne a poučí ji. Na Taťániných jmeninách se Oněgin z nudy a ze msty dvoří Lenského snoubence Olze. Uražený Lenskij ho vyzve na souboj a Oněgin ho zastřelí. Oněgin odjíždí na cesty; Olga se brzy vdá, Taťána je provdána za staršího generála. Po letech se Oněgin setká s Taťánou v Petrohradu jako s obdivovanou dámou společnosti a zamiluje se do ní. Píše jí dopisy; Taťána mu přizná, že ho stále miluje, ale zůstane věrná manželovi. Oněgin zůstává sám; děj končí otevřeně.',
    plotEvents: [
      'Oněgin zdědí statek po strýci a odjede na venkov.',
      'Spřátelí se s básníkem Lenským a poznává rodinu Larinových.',
      'Taťána napíše Oněginovi dopis s vyznáním lásky.',
      'Oněgin Taťánu odmítne a poučí ji.',
      'Na Taťániných jmeninách se Oněgin dvoří Olze.',
      'Oněgin zabije Lenského v souboji a odjede.',
      'Po letech potká v Petrohradu provdanou Taťánu a zamiluje se.',
      'Taťána přizná lásku, ale zůstane věrná manželovi.',
    ],
    setting: 'Petrohrad (salony, plesy, divadla), ruský venkov (statek Oněgina a Larinových), Moskva (kam Taťánu odvezou „na trh nevěst“).',
    time: 'Přibližně 1819–1825 (doba před děkabristickým povstáním); děj pokrývá několik let.',
    composition:
      'Osm kapitol (zpěvů); převážně chronologický děj. Zrcadlová kompozice: Taťánin dopis a odmítnutí na začátku × Oněginův dopis a odmítnutí na konci. Časté lyrické odbočky (digrese) autora. Otevřený konec.',
    narrator:
      'Er-forma; vypravěč je zároveň autorova persona a Oněginův přítel – vstupuje do děje, komentuje jej, ironizuje a vkládá osobní lyrické odbočky (o poezii, přátelích, mládí, ruské společnosti).',
    narrativeModes: 'Vyprávění, popis (příroda, venkov, salony), charakteristika postav, úvahy a lyrické odbočky vypravěče.',
    speechTypes: 'Pásmo vypravěče, přímá řeč, vložené dopisy (Taťánin a Oněginův dopis), vnitřní promluvy postav.',
    verse:
      'Veršovaný román; oněginská strofa – 14 veršů, jambický čtyřstopý verš, rýmové schéma AbAbCCddEffEgg (střídavý, sdružený a obkročný rým). V překladu se strofa zachovává.',
    language:
      'Spisovný, ale lehký, konverzační jazyk; ironie a humor, francouzská slova (salonní společnost), lyrické pasáže; srozumitelnost a živost – Puškin je považován za zakladatele moderní ruské spisovné řeči.',
    tropes:
      'Ironie (vypravěč vůči společnosti i Oněginovi), epiteta, metafory, přirovnání, kontrast (Taťána × Olga, venkov × město, Oněgin × Lenskij), apostrofy (oslovení čtenáře), řečnické otázky.',
    authorContext:
      'A. S. Puškin – zakladatel moderní ruské literatury, básník, prozaik a dramatik. Byl v nemilosti cara (vyhnanství na jih a na rodový statek). Zemřel po souboji s Georgesem d’Anthèsem. Díla: Ruslan a Ludmila, Kavkazský zajatec, Cikáni, Boris Godunov, Bronzový jezdec, Piková dáma, Kapitánská dcerka, pohádky (O rybáři a rybce).',
    historicalContext:
      'Ruský romantismus 1. poloviny 19. století s prvky nastupujícího realismu. Vliv lorda Byrona (Childe Haroldova pouť, Don Juan). Dobový kontext: děkabristické povstání (1825). Kritik V. G. Bělinskij nazval dílo „encyklopedií ruského života“. Typ „zbytečného člověka“ rozvinul M. J. Lermontov (Hrdina naší doby). Česká souvislost: K. H. Mácha – Máj (1836). Opera P. I. Čajkovského Evžen Oněgin.',
    otherWorks: ['Kapitánská dcerka', 'Piková dáma', 'Boris Godunov', 'Bronzový jezdec', 'Cikáni', 'Ruslan a Ludmila'],
    interpretation:
      'Oněgin je první „zbytečný člověk“ ruské literatury: nadaný šlechtic, který nemá smysl života, nudí se a ničí sebe i ostatní. Taťána představuje morální sílu a opravdovost. Zrcadlové odmítnutí na konci ukazuje ironii osudu.',
    examTips:
      'Uveď: román ve verších, oněginská strofa (14 veršů, jamb), zbytečný člověk, zrcadlová kompozice (dva dopisy, dvě odmítnutí), lyrické odbočky vypravěče, Bělinskij – encyklopedie ruského života.',
    quick: [
      'A. S. Puškin, román ve verších, 1823–1831 (souborně 1833); ruský romantismus s prvky realismu.',
      'Oněgin – znuděný šlechtic, typ „zbytečného člověka“.',
      'Taťána mu vyzná lásku dopisem, on ji odmítne; zabije v souboji přítele Lenského.',
      'Po letech miluje provdanou Taťánu – ona ho odmítne a zůstane věrná.',
      'Oněginská strofa: 14 veršů, jambický čtyřstopý verš, AbAbCCddEffEgg.',
      'Zrcadlová kompozice, lyrické odbočky vypravěče; „encyklopedie ruského života“ (Bělinskij).',
    ],
    clues: [
      'Znuděný šlechtic odmítne dopis zamilované venkovské dívky a po letech ji marně miluje, když je vdaná.',
      'Román ve verších, jehož hrdina zabije v souboji svého přítele básníka.',
      'Dílo psané čtrnáctiveršovými strofami, nazvané „encyklopedií ruského života“.',
    ],
    scenes: [
      {
        scene: 'Taťána v noci píše Oněginovi dopis, v němž mu vyznává lásku.',
        context: 'Po prvním setkání s Oněginem u Larinových; následuje Oněginova chladná odpověď a odmítnutí.',
      },
      {
        scene: 'Na zasněžené louce se odehraje souboj Oněgina s Lenským.',
        context: 'Po Taťániných jmeninách, kde se Oněgin dvořil Olze; po souboji Oněgin odjíždí na cesty.',
      },
      {
        scene: 'Taťána říká Oněginovi, že ho miluje, ale je dána jinému a bude mu věrná.',
        context: 'Závěr románu – po Oněginových dopisech v Petrohradu; příběh končí otevřeně.',
      },
    ],
    deepQuestions: [
      {
        q: 'Co znamená, že Oněgin je „zbytečný člověk“?',
        area: 'characters',
        answer:
          'Zbytečný člověk je typ ruské literatury: vzdělaný, schopný šlechtic, který nenachází v životě smysl ani uplatnění, nudí se, je skeptický a citově vyprázdněný. Svou nečinností a lhostejností ničí sebe i ostatní (Lenskij, Taťána).',
        points: [
          { label: 'nuda, prázdnota, nenachází smysl', keywords: ['nud', 'smysl', 'prázdn'] },
          { label: 'vzdělaný šlechtic bez uplatnění', keywords: ['šlecht', 'vzděl', 'uplatn'] },
          { label: 'ubližuje sobě i druhým', keywords: ['ublíž', 'ničí', 'zabij', 'lensk'] },
          { label: 'typ ruské literatury', keywords: ['typ', 'lermontov', 'rusk'] },
        ],
      },
      {
        q: 'V čem spočívá zrcadlová kompozice Evžena Oněgina?',
        area: 'composition',
        answer:
          'Na začátku Taťána píše dopis a Oněgin ji odmítne; na konci píše dopis Oněgin a odmítne ho Taťána. Situace se obrátí – ukazuje to ironii osudu a Oněginovu promarněnou šanci.',
        points: [
          { label: 'Taťánin dopis a odmítnutí', keywords: ['taťán', 'dopis'] },
          { label: 'Oněginův dopis na konci', keywords: ['oněgin', 'konci', 'závěr'] },
          { label: 'obrácení situace / ironie osudu', keywords: ['obrác', 'ironi', 'zrcad', 'osud'] },
        ],
      },
    ],
  },
  {
    id: 'kytice',
    title: 'Kytice',
    author: 'Karel Jaromír Erben',
    authorLife: '1811–1870',
    year: '1853 (2. vydání 1861 rozšířeno o baladu Lilie)',
    category: 'st19',
    kind: 'lyricko-epika',
    genre: 'sbírka balad',
    period: 'Česká literatura 19. století – romantismus (národní obrození, 50. léta)',
    movement: 'Romantismus (s klasicistní vyvážeností formy), inspirace lidovou slovesností',
    narratorShort: 'er-forma, vypravěč baladického příběhu; hojné dialogy',
    settingShort: 'český venkov, les, jezero, hřbitov; neurčitý čas lidových pověstí',
    theme:
      'Střetnutí člověka s nadpřirozenými silami a osudem; vina a trest za porušení přirozeného či mravního řádu (mateřská láska, rodinné vztahy, věrnost).',
    motifs: ['vina a trest', 'mateřská láska', 'smrt', 'nadpřirozené bytosti (vodník, polednice)', 'porušení zákazu', 'svědomí', 'vykoupení (Záhořovo lože)', 'národ a lidová tradice'],
    mainIdea:
      'Kdo poruší přirozený a mravní řád, bývá krutě potrestán; jedinou výjimkou je Záhořovo lože, kde upřímné pokání vede k odpuštění. Sbírka zároveň oslavuje českou lidovou tradici.',
    mainCharacters: [
      ch('Matka (Kytice, Poklad, Polednice, Vodník, Dceřina kletba)', 'Postava matky prostupuje sbírkou – milující, ale i provinilá (v Pokladu zapomene dítě kvůli zlatu, v Polednici na dítě přivolá zlou bytost).'),
      ch('Vodník', 'Nadpřirozená bytost z jezera; odvede si dívku za ženu a pomstí se, když se k němu nevrátí.'),
      ch('Polednice', 'Zlá nadpřirozená bytost, kterou matka v hněvu přivolá na zlobivé dítě.'),
      ch('Dívka ze Svatební košile', 'Sirota, která se rouhavě modlí za návrat mrtvého milého; zachrání ji modlitba k Panně Marii.'),
      ch('Záhoř', 'Loupežník, který se upřímným pokáním vykoupí z viny.'),
    ],
    sideCharacters: [
      ch('Dornička', 'Hrdinka Zlatého kolovratu, zavražděná macechou a nevlastní sestrou, zázračně oživena.'),
      ch('Hana a Marie', 'Dívky ze Štědrého dne, které věští svou budoucnost na zamrzlém jezeře.'),
      ch('Mladá vdova', 'Hrdinka Holoubka, která otrávila manžela; výčitky svědomí ji dovedou k sebevraždě.'),
    ],
    plot:
      'Sbírka obsahuje 13 balad: Kytice (úvodní báseň – mrtvá matka se promění v mateřídoušku; sbírka jako kytice pro národ), Poklad (matka o Velkém pátku zapomene v jeskyni dítě kvůli zlatu), Svatební košile (mrtvý milý přijde pro dívku, zachrání ji modlitba), Polednice (matka přivolá na dítě polednici, dítě zemře), Zlatý kolovrat (zavražděná Dornička je oživena a pravdu odhalí zpívající kolovrat), Štědrý den (dvě dívky věští budoucnost, jedna uvidí svatbu, druhá smrt), Holoubek (vdova otráví muže, holoubek na hrobě jí připomíná vinu), Záhořovo lože (loupežník se kajícností vykoupí), Vodník (dívka neuposlechne matku, stane se vodníkovou ženou; vodník zabije jejich dítě), Vrba (muž pokácí vrbu, v níž žije duše jeho ženy), Lilie (dívka proměněná v lilii zahyne na slunci), Dceřina kletba (dcera, která zabila své dítě, proklíná matku), Věštkyně (proroctví o osudu českého národa).',
    plotEvents: [
      'Kytice',
      'Poklad',
      'Svatební košile',
      'Polednice',
      'Zlatý kolovrat',
      'Štědrý den',
      'Holoubek',
      'Záhořovo lože',
      'Vodník',
      'Vrba',
      'Lilie',
      'Dceřina kletba',
      'Věštkyně',
    ],
    setting: 'Český venkov – chalupa, les, jezero, hřbitov, jeskyně ve skále; prostředí lidových pověstí.',
    time: 'Neurčitý „bájný“ čas lidových pověstí; v jednotlivých baladách často důležitá denní či roční doba (poledne, půlnoc, Štědrý den, Velký pátek, klekání).',
    composition:
      'Sbírka 13 balad (v 1. vydání 12). Souměrná (zrcadlová) kompozice – úvodní Kytice a závěrečná Věštkyně tvoří rámec s národní tematikou, básně si motivicky odpovídají v párech (např. Poklad × Dceřina kletba – vztah matky a dítěte). Jednotlivé balady mají baladickou stavbu: rychlý spád, dramatičnost, tragický konec.',
    narrator: 'Er-forma – vypravěč baladického příběhu; často ustupuje do pozadí a děj nesou dialogy postav (dramatičnost). V Kytici a Věštkyni vystupuje lyrický subjekt blízký autorovi.',
    narrativeModes: 'Vyprávění s rychlým spádem, dramatické dialogy, stručné popisy přírody a prostředí; minimum komentářů.',
    speechTypes: 'Přímá řeč, dialogy (Dceřina kletba je celá dialogem matky a dcery), monology, zvolání.',
    verse:
      'Verš vázaný, přízvučný (sylabotónický) – převládá trochej, také daktyl; krátké verše, rým sdružený i střídavý; výrazný rytmus a zvukomalba. Příklad: „Na topole nad jezerem / seděl vodník pod večerem.“',
    language:
      'Inspirace lidovou slovesností (písně, pohádky, pověsti); spisovný jazyk s lidovými výrazy, archaismy a zdrobnělinami; úsporné, dramatické vyjadřování, opakování, citoslovce a zvukomalba (onomatopoie).',
    tropes:
      'Personifikace (zpívající kolovrat, mluvící vrba), epiteta (stálá lidová epiteta), symboly (holoubek = svědomí, vrba = duše), gradace (Polednice, Svatební košile), anafora a opakování, onomatopoie, kontrast, apostrofa, elipsy (dramatičnost).',
    authorContext:
      'K. J. Erben – básník, sběratel lidové slovesnosti, historik a archivář (archivář města Prahy). Vydal Prostonárodní české písně a říkadla a České pohádky (Dlouhý, Široký a Bystrozraký; Tři zlaté vlasy děda Vševěda; Zlatovláska). Kytice je jeho jediná básnická sbírka, pracoval na ní dlouhá léta.',
    historicalContext:
      'Česká literatura 19. století; Kytice vychází v 50. letech (Bachův absolutismus) jako vyvrcholení romantické inspirace lidovou tvorbou. Obdobně sbírali lidovou slovesnost bratři Grimmové, F. L. Čelakovský, B. Němcová. Erben navazuje na lidovou baladu, ale formou je klasicistně vyvážený (na rozdíl od subjektivního Máchy). Návaznost: J. Neruda – Balady a romance, J. Wolker (Balady), inspirace pro skladatele (A. Dvořák – symfonické básně Vodník, Polednice, Zlatý kolovrat, Holoubek) a film F. A. Brabce (2000).',
    otherWorks: ['Prostonárodní české písně a říkadla', 'České pohádky (Dlouhý, Široký a Bystrozraký; Tři zlaté vlasy děda Vševěda)', 'Sto prostonárodních pohádek a pověstí slovanských'],
    interpretation:
      'Balady ukazují svět, v němž je řád (přírodní, rodinný, křesťanský) nedotknutelný; kdo jej poruší, je potrestán. Nadpřirozené bytosti jsou vykonavateli trestu. Kytice je zároveň „kytice“ z lidových pověstí věnovaná národu.',
    examTips:
      'Znej názvy balad a jejich děj, zrcadlovou kompozici, motiv viny a trestu, lyricko-epický druh (balada), inspiraci folklórem a Erbena jako sběratele. Výňatky bývají z Vodníka, Polednice, Svatební košile.',
    quick: [
      'K. J. Erben, 1853 (2. vyd. 1861 + Lilie); sbírka 13 balad – lyricko-epické dílo.',
      'Hlavní motiv: vina a trest, porušení řádu, mateřská láska, nadpřirozeno.',
      'Balady: Kytice, Poklad, Svatební košile, Polednice, Zlatý kolovrat, Štědrý den, Holoubek, Záhořovo lože, Vodník, Vrba, Lilie, Dceřina kletba, Věštkyně.',
      'Zrcadlová kompozice (rámec Kytice – Věštkyně); výjimka – vykoupení v Záhořově loži.',
      'Inspirace lidovou slovesností; dramatické dialogy, gradace, personifikace, symboly.',
      'Erben: sběratel pohádek a písní, archivář Prahy.',
    ],
    clues: [
      'Sbírka balad, v níž vodník zabije vlastní dítě, když se mu žena nevrátí.',
      'Matka přivolá na zlobivé dítě nadpřirozenou bytost v pravé poledne.',
      'Básnická sbírka inspirovaná lidovými pověstmi, jejíž úvodní báseň mluví o mateřídoušce.',
    ],
    scenes: [
      {
        scene: 'Vodník sedí na topoli nad jezerem a šije si botičky a zelený kabátek (úvod balady Vodník).',
        context: 'Začátek balady Vodník – následuje matčino varování a dcera přesto jde k jezeru prát prádlo.',
      },
      {
        scene: 'Matka u plotny v hněvu volá na plačící dítě, ať si pro něj přijde polednice.',
        context: 'Balada Polednice – expozice; poté se objeví polednice, matka omdlí a otec najde dítě mrtvé.',
      },
      {
        scene: 'Mrtvý milý vede dívku za noci přes skály a hřbitov a žádá, aby odhodila modlitební knížku a růženec.',
        context: 'Balada Svatební košile – po dívčině rouhavé modlitbě; vyvrcholí v márnici, kde ji zachrání modlitba a kohoutí kokrhání.',
      },
    ],
    deepQuestions: [
      {
        q: 'Jak se v Kytici projevuje motiv viny a trestu? Uveďte příklady.',
        area: 'theme',
        answer:
          'Postavy poruší řád (přírodní, rodinný či náboženský) a jsou potrestány: v Polednici matka přivolá zlou bytost a dítě zemře, ve Vodníkovi dcera neuposlechne matku a nakonec přijde o dítě, v Holoubkovi vdova otráví muže a svědomí ji dožene k sebevraždě. Výjimkou je Záhořovo lože – vina je odčiněna pokáním.',
        points: [
          { label: 'porušení řádu / zákazu', keywords: ['poruš', 'zákaz', 'neuposlech', 'řád'] },
          { label: 'konkrétní příklad (Polednice, Vodník, Holoubek…)', keywords: ['polednic', 'vodník', 'holoub', 'poklad', 'vrba', 'košil'] },
          { label: 'trest – často smrt', keywords: ['trest', 'smrt', 'zemř'] },
          { label: 'výjimka: Záhořovo lože – vykoupení', keywords: ['záhoř', 'vykoup', 'odpušt', 'pokán'] },
        ],
      },
      {
        q: 'Proč je Kytice lyricko-epické dílo a co je typické pro baladu?',
        area: 'genre',
        answer:
          'Balada je lyricko-epický žánr: má děj (epika), ale je psaná veršem s výraznou citovostí a zvukovostí (lyrika). Typický je ponurý, tragický děj, rychlý spád, dramatičnost, dialogy, nadpřirozené prvky a tragický konec.',
        points: [
          { label: 'děj + verš a citovost (lyrika i epika)', keywords: ['děj', 'verš', 'lyri', 'epi'] },
          { label: 'tragický konec', keywords: ['tragick', 'smrt', 'ponur'] },
          { label: 'dramatičnost, dialogy, rychlý spád', keywords: ['dramat', 'dialog', 'spád'] },
          { label: 'nadpřirozeno', keywords: ['nadpřiroz', 'bytost'] },
        ],
      },
    ],
  },
  {
    id: 'maj',
    title: 'Máj',
    author: 'Karel Hynek Mácha',
    authorLife: '1810–1836',
    year: '1836',
    category: 'st19',
    kind: 'lyricko-epika',
    genre: 'lyricko-epická (romantická) báseň',
    period: 'Romantismus (česká literatura 30. let 19. století)',
    movement: 'Romantismus',
    narratorShort: 'er-forma se silným lyrickým subjektem (básník vstupuje do díla)',
    settingShort: 'krajina u jezera pod horami (inspirace Máchovým krajem), vězení, popraviště',
    theme:
      'Tragický příběh lásky, zrady a otcovraždy: Vilém zabije svůdce své milé, který se ukáže být jeho otcem, a je popraven; zároveň úvaha o smyslu života, smrti a nicotě.',
    motifs: ['láska a zrada', 'otcovražda', 'vina a trest', 'smrt a nicota', 'příroda (máj, jezero, noc)', 'čas a pomíjivost', 'vyděděnec', 'domov (krásná zem)'],
    mainIdea:
      'Člověk je tragicky vydán osudu; po smrti ho čeká „nic“ – nicota. Proti lidské pomíjivosti stojí věčná, krásná příroda. Básník se s tragédií Viléma a jeho světobolem ztotožňuje.',
    mainCharacters: [
      ch('Vilém', '„Strašný lesů pán“, vůdce loupežníků; jako dítě byl vyhnán z domova. Zabije Jarmilina svůdce, aniž ví, že je to jeho otec. Romantický hrdina – vyděděnec, vzpurný, rozervaný.'),
      ch('Jarmila', 'Vilémova milá, kterou svedl Vilémův otec; když se dozví o Vilémově osudu, vrhne se do jezera.'),
      ch('Vilémův otec', 'Svůdce Jarmily; Vilém ho zabije, aniž ho pozná.'),
      ch('Básník (Hynek)', 'Lyrický subjekt ve 4. zpěvu; po sedmi letech navštíví místo Vilémovy popravy a ztotožní se s jeho osudem.'),
    ],
    sideCharacters: [
      ch('Plavec (poutník)', 'Přináší Jarmile zprávu o Vilémově uvěznění a o tom, že zavražděný byl jeho otec.'),
      ch('Žalářník', 'Pozoruje Viléma ve vězení.'),
      ch('Loupežníci (Vilémova družina)', 'V intermezzu II truchlí nad smrtí svého vůdce.'),
    ],
    plot:
      '1. zpěv: Za májového večera čeká Jarmila na břehu jezera na Viléma. Místo něj připluje plavec a sdělí jí, že Vilém bude zítra popraven, protože zabil jejího svůdce – svého vlastního otce. Jarmila se vrhne do jezera. 2. zpěv: Vilém ve vězení vzpomíná na dětství, na vyhnání z domova a přemýšlí o smrti a nicotě. Intermezzo I: o půlnoci se duchové přírody sejdou na popravišti a chystají pohřeb svého pána. 3. zpěv: Vilém je veden na popraviště, loučí se s krásnou zemí a je popraven; jeho ostatky jsou vystaveny na popravišti. Intermezzo II: loupežníci truchlí nad smrtí svého vůdce. 4. zpěv: Po sedmi letech přichází na místo básník (Hynek), vyslechne příběh a spatří Vilémovu lebku. Ztotožní se s ním a báseň končí zvoláním „Hynku! – Viléme! – Jarmilo!“.',
    plotEvents: [
      'Jarmila čeká za májového večera na břehu jezera na Viléma.',
      'Plavec jí oznámí, že Vilém bude popraven za vraždu svého otce – jejího svůdce.',
      'Jarmila se vrhne do jezera.',
      'Vilém ve vězení přemýšlí o dětství, smrti a nicotě.',
      'Duchové přírody se o půlnoci chystají k pohřbu (Intermezzo I).',
      'Vilém se loučí s krásnou zemí a je popraven.',
      'Loupežníci truchlí nad smrtí svého vůdce (Intermezzo II).',
      'Po sedmi letech se na místo vrací básník a ztotožní se s Vilémem.',
    ],
    setting:
      'Romantická krajina u jezera pod horami (inspirace krajinou kolem Doks a Bezdězu – dnešní Máchův kraj), žalář, popraviště na pahorku.',
    time: 'Večer 1. máje a následující den (poprava); 4. zpěv po sedmi letech, opět 1. máje.',
    composition:
      'Čtyři zpěvy a dvě intermezza (Intermezzo I po 1. zpěvu, Intermezzo II po 3. zpěvu); úvodní věnování „Hynku Kommovi, měšťanu pražskému“. Příběh vyprávěn s retrospektivou (Vilémovo dětství, vražda se dozvídáme zpětně). 4. zpěv tvoří rámec – básník vstupuje do díla.',
    narrator:
      'Er-forma, ale se silně subjektivním lyrickým subjektem; ve 4. zpěvu vystupuje přímo básník (Hynek) v ich-formě. Epická linie je potlačena lyrickými pasážemi (popisy přírody, úvahy o smrti).',
    narrativeModes: 'Lyrické popisy přírody, vyprávění (epická linie), úvahy (Vilémovy monology o smrti a nicotě), vyjádření pocitů.',
    speechTypes: 'Pásmo vypravěče, přímá řeč, rozsáhlé Vilémovy monology ve vězení, promluvy duchů v intermezzu (sborové promluvy).',
    verse:
      'Verš vázaný – převládá jambický čtyřstopý verš, střídavý, sdružený i obkročný rým; mimořádná eufonie (libozvučnost) a zvukomalba. „Byl pozdní večer – první máj – / večerní máj – byl lásky čas.“',
    language:
      'Básnický, velmi obrazný a libozvučný jazyk; bohatá práce se zvukem (eufonie), neologismy a básnická slova, archaismy, inverze (převrácený slovosled), citově zabarvená slova.',
    tropes:
      'Metafory, personifikace přírody („hrdliččin zval ku lásce hlas“), epiteta, přirovnání, oxymóra a kontrasty (světlo × tma, život × smrt, krása přírody × lidská tragédie), anafora, apostrofa („Ó krásná zem, ty zem milovaná“), symboly (máj = láska, mládí; noc, jezero), řečnické otázky.',
    authorContext:
      'K. H. Mácha – největší český romantický básník; studoval práva, psal česky i německy, miloval toulky přírodou a hrady. Máj vydal roku 1836 vlastním nákladem, téhož roku zemřel v Litoměřicích (nejspíš na zápal plic), několik dní před plánovanou svatbou s Lori Šomkovou. Roku 1939 byly jeho ostatky převezeny na Vyšehrad. Další díla: Cikáni (román), Marinka (povídka), Obrazy ze života mého, Křivoklad, deníky.',
    historicalContext:
      'Vrchol českého romantismu, 30. léta 19. století (národní obrození). Současníci Máj odmítali (např. J. K. Tyl) jako nevlastenecký a příliš subjektivní; ocenila ho až další generace – májovci (almanach Máj, 1858: Neruda, Hálek). Evropský kontext: lord Byron (byronismus, světobol), A. Mickiewicz, A. S. Puškin (Evžen Oněgin). Pozdější reakce: V. Nezval, J. Seifert, F. Halas, K. Hlaváček; pojmenování májovců.',
    otherWorks: ['Cikáni', 'Marinka', 'Obrazy ze života mého', 'Křivoklad', 'Deníky'],
    interpretation:
      'Máj řeší existenciální otázky – vina, osud, smrt a nicota; Vilém je romantický vyděděnec, jehož vina je tragická (nevěděl, koho zabíjí). Kontrast věčné a krásné přírody s pomíjivým člověkem vyznívá skepticky. Ve 4. zpěvu se básník s Vilémem ztotožňuje – romantický subjektivismus.',
    examTips:
      'Zapamatuj úvodní verše, stavbu (4 zpěvy + 2 intermezza), jambický verš a eufonii, romantického hrdinu, motiv nicoty, dobové odmítnutí a pozdější uznání (májovci).',
    quick: [
      'K. H. Mácha, 1836, vrchol českého romantismu; lyricko-epická báseň.',
      'Vilém zabije svůdce Jarmily – vlastního otce – a je popraven; Jarmila se utopí.',
      'Stavba: 4 zpěvy + 2 intermezza; ve 4. zpěvu vystupuje básník Hynek.',
      'Motivy: láska, zrada, otcovražda, smrt a nicota, věčná příroda × pomíjivý člověk.',
      'Jambický verš, eufonie; „Byl pozdní večer – první máj…“',
      'Současníky odmítnut (Tyl), oceněn májovci (1858).',
    ],
    clues: [
      'Loupežník zabije svůdce své milé a zjistí, že to byl jeho otec.',
      'Báseň začínající veršem „Byl pozdní večer – první máj“.',
      'Lyricko-epická skladba o čtyřech zpěvech a dvou intermezzech.',
    ],
    scenes: [
      {
        scene: 'Jarmila sedí za májového večera na skále u jezera a vyhlíží loďku s milým.',
        context: 'Začátek 1. zpěvu – po úvodním popisu májové přírody; následuje příjezd plavce se zprávou o Vilémovi a Jarmilina smrt.',
      },
      {
        scene: 'Vilém v žaláři přemýšlí o tom, co bude po smrti, a dochází k představě nicoty.',
        context: '2. zpěv – noc před popravou; poté následuje Intermezzo I s duchy přírody.',
      },
      {
        scene: 'Vilém se na cestě na popraviště loučí s krásnou zemí.',
        context: '3. zpěv – ráno v den popravy; následuje poprava a Intermezzo II.',
      },
    ],
    deepQuestions: [
      {
        q: 'Jak se v Máji projevuje kontrast mezi přírodou a člověkem?',
        area: 'theme',
        answer:
          'Příroda je krásná, věčná a každý máj se obnovuje (máj = láska, mládí), zatímco lidský osud je tragický a pomíjivý. Vilémova poprava se odehrává v nádherné májové přírodě. Kontrast zdůrazňuje lidskou malost a osamění tváří v tvář smrti a nicotě.',
        points: [
          { label: 'krásná, věčná příroda', keywords: ['přírod', 'věčn', 'krás'] },
          { label: 'pomíjivost a tragédie člověka', keywords: ['pomíjiv', 'tragéd', 'smrt'] },
          { label: 'kontrast', keywords: ['kontrast', 'protiklad'] },
          { label: 'nicota', keywords: ['nicot', 'nic'] },
        ],
      },
      {
        q: 'Proč je Vilém typickým romantickým hrdinou?',
        area: 'characters',
        answer:
          'Je to vyděděnec vyhnaný z domova, vůdce loupežníků, stojí mimo společnost a proti ní; je vzpurný, rozervaný, prožívá silné city. Jeho vina je tragická (nevěděl, že zabíjí otce). Před smrtí řeší otázky smyslu bytí.',
        points: [
          { label: 'vyděděnec / mimo společnost', keywords: ['vyděděn', 'vyhnan', 'mimo', 'loupež'] },
          { label: 'vzpoura, rozervanost, silné city', keywords: ['vzpour', 'rozerva', 'cit'] },
          { label: 'tragická vina (neznalost)', keywords: ['tragick', 'nevěd', 'otc'] },
          { label: 'otázka smyslu bytí, smrti', keywords: ['smysl', 'smrt', 'nicot'] },
        ],
      },
    ],
  },
  {
    id: 'revizor',
    title: 'Revizor',
    author: 'Nikolaj Vasiljevič Gogol',
    authorLife: '1809–1852',
    year: '1836',
    category: 'st19',
    kind: 'drama',
    genre: 'satirická komedie o pěti dějstvích',
    period: 'Světová literatura 19. století – ruský realismus (1. polovina 19. století)',
    movement: 'Kritický realismus; satira',
    narratorShort: 'drama – bez vypravěče',
    settingShort: 'malé ruské okresní městečko, počátek 30. let 19. století; děj trvá asi 24 hodin',
    theme:
      'Úředníci zkorumpovaného ruského městečka považují bezvýznamného mladíka Chlestakova za tajného revizora z Petrohradu, podplácejí ho a podlézají mu – a pak přijede revizor skutečný.',
    motifs: ['korupce a úplatky', 'strach z kontroly', 'podlézavost', 'záměna osob', 'lež a vychloubání', 'byrokracie', 'hloupost a nevzdělanost', 'pomluvy a drby', 'otevírání dopisů', 'zrcadlo'],
    mainIdea:
      'Gogol zesměšňuje úplatkářství, hloupost a podlézavost úředníků carského Ruska. Strach a špatné svědomí z nich udělají snadnou oběť podvodníka. Divák se směje, ale vidí v nich i sebe („Čemu se smějete? Sami sobě se smějete!“).',
    mainCharacters: [
      ch('Ivan Alexandrovič Chlestakov', 'Mladý bezvýznamný petrohradský úředník, lehkomyslný a prázdný; prohrál v kartách všechny peníze a nemá na zaplacení hostince. Když ho považují za revizora, rychle toho využije: bere „půjčky“, vychloubá se smyšlenými známostmi, dvoří se hejtmanově ženě i dceři a včas zmizí.'),
      ch('Hejtman (Anton Antonovič)', 'Představený městečka, zkušený úplatkář a zloděj obecních peněz. Ze strachu z revize Chlestakova ubytuje u sebe, podplácí ho a nabídne mu ruku své dcery; sní o kariéře v Petrohradě. Nakonec je sám podveden.'),
    ],
    sideCharacters: [
      ch('Osip', 'Chlestakovův starý sluha; chytřejší než jeho pán, přiměje ho včas odjet, než se podvod prozradí.'),
      ch('Anna Andrejevna a Marja Antonovna', 'Hejtmanova žena a dcera; marnivé a koketní, obě se nechají Chlestakovem okouzlit.'),
      ch('Bobčinskij a Dobčinskij', 'Dva statkáři a klevetníci, kteří běhají po městě se zprávami; jako první prohlásí Chlestakova za revizora.'),
      ch('Poštmistr', 'Ze zvědavosti otevírá cizí dopisy – tak se nakonec všichni dozvědí o Chlestakovově podvodu.'),
      ch('Soudce, školní inspektor, správce chudobince', 'Městští úředníci – úplatkáři a nedbalci, kteří Chlestakovovi ochotně „půjčují“ peníze.'),
      ch('Strážník Děržimorda', 'Hrubý policista, symbol policejní zvůle.'),
    ],
    plot:
      'Hejtman svolá městské úředníky a oznámí jim, že podle dopisu z Petrohradu přijede inkognito revizor. Všichni mají špatné svědomí – berou úplatky, kradou a ve městě je nepořádek. Bobčinskij a Dobčinskij přiběhnou se zprávou, že v hostinci už dva týdny bydlí mladý muž z Petrohradu, který nic neplatí – určitě je to revizor. Je to však Chlestakov, drobný úředník, který prohrál peníze v kartách a hostinský mu už nechce dávat jíst. Hejtman ho navštíví, omlouvá se a odvede si ho k sobě domů. Chlestakov zprvu nechápe, proč se k němu všichni tak chovají, ale pak toho využije: úředníci a kupci mu jeden po druhém přinášejí „půjčky“ a dary, on se vychloubá, jak se stýká s ministry a Puškinem. Dvoří se hejtmanově ženě i dceři a nakonec požádá o ruku dcery. Sluha Osip ho přiměje, aby co nejdřív odjel; Chlestakov tvrdí, že jede za strýcem pro požehnání ke svatbě. Hejtman se už vidí v Petrohradě jako generál. Pak poštmistr přinese otevřený Chlestakovův dopis příteli, ve kterém se všem vysmívá. Hejtman zuří a obviňuje i sám sebe. V tu chvíli četník oznámí, že přijel skutečný revizor z Petrohradu a chce je všechny vidět. Hra končí němou scénou – všichni ztuhnou.',
    plotEvents: [
      'Hejtman oznámí úředníkům, že přijede tajný revizor.',
      'Bobčinskij a Dobčinskij prohlásí za revizora Chlestakova, který bydlí v hostinci.',
      'Hejtman ho ze strachu ubytuje u sebe doma.',
      'Úředníci a kupci Chlestakovovi dávají „půjčky“ a dary.',
      'Chlestakov se vychloubá, dvoří se hejtmanově ženě i dceři a požádá o ruku dcery.',
      'Na Osipovu radu Chlestakov včas odjede.',
      'Poštmistr přečte Chlestakovův dopis, kde se všem vysmívá.',
      'Přijede skutečný revizor – němá scéna.',
    ],
    setting: 'Malé ruské okresní městečko daleko od Petrohradu: hostinec, hejtmanův dům.',
    time: 'Počátek 30. let 19. století (Rusko za cara Mikuláše I.); děj trvá zhruba 24 hodin.',
    composition:
      'Pět dějství, chronologický děj, soustředěný na jedno místo a krátký čas. Vtip stojí na záměně osob. Expozice (zpráva o revizorovi) – kolize (Chlestakov považován za revizora) – krize (podplácení, zásnuby) – peripetie (Chlestakov odjede, dopis je přečten) – katastrofa (příjezd skutečného revizora). Na konci slavná „němá scéna“.',
    narrator: 'Drama nemá vypravěče; děj se odvíjí v dialozích a monolozích postav, autor připojil podrobné poznámky k postavám a scénické poznámky.',
    narrativeModes: 'Dialogy, monology, scénické poznámky; dopis.',
    speechTypes: 'Dialogy, monology (hejtman, Chlestakov), řeč stranou, přečtený dopis.',
    verse: '',
    language: 'Próza; hovorový jazyk postav, který je charakterizuje (vychloubačné řeči Chlestakova, podlézavé projevy úředníků), mluvící jména, komické přeřeky. Motto hry: „Nevrč, brachu, na zrcadlo, když máš křivou hubu.“',
    tropes: 'Satira, ironie, groteska, nadsázka (hyperbola – Chlestakovovo vychloubání), situační komika, mluvící jména, kontrast mezi zdáním a skutečností.',
    authorContext:
      'Nikolaj Vasiljevič Gogol – ruský prozaik a dramatik ukrajinského původu, zakladatel ruského kritického realismu. Námět Revizora mu prý dal A. S. Puškin. Další díla: Mrtvé duše, Petrohradské povídky (Plášť, Nos), Taras Bulba, Večery na samotě u Dikaňky, Ženitba.',
    historicalContext:
      'Rusko za cara Mikuláše I. – absolutismus, rozbujelá byrokracie, tajná policie a cenzura, korupce úředníků; z Petrohradu se do provincie posílali revizoři. Premiéra 1836 v Petrohradě měla úspěch u mladé generace, ale vyvolala odpor vyšší společnosti. Současníci: A. S. Puškin (Evžen Oněgin), M. J. Lermontov; v Čechách hru přeložil už v 19. století např. J. Mikuláš Boleslavský a známý je film Revizor (1933) s Vlastou Burianem.',
    otherWorks: ['Mrtvé duše', 'Plášť', 'Nos', 'Taras Bulba', 'Večery na samotě u Dikaňky', 'Ženitba'],
    interpretation:
      'Hra je satirou na celé carské Rusko: městečko je zmenšený obraz státu, kde vládne strach, úplatky a přetvářka. Chlestakov není záměrný podvodník – je prázdný člověk, kterého si úředníci sami „vytvoří“ ze svého strachu. Němá scéna ukazuje, že trest přichází. Gogol sám později hru vykládal i nábožensky: skutečný revizor jako Boží soud nad lidskou duší.',
    examTips:
      'Znát záměnu (Chlestakov považován za revizora), hejtmana, Bobčinského a Dobčinského, Osipa, poštmistra, který otevírá dopisy, a závěr s příjezdem skutečného revizora (němá scéna). Druh drama – satirická komedie, 5 dějství, próza. Kritický realismus, korupce za Mikuláše I. Motto o zrcadle.',
    quick: [
      'N. V. Gogol, 1836; satirická komedie o 5 dějstvích; ruský realismus.',
      'Úředníci ruského městečka čekají tajného revizora.',
      'Za revizora považují zadluženého mladíka Chlestakova.',
      'Podplácejí ho, hejtman mu nabídne dceru; Chlestakov včas odjede.',
      'Poštmistr otevře jeho dopis – podvod prozrazen.',
      'Přijede skutečný revizor – němá scéna.',
    ],
    clues: [
      'Komedie, v níž úředníci ze strachu z kontroly podplácejí bezvýznamného mladíka, kterého si spletli s tajným vyslancem z hlavního města.',
      'Hra, ve které poštmistr ze zvědavosti otevírá cizí dopisy a díky tomu se prozradí podvod.',
      'Komedie končící němou scénou, kdy strážník oznámí příjezd skutečného úředníka z Petrohradu.',
    ],
    scenes: [
      {
        scene: 'Představený města svolá úředníky a oznámí jim „nepříjemnou zprávu“: přijede k nim inkognito úředník z Petrohradu, aby vše prověřil.',
        context: 'Začátek hry (1. dějství) – hejtman varuje úředníky před revizorem; všichni mají špatné svědomí.',
      },
      {
        scene: 'Mladík u stolu vypráví, jak se stýká s ministry, jak píše knihy a jak se o jeho přízeň uchází celý Petrohrad; posluchači se chvějí úctou.',
        context: 'Chlestakovovo vychloubání v hejtmanově domě – úředníci věří, že mluví s mocným revizorem.',
      },
      {
        scene: 'Úředník nahlas čte dopis, v němž odjíždějící host popisuje všechny místní jako hlupáky a dává jim posměšné přezdívky.',
        context: 'Závěr (5. dějství) – poštmistr otevřel Chlestakovův dopis; podvod je prozrazen a vzápětí přijede skutečný revizor.',
      },
    ],
    deepQuestions: [
      {
        q: 'Proč úředníci považují Chlestakova za revizora?',
        area: 'characters',
        answer:
          'Mají špatné svědomí – berou úplatky, kradou a zanedbávají povinnosti – a proto se bojí. Klevetníci Bobčinskij a Dobčinskij zjistí, že v hostinci bydlí mladík z Petrohradu, který nic neplatí, a hned z něj udělají revizora. Strach a hloupost jim nedovolí vidět pravdu; Chlestakova si „vytvoří“ sami. Chlestakov zpočátku nic nepředstírá, teprve pak toho využije.',
        points: [
          { label: 'špatné svědomí, strach', keywords: ['svědom', 'strach', 'boj'] },
          { label: 'klevetníci Bobčinskij a Dobčinskij', keywords: ['bobčin', 'dobčin', 'klevet', 'drb'] },
          { label: 'hloupost, sebeklam', keywords: ['hloup', 'sebeklam', 'vytvoř'] },
          { label: 'Chlestakov toho využije', keywords: ['využ', 'chlestakov'] },
        ],
      },
      {
        q: 'V čem spočívá satira Revizora?',
        area: 'theme',
        answer:
          'Gogol zesměšňuje úplatkářství, nevzdělanost, podlézavost a byrokracii úředníků carského Ruska. Městečko je obrazem celé země. Satira používá nadsázku, grotesku, situační komiku a mluvící jména. Hejtmanovo „Čemu se smějete? Sami sobě se smějete!“ a motto o zrcadle obracejí kritiku i k divákům.',
        points: [
          { label: 'korupce, úplatky', keywords: ['koru', 'úplat', 'podplác'] },
          { label: 'byrokracie carského Ruska', keywords: ['byrokra', 'úřed', 'carsk', 'rusk'] },
          { label: 'nadsázka, groteska, komika', keywords: ['nadsáz', 'grotesk', 'komik', 'hyperbol'] },
          { label: 'zrcadlo – smějeme se sami sobě', keywords: ['zrcad', 'sami sobě', 'divák'] },
        ],
      },
      {
        q: 'Jaký význam má závěrečná němá scéna?',
        area: 'composition',
        answer:
          'Když strážník oznámí příjezd skutečného revizora, všechny postavy ztuhnou v úžasu a zděšení. Podvod je odhalen a úředníky čeká skutečná kontrola – trest přichází. Němá scéna je pointou hry a nechává diváka domyslet, co bude dál; Gogol ji později vykládal i jako obraz Božího soudu.',
        points: [
          { label: 'přijel skutečný revizor', keywords: ['skuteč', 'revizor'] },
          { label: 'ztuhnutí, úžas a zděšení', keywords: ['ztuh', 'úžas', 'zděš', 'němá'] },
          { label: 'trest / soud', keywords: ['trest', 'soud'] },
        ],
      },
    ],
  },
  {
    id: 'kulicka',
    title: 'Kulička',
    author: 'Guy de Maupassant',
    authorLife: '1850–1893',
    year: '1880',
    category: 'st19',
    kind: 'epika',
    genre: 'povídka (novela)',
    period: 'Světová literatura 19. století – realismus a naturalismus (Francie)',
    movement: 'Realismus a naturalismus',
    narratorShort: 'er-forma, objektivní vševědoucí vypravěč',
    settingShort: 'Normandie (Rouen – hostinec v Tôtes – cesta k Le Havru) za prusko-francouzské války, zima 1870',
    theme:
      'Prostitutka Kulička se obětuje pro spolucestující z „lepší společnosti“, kteří ji k tomu sami donutí a pak jí opovrhují.',
    motifs: ['pokrytectví', 'společenské vrstvy a předsudky', 'válka a okupace', 'vlastenectví', 'oběť', 'sobectví', 'jídlo a hlad', 'morálka', 'vydírání', 'nevděk'],
    mainIdea:
      'Člověk z nejnižší vrstvy může být morálně mnohem lepší než „ctihodní“ bohatí měšťané a šlechtici. Ti jsou sobečtí, pokrytečtí a vděk neznají – svou čest a víru ohýbají podle vlastního prospěchu.',
    mainCharacters: [
      ch('Kulička (Alžběta Roussetová)', 'Prostitutka z Rouenu, podle své kypré postavy přezdívaná Kulička. Dobrosrdečná, štědrá a vlastenecká (bonapartistka); odmítá se vydat pruskému důstojníkovi, dokud ji spolucestující nepřemluví. Na konci zůstane opovrhovaná, hladová a pláče.'),
    ],
    sideCharacters: [
      ch('Manželé Loiseauovi', 'Velkoobchodník s vínem, vychytralý šibal a vtipálek, a jeho rázná, počtářská žena.'),
      ch('Manželé Carré-Lamadonovi', 'Bohatý a vážený továrník (přádelny bavlny) a jeho mladá, hezká žena.'),
      ch('Hrabě a hraběnka de Bréville', 'Šlechtici ze starého rodu, nejvýše postavení cestující; hrabě vede „diplomatické“ přemlouvání Kuličky.'),
      ch('Dvě jeptišky', 'Starší a mladší řeholnice; starší svými řečmi o světcích pomáhá Kuličku přesvědčit, že oběť pro dobrou věc není hřích.'),
      ch('Cornudet', 'Demokrat (republikán) a pivař s rudým plnovousem; sám se Kuličce marně dvoří, k nátlaku se nepřidá a na konci si pohvizduje Marseillaisu.'),
      ch('Pruský důstojník', 'Velitel v hostinci v Tôtes; nepustí dostavník dál, dokud mu Kulička nebude po vůli.'),
      ch('Follenvie', 'Majitel hostince v Tôtes.'),
    ],
    plot:
      'Za prusko-francouzské války obsadí Prusové Rouen. Deset lidí si s povolením opatří dostavník a jednoho mrazivého rána vyjede do Le Havru: tři manželské páry z vyšší společnosti (Loiseauovi, Carré-Lamadonovi, hrabě a hraběnka de Bréville), dvě jeptišky, demokrat Cornudet a prostitutka Kulička. Dámy jí okázale opovrhují. Cesta se kvůli sněhu protahuje, nikde nelze nic koupit a všichni hladovějí – jedině Kulička má košík plný jídla a se všemi se ochotně rozdělí. Pak se k ní na chvíli chovají vlídně. Večer dorazí do hostince v Tôtes, kde je pruský důstojník. Ten nedovolí odjet, dokud se mu Kulička nepodvolí; ona to z vlastenectví a hrdosti odmítá. Zpočátku ji všichni podporují, ale po několika dnech čekání ji začnou přemlouvat: líčí jí příklady obětavých žen z historie, jeptiška mluví o světcích, kterým Bůh odpustí, když jednají pro dobrou věc. Kulička nakonec ustoupí. Druhý den smí dostavník odjet. Spolucestující se od Kuličky odtahují a nemluví s ní. Kulička v rychlosti zapomněla jídlo, a když ostatní vytáhnou své zásoby, nikdo se s ní nerozdělí. Cornudet si pohvizduje Marseillaisu a Kulička v koutě tiše pláče.',
    plotEvents: [
      'Prusové obsadí Rouen; deset lidí vyjede dostavníkem do Le Havru.',
      'Dámy Kuličkou opovrhují.',
      'Cestující hladovějí; Kulička se s nimi rozdělí o svůj košík jídla.',
      'V hostinci v Tôtes pruský důstojník nepustí dostavník dál, dokud se mu Kulička nepodvolí.',
      'Kulička z vlastenectví odmítá.',
      'Spolucestující ji několik dní přemlouvají; nakonec ustoupí.',
      'Dostavník odjede; nikdo s Kuličkou nemluví ani se s ní nerozdělí o jídlo.',
      'Kulička pláče, Cornudet si pohvizduje Marseillaisu.',
    ],
    setting: 'Normandie: okupovaný Rouen, zasněžená cesta, dostavník, hostinec v Tôtes, cesta k Le Havru.',
    time: 'Prusko-francouzská válka, zima 1870; děj trvá několik dní.',
    composition:
      'Chronologická povídka. Úvod popisuje porážku Francie a okupaci Rouenu. Rámcově souměrná stavba: dvě cesty dostavníkem – na první se Kulička dělí o jídlo, na druhé s ní nikdo; mezi nimi čekání v hostinci. Uzavřený, hořce ironický konec.',
    narrator: 'Er-forma; objektivní vševědoucí vypravěč, který nekomentuje přímo, ale ironicky vykresluje postavy jejich vlastním jednáním.',
    narrativeModes: 'Vyprávění, popis (válka, prostředí, postavy), charakteristika, dialogy.',
    speechTypes: 'Pásmo vypravěče, přímá řeč (dialogy cestujících), nepřímá řeč.',
    verse: '',
    language: 'Spisovný, věcný a přesný jazyk (v českém překladu), realistické detaily, ironie; přímá charakteristika postav; místy hovorové výrazy v řeči postav.',
    tropes: 'Ironie, kontrast (Kulička × „ctihodná“ společnost, první × druhá cesta), přirovnání, symbolika jídla (štědrost × sobectví), satira.',
    authorContext:
      'Guy de Maupassant – francouzský prozaik, mistr povídky, žák a přítel Gustava Flauberta. Účastnil se prusko-francouzské války, později byl úředníkem v Paříži. Kulička vyšla 1880 ve společném sborníku Médanské večery (kolem É. Zoly) a proslavila ho. Další díla: Miláček, Silná jako smrt, Petr a Jan, povídky Horla, Slečna Fifi.',
    historicalContext:
      'Prusko-francouzská válka 1870–1871 – porážka Francie, pád císařství Napoleona III. a pruská okupace severní Francie. Literatura 2. poloviny 19. století – realismus a naturalismus: É. Zola (Zabiják), G. Flaubert (Paní Bovaryová), H. de Balzac; v Rusku F. M. Dostojevskij, L. N. Tolstoj.',
    otherWorks: ['Miláček', 'Silná jako smrt', 'Petr a Jan', 'Horla', 'Slečna Fifi'],
    interpretation:
      'Povídka ostře kritizuje pokrytectví „lepší společnosti“: šlechtici, továrník, obchodník i jeptišky se dovolávají cti a víry, ale kvůli vlastnímu pohodlí obětují druhého a pak jím pohrdají. Kulička, kterou společnost odsuzuje, je jediná štědrá a vlastenecká. Jídlo symbolizuje rozdíl mezi její nezištností a sobectvím ostatních.',
    examTips:
      'Znát dobu (prusko-francouzská válka 1870), Rouen – dostavník – Tôtes, cestující (tři páry, jeptišky, Cornudet), košík s jídlem, pruského důstojníka a nátlak na Kuličku, závěr (nikdo se nerozdělí, pláč, Marseillaisa). Realismus/naturalismus, Médanské večery.',
    quick: [
      'G. de Maupassant, 1880 (sborník Médanské večery); povídka; realismus/naturalismus.',
      'Prusko-francouzská válka, okupovaný Rouen, cesta dostavníkem do Le Havru.',
      'Prostitutka Kulička se rozdělí o jídlo s hladovými „ctihodnými“ cestujícími.',
      'Pruský důstojník nepustí dostavník dál, dokud mu Kulička nebude po vůli.',
      'Spolucestující ji přemluví; potom jí opovrhují a nedají jí jíst.',
      'Kritika pokrytectví vyšších vrstev; Kulička pláče.',
    ],
    clues: [
      'Povídka o prostitutce, která se v dostavníku rozdělí o jídlo s hladovými spolucestujícími, kteří jí pak opovrhují.',
      'Příběh z prusko-francouzské války, v němž pruský důstojník nedovolí odjet dostavníku, dokud mu jedna z cestujících nebude po vůli.',
      'Povídka končící tím, že hrdinka hladová pláče v koutě dostavníku, zatímco jeden z cestujících pohvizduje Marseillaisu.',
    ],
    scenes: [
      {
        scene: 'Žena vytáhne zpod lavice velký košík s pečenými kuřaty, paštikou, ovocem a vínem, zatímco ostatní hladoví cestující na ni závistivě hledí.',
        context: 'První cesta dostavníkem – Kulička se s „ctihodnými“ spolucestujícími, kteří jí předtím pohrdali, štědře rozdělí o jídlo.',
      },
      {
        scene: 'Hostinský každý večer přijde se vzkazem od důstojníka, zda už si to slečna nerozmyslela; ostatní cestující u večeře probírají, jak ji přesvědčit.',
        context: 'Čekání v hostinci v Tôtes – nátlak spolucestujících, kteří chtějí za každou cenu odjet.',
      },
      {
        scene: 'Všichni jedí ze svých zásob a nikdo nenabídne hladové ženě, která si v rychlosti nestihla nic vzít; ona v koutě pláče.',
        context: 'Závěr – druhá cesta dostavníkem po Kuliččině oběti; spolucestující jí opovrhují a Cornudet pohvizduje Marseillaisu.',
      },
    ],
    deepQuestions: [
      {
        q: 'Jak Maupassant v Kuličce zobrazuje „lepší společnost“?',
        area: 'theme',
        answer:
          'Bohatí měšťané, šlechtici a jeptišky se ohánějí ctí, vírou a vlastenectvím, ale jednají sobecky a pokrytecky. Nejprve Kuličkou pohrdají, pak se nechají pohostit jejím jídlem, nakonec ji kvůli vlastnímu pohodlí donutí k oběti a poté jí znovu opovrhují. Kulička je jediná štědrá a vlastenecká postava – vyšší vrstvy jsou morálně pod ní.',
        points: [
          { label: 'pokrytectví, sobectví', keywords: ['pokryt', 'sobec'] },
          { label: 'pohrdání, nevděk', keywords: ['pohrd', 'opovrh', 'nevděk'] },
          { label: 'nátlak na Kuličku', keywords: ['nátlak', 'přemlouv', 'donut'] },
          { label: 'Kulička morálně lepší', keywords: ['morál', 'lepší', 'štědr', 'vlasten'] },
        ],
      },
      {
        q: 'Jakou roli v povídce hraje jídlo?',
        area: 'composition',
        answer:
          'Jídlo rámuje celý příběh. Na první cestě má jídlo jen Kulička a štědře se rozdělí s hladovými spolucestujícími. Na druhé cestě mají jídlo všichni kromě ní a nikdo se nerozdělí. Tento kontrast ukazuje nevděk a sobectví „ctihodné“ společnosti a nezištnost Kuličky.',
        points: [
          { label: 'první cesta – Kulička se dělí', keywords: ['první', 'dělí', 'košík', 'rozděl'] },
          { label: 'druhá cesta – nikdo se nerozdělí', keywords: ['druh', 'nikdo'] },
          { label: 'kontrast, nevděk', keywords: ['kontrast', 'nevděk', 'sobec'] },
        ],
      },
      {
        q: 'Proč je Kulička řazena k realismu a naturalismu?',
        area: 'context',
        answer:
          'Zachycuje skutečnou historickou situaci (prusko-francouzská válka, okupace Normandie), postavy z různých vrstev a jejich skutečné jednání bez idealizace. Vypravěč je objektivní, nekomentuje, ironie vyplývá z popsaného chování. Hrdinkou je člověk ze společenské „spodiny“, což je typické pro naturalismus. Povídka vyšla ve sborníku Médanské večery spojeném s É. Zolou.',
        points: [
          { label: 'skutečná historická situace', keywords: ['válk', 'histor', 'skuteč', '1870'] },
          { label: 'objektivní vypravěč, bez idealizace', keywords: ['objektiv', 'idealiz', 'vypravěč'] },
          { label: 'hrdinka ze spodiny', keywords: ['prostitut', 'spodin', 'nižš'] },
          { label: 'Médanské večery / Zola', keywords: ['médan', 'zola'] },
        ],
      },
    ],
  },
];
