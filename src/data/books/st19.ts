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
];
