/** Pravopisná cvičení k písemné práci. Věta obsahuje „___“ v místě doplnění. */

export interface SpellingItem {
  id: string;
  category: SpellingCategory;
  sentence: string;
  options: string[];
  answer: string;
  rule: string;
}

export type SpellingCategory = 'iy-vyjmenovana' | 'iy-koncovky' | 'iy-shoda' | 'me-mne' | 'sz' | 'velka' | 'carky' | 'tvary';

export const SPELLING_CATEGORIES: Record<SpellingCategory, string> = {
  'iy-vyjmenovana': 'i/y – vyjmenovaná slova',
  'iy-koncovky': 'i/y – koncovky (vzory)',
  'iy-shoda': 'i/y – shoda přísudku s podmětem',
  'me-mne': 'mě / mně',
  sz: 's / z na začátku slova',
  velka: 'Velká písmena',
  carky: 'Čárky v souvětí',
  tvary: 'Tvary slov',
};

let n = 0;
const s = (category: SpellingCategory, sentence: string, options: string[], answer: string, rule: string): SpellingItem => ({ id: `pr-${++n}`, category, sentence, options, answer, rule });

export const SPELLING: SpellingItem[] = [
  // ===== Vyjmenovaná slova =====
  s('iy-vyjmenovana', 'Celou zimu jsme ___ na chalupě.', ['bydleli', 'bidleli'], 'bydleli', 'bydlet je vyjmenované slovo po b'),
  s('iy-vyjmenovana', 'Na zahradě rostl ___ keř.', ['bylinný', 'bilinný'], 'bylinný', 'bylina je vyjmenované slovo po b'),
  s('iy-vyjmenovana', 'Kůň ___ kopytem do dveří.', ['bil', 'byl'], 'bil', 'bít (udeřit) není vyjmenované; byl je tvar slovesa být'),
  s('iy-vyjmenovana', 'Celý den ___ doma.', ['byl', 'bil'], 'byl', 'být je vyjmenované slovo po b'),
  s('iy-vyjmenovana', 'Oběd byl ___.', ['výborný', 'víborný'], 'výborný', 'po v se v předponě vy-/vý- píše y'),
  s('iy-vyjmenovana', 'Na louce se pásla ___.', ['kobyla', 'kobila'], 'kobyla', 'kobyla je vyjmenované slovo po b'),
  s('iy-vyjmenovana', 'Psi ___ celou noc.', ['vyli', 'vili'], 'vyli', 'výt je vyjmenované slovo po v'),
  s('iy-vyjmenovana', 'Na řece plavala ___.', ['vydra', 'vidra'], 'vydra', 'vydra je vyjmenované slovo po v'),
  s('iy-vyjmenovana', 'Ráno jsem si ___ zuby.', ['umyl', 'umil'], 'umyl', 'mýt je vyjmenované slovo po m'),
  s('iy-vyjmenovana', 'Ve sklepě běhala ___.', ['myš', 'miš'], 'myš', 'myš je vyjmenované slovo po m'),
  s('iy-vyjmenovana', 'Učitel byl na nás ___.', ['milý', 'mylý'], 'milý', 'milý není vyjmenované slovo (mýlit se ano)'),
  s('iy-vyjmenovana', 'To byla velká ___.', ['mýlka', 'mílka'], 'mýlka', 'mýlit se je vyjmenované slovo po m'),
  s('iy-vyjmenovana', 'Ve vesnici stál starý ___.', ['mlýn', 'mlín'], 'mlýn', 'mlýn je vyjmenované slovo po l'),
  s('iy-vyjmenovana', 'Děti si hrály na ___.', ['lyžích', 'ližích'], 'lyžích', 'lyže je vyjmenované slovo po l'),
  s('iy-vyjmenovana', 'Na podzim padá ___.', ['listí', 'lystí'], 'listí', 'list není vyjmenované slovo'),
  s('iy-vyjmenovana', 'Na trhu prodávali ___ vejce.', ['slepičí', 'slepyčí'], 'slepičí', 'po měkkých souhláskách (č) se píše i'),
  s('iy-vyjmenovana', 'Kočka ___ v pelíšku.', ['spí', 'spý'], 'spí', 'spát není vyjmenované slovo po p'),
  s('iy-vyjmenovana', 'Byl na sebe velmi ___.', ['pyšný', 'pišný'], 'pyšný', 'pýcha, pyšný jsou vyjmenovaná slova po p'),
  s('iy-vyjmenovana', 'V lese rostly ___.', ['pýchavky', 'píchavky'], 'pýchavky', 'pýchavka je vyjmenované slovo po p'),
  s('iy-vyjmenovana', 'Učitel nás ___ i za drobnost.', ['chválil', 'chvályl'], 'chválil', 'po l v příčestí -il (chválit), slovo není vyjmenované'),
  s('iy-vyjmenovana', 'Na dveřích byl ___ zámek.', ['visací', 'vysací'], 'visací', 'viset (být zavěšen) není vyjmenované; vysoký ano'),
  s('iy-vyjmenovana', 'Hory jsou ___.', ['vysoké', 'visoké'], 'vysoké', 'vysoký je vyjmenované slovo po v'),
  s('iy-vyjmenovana', 'Na poli rostlo ___.', ['žito', 'žyto'], 'žito', 'po ž se vždy píše i'),
  s('iy-vyjmenovana', 'Maso bylo ještě ___.', ['syrové', 'sirové'], 'syrové', 'syrový je vyjmenované slovo po s'),
  s('iy-vyjmenovana', 'Vítr k večeru ještě ___.', ['zesílil', 'zesýlil'], 'zesílil', 'síla není vyjmenované slovo'),
  s('iy-vyjmenovana', 'Na stole ležel ___.', ['sýr', 'sír'], 'sýr', 'sýr je vyjmenované slovo po s'),
  s('tvary', 'Na jaře ___ vyrazili na výlet.', ['jsme', 'sme'], 'jsme', 'spisovně jsme (sme je hovorové)'),
  s('iy-vyjmenovana', 'Všichni nudou ___.', ['zívali', 'zývali'], 'zívali', 'zívat se píše s í (není vyjmenované)'),
  s('iy-vyjmenovana', 'Pes ___ zuby.', ['cenil', 'cenyl'], 'cenil', 'po c se píše i'),

  // ===== Koncovky podle vzorů =====
  s('iy-koncovky', 'Na stromech zpívali ___.', ['ptáci', 'ptácy'], 'ptáci', 'životné podstatné jméno v 1. p. mn. č. (vzor pán) – -i'),
  s('iy-koncovky', 'Na stole ležely ___.', ['hrnky', 'hrnki'], 'hrnky', 'neživotné (vzor hrad) – 1. p. mn. č. -y'),
  s('iy-koncovky', 'Přišli jsme s ___.', ['kamarády', 'kamarádi'], 'kamarády', '7. p. mn. č. (s kým?) – vzor pán: s pány'),
  s('iy-koncovky', 'Na louce kvetly ___ květiny.', ['modré', 'modrí'], 'modré', 'ženský rod mn. č. – vzor mladý: mladé'),
  s('iy-koncovky', 'Na hřišti hráli ___ kluci.', ['malí', 'malý'], 'malí', 'mužský životný 1. p. mn. č. – vzor mladý: mladí'),
  s('iy-koncovky', 'Viděl jsem ___ psy.', ['velké', 'velký'], 'velké', '4. p. mn. č. mužský životný – vzor mladý: mladé'),
  s('iy-koncovky', 'Ze stájí utekli ___ koně.', ['bílí', 'bílý'], 'bílí', 'kůň je životné, 1. p. mn. č. – mladí'),
  s('iy-koncovky', 'Na zahradě stály staré ___.', ['stromy', 'stromi'], 'stromy', 'neživotné – vzor hrad'),
  s('iy-koncovky', 'Hráli si s ___ míčem.', ['otcovým', 'otcovím'], 'otcovým', 'přivlastňovací přídavné jméno – vzor otcův: otcovým'),

  // ===== Shoda přísudku s podmětem =====
  s('iy-shoda', 'Děti si ___ na zahradě.', ['hrály', 'hrálí', 'hráli'], 'hrály', 'děti (jako podstatné jméno ženského rodu mn. č.) → -y'),
  s('iy-shoda', 'Kluci ___ fotbal.', ['hráli', 'hrály'], 'hráli', 'podmět rodu mužského životného → -i'),
  s('iy-shoda', 'Holky ___ do kina.', ['šly', 'šli'], 'šly', 'ženský rod → -y'),
  s('iy-shoda', 'Stromy se ___ ve větru.', ['ohýbaly', 'ohýbali'], 'ohýbaly', 'mužský neživotný → -y'),
  s('iy-shoda', 'Psi ___ celou noc.', ['štěkali', 'štěkaly'], 'štěkali', 'mužský životný → -i'),
  s('iy-shoda', 'Kotě a štěně si ___.', ['hrály', 'hráli', 'hrála'], 'hrála', 'několikanásobný podmět ze středního rodu v jednotném čísle → -a'),
  s('iy-shoda', 'Petr a Jana ___ na výlet.', ['jeli', 'jely'], 'jeli', 'v podmětu je podstatné jméno mužské životné → -i'),
  s('iy-shoda', 'Maminka a babička ___ koláče.', ['pekly', 'pekli'], 'pekly', 'všechny členy ženského rodu → -y'),
  s('iy-shoda', 'Počítače se ___ aktualizovat.', ['musely', 'museli'], 'musely', 'mužský neživotný → -y'),
  s('iy-shoda', 'Učitelé nás ___.', ['chválili', 'chválily'], 'chválili', 'mužský životný → -i'),

  // ===== mě / mně =====
  s('me-mne', 'Dej to ___.', ['mně', 'mě'], 'mně', '3. pád (komu?) → mně'),
  s('me-mne', 'Vidíš ___?', ['mě', 'mně'], 'mě', '4. pád (koho?) → mě'),
  s('me-mne', 'Mluvili o ___.', ['mně', 'mě'], 'mně', '6. pád (o kom?) → mně'),
  s('me-mne', 'Bez ___ nikam nechoď.', ['mě', 'mně'], 'mě', '2. pád (bez koho?) → mě'),
  s('me-mne', 'Na ___ se nezlob.', ['mě', 'mně'], 'mě', '4. pád (na koho?) → mě'),
  s('me-mne', 'Bylo ___ zima.', ['mně', 'mě'], 'mně', '3. pád (komu bylo zima?) → mně'),
  s('me-mne', 'Celý den jsem byl ve ___.', ['městě', 'měste', 'mněstě'], 'městě', 'mně píšeme jen tam, kde je n v příbuzných slovech (zapomenout → zapomněl, rozumný → rozumně); město n nemá → mě'),
  s('me-mne', 'Úplně jsem ___ na úkol.', ['zapomněl', 'zapoměl'], 'zapomněl', 'zapomenout → zapomněl: v příbuzném slově je n → mn'),
  s('me-mne', 'Nedokázal si ___ jeho jméno.', ['vzpomenout', 'vzpomnout'], 'vzpomenout', 'správně vzpomenout si; v minulém čase vzpomněl (n z kořene)'),

  // ===== s / z =====
  s('sz', 'Musíme ___ úkol do pátku.', ['splnit', 'zplnit'], 'splnit', 'předpona s- (dokončení, odstranění) – splnit'),
  s('sz', 'Děti ___ ze stromu.', ['slezly', 'zlezly'], 'slezly', 's- znamená pohyb shora dolů'),
  s('sz', 'Kluk ___ celý strom.', ['zlezl', 'slezl'], 'zlezl', 'z- znamená pohyb nahoru / po celé ploše (zlezl celý strom)'),
  s('sz', 'Bouřka ___ úrodu.', ['zničila', 'sničila'], 'zničila', 'z- označuje změnu stavu (zničit)'),
  s('sz', 'Před zkouškou se ___.', ['soustředil', 'zoustředil'], 'soustředil', 'soustředit se píše se s'),
  s('sz', 'Celou noc nemohl ___.', ['usnout', 'uznout'], 'usnout', 'usnout se píše se s'),
  s('sz', 'Ze stolu ___ talíř.', ['spadl', 'zpadl'], 'spadl', 's- (shora dolů) – spadnout'),
  s('sz', 'Na podzim ___ listí.', ['zežloutne', 'sežloutne'], 'zežloutne', 'z- změna stavu (žlutý → zežloutnout)'),
  s('sz', 'Na schůzi jsme ___ nový plán.', ['schválili', 'zchválili'], 'schválili', 'schválit se píše se s'),

  // ===== Velká písmena =====
  s('velka', 'Jeli jsme do ___.', ['Krkonoš', 'krkonoš'], 'Krkonoš', 'zeměpisný název pohoří – velké písmeno'),
  s('velka', 'Na ___ jsme jedli kapra.', ['Vánoce', 'vánoce'], 'Vánoce', 'svátky (Vánoce, Velikonoce) – velké písmeno'),
  s('velka', 'Studuje na ___ v Praze.', ['Univerzitě Karlově', 'univerzitě Karlově'], 'Univerzitě Karlově', 'název instituce – první slovo velkým'),
  s('velka', 'Bydlíme v ___.', ['Ústí nad Labem', 'Ústí Nad Labem'], 'Ústí nad Labem', 'víceslovný název obce – předložka malým písmenem'),
  s('velka', 'Zítra je ___.', ['pondělí', 'Pondělí'], 'pondělí', 'dny v týdnu malým písmenem'),
  s('velka', 'Mluví plynně ___.', ['anglicky', 'Anglicky'], 'anglicky', 'jazyky a přídavná jména od zemí malým písmenem'),
  s('velka', 'Potkal jsem dva ___.', ['Pražany', 'pražany'], 'Pražany', 'obyvatelská jména velkým písmenem'),
  s('velka', 'Hrad stojí na ___ ulici.', ['Nerudově', 'nerudově'], 'Nerudově', 'název ulice – první slovo velkým (Nerudova ulice)'),
  s('velka', 'Bydlím v ulici ___.', ['Na Příkopě', 'na Příkopě', 'Na příkopě'], 'Na Příkopě', 'název ulice začínající předložkou – předložka i další slovo velkým'),

  // ===== Čárky =====
  s('carky', 'Myslím ___ to zvládneme.', [', že', ' že'], ', že', 'čárka před vedlejší větou se spojkou že'),
  s('carky', 'Kniha ___ jsi mi půjčil ___ je skvělá.', [', kterou … ,', ' kterou … ', ', kterou … '], ', kterou … ,', 'vložená vedlejší věta se odděluje čárkami z obou stran'),
  s('carky', 'Koupil chleba ___ mléko.', [' a', ', a'], ' a', 'před slučovacím a mezi několikanásobnými větnými členy se čárka nepíše'),
  s('carky', 'Chtěl jít ven ___ pršelo.', [', ale', ' ale'], ', ale', 'před odporovací spojkou ale se čárka píše vždy'),
  s('carky', 'Šel do obchodu ___ aby koupil chleba.', [',', 'bez čárky'], ',', 'před aby (vedlejší věta) se píše čárka'),
  s('carky', 'Jana ___ moje sestra ___ studuje v Brně.', [', … ,', 'bez čárek', ', … bez čárky'], ', … ,', 'volný přístavek se odděluje čárkami z obou stran'),
  s('carky', 'Nejen že přišel ___ ale přinesl i dárek.', [',', 'bez čárky'], ',', 'nejen – ale (i): před ale čárka'),
  s('carky', 'Byl unavený ___ protože celou noc nespal.', [',', 'bez čárky'], ',', 'čárka před vedlejší větou příčinnou (protože)'),
  s('carky', 'Až přijdeš ___ zavolej mi.', [',', 'bez čárky'], ',', 'vedlejší věta na začátku souvětí se odděluje čárkou'),

  // ===== Tvary slov =====
  s('tvary', 'Kdybychom věděli, ___ dřív.', ['přišli bychom', 'přišli by jsme', 'přišli bysme'], 'přišli bychom', 'podmiňovací způsob 1. os. mn. č.: bychom (ne „by jsme“)'),
  s('tvary', 'Chtěla bych, ___ přišli včas.', ['abyste', 'aby jste', 'abyjste'], 'abyste', 'abyste (ne „aby jste“)'),
  s('tvary', 'Učili jsme se, ___ uspěli.', ['abychom', 'aby jsme', 'abysme'], 'abychom', 'abychom (ne „aby jsme“, „abysme“)'),
  s('tvary', 'Viděl jsem ___ lidi.', ['ty', 'ti', 'těch'], 'ty', '4. p. mn. č. (koho, co?) → ty lidi; ti lidé je 1. p.'),
  s('tvary', 'Na výletě byli i ___ lidé.', ['ti', 'ty'], 'ti', '1. p. mn. č. → ti lidé'),
  s('tvary', 'Musíš to udělat ___.', ['dvěma rukama', 'dvouma rukama', 'dvěmi rukami'], 'dvěma rukama', '7. p. dvěma; ruce mají v 7. p. dvojné číslo „rukama“'),
  s('tvary', 'Sešli jsme se ve ___.', ['dvou', 'dvoum', 'dvouch'], 'dvou', '6. p. dvou (o dvou)'),
];
