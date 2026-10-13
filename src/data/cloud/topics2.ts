import { topicFor } from '../site/helpers';

const topic = topicFor('cloud');

/** Další látka z učitelových učebnic VRT (Virtualizace OS) a CCC (Clustery a cloud) – randis.cz/wikit */
export const CLOUD_EXTRA_FROM = 14;

export const CLOUD_TOPICS_VRT = [
  topic(
    14,
    'os',
    'Operační systémy a jádro',
    'Operační systém spravuje hardware a poskytuje služby aplikacím – tvoří abstrakční vrstvu nad hardwarem. Jádro běží v privilegovaném režimu (Ring 0), aplikace v uživatelském (Ring 3) a o přístup k hardwaru žádají systémovým voláním.',
    [
      ['Vývoj a členění OS', ['dávkové zpracování (50.–60. léta): programy na děrných štítcích, operátor je seskupil do dávek', 'jednouživatelský × víceuživatelský (správa účtů a práv) – MS-DOS × Windows, Linux, macOS', 'jednoúlohový × víceúlohový (rychlé přepínání úloh na procesoru)']],
      ['Druhy OS', ['desktopové (Windows, macOS, Ubuntu)', 'serverové (Windows Server, RHEL, Debian) – stabilita, bezpečnost, síťové služby', 'mobilní (Android, iOS), vestavěné (routery, TV, auta)', 'real-time OS (RTOS) – garantuje dokončení v časovém limitu (průmysl, letový provoz, lékařské přístroje)']],
      ['Vrstvy a rozhraní', ['uživatel → aplikace → (systémová volání, API) → jádro → ovladače a firmware → hardware', 'API – rozhraní pro programy, komunikace přes systémová volání', 'CLI (Bash, PowerShell), TUI (Norton/Midnight Commander), GUI (okna, ikony, myš)']],
      ['Režimy procesoru', ['Kernel Mode (Ring 0) – jádro, neomezený přístup k hardwaru a paměti', 'User Mode (Ring 3) – aplikace, bez přímého přístupu k hardwaru a paměti jiných procesů', 'privilegovanou operaci aplikace vyžádá systémovým voláním; chrání to systém před chybami a malwarem']],
      ['Architektury jádra', ['monolitické – všechny služby v kernel mode (Linux, FreeBSD)', 'mikrojádro – v kernel mode jen minimum, ostatní služby jako procesy v user mode (Minix, QNX)', 'hybridní – kompromis, většina služeb v kernel mode, moduly (Windows, macOS)']],
    ],
    [
      ['operační systém', 'Základní systémový software, který spravuje hardware a poskytuje společné služby aplikacím.'],
      ['jádro (kernel)', 'Centrální část OS, zavádí se po startu jako první a zprostředkovává komunikaci softwaru s hardwarem.'],
      ['systémové volání', 'Žádost aplikace jádru o privilegovanou operaci (např. zápis souboru na disk).'],
      ['Ring 0 / Ring 3', 'Režim jádra s plným přístupem k hardwaru / uživatelský režim aplikací s omezeným přístupem.'],
      ['RTOS', 'Real-time OS – garantuje dokončení operací v přesně daném časovém limitu.'],
      ['mikrojádro', 'Architektura, kde v režimu jádra běží jen minimum funkcí a ostatní služby jsou procesy v uživatelském režimu.'],
    ],
    [
      ['Jakou architekturu jádra má Linux?', 'monolitickou', ['mikrojádro', 'hybridní', 'exojádro'], 'V Linuxu běží všechny základní služby včetně ovladačů v kernel mode.'],
      ['Jakou architekturu jádra má Windows?', 'hybridní', ['monolitickou', 'mikrojádro', 'dávkovou']],
      ['V jakém režimu běží běžné aplikace?', 'User Mode (Ring 3)', ['Kernel Mode (Ring 0)', 'Real Mode', 'BIOS mode'], 'K hardwaru se dostanou jen přes systémové volání.'],
      ['Který OS garantuje dokončení operace v časovém limitu?', 'real-time OS (RTOS)', ['desktopový OS', 'dávkový systém', 'mobilní OS']],
      ['Co je TUI?', 'textové rozhraní s okny a menu v textovém režimu', ['grafické rozhraní s ikonami', 'rozhraní pro programy', 'příkazový řádek bez menu'], 'Příklad: Norton Commander, Midnight Commander.'],
      ['Který systém byl jednouživatelský a jednoúlohový?', 'MS-DOS', ['Linux', 'Windows 10', 'macOS']],
    ],
    [
      {
        q: 'Co je operační systém, jaké jsou režimy procesoru a architektury jádra?',
        answer:
          'Operační systém je základní systémový software, který spravuje hardware a poskytuje služby aplikacím – vytváří abstrakční vrstvu, takže aplikace nemusí znát konkrétní hardware. Jádro běží v režimu Kernel Mode (Ring 0) s plným přístupem k hardwaru, aplikace v User Mode (Ring 3) a o privilegované operace žádají systémovým voláním. Jádro může být monolitické (Linux), mikrojádro (Minix, QNX) nebo hybridní (Windows, macOS).',
        points: [
          ['definice – správa hardwaru, služby aplikacím', ['hardware', 'služb', 'abstrak']],
          ['Kernel Mode / Ring 0', ['kernel', 'ring 0', 'jádr']],
          ['User Mode / Ring 3, systémové volání', ['user', 'ring 3', 'volání']],
          ['monolitické jádro (Linux)', ['monolit']],
          ['mikrojádro a hybridní jádro', ['mikroj', 'hybrid']],
        ],
      },
    ],
  ),
  topic(
    15,
    'bootovani',
    'Proces bootování, MBR a GPT',
    'Bootování je řetěz šesti fází: zapnutí zdroje, firmware (BIOS/UEFI) s testem POST, nalezení a spuštění zavaděče z MBR nebo GPT, načtení jádra a start systému prvním procesem (systemd, smss.exe).',
    [
      ['Fáze bootování', ['1. Power-On – zdroj pošle signál „Power Good“, deska aktivuje CPU', '2. firmware BIOS/UEFI provede POST (CPU, RAM, grafika, sběrnice), chybu ohlásí pípáním', '3.–4. nalezení zavaděče podle Boot Sequence a jeho spuštění', '5. zavaděč načte jádro (vmlinuz, ntoskrnl.exe), případně initramfs', '6. jádro spustí první proces – systemd (Linux), smss.exe (Windows) – a ten služby a přihlášení']],
      ['MBR (starší, Legacy BIOS)', ['prvních 512 B disku: boot code 446 B, tabulka oddílů 64 B, signatura 0x55AA', 'max. 4 primární oddíly, nebo 3 primární + 1 rozšířený s logickými jednotkami', 'max. velikost disku 2,2 TB, žádná záloha ani kontrola integrity']],
      ['GPT (moderní, UEFI)', ['64bitové LBA – odstraňuje limit 2,2 TB', 'ochranný MBR v LBA 0, primární hlavička v LBA 1, záznamy oddílů v LBA 2–33', 'standardně 128 oddílů, každý s unikátním GUID', 'záložní hlavička a tabulka na konci disku, kontrolní součty CRC32']],
      ['Bootování z GPT', ['UEFI hledá oddíl EFI System Partition (ESP) a spustí zavaděč, např. \\EFI\\BOOT\\BOOTX64.EFI', 'starý BIOS standardně z GPT nenabootuje (jen nestandardní hybridní řešení s GRUBem)']],
      ['Zavaděč a jádro', ['zavaděč (GRUB, Windows Boot Manager) umí číst souborové systémy (NTFS, ext4)', 'najde a načte jádro do RAM a předá mu řízení', 'jádro inicializuje paměť a plánovač, načte ovladače, spustí první proces']],
    ],
    [
      ['POST', 'Power-On Self-Test – diagnostika hardwaru firmwarem po zapnutí.'],
      ['Power Good', 'Signál zdroje, že výstupní napětí jsou stabilní – teprve pak deska spustí CPU.'],
      ['MBR', 'Master Boot Record – první sektor disku (512 B) se zavaděčem a tabulkou až 4 primárních oddílů, max. 2,2 TB.'],
      ['GPT', 'GUID Partition Table – moderní tabulka oddílů pro UEFI, 128 oddílů, zálohovaná a s CRC32.'],
      ['ESP', 'EFI System Partition – oddíl, ze kterého UEFI spouští zavaděč.'],
      ['initramfs', 'Dočasný souborový systém se základními ovladači, který načte zavaděč spolu s jádrem Linuxu.'],
    ],
    [
      ['Kolik primárních oddílů umožňuje MBR?', '4', ['2', '128', 'neomezeně'], 'Tabulka oddílů má jen 64 B (4 × 16 B); více oddílů jen přes rozšířený oddíl.'],
      ['Jaký je limit velikosti disku u MBR?', '2,2 TB', ['4 GB', '16 TB', '9,4 ZB']],
      ['Jakou signaturou končí platný MBR?', '0x55AA', ['0xFFFF', '0x0000', '0xEFI0']],
      ['Z jakého oddílu spouští UEFI zavaděč?', 'EFI System Partition (ESP)', ['rozšířeného oddílu', 'swapového oddílu', 'z ochranného MBR']],
      ['Jaký je první proces spuštěný jádrem v moderním Linuxu?', 'systemd', ['GRUB', 'smss.exe', 'initramfs'], 'Ve Windows je to Session Manager (smss.exe).'],
      ['Co dělá firmware při POST?', 'testuje a inicializuje CPU, RAM, grafiku a sběrnice', ['načítá jádro OS', 'formátuje disk', 'spouští přihlašovací obrazovku']],
      ['Kde je u GPT záloha tabulky oddílů?', 'na konci disku', ['v LBA 0', 'v RAM', 'na ESP oddílu']],
    ],
    [
      {
        q: 'Popiš proces bootování a rozdíl mezi MBR a GPT.',
        answer:
          'Po zapnutí zdroj pošle signál Power Good a spustí se procesor. Firmware BIOS nebo UEFI provede POST a podle pořadí bootování hledá zavaděč. U MBR (Legacy BIOS) je zavaděč v prvních 512 bajtech disku spolu s tabulkou oddílů – max. 4 primární oddíly a disk do 2,2 TB. GPT (UEFI) má 64bitové adresování, 128 oddílů, zálohu na konci disku a CRC32; UEFI spustí zavaděč z oddílu ESP. Zavaděč (GRUB, Windows Boot Manager) načte jádro a jádro spustí první proces – systemd nebo smss.exe.',
        points: [
          ['Power Good, start CPU', ['power good', 'zdroj', 'cpu']],
          ['firmware BIOS/UEFI a POST', ['post', 'bios', 'uefi']],
          ['MBR – 512 B, 4 oddíly, 2,2 TB', ['mbr', '2,2', '4']],
          ['GPT – 128 oddílů, záloha, CRC32, ESP', ['gpt', '128', 'záloh', 'esp']],
          ['zavaděč a jádro, systemd', ['zavaděč', 'grub', 'jádr', 'systemd']],
        ],
      },
    ],
  ),
  topic(
    16,
    'procesy',
    'Procesy, vlákna a správa paměti',
    'Program je soubor na disku, proces jeho běžící instance s vlastním PID a pamětí, vlákno nejmenší jednotka plánování. Jádro přepíná procesy (kontextový přepínač), izoluje jejich paměť v chráněném režimu a překládá virtuální adresy na fyzické.',
    [
      ['Program, proces, vlákno', ['program – pasivní spustitelný soubor (PE ve Windows, ELF v Linuxu)', 'proces – běžící instance: PID, vlastní adresní prostor, otevřené soubory, vlastník; údaje v PCB', 'vlákno – nejmenší jednotka plánování; vlákna procesu sdílejí paměť, ale mají vlastní zásobník a registry', 'z jednoho programu může vzniknout více procesů (multi-instance × single-instance aplikace)']],
      ['Stavy procesu', ['nový → připraven (přijetí, zařazení do fronty)', 'připraven → běžící (plánovač přidělí CPU)', 'běžící → připraven (vypršel časový úsek, přerušení)', 'běžící → čekající (čeká na I/O) → připraven (operace dokončena)', 'běžící → ukončený (konec nebo násilné ukončení)']],
      ['Hierarchie procesů', ['fork() vytvoří kopii rodiče s novým PID, exec() nahradí kód novým programem', 'první proces (systemd/init, PID 1) je předek všech ostatních', 'zombie – skončil, ale rodič si nevyzvedl návratový kód', 'sirotek – rodič skončil dřív, proces adoptuje init']],
      ['Meziprocesová komunikace (IPC)', ['signály (SIGKILL, SIGINT) – jen povel, bez dat', 'roury (pipes) – výstup jednoho programu jako vstup druhého (|)', 'sdílená paměť – nejrychlejší, vyžaduje synchronizaci', 'sockety – i mezi procesy na různých počítačích']],
      ['Paměť a plánování', ['chráněný režim – izolace procesů, pokus o cizí paměť = Segmentation Fault / Access Violation', 'virtuální paměť – MMU překládá virtuální adresy na fyzické pomocí stránkovacích tabulek, umožňuje swapování', 'kontextový přepínač – uložení registrů do PCB a obnovení jiného procesu (režie)', 'preemptivní multitasking – časové kvantum (např. 20 ms) z časovače × kooperativní (proces se musel vzdát sám)']],
    ],
    [
      ['proces', 'Běžící instance programu s vlastním PID, adresním prostorem a otevřenými soubory.'],
      ['vlákno (thread)', 'Nejmenší jednotka plánování; vlákna procesu sdílejí paměť, mají vlastní zásobník a registry.'],
      ['PCB', 'Process Control Block – struktura jádra s informacemi o procesu, ukládá se do ní kontext.'],
      ['kontextový přepínač', 'Odebrání CPU jednomu procesu a přidělení jinému (uložení a obnovení registrů).'],
      ['zombie proces', 'Proces, který skončil, ale rodič si ještě nevyzvedl jeho návratový kód.'],
      ['MMU', 'Memory Management Unit – překládá virtuální adresy na fyzické podle stránkovacích tabulek.'],
      ['preemptivní multitasking', 'OS procesu po uplynutí časového kvanta CPU násilně odebere a spustí plánovač.'],
    ],
    [
      ['Co sdílejí vlákna jednoho procesu?', 'paměťový prostor (heap, globální proměnné)', ['zásobník (stack)', 'registry', 'PID každého vlákna zvlášť'], 'Zásobník a registry má každé vlákno vlastní.'],
      ['Kam proces přejde, když čeká na čtení z disku?', 'do stavu čekající', ['do stavu ukončený', 'do stavu nový', 'zůstane běžící'], 'CPU nemůže čekat na pomalý disk, proto se proces zablokuje.'],
      ['Co je zombie proces?', 'skončil, ale rodič si nevyzvedl návratový kód', ['proces bez rodiče', 'proces, který zabírá 100 % CPU', 'virus']],
      ['Co dělá systémové volání fork()?', 'vytvoří kopii rodičovského procesu', ['ukončí proces', 'nahradí kód procesu jiným programem', 'pošle signál'], 'Kód nového programu načte až exec().'],
      ['Která metoda IPC je nejrychlejší?', 'sdílená paměť', ['signály', 'roury', 'sockety']],
      ['Co se stane, když proces sáhne do paměti jiného procesu?', 'CPU vyvolá výjimku a OS proces ukončí', ['data se zkopírují', 'proces dostane vyšší prioritu', 'nic, je to povolené']],
      ['Jaký proces má v Linuxu PID 1?', 'systemd (init)', ['bash', 'kernel', 'GRUB']],
    ],
    [
      {
        q: 'Vysvětli rozdíl mezi programem, procesem a vláknem a popiš stavy procesu.',
        answer:
          'Program je pasivní spustitelný soubor na disku. Proces je jeho běžící instance – má PID, vlastní adresní prostor a otevřené soubory, jádro o něm vede záznam v PCB. Vlákno je nejmenší jednotka plánování; vlákna procesu sdílejí paměť, ale mají vlastní zásobník a registry. Proces prochází stavy nový, připraven, běžící, čekající (např. na disk) a ukončený. Plánovač procesy střídá kontextovým přepínačem – u preemptivního multitaskingu po vypršení časového kvanta.',
        points: [
          ['program – soubor na disku', ['program', 'soubor', 'disk']],
          ['proces – PID, paměť, PCB', ['pid', 'pcb', 'instanc']],
          ['vlákno – sdílí paměť, vlastní zásobník', ['vlákn', 'zásobník', 'sdíl']],
          ['stavy: nový, připraven, běžící, čekající, ukončený', ['připraven', 'běžící', 'čekající']],
          ['kontextový přepínač, preempce', ['kontext', 'preempt', 'kvant']],
        ],
      },
    ],
  ),
  topic(
    17,
    'souborove-systemy',
    'Souborové systémy',
    'Souborový systém určuje, jak se data na médiu organizují, ukládají a zpřístupňují jako soubory a adresáře. Chrání integritu žurnálováním, data oprávněními a kvótami. Na Windows dominuje NTFS, na Linuxu ext4, na výměnných médiích FAT32 a exFAT.',
    [
      ['Architektura', ['logický FS – API pro otevření, čtení, zápis a zavření, deskriptory, práva', 'virtuální FS (VFS) – více fyzických FS v jedné hierarchii s jedním kořenem (Unix)', 'fyzický FS – čtení a zápis po blocích přes ovladače, buffering']],
      ['Metadata a alokace', ['metadata: název, velikost, práva, vlastník, časy vytvoření, změny a přístupu', 'adresáře spojují názvy s indexy (inode v Unixu); ve stejném adresáři nesmí být dva stejné názvy', 'prostor po blocích (clusterech) – nevyužitý zbytek bloku = slack space', 'fragmentace zpomaluje HDD, na SSD vliv nemá']],
      ['Integrita a bezpečnost', ['žurnálování – operace se nejdřív zapíší do žurnálu, po havárii se FS rychle vrátí do konzistentního stavu (NTFS, ext3/4, XFS)', 'řízení přístupu – POSIX oprávnění až ACL', 'kvóty – omezení obsazeného místa nebo počtu souborů (inode quota)']],
      ['Typy FS', ['diskové (FAT, NTFS, ext4, XFS), flash (JFFS2, UBIFS), páskové (LTFS)', 'síťové a distribuované (NFS, SMB, AFP)', 'transakční (atomicita), databázové, pseudo-FS (procfs, sysfs, devfs)']],
      ['Systémy podle OS', ['Windows: písmena jednotek, NTFS (ACL, žurnál, kvóty), FAT32 (soubor max. 4 GB), exFAT pro výměnná média', 'Linux: jeden strom od /, oddíly se připojují do mount pointů podle /etc/fstab; ext4, XFS, Btrfs (snapshoty)', 'macOS: HFS+, dnes APFS (SSD, sdílený prostor svazků); NTFS jen čte']],
    ],
    [
      ['souborový systém', 'Pravidla organizace, ukládání a zpřístupnění dat na médiu ve formě souborů a adresářů.'],
      ['metadata', 'Služební informace o souboru – název, velikost, práva, vlastník a časové známky.'],
      ['žurnálování', 'Zápis prováděných operací do žurnálu předem, aby se FS po havárii vrátil do konzistentního stavu.'],
      ['inode', 'Index souboru v unixových FS, se kterým adresář spojuje název souboru.'],
      ['slack space', 'Nevyužité místo v posledním alokačním bloku souboru.'],
      ['mount point', 'Adresář v linuxovém stromu, do kterého se připojí další oddíl.'],
      ['exFAT', 'Souborový systém pro výměnná média, který odstranil 4GB limit souboru u FAT32.'],
    ],
    [
      ['Jaká je max. velikost souboru na FAT32?', '4 GB', ['2 TB', '16 EB', '32 GB'], 'Proto vznikl exFAT.'],
      ['Který souborový systém je standardní pro většinu linuxových distribucí?', 'ext4', ['NTFS', 'APFS', 'FAT32']],
      ['K čemu slouží žurnálování?', 'po havárii rychle obnoví konzistentní stav FS', ['šifruje data', 'zrychluje SSD', 'omezuje místo uživatelům']],
      ['Který soubor v Linuxu určuje připojování oddílů?', '/etc/fstab', ['/etc/passwd', '/boot/grub', '/etc/hosts']],
      ['Má fragmentace vliv na výkon SSD?', 'ne, zpomaluje jen mechanické HDD', ['ano, výrazně', 'ano, SSD se kvůli ní poškodí', 'jen u FAT32']],
      ['Který FS nemá žurnálování?', 'FAT32', ['NTFS', 'ext4', 'APFS']],
      ['Co je procfs?', 'pseudo-souborový systém s informacemi z jádra', ['síťový FS', 'FS pro pásky', 'šifrovaný oddíl']],
    ],
    [
      {
        q: 'Co je souborový systém a jak zajišťuje integritu dat? Porovnej NTFS, FAT32, exFAT a ext4.',
        answer:
          'Souborový systém organizuje data na médiu do souborů a adresářů a ukládá k nim metadata (název, velikost, práva, vlastník, časy). Integritu zajišťuje žurnálování – operace se nejdřív zapíší do žurnálu a po výpadku se FS rychle vrátí do konzistentního stavu. Data chrání oprávnění (POSIX, ACL) a kvóty. NTFS je systémový FS Windows s žurnálem, ACL a kvótami; FAT32 je univerzální, bez žurnálu a se souborem max. 4 GB; exFAT tento limit odstranil a hodí se na flash disky; ext4 je standard Linuxu se žurnálem.',
        points: [
          ['soubory, adresáře, metadata', ['metadat', 'adresář', 'soubor']],
          ['žurnálování', ['žurnál']],
          ['práva, ACL, kvóty', ['acl', 'práv', 'kvót']],
          ['NTFS a FAT32 (4 GB)', ['ntfs', 'fat32', '4 gb']],
          ['exFAT a ext4', ['exfat', 'ext4']],
        ],
      },
    ],
  ),
  topic(
    18,
    'ups',
    'Záložní zdroje napájení (UPS)',
    'UPS dodává elektřinu z baterií při výpadku sítě a zároveň čistí napájení od špiček a podpětí. Podle topologie je offline, line-interactive nebo online (dvojitá konverze). Při dimenzování se hlídají VA i W, výdrž se počítá z kapacity baterií a zátěže.',
    [
      ['Problémy v síti', ['blackout – úplný výpadek napětí', 'brownout – dlouhodobé podpětí (např. pod 200 V), zdroje se přehřívají', 'surge/spike – krátká napěťová špička (blesk, spínání motorů)', 'šum – elektromagnetické rušení deformující sinusovku']],
      ['Typy UPS', ['offline (standby) – běžně ze sítě, při výpadku přepne relé na baterii (5–10 ms); neřeší brownout', 'line-interactive – autotransformátor AVR vyrovná podpětí i přepětí bez baterie; přepnutí 2–4 ms; servery, switche, NAS', 'online (dvojitá konverze) – vždy AC → DC → AC z invertoru, přepnutí 0 ms, čistá sinusovka; dražší, nižší účinnost, hlučná']],
      ['Watty, VA a účiník', ['W – činný výkon, určuje výdrž baterie', 'VA – zdánlivý výkon, určuje kapacitu invertoru a elektroniky', 'W = VA × PF; UPS 1000 VA s PF 0,6 dodá jen 600 W', 'zátěž nesmí překročit ani limit VA, ani limit W']],
      ['Výpočet výdrže', ['čas [min] = (napětí baterie [V] × kapacita [Ah] × účinnost) / zátěž [W] × 60', 'účinnost měniče cca 0,85–0,9', 'malé UPS 12 V nebo 24 V, rackové 48–96 V', 'delší výdrž: menší spotřeba nebo více baterií (battery packy)']],
      ['Graceful shutdown', ['UPS je se serverem propojena USB nebo po síti (SNMP), software např. PowerChute, NUT', 'při výpadku hlásí běh na baterii, při slabé baterii signál „Low Battery“', 'server korektně uloží data, zastaví databáze a vypne se', 'u virtualizace UPS komunikuje s hypervizorem: nejdřív se vypnou VM, pak hypervizor']],
    ],
    [
      ['UPS', 'Zdroj nepřerušovaného napájení – záloha z baterií a čištění napájení.'],
      ['brownout', 'Dlouhodobý pokles napětí v síti (podpětí).'],
      ['AVR', 'Automatická regulace napětí autotransformátorem v line-interactive UPS.'],
      ['dvojitá konverze', 'Online UPS převádí proud vždy AC → DC → AC, zátěž běží stále z invertoru.'],
      ['účiník (PF)', 'Poměr činného výkonu ve W ke zdánlivému ve VA: W = VA × PF.'],
      ['graceful shutdown', 'Korektní vypnutí serveru na signál z UPS dřív, než dojde baterie.'],
    ],
    [
      ['Který typ UPS má přepínací čas 0 ms?', 'online (dvojitá konverze)', ['offline (standby)', 'line-interactive', 'žádný']],
      ['Co řeší AVR v line-interactive UPS?', 'podpětí a přepětí bez použití baterie', ['úplný výpadek', 'chlazení baterií', 'komunikaci se serverem']],
      ['Kolik W dodá UPS 1000 VA s účiníkem 0,6?', '600 W', ['1000 W', '1600 W', '400 W'], 'W = VA × PF = 1000 × 0,6.'],
      ['Co určuje výdrž baterie UPS?', 'spotřeba zátěže ve wattech', ['údaj ve VA', 'délka kabelu', 'počet zásuvek']],
      ['Výdrž: baterie 12 V, 9 Ah, účinnost 0,9, zátěž 100 W?', 'asi 58 minut', ['asi 6 minut', 'asi 108 minut', 'asi 12 minut'], '(12 × 9 × 0,9) / 100 × 60 = 58,3 min.'],
      ['Co je brownout?', 'dlouhodobé podpětí', ['úplný výpadek', 'krátká napěťová špička', 'elektromagnetický šum']],
      ['Co se v prostředí virtualizace vypíná při slabé baterii jako poslední?', 'hypervizor', ['virtuální počítače', 'databáze ve VM', 'UPS']],
    ],
    [
      {
        q: 'Jaké typy UPS znáš a jak se UPS dimenzuje?',
        answer:
          'UPS chrání proti výpadku (blackout), podpětí (brownout), špičkám a šumu. Offline UPS jede ze sítě a při výpadku přepne na baterii za 5–10 ms, podpětí neřeší. Line-interactive vyrovná podpětí autotransformátorem AVR a přepíná za 2–4 ms – hodí se pro servery a switche. Online UPS s dvojitou konverzí napájí zátěž stále z invertoru, přepnutí je 0 ms a výstup čistá sinusovka. Při dimenzování se hlídá limit VA i W (W = VA × PF) a výdrž se spočítá jako napětí × kapacita × účinnost / zátěž × 60. Server se při slabé baterii korektně vypne (graceful shutdown).',
        points: [
          ['blackout, brownout, špičky', ['blackout', 'brownout', 'špičk']],
          ['offline UPS', ['offline', 'standby']],
          ['line-interactive, AVR', ['line', 'avr']],
          ['online, dvojitá konverze, 0 ms', ['online', 'konverz', '0 ms']],
          ['VA × účiník = W, výdrž', ['va', 'účiník', 'výdrž', 'w']],
        ],
      },
    ],
  ),
  topic(
    19,
    'clustery-praxe',
    'Clustery v praxi – Beowulf, TOP500, HPC',
    'Beowulf (NASA, 1994) ukázal, že superpočítač jde postavit z běžných PC propojených Ethernetem. Nejvýkonnější systémy řadí žebříček TOP500 podle benchmarku HPL ve FLOPS. Clustery slouží pro simulace, Big Data a trénink umělé inteligence na GPU.',
    [
      ['Beowulf cluster', ['1994, NASA (Thomas Sterling, Donald Becker): 16 PC s Intel 486 propojených Ethernetem', 'COTS – běžně dostupný hardware (PC, Raspberry Pi)', 'open source software – Linux/BSD, knihovny MPI, PVM', 'dedikovaná privátní síť LAN', 'master (head) node řídí cluster, compute nodes jen počítají, často bez disku a startují po síti (PXE)']],
      ['TOP500 a exascale', ['žebříček 500 nejvýkonnějších systémů, aktualizace v červnu a listopadu', 'benchmark HPL (High-Performance Linpack), výkon ve FLOPS', 'exascale = více než 10^18 operací za sekundu (1 exaFLOPS), např. Frontier (USA, AMD)', 'spotřeba desítky megawattů – energetickou efektivitu řadí Green500']],
      ['Vědecké simulace', ['předpověď počasí – atmosféra rozdělená na mřížku, jemnější mřížka = přesnější, ale náročnější', 'molekulární modelování, skládání proteinů, testování léků', 'virtuální crash testy a aerodynamika']],
      ['Big Data a AI', ['Apache Hadoop, Apache Spark', 'MapReduce – úloha se rozdělí a zpracuje tam, kde leží data, výsledky se posbírají', 'trénink neuronových sítí (LLM) je násobení matic – GPU clustery s tisíci GPU']],
    ],
    [
      ['Beowulf', 'Cluster z běžných PC propojených Ethernetem s open source softwarem (NASA, 1994).'],
      ['COTS', 'Commodity Off-The-Shelf – běžně dostupný hardware z obchodu.'],
      ['MPI', 'Knihovna pro komunikaci a paralelní výpočty mezi uzly clusteru.'],
      ['TOP500', 'Žebříček 500 nejvýkonnějších počítačových systémů, měřeno benchmarkem HPL.'],
      ['FLOPS', 'Počet operací s plovoucí desetinnou čárkou za sekundu – míra výkonu superpočítačů.'],
      ['MapReduce', 'Princip rozdělení zpracování dat na části, které běží přímo u dat na uzlech.'],
    ],
    [
      ['Z čeho byl postaven první Beowulf cluster?', 'z 16 běžných PC propojených Ethernetem', ['ze speciálních čipů NASA', 'z jednoho sálového počítače', 'z GPU karet']],
      ['Jakým benchmarkem se měří žebříček TOP500?', 'HPL (High-Performance Linpack)', ['3DMark', 'SPEC CPU', 'Geekbench']],
      ['Co znamená exascale?', 'více než 10^18 operací za sekundu', ['10^9 operací za sekundu', '1000 uzlů v clusteru', '1 exabajt paměti']],
      ['Proč se AI trénuje na GPU?', 'trénink je násobení matic, ve kterém jsou GPU efektivnější', ['GPU mají víc RAM než disky', 'CPU neumí počítat s desetinnými čísly', 'GPU jsou levnější než paměť']],
      ['Co dělá master node v Beowulf clusteru?', 'řídí cluster a spouští úlohy', ['jen počítá', 'slouží jako záložní zdroj', 'ukládá zálohy']],
      ['Který žebříček řadí superpočítače podle energetické efektivity?', 'Green500', ['TOP500', 'HPL', 'Exascale500']],
    ],
    [
      {
        q: 'Co je Beowulf cluster a k čemu se clustery v praxi používají?',
        answer:
          'Beowulf vznikl v roce 1994 v NASA: 16 běžných PC s procesory Intel 486 propojených Ethernetem. Používá běžně dostupný hardware (COTS), open source software (Linux, MPI) a privátní síť; master node řídí cluster a compute nodes jen počítají. Nejvýkonnější systémy řadí žebříček TOP500 podle benchmarku HPL ve FLOPS, dnes v éře exascale (např. Frontier). Clustery slouží pro vědecké simulace (počasí, proteiny, crash testy), zpracování Big Data (Hadoop, Spark, MapReduce) a trénink AI na GPU clusterech.',
        points: [
          ['Beowulf – NASA 1994, běžná PC, Ethernet', ['beowulf', 'nasa', 'ethernet']],
          ['COTS, Linux, MPI, master/compute', ['cots', 'mpi', 'master']],
          ['TOP500, HPL, FLOPS, exascale', ['top500', 'flops', 'exa']],
          ['simulace – počasí, medicína', ['počas', 'simul', 'protein']],
          ['Big Data a AI na GPU', ['hadoop', 'spark', 'gpu', 'ai']],
        ],
      },
    ],
  ),
];
