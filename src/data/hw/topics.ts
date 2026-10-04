import { topicFor } from '../site/helpers';

const topic = topicFor('hw');

/** Okruhy z Technického vybavení počítačů (obecný obsah předmětu) */
export const HW_TOPICS = [
  topic(
    1,
    'soustavy',
    'Číselné soustavy a jednotky informace',
    'Počítač pracuje ve dvojkové soustavě. Pro zápis se používá i šestnáctková soustava (4 bity = 1 hexadecimální číslice). Jednotkou informace je bit, 8 bitů tvoří bajt. U násobků se rozlišují desítkové předpony SI (kB = 1000 B) a dvojkové předpony IEC (KiB = 1024 B).',
    [
      ['Číselné soustavy', ['dvojková (binární) – číslice 0 a 1, váhy 1, 2, 4, 8, 16…', 'desítková – běžné počítání', 'šestnáctková (hexadecimální) – 0–9 a A–F, jedna číslice = 4 bity, bajt = 2 číslice', 'převod do dvojkové: postupné dělení dvěma, zbytky zapsané odzadu']],
      ['Jednotky informace', ['bit (b) – nejmenší jednotka, bajt (B) = 8 bitů', 'SI: kB = 1000 B, MB = 10^6 B, GB = 10^9 B, TB = 10^12 B', 'IEC: KiB = 1024 B, MiB = 1024 KiB, GiB = 1024 MiB', 'výrobci disků používají SI, Windows zobrazuje dvojkové jednotky → disk „1 TB“ ukáže cca 931 GB']],
      ['Přenosová rychlost', ['udává se v bitech za sekundu (b/s, Mb/s, Gb/s)', 'rychlost v MB/s = rychlost v Mb/s ÷ 8', 'doba přenosu = velikost dat v bitech ÷ rychlost']],
      ['Kódování znaků a čísel', ['ASCII – 7 bitů, 128 znaků; Unicode / UTF-8 – proměnná délka 1–4 bajty, čeština', 'záporná čísla – dvojkový doplněk', 'barevná hloubka n bitů = 2^n barev (24 bitů = 16,7 milionu barev)']],
    ],
    [
      ['bit', 'Nejmenší jednotka informace – hodnota 0 nebo 1.'],
      ['bajt', 'Skupina 8 bitů.'],
      ['KiB', 'Kibibajt = 1024 bajtů (dvojková předpona).'],
      ['hexadecimální soustava', 'Šestnáctková soustava s číslicemi 0–9 a A–F.'],
      ['UTF-8', 'Kódování Unicode s proměnnou délkou 1–4 bajty na znak.'],
      ['dvojkový doplněk', 'Způsob zápisu záporných celých čísel ve dvojkové soustavě.'],
    ],
    [
      ['Kolik bitů má jeden bajt?', '8', ['4', '10', '16']],
      ['Kolik bajtů je 1 KiB?', '1024', ['1000', '1048', '512']],
      ['Kolik bitů vyjádří jedna šestnáctková číslice?', '4', ['2', '8', '16']],
      ['Proč Windows u disku „1 TB“ ukazuje přibližně 931 GB?', 'výrobce počítá v desítkových jednotkách, Windows v dvojkových', ['část disku zabírá systém', 'disk je vadný', 'formátování zmenší disk o 7 %']],
      ['Kolik barev zobrazí 24bitová barevná hloubka?', 'přibližně 16,7 milionu', ['65 536', '256', '4,3 miliardy']],
      ['Jak převedeš rychlost 100 Mb/s na MB/s?', 'vydělím 8 → 12,5 MB/s', ['vynásobím 8', 'vydělím 1024', 'je to totéž']],
    ],
    [
      {
        q: 'Vysvětli rozdíl mezi kB a KiB a proč na něm záleží u disků a pamětí.',
        answer:
          'kB je desítková předpona SI, 1 kB = 1000 B; KiB je dvojková předpona IEC, 1 KiB = 1024 B (2^10). S každým dalším řádem rozdíl roste: 1 GB = 10^9 B, 1 GiB = 2^30 B, rozdíl asi 7 %. Výrobci disků uvádějí kapacitu v desítkových jednotkách, operační systém Windows ji počítá dvojkově, ale zobrazuje zkratkou GB/TB, takže disk 1 TB ukáže cca 931 GB. Paměti RAM se vyrábějí v mocninách dvou, proto se u nich používají dvojkové jednotky.',
        points: [
          ['kB = 1000 B (SI)', ['1000', 'si', 'desítk']],
          ['KiB = 1024 B (IEC, 2^10)', ['1024', 'iec', 'dvojk']],
          ['disk 1 TB ≈ 931 GB', ['931', 'disk', 'výrob']],
        ],
      },
    ],
  ),
  topic(
    2,
    'architektura',
    'Architektura a historie počítačů',
    'Většina počítačů vychází z von Neumannovy architektury: procesor, operační paměť společná pro program i data, vstupní a výstupní zařízení propojené sběrnicemi. Harvardská architektura má oddělenou paměť programu a dat. Historie se dělí do generací podle použité technologie – relé a elektronky, tranzistory, integrované obvody a mikroprocesory.',
    [
      ['Von Neumannova architektura', ['části: řadič, aritmeticko-logická jednotka (ALU), operační paměť, vstupní a výstupní zařízení', 'program i data jsou ve společné paměti', 'instrukce se zpracovávají postupně (sekvenčně)', 'úzké hrdlo: jedna sběrnice mezi CPU a pamětí (von Neumannovo hrdlo)']],
      ['Harvardská architektura', ['oddělená paměť a sběrnice pro program a pro data', 'současné čtení instrukce i dat → rychlejší', 'používá se v mikrokontrolérech a DSP; dnešní CPU ji využívají v L1 cache (oddělená cache instrukcí a dat)']],
      ['Sběrnice', ['datová (přenáší data), adresová (určuje místo v paměti), řídicí (řídicí signály)', 'šířka adresové sběrnice určuje velikost adresovatelné paměti (32 bitů = 4 GiB)']],
      ['Generace počítačů', ['0. generace – mechanické a reléové stroje (Z3, Konrad Zuse)', '1. generace – elektronky (ENIAC)', '2. generace – tranzistory', '3. generace – integrované obvody', '4. generace – mikroprocesory (Intel 4004, 1971), osobní počítače (IBM PC, 1981)']],
    ],
    [
      ['von Neumannova architektura', 'Koncepce počítače se společnou pamětí pro program i data.'],
      ['harvardská architektura', 'Koncepce s oddělenou pamětí pro program a pro data.'],
      ['ALU', 'Aritmeticko-logická jednotka – provádí výpočty a logické operace.'],
      ['řadič', 'Část procesoru, která řídí provádění instrukcí.'],
      ['adresová sběrnice', 'Sběrnice určující adresu místa v paměti, se kterým se pracuje.'],
      ['ENIAC', 'První univerzální elektronkový počítač (1946).'],
    ],
    [
      ['Co je typické pro von Neumannovu architekturu?', 'program i data jsou ve společné paměti', ['program a data mají oddělené paměti', 'počítač nemá operační paměť', 'instrukce se provádějí jen paralelně']],
      ['Jaká technologie charakterizuje 1. generaci počítačů?', 'elektronky', ['tranzistory', 'integrované obvody', 'mikroprocesory']],
      ['Kterou sběrnicí procesor určuje, se kterým místem v paměti pracuje?', 'adresovou', ['datovou', 'řídicí', 'napájecí']],
      ['Kde se dnes využívá harvardská architektura?', 'v mikrokontrolérech a v L1 cache procesorů', ['v pevných discích', 'v monitorech', 'nikde, je zastaralá']],
      ['Který byl první mikroprocesor?', 'Intel 4004', ['Intel 8086', 'Zilog Z80', 'Motorola 68000']],
    ],
    [
      {
        q: 'Popiš von Neumannovu architekturu a porovnej ji s harvardskou.',
        answer:
          'Von Neumannův počítač se skládá z řadiče a ALU (dohromady procesor), operační paměti, vstupních a výstupních zařízení propojených sběrnicemi. Program i data jsou uložené ve stejné paměti a instrukce se provádějí postupně; nevýhodou je úzké hrdlo jedné sběrnice mezi procesorem a pamětí. Harvardská architektura má pro program a data oddělené paměti i sběrnice, takže lze současně načítat instrukci i data. Používá se v mikrokontrolérech a signálových procesorech; moderní CPU ji kombinují – navenek von Neumann, ale v L1 cache mají oddělenou cache instrukcí a dat.',
        points: [
          ['části: řadič, ALU, paměť, vstup/výstup', ['řadič', 'alu', 'pamě']],
          ['společná paměť pro program i data', ['společn', 'program', 'data']],
          ['harvard – oddělené paměti a sběrnice', ['oddělen', 'harvard']],
          ['použití – mikrokontroléry, L1 cache', ['mikrokontrol', 'cache']],
        ],
      },
    ],
  ),
  topic(
    3,
    'procesor',
    'Procesor (CPU)',
    'Procesor vykonává instrukce programu. Skládá se z řadiče, ALU, registrů a vyrovnávacích pamětí cache. Výkon ovlivňuje takt, počet jader a vláken, velikost cache, architektura (IPC) i výrobní proces. Procesory se dělí podle instrukční sady na CISC (x86) a RISC (ARM).',
    [
      ['Části procesoru', ['řadič – načítá a dekóduje instrukce', 'ALU – aritmetické a logické operace, FPU – výpočty s desetinnou čárkou', 'registry – nejrychlejší paměť přímo v jádře', 'cache L1, L2 (u jádra), L3 (sdílená)', 'integrovaný paměťový řadič, často i grafika (iGPU)']],
      ['Zpracování instrukcí', ['cyklus: načtení (fetch) → dekódování → provedení → zápis výsledku', 'pipelining (zřetězení) – více instrukcí v různých fázích současně', 'predikce skoků, spekulativní a mimořádné provádění (out-of-order)']],
      ['Parametry', ['takt (GHz), turbo / boost', 'počet jader a vláken (Hyper-Threading / SMT)', 'velikost cache', 'TDP – tepelný výkon, který musí chladič odvést', 'výrobní proces (nm), patice (socket) – LGA (piny v desce, Intel), AM5 (LGA, AMD), starší PGA']],
      ['Instrukční sady a výrobci', ['CISC – složité instrukce, x86-64 (Intel, AMD)', 'RISC – jednoduché instrukce stejné délky, ARM (mobily, Apple M), RISC-V', 'rozšíření: SSE, AVX (vektorové výpočty), VT-x / AMD-V (virtualizace)']],
    ],
    [
      ['jádro', 'Samostatná výpočetní jednotka procesoru.'],
      ['takt', 'Frekvence, se kterou procesor pracuje (GHz).'],
      ['cache', 'Rychlá vyrovnávací paměť mezi procesorem a RAM (L1, L2, L3).'],
      ['Hyper-Threading', 'Technologie Intel, kdy jedno jádro zpracovává dvě vlákna (obecně SMT).'],
      ['TDP', 'Thermal Design Power – tepelný výkon, který musí chlazení odvést.'],
      ['pipelining', 'Zřetězené zpracování instrukcí v několika fázích zároveň.'],
      ['RISC', 'Architektura s jednoduchou a omezenou sadou instrukcí (ARM).'],
      ['socket', 'Patice na základní desce, do které se vkládá procesor.'],
    ],
    [
      ['Která část procesoru provádí aritmetické a logické operace?', 'ALU', ['řadič', 'cache', 'registr']],
      ['Která paměť je nejrychlejší?', 'registry procesoru', ['cache L3', 'RAM', 'SSD']],
      ['Co udává TDP?', 'tepelný výkon, který musí chladič odvést', ['takt procesoru', 'počet jader', 'velikost cache']],
      ['Jakou architekturu mají procesory ARM?', 'RISC', ['CISC', 'harvardskou bez cache', 'x86']],
      ['Co je Hyper-Threading (SMT)?', 'zpracování dvou vláken jedním jádrem', ['přetaktování procesoru', 'dvě patice na desce', 'typ cache']],
      ['Která rozšíření procesoru jsou nutná pro hardwarovou virtualizaci?', 'Intel VT-x / AMD-V', ['SSE', 'AVX', 'Turbo Boost']],
    ],
    [
      {
        q: 'Jaké parametry ovlivňují výkon procesoru?',
        answer:
          'Výkon určuje takt (kolik cyklů za sekundu, včetně turbo režimu), počet jader a vláken (paralelní zpracování, SMT/Hyper-Threading), velikost a rychlost cache L1–L3, architektura jádra – kolik instrukcí zvládne za takt (IPC), pipelining, predikce skoků – a podporované instrukční sady (AVX). Roli hraje také výrobní proces a TDP, které omezují, jak dlouho udrží vysoký takt, a rychlost paměti RAM.',
        points: [
          ['takt / turbo', ['takt', 'ghz', 'turbo']],
          ['jádra a vlákna', ['jád', 'vlák']],
          ['cache', ['cache']],
          ['architektura / IPC', ['ipc', 'architekt', 'instrukc']],
          ['TDP / výrobní proces', ['tdp', 'proces', 'nm']],
        ],
      },
    ],
  ),
  topic(
    4,
    'pameti',
    'Paměti (RAM, ROM, cache)',
    'Paměti se dělí na volatilní (po vypnutí ztratí obsah – RAM) a nevolatilní (ROM, flash). Operační paměť DRAM se musí obnovovat, statická SRAM je rychlejší a slouží jako cache. Paměti tvoří hierarchii od nejrychlejších a nejmenších (registry) po pomalé a velké (disky).',
    [
      ['Rozdělení', ['volatilní (RAM) × nevolatilní (ROM, flash)', 'SRAM – klopné obvody, rychlá, drahá → cache', 'DRAM – kondenzátor, nutné obnovování (refresh) → operační paměť', 'ROM, PROM, EPROM (mazání UV), EEPROM a flash (elektricky mazatelné)']],
      ['Operační paměť', ['DDR SDRAM – přenos na obou hranách hodinového signálu', 'generace DDR3, DDR4, DDR5 – nejsou vzájemně kompatibilní (jiný klíč)', 'moduly DIMM (desktop), SO-DIMM (notebook)', 'parametry: kapacita, frekvence (MT/s), časování / latence (CL), napětí', 'dvoukanálový režim (dual channel) – moduly v párových slotech', 'ECC – oprava chyb, servery']],
      ['Hierarchie pamětí', ['registry → cache L1/L2/L3 → RAM → SSD/HDD → zálohy', 'směrem dolů roste kapacita, klesá rychlost a cena za GB', 'virtuální paměť – stránkovací soubor / swap na disku']],
    ],
    [
      ['RAM', 'Paměť s náhodným přístupem; operační paměť, po vypnutí ztratí obsah.'],
      ['ROM', 'Paměť určená pouze ke čtení; obsah zůstává i bez napájení.'],
      ['DRAM', 'Dynamická RAM – bity v kondenzátorech, nutná obnova (refresh).'],
      ['SRAM', 'Statická RAM – rychlá, bez obnovování, používá se jako cache.'],
      ['dual channel', 'Dvoukanálový režim – dva moduly pracují souběžně, vyšší propustnost.'],
      ['ECC', 'Paměť s opravou chyb, používaná v serverech.'],
      ['CL', 'CAS latence – zpoždění paměti v taktech.'],
      ['SO-DIMM', 'Menší paměťový modul pro notebooky.'],
    ],
    [
      ['Která paměť se používá jako cache procesoru?', 'SRAM', ['DRAM', 'EPROM', 'flash']],
      ['Co znamená, že je paměť volatilní?', 'po vypnutí napájení ztratí obsah', ['lze ji jen číst', 'je odolná proti chybám', 'je rychlejší než cache']],
      ['Lze do desky pro DDR4 vložit modul DDR5?', 'ne, liší se klíčem i elektricky', ['ano, jen poběží pomaleji', 'ano, pokud má stejnou kapacitu', 'ano, s redukcí']],
      ['K čemu slouží paměť ECC?', 'k detekci a opravě chyb v datech', ['ke zvýšení frekvence', 'k úspoře energie', 'k šifrování dat']],
      ['Který paměťový modul se používá v noteboocích?', 'SO-DIMM', ['DIMM', 'SIMM', 'M.2']],
      ['Proč se DRAM musí obnovovat (refresh)?', 'kondenzátory ztrácejí náboj', ['kvůli přehřívání', 'aby šla číst', 'kvůli ECC']],
    ],
    [
      {
        q: 'Popiš hierarchii pamětí v počítači a proč existuje.',
        answer:
          'Nejrychlejší jsou registry procesoru, pak cache L1, L2 a L3 (SRAM), operační paměť RAM (DRAM), dále SSD a pevné disky a nakonec zálohová média. Směrem dolů roste kapacita a klesá rychlost i cena za gigabajt. Hierarchie existuje, protože rychlá paměť je drahá a malá; díky principu lokality (program pracuje opakovaně s blízkými daty) stačí mít často používaná data v rychlé cache a zbytek v levnější paměti. Když RAM nestačí, OS používá virtuální paměť na disku (swap).',
        points: [
          ['registry → cache → RAM → disk', ['registr', 'cache', 'ram', 'disk']],
          ['kapacita roste, rychlost a cena klesá', ['kapacit', 'rychl', 'cen']],
          ['lokalita / častá data v cache', ['lokalit', 'často']],
          ['virtuální paměť / swap', ['virtuáln', 'swap', 'stránk']],
        ],
      },
    ],
  ),
  topic(
    5,
    'deska',
    'Základní deska, chipset a firmware (BIOS/UEFI)',
    'Základní deska propojuje všechny komponenty. Obsahuje patici procesoru, sloty pro paměti a rozšiřující karty, konektory pro disky a periferie, napájecí obvody (VRM) a firmware. Chipset řídí komunikaci s periferiemi. Firmware UEFI (dříve BIOS) inicializuje hardware, provede POST a spustí zavaděč operačního systému.',
    [
      ['Části desky', ['patice (socket) procesoru a VRM – napájení procesoru', 'sloty DIMM pro paměti, sloty PCIe, sloty M.2', 'konektory SATA, USB, napájecí konektory ATX 24pin a EPS 8pin (CPU)', 'zadní panel I/O, čip firmwaru, baterie CMOS']],
      ['Chipset', ['dnes hlavní funkce (paměťový řadič, PCIe pro grafiku) v procesoru', 'chipset (dříve jižní můstek, PCH) – USB, SATA, další PCIe linky, síť, zvuk', 'dříve severní můstek (paměť, grafika) + jižní můstek']],
      ['Formáty desek', ['ATX (305 × 244 mm), micro-ATX, mini-ITX (170 × 170 mm)', 'formát určuje počet slotů a velikost skříně']],
      ['BIOS a UEFI', ['POST – test hardwaru po zapnutí (chyby hlásí pípáním / kódy)', 'BIOS – starší, MBR (max. 2 TiB, 4 primární oddíly)', 'UEFI – grafické rozhraní, GPT (disky > 2 TiB), Secure Boot, rychlejší start', 'nastavení: pořadí bootování, XMP/EXPO profily pamětí, virtualizace, TPM']],
    ],
    [
      ['chipset', 'Sada obvodů na desce řídící komunikaci procesoru s periferiemi.'],
      ['VRM', 'Napájecí obvody desky, které upravují napětí pro procesor.'],
      ['UEFI', 'Moderní firmware počítače nahrazující BIOS (GPT, Secure Boot).'],
      ['POST', 'Power-On Self-Test – test hardwaru po zapnutí.'],
      ['GPT', 'Tabulka oddílů pro UEFI, podporuje disky větší než 2 TiB.'],
      ['Secure Boot', 'Funkce UEFI, která dovolí spustit jen podepsaný zavaděč.'],
      ['TPM', 'Bezpečnostní čip pro ukládání klíčů (vyžaduje ho Windows 11).'],
      ['ATX', 'Standard rozměrů základní desky, zdroje a skříně.'],
    ],
    [
      ['Co dělá POST?', 'otestuje hardware po zapnutí počítače', ['nainstaluje ovladače', 'zálohuje BIOS', 'naformátuje disk']],
      ['Jaké tabulky oddílů umožní disk větší než 2 TiB?', 'GPT', ['MBR', 'FAT32', 'NTFS']],
      ['Který formát desky je nejmenší?', 'mini-ITX', ['ATX', 'micro-ATX', 'E-ATX']],
      ['K čemu slouží VRM na základní desce?', 'k napájení procesoru správným napětím', ['k chlazení paměti', 'k připojení disků', 'k uložení firmwaru']],
      ['Co zajišťuje Secure Boot?', 'spuštění jen podepsaného zavaděče', ['šifrování disku', 'rychlejší POST', 'přetaktování']],
      ['K čemu slouží baterie na základní desce?', 'udržuje nastavení a čas (CMOS/RTC) při vypnutí', ['napájí procesor při výpadku', 'záloha pro UPS', 'napájí ventilátory']],
    ],
    [
      {
        q: 'Porovnej BIOS a UEFI.',
        answer:
          'BIOS je starší firmware s textovým rozhraním, pracuje v 16bitovém režimu a používá tabulku oddílů MBR, která podporuje disky do 2 TiB a 4 primární oddíly. UEFI je modernější: má grafické rozhraní s myší, podporuje GPT (velké disky, až 128 oddílů ve Windows), rychlejší start, Secure Boot (spustí se jen podepsaný zavaděč), síťové funkce a ovladače. Oba po zapnutí provádějí POST, inicializují hardware a předávají řízení zavaděči operačního systému.',
        points: [
          ['BIOS – starší, MBR do 2 TiB', ['mbr', '2 tib', 'bios']],
          ['UEFI – GPT, velké disky', ['gpt', 'uefi']],
          ['Secure Boot', ['secure']],
          ['grafické rozhraní, rychlejší start', ['grafick', 'rychl']],
          ['POST a předání zavaděči', ['post', 'zavaděč']],
        ],
      },
    ],
  ),
  topic(
    6,
    'rozhrani',
    'Sběrnice a rozhraní (PCIe, USB, SATA, M.2)',
    'Moderní rozhraní jsou sériová a dvoubodová. PCI Express připojuje grafické karty a NVMe SSD pomocí linek (x1–x16). Disky se připojují přes SATA nebo M.2 (SATA i NVMe). Periferie využívají USB a Thunderbolt, obraz HDMI a DisplayPort.',
    [
      ['PCI Express', ['sériová dvoubodová sběrnice, linky (lanes) x1, x4, x8, x16', 'každá generace zhruba zdvojnásobuje propustnost (PCIe 3.0 ≈ 1 GB/s na linku, 4.0 ≈ 2 GB/s, 5.0 ≈ 4 GB/s)', 'grafická karta – x16, NVMe SSD – x4']],
      ['Úložiště', ['SATA III – 6 Gb/s (≈ 600 MB/s), kabel dat + napájecí konektor', 'M.2 – formát konektoru; disk může být SATA nebo NVMe (PCIe)', 'NVMe – protokol pro SSD přes PCIe, nízká latence']],
      ['USB', ['USB 2.0 – 480 Mb/s', 'USB 3.2 Gen 1 – 5 Gb/s, Gen 2 – 10 Gb/s, Gen 2×2 – 20 Gb/s, USB4 – 40 Gb/s (i 80 Gb/s ve v2)', 'konektory A, B, micro-USB, USB-C (oboustranný); USB-C ≠ automaticky rychlé USB', 'USB Power Delivery – napájení až 100 W (nově 240 W)']],
      ['Další rozhraní', ['Thunderbolt 3/4 – 40 Gb/s přes USB-C, PCIe a DisplayPort v jednom kabelu', 'obraz: HDMI, DisplayPort, starší DVI a VGA (analogové)', 'síť RJ-45 (Ethernet), audio jack 3,5 mm']],
    ],
    [
      ['PCIe', 'Sériová rozšiřující sběrnice s linkami x1–x16.'],
      ['linka (lane)', 'Jeden obousměrný sériový kanál PCIe.'],
      ['NVMe', 'Protokol pro rychlé SSD připojené přes PCIe.'],
      ['M.2', 'Malý konektor / formát pro SSD (SATA nebo NVMe) a karty Wi-Fi.'],
      ['SATA', 'Sériové rozhraní pro disky, verze III až 6 Gb/s.'],
      ['USB-C', 'Oboustranný konektor USB; podporované rychlosti závisí na zařízení.'],
      ['Thunderbolt', 'Rozhraní přes USB-C spojující PCIe, DisplayPort a napájení (40 Gb/s).'],
      ['DisplayPort', 'Digitální obrazové rozhraní, alternativa HDMI.'],
    ],
    [
      ['Jakou maximální rychlost má SATA III?', '6 Gb/s', ['3 Gb/s', '10 Gb/s', '40 Gb/s']],
      ['Kolik linek PCIe obvykle využívá NVMe SSD?', 'x4', ['x1', 'x8', 'x16']],
      ['Co platí o konektoru M.2?', 'může v něm být disk SATA i NVMe', ['je vždy NVMe', 'je jen pro Wi-Fi karty', 'je to typ USB']],
      ['Jaká je rychlost USB 2.0?', '480 Mb/s', ['12 Mb/s', '5 Gb/s', '10 Gb/s']],
      ['Které rozhraní je analogové?', 'VGA', ['HDMI', 'DisplayPort', 'DVI-D']],
      ['Jakou rychlost má Thunderbolt 4?', '40 Gb/s', ['10 Gb/s', '20 Gb/s', '480 Mb/s']],
    ],
    [
      {
        q: 'Jak se dnes připojují úložná zařízení a jaký je rozdíl mezi SATA a NVMe?',
        answer:
          'SSD a HDD se připojují rozhraním SATA (verze III, 6 Gb/s, prakticky asi 550 MB/s) datovým a napájecím kabelem, nebo do slotu M.2. M.2 je jen formát konektoru – disk v něm může komunikovat přes SATA (stejná rychlost jako SATA) nebo přes NVMe, což je protokol nad PCI Express, typicky 4 linky. NVMe má mnohem vyšší propustnost (PCIe 4.0 x4 zhruba 7 GB/s), nižší latenci a víc front příkazů. Rozdíl je proto v rozhraní a protokolu, ne v samotném tvaru disku.',
        points: [
          ['SATA III 6 Gb/s, kabel', ['sata', '6 gb', 'kabel']],
          ['M.2 je jen formát (SATA i NVMe)', ['m.2', 'formát']],
          ['NVMe přes PCIe x4', ['nvme', 'pcie', 'link']],
          ['vyšší propustnost, nižší latence', ['propustn', 'latenc', 'rychl']],
        ],
      },
    ],
  ),
  topic(
    7,
    'disky',
    'Pevné disky, SSD a RAID',
    'Pevný disk (HDD) ukládá data magneticky na rotující plotny, SSD do flash pamětí bez pohyblivých částí – je rychlejší, tišší a odolnější, ale buňky mají omezený počet zápisů. Disková pole RAID kombinují více disků kvůli výkonu nebo odolnosti proti výpadku disku.',
    [
      ['HDD', ['plotny, hlavičky na raménku, motor; otáčky 5400 / 7200 ot./min', 'přístupová doba ≈ milisekundy (pohyb hlav + otočení plotny)', 'velká kapacita za nízkou cenu, citlivost na otřesy', 'formáty 3,5″ (desktop) a 2,5″ (notebook)']],
      ['SSD', ['flash paměti NAND, řadič, často DRAM cache', 'typy buněk SLC, MLC, TLC, QLC – víc bitů na buňku = levnější, ale pomalejší a méně odolné', 'wear leveling (rovnoměrné opotřebení), TRIM, životnost v TBW', 'přístupová doba ≈ desítky mikrosekund']],
      ['RAID', ['RAID 0 – prokládání, výkon, žádná redundance (vypadne 1 disk = ztráta všeho)', 'RAID 1 – zrcadlení, kapacita jednoho disku', 'RAID 5 – parita, min. 3 disky, kapacita (n − 1) disků, přežije 1 disk', 'RAID 6 – dvojitá parita, min. 4 disky, (n − 2), přežije 2 disky', 'RAID 10 – zrcadlení + prokládání, min. 4 disky, polovina kapacity', 'RAID není záloha!']],
      ['Souborové systémy a oddíly', ['MBR × GPT', 'NTFS (Windows), FAT32 (max. soubor 4 GiB), exFAT (flash disky), ext4 (Linux)', 'hot-swap – výměna disku za chodu (servery)']],
    ],
    [
      ['HDD', 'Pevný disk s rotujícími magnetickými plotnami.'],
      ['SSD', 'Polovodičový disk s flash pamětmi, bez pohyblivých částí.'],
      ['TRIM', 'Příkaz, kterým OS sdělí SSD, které bloky už nejsou používány.'],
      ['TBW', 'Terabytes Written – kolik dat lze na SSD zapsat během životnosti.'],
      ['RAID 1', 'Zrcadlení dat na dva disky.'],
      ['RAID 5', 'Pole s distribuovanou paritou; přežije výpadek jednoho disku.'],
      ['wear leveling', 'Rovnoměrné rozkládání zápisů po buňkách SSD.'],
      ['hot-swap', 'Výměna komponenty za chodu systému.'],
    ],
    [
      ['Který RAID nemá žádnou redundanci?', 'RAID 0', ['RAID 1', 'RAID 5', 'RAID 10']],
      ['Kolik disků minimálně potřebuje RAID 5?', '3', ['2', '4', '5']],
      ['Jaká je využitelná kapacita RAID 5 ze 4 disků po 2 TB?', '6 TB', ['8 TB', '4 TB', '2 TB']],
      ['Který typ buněk SSD je nejodolnější a nejdražší?', 'SLC', ['MLC', 'TLC', 'QLC']],
      ['Jaký je maximální soubor na FAT32?', '4 GiB', ['2 GiB', '16 GiB', 'neomezený']],
      ['Proč RAID nenahrazuje zálohu?', 'nechrání proti smazání, ransomwaru ani zničení celého pole', ['je pomalejší než záloha', 'nefunguje se SSD', 'nahrazuje ji vždy']],
    ],
    [
      {
        q: 'Porovnej HDD a SSD a vysvětli, kdy použít který.',
        answer:
          'HDD zapisuje magneticky na rotující plotny čtecími hlavičkami; má velkou kapacitu za nízkou cenu, ale vyšší přístupovou dobu (milisekundy), je hlučnější, citlivý na otřesy a sekvenčně čte zhruba do 250 MB/s. SSD používá flash paměti NAND bez pohyblivých částí, má přístupovou dobu v mikrosekundách, přes SATA kolem 550 MB/s a přes NVMe několik GB/s, je tichý a odolný; buňky ale mají omezený počet zápisů (TBW, wear leveling) a cena za GB je vyšší. SSD se hodí na systém a aplikace, HDD na velké archivy, zálohy a NAS.',
        points: [
          ['HDD – plotny, hlavičky, levná kapacita', ['plotn', 'hlav', 'kapacit']],
          ['SSD – flash, bez pohyblivých částí', ['flash', 'nand', 'pohybl']],
          ['přístupová doba / rychlost', ['přístup', 'rychl', 'latenc']],
          ['životnost zápisů SSD', ['tbw', 'zápis', 'životn']],
          ['použití – systém × archiv', ['systém', 'archiv', 'záloh']],
        ],
      },
    ],
  ),
  topic(
    8,
    'grafika',
    'Grafická karta a zobrazovací zařízení',
    'Grafický procesor (GPU) zpracovává obraz a paralelní výpočty. Může být integrovaný v procesoru, nebo na samostatné kartě s vlastní pamětí VRAM. Monitory se liší technologií panelu (IPS, VA, TN, OLED), rozlišením, obnovovací frekvencí a dobou odezvy.',
    [
      ['Grafická karta', ['GPU s tisíci jednoduchých jader – paralelní výpočty (hry, AI, rendering)', 'vlastní paměť VRAM (GDDR6/6X), sběrnice PCIe x16', 'integrovaná grafika (iGPU) – sdílí RAM, nižší spotřeba', 'napájení přes PCIe 6+2 pin / 12V-2x6, výstupy HDMI, DisplayPort']],
      ['Technologie displejů', ['LCD s podsvícením LED: TN (rychlé, horší úhly), IPS (věrné barvy, úhly), VA (vysoký kontrast)', 'OLED – každý bod svítí sám, dokonalá černá, riziko vypálení', 'projektory, e-ink (čtečky)']],
      ['Parametry monitoru', ['úhlopříčka (palce), rozlišení (Full HD 1920×1080, QHD 2560×1440, 4K 3840×2160)', 'poměr stran 16:9, 21:9', 'obnovovací frekvence (Hz), doba odezvy (ms)', 'jas (nity), kontrast, barevný gamut, HDR', 'adaptivní synchronizace (G-Sync, FreeSync)']],
      ['Barvy a obraz', ['aditivní model RGB (displeje)', 'barevná hloubka 8 bitů na kanál = 24 bitů', 'velikost snímku = šířka × výška × bajty na pixel']],
    ],
    [
      ['GPU', 'Grafický procesor určený k paralelnímu zpracování obrazu a výpočtů.'],
      ['VRAM', 'Paměť grafické karty.'],
      ['IPS', 'Typ LCD panelu s věrnými barvami a širokými pozorovacími úhly.'],
      ['OLED', 'Displej, ve kterém každý pixel sám svítí.'],
      ['obnovovací frekvence', 'Kolikrát za sekundu monitor překreslí obraz (Hz).'],
      ['rozlišení', 'Počet bodů obrazu na šířku a výšku.'],
      ['FreeSync', 'Adaptivní synchronizace frekvence monitoru se snímky grafiky (AMD).'],
    ],
    [
      ['Jaké rozlišení má Full HD?', '1920 × 1080', ['1280 × 720', '2560 × 1440', '3840 × 2160']],
      ['Který typ panelu má nejvěrnější barvy a nejlepší pozorovací úhly z LCD?', 'IPS', ['TN', 'VA', 'CRT']],
      ['Čím se vyznačuje OLED?', 'každý pixel svítí sám, dokonalá černá', ['potřebuje podsvícení', 'má nejhorší kontrast', 'je to druh projektoru']],
      ['Do jakého slotu se připojuje grafická karta?', 'PCIe x16', ['PCIe x1', 'M.2', 'DIMM']],
      ['Jaký barevný model používají displeje?', 'aditivní RGB', ['subtraktivní CMYK', 'HSV', 'YUV']],
      ['Co je VRAM?', 'paměť grafické karty', ['virtuální RAM na disku', 'cache procesoru', 'typ monitoru']],
    ],
    [
      {
        q: 'Podle čeho bys vybral monitor pro grafika a pro hráče?',
        answer:
          'Pro grafika je důležitá věrnost barev: panel IPS nebo OLED, široký barevný gamut (sRGB, Adobe RGB), možnost kalibrace, vyšší rozlišení (QHD, 4K) a větší úhlopříčka. Pro hráče je klíčová vysoká obnovovací frekvence (144 Hz a víc), krátká doba odezvy, adaptivní synchronizace FreeSync nebo G-Sync a vhodné rozlišení podle výkonu grafické karty. Obecně se dále sleduje kontrast, jas, HDR, poměr stran a konektory (DisplayPort, HDMI).',
        points: [
          ['grafik – IPS/OLED, věrné barvy, gamut', ['ips', 'oled', 'barv', 'gamut']],
          ['vysoké rozlišení', ['rozliš', '4k', 'qhd']],
          ['hráč – obnovovací frekvence, odezva', ['hz', 'frekvenc', 'odezv']],
          ['FreeSync / G-Sync', ['sync']],
        ],
      },
    ],
  ),
  topic(
    9,
    'vstupni',
    'Vstupní zařízení',
    'Vstupní zařízení převádějí informace od uživatele nebo z okolí do digitální podoby: klávesnice, myš, dotykové plochy, skenery, mikrofony, kamery a čtečky. Připojují se kabelem (USB) nebo bezdrátově (Bluetooth, 2,4 GHz přijímač).',
    [
      ['Klávesnice', ['membránová (levná, tichá) × mechanická (spínače, delší životnost)', 'rozložení QWERTZ (česká) × QWERTY', 'N-key rollover, podsvícení']],
      ['Polohovací zařízení', ['optická / laserová myš – snímač sleduje povrch, citlivost DPI', 'touchpad, trackball, grafický tablet (pero, úrovně přítlaku)', 'dotykové displeje – rezistivní (tlak) × kapacitní (vodivost prstu, multitouch)']],
      ['Snímání obrazu a zvuku', ['skener – plochý (CCD/CIS), rozlišení v DPI, OCR pro převod na text', 'webkamera, digitální fotoaparát – čip CMOS', 'mikrofon – převod zvuku, A/D převodník ve zvukové kartě']],
      ['Další', ['čtečky čárových a QR kódů, RFID/NFC', 'biometrie – čtečka otisků, rozpoznání obličeje', 'herní ovladače, VR']],
    ],
    [
      ['DPI', 'Dots per inch – citlivost myši nebo rozlišení skeneru.'],
      ['OCR', 'Optické rozpoznávání znaků – převod obrázku textu na text.'],
      ['kapacitní displej', 'Dotyková vrstva reagující na vodivost prstu, umí multitouch.'],
      ['rezistivní displej', 'Dotyková vrstva reagující na tlak, lze ovládat i stylusem bez vodivosti.'],
      ['mechanická klávesnice', 'Klávesnice se samostatným spínačem pod každou klávesou.'],
      ['CMOS snímač', 'Obrazový čip v kamerách a fotoaparátech.'],
    ],
    [
      ['Co udává DPI u myši?', 'citlivost – o kolik bodů se kurzor posune na palec pohybu', ['počet tlačítek', 'rychlost USB', 'výdrž baterie']],
      ['Který dotykový displej reaguje na vodivost prstu?', 'kapacitní', ['rezistivní', 'infračervený', 'e-ink']],
      ['K čemu slouží OCR?', 'k převodu naskenovaného textu na upravitelný text', ['ke kompresi obrázků', 'ke zvýšení rozlišení', 'k barevné kalibraci']],
      ['Jaké rozložení klávesnice se používá v Česku?', 'QWERTZ', ['QWERTY', 'AZERTY', 'Dvorak']],
      ['Čím se liší mechanická klávesnice od membránové?', 'má samostatný spínač pod každou klávesou', ['nepotřebuje napájení', 'je vždy bezdrátová', 'nemá diakritiku']],
    ],
    [
      {
        q: 'Rozděl vstupní zařízení a popiš princip myši a skeneru.',
        answer:
          'Vstupní zařízení dělíme na znaková (klávesnice), polohovací (myš, touchpad, tablet, dotykový displej), obrazová (skener, kamera), zvuková (mikrofon) a ostatní (čtečky kódů, biometrické snímače). Optická myš má LED nebo laser a malý snímač, který mnohokrát za sekundu fotografuje povrch a z posunu obrazu počítá pohyb; citlivost se udává v DPI. Plochý skener osvětluje předlohu a pohyblivý snímač CCD nebo CIS ji řádek po řádku převádí na digitální obraz; rozlišení se udává v DPI a pomocí OCR lze obraz převést na text.',
        points: [
          ['rozdělení – znaková, polohovací, obrazová, zvuková', ['znak', 'polohov', 'obraz', 'zvuk']],
          ['myš – snímač fotografuje povrch, DPI', ['snímač', 'povrch', 'dpi']],
          ['skener – CCD/CIS, řádek po řádku', ['ccd', 'cis', 'řád']],
          ['OCR', ['ocr']],
        ],
      },
    ],
  ),
  topic(
    10,
    'tiskarny',
    'Tiskárny a výstupní zařízení',
    'Tiskárny převádějí digitální dokument na papír. Nejrozšířenější jsou inkoustové a laserové, dále jehličkové (průpisy), termální (účtenky, štítky) a 3D tiskárny. Tisk používá subtraktivní barevný model CMYK.',
    [
      ['Laserová tiskárna', ['postup: nabití válce → osvit laserem → nanesení toneru → přenos na papír → zapečení fixační jednotkou (fuser) → očištění', 'rychlá, levný tisk na stránku, toner']],
      ['Inkoustová tiskárna', ['termální (bublinková) × piezoelektrická tryska', 'kvalitní fotografie, levná tiskárna, dražší náplně, zasychání trysek']],
      ['Další typy', ['jehličková – mechanický úder přes pásku, průpisy, hlučná', 'termální – teplocitlivý papír (účtenky, štítky)', 'sublimační – fotografie', '3D tisk – FDM (tavené vlákno), SLA (pryskyřice)']],
      ['Parametry a barvy', ['rozlišení DPI, rychlost (str./min), cena za stránku, duplex, připojení (USB, síť, Wi-Fi)', 'CMYK – azurová, purpurová, žlutá, černá (subtraktivní model)', 'multifunkční zařízení – tisk, sken, kopírování', 'další výstupy: monitory, reproduktory, projektory']],
    ],
    [
      ['toner', 'Jemné práškové barvivo pro laserové tiskárny.'],
      ['fixační jednotka', 'Část laserové tiskárny, která teplem zapeče toner do papíru (fuser).'],
      ['CMYK', 'Subtraktivní barevný model tisku – azurová, purpurová, žlutá a černá.'],
      ['piezoelektrická tiskárna', 'Inkoustová tiskárna vystřelující kapky pomocí piezokrystalu.'],
      ['FDM', '3D tisk vrstvením roztaveného plastového vlákna.'],
      ['duplex', 'Oboustranný tisk.'],
    ],
    [
      ['Jaký barevný model používá tisk?', 'CMYK', ['RGB', 'HSL', 'YUV']],
      ['Která část laserové tiskárny zapeče toner do papíru?', 'fixační jednotka (fuser)', ['válec', 'laser', 'tryska']],
      ['Která tiskárna umí tisknout průpisy?', 'jehličková', ['laserová', 'inkoustová', 'termální']],
      ['Na co se používají termální tiskárny?', 'účtenky a štítky', ['fotografie', 'plakáty', 'průpisy']],
      ['Jaká je nevýhoda inkoustové tiskárny?', 'drahé náplně a zasychání trysek', ['nemůže tisknout barevně', 'je velmi hlučná', 'potřebuje toner']],
    ],
    [
      {
        q: 'Popiš princip laserové tiskárny a porovnej ji s inkoustovou.',
        answer:
          'Laserová tiskárna nejprve nabije fotocitlivý válec, laser na něm osvitem vybije místa, kde má být obraz, na nabitá místa se přichytí toner, ten se přenese na papír a ve fixační jednotce (fuseru) se teplem a tlakem zapeče; nakonec se válec očistí. Inkoustová tiskárna stříká kapky inkoustu tryskami – termálně (bublinkou) nebo piezoelektricky. Laserová je rychlejší, má nižší cenu za stránku a hodí se pro kanceláře a text; inkoustová je levnější na pořízení, dobře tiskne fotografie, ale náplně jsou drahé a trysky mohou zasychat.',
        points: [
          ['válec, laser, toner', ['válec', 'laser', 'toner']],
          ['fixační jednotka – zapečení', ['fix', 'fuser', 'zapeč']],
          ['inkoust – tryska, termální/piezo', ['tryska', 'piezo', 'bublin']],
          ['porovnání – rychlost, cena za stránku, fotky', ['cen', 'rychl', 'foto']],
        ],
      },
    ],
  ),
  topic(
    11,
    'napajeni',
    'Napájení a chlazení (zdroj, UPS)',
    'Počítačový zdroj převádí střídavé síťové napětí 230 V na stejnosměrná napětí 12 V, 5 V a 3,3 V. Důležitý je výkon, účinnost (80 PLUS) a kvalita. Proti výpadkům chrání UPS. Teplo z procesoru a grafiky odvádí vzduchové nebo kapalinové chlazení.',
    [
      ['Zdroj (PSU)', ['spínaný zdroj ATX, napětí +12 V (CPU, GPU), +5 V, +3,3 V', 'konektory: ATX 24pin, EPS 4+4pin (CPU), PCIe 6+2pin / 12V-2x6 (GPU), SATA napájení', 'výkon ve wattech s rezervou, účinnost 80 PLUS (Bronze, Gold, Platinum, Titanium)', 'modulární kabeláž, ochrany (přepětí, zkrat, přehřátí)']],
      ['UPS', ['záložní zdroj s baterií', 'offline (standby), line-interactive (s regulací napětí), online (dvojitá konverze – nejlepší ochrana)', 'kapacita ve VA / W, komunikace s PC → bezpečné vypnutí']],
      ['Chlazení', ['pasivní (chladič) × aktivní (ventilátor)', 'teplovodivá pasta mezi CPU a chladičem', 'vodní chlazení AIO, heatpipe', 'proudění vzduchu ve skříni – přední sání, zadní/horní výfuk']],
      ['Spotřeba a teplo', ['TDP procesoru a grafiky určuje chlazení i zdroj', 'thermal throttling – snížení taktu při přehřátí']],
    ],
    [
      ['PSU', 'Power Supply Unit – počítačový zdroj.'],
      ['80 PLUS', 'Certifikace účinnosti zdroje (Bronze, Gold, Platinum, Titanium).'],
      ['UPS', 'Záložní zdroj nepřerušitelného napájení s baterií.'],
      ['online UPS', 'UPS s dvojitou konverzí – zařízení stále napájí z baterie / měniče.'],
      ['teplovodivá pasta', 'Vrstva mezi procesorem a chladičem zlepšující přenos tepla.'],
      ['thermal throttling', 'Snížení výkonu procesoru při přehřátí.'],
    ],
    [
      ['Jaké hlavní napětí napájí procesor a grafickou kartu?', '12 V', ['5 V', '3,3 V', '230 V']],
      ['Co udává certifikace 80 PLUS?', 'účinnost zdroje', ['maximální výkon', 'počet konektorů', 'hlučnost']],
      ['Která UPS poskytuje nejlepší ochranu?', 'online (dvojitá konverze)', ['offline', 'line-interactive', 'všechny stejně']],
      ['K čemu slouží teplovodivá pasta?', 'zlepšuje přenos tepla z procesoru do chladiče', ['izoluje procesor elektricky', 'lepí chladič k desce', 'chladí paměti']],
      ['Co je thermal throttling?', 'snížení taktu procesoru při přehřátí', ['přetaktování', 'zvýšení otáček ventilátoru', 'vypnutí zdroje']],
    ],
    [
      {
        q: 'Jak vybrat zdroj do počítače a proč je důležitá UPS?',
        answer:
          'Výkon zdroje se odvodí ze spotřeby komponent, hlavně TDP procesoru a grafické karty, a přidá se rezerva (asi 20–30 %). Zdroj by měl mít certifikaci účinnosti 80 PLUS (alespoň Bronze, lépe Gold), dostatečný výkon na větvi 12 V, potřebné konektory (ATX 24pin, EPS pro CPU, PCIe pro grafiku), ochrany proti přepětí a zkratu a kvalitní výrobce; modulární kabely usnadní kabeláž. UPS chrání před výpadkem a kolísáním napětí – baterie přemostí výpadek, aby se počítač nebo server stihl bezpečně vypnout a nedošlo ke ztrátě dat; pro servery je vhodná online UPS.',
        points: [
          ['výkon podle spotřeby + rezerva', ['výkon', 'rezerv', 'spotřeb', 'tdp']],
          ['účinnost 80 PLUS', ['80 plus', 'účinn']],
          ['konektory, ochrany', ['konektor', 'ochran']],
          ['UPS – výpadek, bezpečné vypnutí', ['ups', 'výpad', 'vypnut']],
        ],
      },
    ],
  ),
  topic(
    12,
    'sestaveni',
    'Sestavení PC, diagnostika a údržba',
    'Při sestavování počítače se ověřuje kompatibilita komponent (patice, chipset, typ RAM, formát desky a skříně, výkon zdroje). Po zapnutí proběhne POST; chyby se hledají postupně podle příznaků, zvukových kódů a diagnostických nástrojů.',
    [
      ['Kompatibilita', ['procesor ↔ patice a chipset desky (podpora v BIOSu)', 'typ RAM (DDR4/DDR5) a max. kapacita', 'formát desky ↔ skříň, délka grafické karty, výška chladiče', 'zdroj – výkon a konektory', 'rozhraní disků (SATA, M.2 NVMe)']],
      ['Postup sestavení', ['ochrana proti ESD – uzemnění, antistatický náramek', 'na desku: CPU, chladič s pastou, RAM, M.2 disk', 'deska do skříně (distanční sloupky), zdroj, grafická karta, kabely', 'první spuštění, nastavení UEFI (XMP, boot), instalace OS a ovladačů']],
      ['Diagnostika', ['nejde zapnout → zdroj, kabely, tlačítko, zkrat', 'pípání / diagnostické LED → RAM, grafika, CPU', 'nestabilita → teploty, RAM test (MemTest86), zdroj', 'S.M.A.R.T. – stav disku, správce zařízení, prohlížeč událostí']],
      ['Údržba', ['čištění prachu, výměna teplovodivé pasty', 'aktualizace ovladačů a firmwaru', 'zálohování, kontrola disků']],
    ],
    [
      ['ESD', 'Elektrostatický výboj, který může poškodit elektroniku.'],
      ['XMP', 'Profil v paměti, který nastaví výrobcem udávanou frekvenci a časování RAM (u AMD EXPO).'],
      ['S.M.A.R.T.', 'Samodiagnostika disků – sleduje jejich stav a varuje před selháním.'],
      ['MemTest86', 'Nástroj na testování operační paměti.'],
      ['distanční sloupky', 'Šroubky, které drží desku nad plechem skříně, aby nevznikl zkrat.'],
    ],
    [
      ['Čím se chráníš před ESD při sestavování?', 'uzemněním / antistatickým náramkem', ['gumovými rukavicemi', 'zapnutým zdrojem', 'vysavačem']],
      ['Co ověříš jako první u procesoru a desky?', 'shodnou patici a podporu chipsetu', ['barvu chladiče', 'velikost skříně', 'typ monitoru']],
      ['Co sleduje S.M.A.R.T.?', 'stav disku a varování před selháním', ['teplotu procesoru', 'rychlost sítě', 'chyby RAM']],
      ['Počítač po zapnutí pípá a nic nezobrazí – co prověříš nejdřív?', 'paměti RAM a grafickou kartu (usazení)', ['instalaci OS', 'nastavení Wi-Fi', 'ovladač tiskárny']],
      ['K čemu slouží profil XMP?', 'nastaví RAM na výrobcem udávanou frekvenci a časování', ['přetaktuje procesor', 'zapne Secure Boot', 'zrychlí disk']],
    ],
    [
      {
        q: 'Počítač se nezapne vůbec – jak budeš postupovat při hledání závady?',
        answer:
          'Postupuji od nejjednoduššího: ověřím zásuvku, napájecí kabel a vypínač na zdroji, pak připojení tlačítka (front panel) na desce. Zkontroluji konektory ATX 24pin a EPS pro procesor. Zdroj otestuji testerem nebo zkratováním zapínacího signálu, případně vyměním za funkční. Hledám zkrat – deska musí stát na distančních sloupcích. Pak počítač zkusím s minimální sestavou (deska, CPU, jedna RAM, zdroj) mimo skříň a postupně přidávám komponenty, sleduji diagnostické LED a pípání. Vše dělám s uzemněním proti ESD.',
        points: [
          ['napájení – zásuvka, kabel, vypínač zdroje', ['zásuv', 'kabel', 'vypínač']],
          ['konektory ATX / EPS, tlačítko', ['atx', 'eps', 'konektor', 'tlačítk']],
          ['test / výměna zdroje', ['zdroj', 'test']],
          ['minimální sestava, postupné přidávání', ['minimáln', 'postup']],
          ['diagnostické LED / pípání', ['led', 'píp']],
        ],
      },
    ],
  ),
  topic(
    13,
    'servery',
    'Servery a datová centra',
    'Servery jsou navržené pro nepřetržitý provoz a spolehlivost: mají paměti ECC, redundantní zdroje a disky v RAID s výměnou za chodu, vzdálenou správu a instalují se do racků. Datová centra zajišťují napájení, chlazení, konektivitu a fyzickou bezpečnost.',
    [
      ['Provedení serverů', ['tower, rackový (19″, výška v jednotkách U, 1U = 44,45 mm), blade', 'rack – skříň s patch panely, switchi, UPS']],
      ['Spolehlivost', ['paměť ECC, více procesorů', 'redundantní zdroje a ventilátory, hot-swap disky v RAID', 'vzdálená správa: IPMI, iDRAC (Dell), iLO (HPE) – i při vypnutém OS']],
      ['Úložiště', ['DAS – přímo připojené disky', 'NAS – úložiště sdílené po síti na úrovni souborů (SMB, NFS)', 'SAN – blokové úložiště ve vlastní síti (Fibre Channel, iSCSI)']],
      ['Datové centrum', ['napájení: UPS + dieselagregát, dvě napájecí větve', 'chlazení: studené a teplé uličky, klimatizace', 'konektivita od více poskytovatelů, fyzická bezpečnost', 'Tier I–IV podle redundance a dostupnosti']],
    ],
    [
      ['rack', 'Standardizovaná 19″ skříň pro servery a síťové prvky.'],
      ['U (unit)', 'Jednotka výšky v racku = 44,45 mm.'],
      ['NAS', 'Síťové úložiště sdílené na úrovni souborů.'],
      ['SAN', 'Síť úložišť poskytující blokový přístup k diskům.'],
      ['iDRAC / iLO', 'Vzdálená správa serveru nezávislá na operačním systému.'],
      ['blade server', 'Tenký serverový modul sdílející napájení a chlazení v šasi.'],
    ],
    [
      ['Kolik měří jednotka 1U v racku?', '44,45 mm', ['19 palců', '10 cm', '25,4 mm']],
      ['Čím se liší SAN od NAS?', 'SAN poskytuje blokový přístup, NAS soubory', ['SAN je bezdrátové', 'NAS je rychlejší vždy', 'nijak']],
      ['Jaká paměť se v serverech používá kvůli spolehlivosti?', 'ECC', ['SO-DIMM', 'SRAM', 'ROM']],
      ['K čemu slouží iDRAC / iLO?', 'ke vzdálené správě serveru i při vypnutém OS', ['k zálohování', 'k chlazení', 'k šifrování']],
      ['Co zajistí napájení datového centra při dlouhém výpadku sítě?', 'dieselagregát (UPS přemostí rozběh)', ['jen UPS', 'baterie v serverech', 'solární panely']],
    ],
    [
      {
        q: 'Čím se server liší od běžného PC?',
        answer:
          'Server je navržený na nepřetržitý provoz 24/7 a spolehlivost: používá paměti ECC s opravou chyb, často více procesorů, redundantní zdroje a ventilátory, disky v RAID vyměnitelné za chodu (hot-swap) a vzdálenou správu (IPMI, iDRAC, iLO), která funguje i bez OS. Bývá v rackovém provedení (výška v U), nemá výkonnou grafiku a běží na něm serverový operační systém a služby. Komponenty jsou certifikované a dražší, podpora výrobce je delší.',
        points: [
          ['nepřetržitý provoz', ['24', 'nepřetrž']],
          ['ECC', ['ecc']],
          ['redundance – zdroje, RAID, hot-swap', ['redund', 'raid', 'hot']],
          ['vzdálená správa', ['vzdálen', 'idrac', 'ilo', 'ipmi']],
          ['rackové provedení', ['rack']],
        ],
      },
    ],
  ),
];
