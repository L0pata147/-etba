import { topic } from './helpers';

export const SITE_TOPICS_1 = [
  topic(
    1,
    'prenos-bitu',
    'Přenos bitů, kolize',
    'Fyzická vrstva přenáší jednotlivé bity jako signál po médiu (metalika, optika, rádio). Na sdíleném médiu může dojít ke kolizi – řeší ji metoda CSMA/CD (Ethernet) nebo CSMA/CA (Wi-Fi).',
    [
      ['Fyzická vrstva (L1 modelu OSI)', ['přenáší bity jako elektrický, světelný nebo rádiový signál', 'média: metalický kabel, optické vlákno, bezdrátový přenos', 'kódování signálu (např. NRZ, Manchester), modulace u rádiového přenosu']],
      ['Parametry přenosu', ['přenosová rychlost v bit/s (b/s, Mb/s, Gb/s)', 'šířka pásma (bandwidth) × propustnost (skutečně přenesená data, throughput)', 'latence (zpoždění), útlum signálu, rušení (EMI), přeslechy']],
      ['Režimy komunikace', ['simplex – jen jedním směrem', 'half-duplex – oběma směry, ale ne současně (hub, Wi-Fi)', 'full-duplex – oběma směry současně (switch, moderní Ethernet)']],
      ['Kolize a CSMA/CD', ['kolize = dvě stanice vysílají současně na sdíleném médiu, signály se poškodí', 'CSMA/CD: naslouchá, vysílá, detekuje kolizi, pošle jam signál, čeká náhodnou dobu (backoff) a zkusí znovu', 'kolizní doména = část sítě, kde může dojít ke kolizi; hub ji nerozděluje, switch ano (každý port = vlastní kolizní doména)', 'při full-duplexu kolize nevznikají']],
      ['Bezdrátové sítě – CSMA/CA', ['ve Wi-Fi nelze kolizi spolehlivě detekovat', 'CSMA/CA se kolizím vyhýbá: čekání, potvrzování (ACK), volitelně RTS/CTS']],
    ],
    [
      ['kolize', 'Současné vysílání dvou stanic na sdíleném médiu, při kterém se signály poškodí.'],
      ['CSMA/CD', 'Metoda přístupu k médiu v half-duplex Ethernetu: naslouchání, detekce kolize, jam signál a opakování po náhodné době.'],
      ['CSMA/CA', 'Metoda přístupu k médiu ve Wi-Fi, která se kolizím vyhýbá (čekání, potvrzování, RTS/CTS).'],
      ['kolizní doména', 'Část sítě, ve které spolu mohou kolidovat rámce; switch ji omezuje na jeden port.'],
      ['full-duplex', 'Režim, kdy zařízení vysílá a přijímá současně – kolize nevznikají.'],
      ['propustnost (throughput)', 'Skutečné množství dat přenesených za čas; bývá nižší než šířka pásma.'],
    ],
    [
      ['Které zařízení rozděluje kolizní domény?', 'switch', ['hub', 'repeater', 'kabel s konektorem RJ-45'], 'Každý port switche tvoří samostatnou kolizní doménu; hub a repeater jen opakují signál.'],
      ['Jaká metoda řeší kolize v klasickém (half-duplex) Ethernetu?', 'CSMA/CD', ['CSMA/CA', 'Token passing', 'TDMA'], 'CSMA/CD kolizi detekuje a vysílání opakuje; CSMA/CA se používá ve Wi-Fi.'],
      ['Co udělá stanice po detekci kolize při CSMA/CD?', 'pošle jam signál a počká náhodnou dobu', ['okamžitě vysílá znovu', 'restartuje síťovou kartu', 'pošle ICMP zprávu'], 'Náhodné čekání (backoff) snižuje šanci na opakovanou kolizi.'],
      ['V jakém režimu u Ethernetu kolize nevznikají?', 'full-duplex', ['half-duplex', 'simplex', 'broadcast'], 'Při full-duplexu má každý směr vlastní vodiče a nemůže dojít ke kolizi.'],
      ['Na které vrstvě modelu OSI se přenášejí bity jako signál?', 'fyzické (L1)', ['linkové (L2)', 'síťové (L3)', 'transportní (L4)']],
    ],
    [
      {
        q: 'Vysvětli, proč v moderních přepínaných sítích prakticky nedochází ke kolizím.',
        answer:
          'Switch rozděluje kolizní domény – každý port je samostatná kolizní doména a spojení mezi switchem a stanicí běží ve full-duplexu, takže oba směry mají vlastní vodiče a stanice může vysílat i přijímat současně. Kolize vznikaly na sdíleném médiu (hub, koaxiál) v half-duplexu, kde se používalo CSMA/CD.',
        points: [
          ['switch rozděluje kolizní domény', ['switch', 'kolizní domén']],
          ['full-duplex', ['full', 'duplex']],
          ['kolize na sdíleném médiu / hub', ['sdílen', 'hub', 'koaxi']],
          ['CSMA/CD', ['csma']],
        ],
      },
    ],
  ),
  topic(
    2,
    'kabely',
    'Kabely pro LAN',
    'V lokálních sítích se používá kroucená dvojlinka (UTP/STP) s konektory RJ-45 a optická vlákna (single-mode a multi-mode). Volba kabelu závisí na rychlosti, vzdálenosti a rušení.',
    [
      ['Kroucená dvojlinka', ['4 páry vodičů, kroucení snižuje rušení a přeslechy', 'UTP (nestíněná), STP/FTP (stíněná – do prostředí s rušením)', 'konektor RJ-45 (8P8C), maximální délka segmentu 100 m']],
      ['Kategorie kabelů', ['Cat5e – 1 Gb/s', 'Cat6 – 1 Gb/s, 10 Gb/s na kratší vzdálenost (cca 55 m)', 'Cat6a – 10 Gb/s na 100 m', 'Cat7/Cat8 – vyšší frekvence, stínění, datová centra']],
      ['Zapojení', ['normy T568A a T568B', 'přímý kabel (oba konce stejně) – PC ↔ switch', 'křížený kabel (A na jedné, B na druhé straně) – stejná zařízení; dnes ho nahrazuje Auto-MDIX', 'konzolový (rollover) kabel – správa Cisco zařízení přes konzolový port']],
      ['Optická vlákna', ['přenos světlem – odolná proti elektromagnetickému rušení, velké vzdálenosti a rychlosti', 'single-mode (jednovidové) – laser, desítky km, páteřní spoje', 'multi-mode (mnohovidové) – kratší vzdálenosti (stovky m), levnější', 'konektory LC, SC, ST']],
      ['Strukturovaná kabeláž', ['patch panel, rack, zásuvky, propojovací (patch) kabely', 'značení a dokumentace, testování kabelů']],
    ],
    [
      ['UTP', 'Nestíněná kroucená dvojlinka – nejběžnější kabel v LAN.'],
      ['RJ-45', 'Osmipinový konektor pro kroucenou dvojlinku (8P8C).'],
      ['T568B', 'Norma pořadí vodičů v konektoru RJ-45 (běžná v ČR spolu s T568A).'],
      ['Auto-MDIX', 'Funkce portu, která sama rozpozná typ kabelu – není třeba křížený kabel.'],
      ['single-mode', 'Jednovidové optické vlákno pro velké vzdálenosti, zdrojem světla je laser.'],
      ['multi-mode', 'Mnohovidové optické vlákno pro kratší vzdálenosti.'],
    ],
    [
      ['Jaká je maximální délka segmentu metalického Ethernetu (kroucená dvojlinka)?', '100 m', ['10 m', '500 m', '2 km']],
      ['Který kabel použiješ ke správě Cisco switche přes konzolový port?', 'konzolový (rollover) kabel', ['křížený kabel', 'optický kabel single-mode', 'koaxiální kabel']],
      ['Které médium je odolné proti elektromagnetickému rušení?', 'optické vlákno', ['UTP', 'STP', 'koaxiální kabel'], 'Optika přenáší světlo, ne elektrický signál.'],
      ['Jaká kategorie kabelu zvládne 10 Gb/s na plných 100 m?', 'Cat6a', ['Cat5e', 'Cat5', 'Cat3']],
      ['Který typ optického vlákna se používá na desítky kilometrů?', 'single-mode', ['multi-mode', 'UTP', 'plastové vlákno']],
    ],
    [
      {
        q: 'Porovnej metalickou kroucenou dvojlinku a optické vlákno. Kdy použiješ které?',
        answer:
          'Kroucená dvojlinka je levná, snadno se instaluje a stačí na připojení koncových zařízení do 100 m (Cat5e/6/6a). Je citlivá na rušení – stíněné varianty STP/FTP ho omezují. Optika přenáší světlo, je odolná proti rušení, umožňuje vysoké rychlosti a velké vzdálenosti (multi-mode stovky metrů, single-mode desítky km), ale je dražší. Optiku použiji pro páteřní spoje mezi budovami či patry, dvojlinku pro připojení PC.',
        points: [
          ['dvojlinka do 100 m, levná', ['100', 'levn']],
          ['rušení – optika odolná', ['ruš', 'emi', 'odoln']],
          ['single-mode × multi-mode', ['single', 'multi', 'jednovid', 'mnohovid']],
          ['páteřní spoje × koncová zařízení', ['páteř', 'budov', 'koncov', 'pc']],
        ],
      },
    ],
  ),
  topic(
    3,
    'ramce',
    'Rámce a jejich adresace',
    'Linková vrstva (L2) zapouzdřuje pakety do rámců a doručuje je v rámci lokální sítě pomocí MAC adres. Ethernetový rámec obsahuje cílovou a zdrojovou MAC, typ, data a kontrolní součet FCS.',
    [
      ['Linková vrstva (L2)', ['zapouzdření paketu do rámce, přístup k médiu, detekce chyb', 'podvrstvy LLC a MAC', 'doručení jen v rámci jednoho segmentu (lokální sítě)']],
      ['Ethernetový rámec (Ethernet II)', ['preambule (7 B) a SFD (1 B) – synchronizace', 'cílová MAC (6 B), zdrojová MAC (6 B)', 'EtherType (2 B) – např. 0x0800 IPv4, 0x86DD IPv6, 0x0806 ARP', 'data 46–1500 B (MTU 1500 B), FCS 4 B (CRC – kontrola chyb)', 'velikost rámce 64–1518 B; s tagem 802.1Q o 4 B víc']],
      ['MAC adresa', ['48 bitů, zapisuje se hexadecimálně (např. 00:1A:2B:3C:4D:5E)', 'první polovina OUI – identifikuje výrobce', 'unicast, multicast, broadcast FF:FF:FF:FF:FF:FF']],
      ['ARP', ['zjišťuje MAC adresu k známé IPv4 adrese v lokální síti', 'ARP request jako broadcast, ARP reply jako unicast', 'ARP tabulka (cache); v IPv6 tuto funkci plní NDP']],
    ],
    [
      ['MAC adresa', '48bitová fyzická adresa síťového rozhraní.'],
      ['OUI', 'Prvních 24 bitů MAC adresy – identifikátor výrobce.'],
      ['FCS', 'Kontrolní součet na konci rámce (CRC) pro zjištění chyb přenosu.'],
      ['MTU', 'Maximální velikost dat v rámci; u Ethernetu 1500 B.'],
      ['ARP', 'Protokol, který k IPv4 adrese zjistí MAC adresu.'],
      ['EtherType', 'Pole rámce určující protokol vyšší vrstvy (např. 0x0800 = IPv4).'],
    ],
    [
      ['Kolik bitů má MAC adresa?', '48', ['32', '64', '128']],
      ['Jaká je broadcastová MAC adresa?', 'FF:FF:FF:FF:FF:FF', ['00:00:00:00:00:00', '01:00:5E:00:00:01', '255.255.255.255']],
      ['K čemu slouží protokol ARP?', 'zjistí MAC adresu k IPv4 adrese', ['přidělí IP adresu', 'přeloží doménové jméno na IP', 'zjistí IP adresu k MAC adrese routeru na internetu']],
      ['Co je MTU běžného Ethernetu?', '1500 B', ['64 B', '9000 B', '65 535 B']],
      ['Která část rámce slouží ke kontrole chyb?', 'FCS', ['preambule', 'EtherType', 'SFD']],
    ],
    [
      {
        q: 'Popiš, co se stane, když PC odesílá paket na jiné PC ve stejné síti a nezná jeho MAC adresu.',
        answer:
          'PC se podívá do ARP tabulky. Když MAC nezná, pošle ARP request jako broadcast (cílová MAC FF:FF:FF:FF:FF:FF) s dotazem, kdo má danou IP adresu. Cílové PC odpoví unicastem ARP reply se svou MAC adresou. Odesílatel si ji uloží do ARP cache a zapouzdří paket do ethernetového rámce s cílovou MAC příjemce. Pokud by byl cíl v jiné síti, zjistí se MAC adresa výchozí brány.',
        points: [
          ['ARP tabulka / cache', ['tabul', 'cache']],
          ['ARP request jako broadcast', ['request', 'broadcast']],
          ['ARP reply jako unicast', ['reply', 'unicast', 'odpov']],
          ['rámec s cílovou MAC', ['rámec', 'mac']],
          ['jiná síť → MAC brány', ['bran', 'gateway']],
        ],
      },
    ],
  ),
  topic(
    4,
    'switching-vlan',
    'Switching a VLAN',
    'Switch přepíná rámce podle MAC adres, které se učí do MAC tabulky. VLAN logicky dělí jeden fyzický switch na více oddělených sítí (broadcastových domén); mezi switchi je přenáší trunk s tagy 802.1Q.',
    [
      ['Činnost switche', ['učí se zdrojové MAC adresy do MAC (CAM) tabulky k portům', 'rámec pošle jen na port s cílovou MAC', 'neznámý cíl nebo broadcast → zaplavení (flooding) všech portů kromě příchozího', 'metody: store-and-forward (kontroluje FCS), cut-through, fragment-free']],
      ['VLAN', ['logické rozdělení sítě – každá VLAN je samostatná broadcastová doména', 'výhody: bezpečnost, menší broadcastový provoz, organizace podle oddělení', 'výchozí VLAN 1; VLAN ID 1–4094']],
      ['Access a trunk porty', ['access port – patří do jedné VLAN (připojení PC)', 'trunk – přenáší více VLAN mezi switchi/routerem, rámce označuje tag 802.1Q (4 B, 12bitové VLAN ID)', 'nativní VLAN – netagovaný provoz na trunku (výchozí VLAN 1, kvůli bezpečnosti se mění)']],
      ['Komunikace mezi VLAN', ['vyžaduje směrování na L3', 'router-on-a-stick: podrozhraní routeru s encapsulation dot1Q', 'L3 switch: SVI (interface vlan X) a ip routing']],
      ['Spanning Tree (STP)', ['zabraňuje smyčkám v redundantní L2 síti', 'volba root bridge, některé porty se zablokují', 'varianty RSTP, PVST+']],
    ],
    [
      ['MAC tabulka', 'Tabulka switche, která přiřazuje MAC adresy k portům.'],
      ['VLAN', 'Virtuální LAN – logicky oddělená síť (broadcastová doména) na společné infrastruktuře.'],
      ['trunk', 'Spoj, který přenáší rámce více VLAN označené tagem 802.1Q.'],
      ['802.1Q', 'Standard označování (tagování) rámců číslem VLAN.'],
      ['nativní VLAN', 'VLAN, jejíž rámce jdou po trunku bez tagu.'],
      ['router-on-a-stick', 'Směrování mezi VLAN přes jedno fyzické rozhraní routeru s podrozhraními.'],
      ['STP', 'Spanning Tree Protocol – zabraňuje smyčkám na L2.'],
    ],
    [
      ['Co udělá switch s rámcem, jehož cílovou MAC nezná?', 'pošle ho na všechny porty kromě příchozího', ['zahodí ho', 'pošle ho výchozí bráně', 'pošle zpět odesílateli'], 'Tomu se říká flooding (zaplavení).'],
      ['Podle jaké adresy si switch plní MAC tabulku?', 'podle zdrojové MAC adresy', ['podle cílové MAC adresy', 'podle zdrojové IP adresy', 'podle VLAN ID']],
      ['Jaký standard se používá pro tagování rámců na trunku?', '802.1Q', ['802.11', '802.3af', '802.1X']],
      ['Co je potřeba, aby spolu komunikovala zařízení ze dvou různých VLAN?', 'směrování (router nebo L3 switch)', ['stačí trunk', 'stejná nativní VLAN', 'vypnout STP']],
      ['K čemu slouží STP?', 'zabraňuje smyčkám v L2 síti', ['přiděluje VLAN', 'šifruje provoz', 'přiděluje IP adresy']],
      ['Kolik bitů má VLAN ID?', '12', ['8', '16', '24']],
    ],
    [
      {
        q: 'Vysvětli, proč se sítě dělí do VLAN a jak spolu mohou VLAN komunikovat.',
        answer:
          'VLAN dělí jeden fyzický switch (nebo síť switchů) na více logických sítí – broadcastových domén. Tím se zmenší broadcastový provoz, zvýší bezpečnost (oddělení oddělení firmy, hostů, serverů) a síť se snáz spravuje. Porty jsou access (jedna VLAN) nebo trunk (více VLAN s tagem 802.1Q). VLAN spolu na L2 nekomunikují – je potřeba směrování: router-on-a-stick s podrozhraními (encapsulation dot1Q) nebo L3 switch s rozhraními SVI.',
        points: [
          ['broadcastová doména', ['broadcast']],
          ['bezpečnost a správa', ['bezpečn', 'oddělen', 'správ']],
          ['access a trunk, 802.1Q', ['access', 'trunk', '802']],
          ['směrování mezi VLAN (router-on-a-stick / L3 switch)', ['router', 'směrov', 'l3', 'svi']],
        ],
      },
    ],
  ),
  topic(
    5,
    'ip-icmp',
    'Protokoly IP a ICMP',
    'IP (síťová vrstva L3) doručuje pakety mezi sítěmi na základě IP adres – nespojovaně a bez záruky doručení. ICMP slouží k diagnostice a hlášení chyb (ping, traceroute, nedosažitelný cíl).',
    [
      ['Protokol IP', ['síťová vrstva (L3), logické adresování a směrování mezi sítěmi', 'nespojovaný, „best effort“ – nezaručuje doručení ani pořadí (to řeší TCP)', 'verze IPv4 (32 b) a IPv6 (128 b)']],
      ['Hlavička IPv4', ['min. 20 B: verze, délka hlavičky, DSCP (QoS), celková délka', 'identifikace, příznaky a offset – fragmentace', 'TTL – snižuje se na každém routeru, při 0 se paket zahodí (ochrana proti smyčkám)', 'protokol (1 ICMP, 6 TCP, 17 UDP), kontrolní součet hlavičky, zdrojová a cílová IP']],
      ['IPv6 hlavička', ['pevná délka 40 B, jednodušší', 'Hop Limit místo TTL, Flow Label', 'routery nefragmentují – fragmentuje jen odesílatel']],
      ['ICMP', ['hlášení chyb a diagnostika, zapouzdřen v IP', 'Echo Request (typ 8) / Echo Reply (typ 0) – ping', 'Destination Unreachable (typ 3), Time Exceeded (typ 11) – využívá traceroute', 'ICMPv6 navíc obsahuje NDP (RS, RA, NS, NA)']],
      ['Diagnostika', ['ping – dostupnost a doba odezvy', 'traceroute/tracert – cesta přes routery (postupně zvyšuje TTL)']],
    ],
    [
      ['TTL', 'Time To Live – počet routerů, přes které může paket projít; při 0 se zahodí.'],
      ['ICMP', 'Protokol pro hlášení chyb a diagnostiku sítě (ping, traceroute).'],
      ['fragmentace', 'Rozdělení paketu na menší části, pokud je větší než MTU.'],
      ['best effort', 'Doručení „bez záruky“ – IP nezaručuje doručení ani pořadí.'],
      ['traceroute', 'Nástroj, který zjistí cestu paketu přes routery pomocí zvyšování TTL.'],
    ],
    [
      ['Jaký typ ICMP zprávy posílá příkaz ping?', 'Echo Request', ['Time Exceeded', 'Redirect', 'Router Advertisement']],
      ['Co se stane s paketem, když TTL klesne na 0?', 'router ho zahodí a pošle ICMP Time Exceeded', ['router ho pošle zpět', 'TTL se nastaví znovu na 64', 'paket se rozfragmentuje']],
      ['Jaké číslo protokolu má v IPv4 hlavičce TCP?', '6', ['1', '17', '80'], '1 = ICMP, 6 = TCP, 17 = UDP.'],
      ['Jak velká je pevná hlavička IPv6?', '40 B', ['20 B', '60 B', '128 B']],
      ['Zaručuje IP doručení paketů?', 'ne, je to „best effort“ protokol', ['ano, vždy', 'ano, pomocí potvrzení ACK', 'jen v IPv6']],
    ],
    [
      {
        q: 'Jak funguje traceroute a proč k tomu využívá TTL?',
        answer:
          'Traceroute posílá pakety s postupně rostoucím TTL (1, 2, 3…). Každý router TTL sníží o 1; když klesne na 0, paket zahodí a pošle odesílateli ICMP Time Exceeded. Z adres těchto odpovědí se postupně sestaví cesta přes jednotlivé routery až k cíli, který odpoví (např. Echo Reply). Zároveň se měří doba odezvy každého skoku.',
        points: [
          ['postupně rostoucí TTL', ['ttl', 'rost', 'zvyš']],
          ['router sníží TTL a při 0 zahodí', ['sníž', 'zahod', '0']],
          ['ICMP Time Exceeded', ['exceeded', 'icmp']],
          ['sestavení cesty přes routery', ['cest', 'router', 'skok']],
        ],
      },
    ],
  ),
  topic(
    6,
    'ipv4',
    'Adresace IPv4',
    'IPv4 adresa má 32 bitů a skládá se ze síťové a hostitelské části, které odděluje maska. Z adresy a masky se určí adresa sítě, broadcast a počet použitelných adres; existují privátní a speciální rozsahy.',
    [
      ['Struktura adresy', ['32 bitů, 4 oktety v desítkovém zápisu (192.168.1.10)', 'maska sítě (255.255.255.0 = /24) určuje síťovou a hostitelskou část', 'adresa sítě (všechny hostitelské bity 0), broadcast (všechny 1)', 'počet hostů = 2^n − 2 (n = počet hostitelských bitů)']],
      ['Třídy (historicky)', ['A: 1–126, maska /8', 'B: 128–191, /16', 'C: 192–223, /24', 'D: 224–239 multicast, E: 240–255 rezerva']],
      ['Privátní a speciální adresy', ['privátní (RFC 1918): 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 – nesměrují se do internetu, vyžadují NAT', 'loopback 127.0.0.0/8 (127.0.0.1)', 'APIPA 169.254.0.0/16 – automatická adresa, když chybí DHCP', '0.0.0.0 – neurčená/výchozí trasa, 255.255.255.255 – omezený broadcast']],
      ['Typy komunikace a brána', ['unicast, broadcast, multicast', 'výchozí brána – router, přes který host posílá provoz do jiných sítí', 'host porovná cílovou adresu s maskou: stejná síť → přímo, jinak → brána']],
    ],
    [
      ['maska sítě', 'Určuje, které bity IP adresy patří síti a které hostiteli.'],
      ['adresa sítě', 'Adresa, ve které jsou všechny hostitelské bity nulové; nelze ji přidělit hostiteli.'],
      ['broadcastová adresa', 'Adresa se všemi hostitelskými bity jedničkovými – pro všechny v síti.'],
      ['privátní adresa', 'Adresa z rozsahů RFC 1918, která se nesměruje v internetu.'],
      ['výchozí brána', 'Router, kterému host posílá pakety do cizích sítí.'],
      ['APIPA', 'Automatická adresa 169.254.x.x, když se nepodaří získat adresu z DHCP.'],
    ],
    [
      ['Kolik použitelných adres hostů má síť /24?', '254', ['256', '255', '512'], '2^8 − 2 = 254 (adresa sítě a broadcast se nepřidělují).'],
      ['Která adresa je privátní?', '172.20.5.1', ['172.32.0.1', '8.8.8.8', '192.169.1.1'], 'Privátní rozsah 172.16.0.0/12 končí na 172.31.255.255.'],
      ['Jaká je broadcastová adresa sítě 192.168.10.0/24?', '192.168.10.255', ['192.168.10.0', '192.168.255.255', '255.255.255.0']],
      ['Co znamená adresa 169.254.12.7 na PC?', 'PC nedostalo adresu z DHCP (APIPA)', ['PC má veřejnou adresu', 'jde o loopback', 'jde o adresu výchozí brány']],
      ['Jak se zapíše maska 255.255.255.0 prefixem?', '/24', ['/8', '/16', '/32']],
    ],
    [
      {
        q: 'Jak host pozná, zda je cíl ve stejné síti, a co udělá v obou případech?',
        answer:
          'Host provede logický součin (AND) své IP adresy s maskou a stejně tak cílové adresy. Když vyjde stejná adresa sítě, je cíl v lokální síti a host zjistí jeho MAC pomocí ARP a pošle rámec přímo. Když se sítě liší, pošle paket výchozí bráně – zjistí MAC adresu brány a rámec adresuje jí; IP adresa cíle v paketu zůstává.',
        points: [
          ['AND s maskou / porovnání adresy sítě', ['and', 'mask', 'součin', 'porovn']],
          ['stejná síť → ARP a přímé doručení', ['arp', 'přímo']],
          ['jiná síť → výchozí brána', ['bran', 'gateway', 'router']],
          ['cílová IP se nemění, mění se MAC', ['mac']],
        ],
      },
    ],
  ),
  topic(
    7,
    'cidr',
    'Beztřídní adresace IPv4',
    'Beztřídní adresace (CIDR) nahradila pevné třídy A/B/C – délka síťové části se určuje prefixem /n. Umožňuje dělení sítí na podsítě (subnetting) a sdružování sítí (sumarizace).',
    [
      ['Proč CIDR', ['třídy plýtvaly adresami (síť třídy B = 65 534 hostů)', 'CIDR: libovolná délka prefixu /0–/32', 'efektivnější přidělování adres a menší směrovací tabulky']],
      ['Subnetting (dělení na podsítě)', ['výpůjčka bitů z hostitelské části', 'počet podsítí = 2^s (s = vypůjčené bity)', 'počet hostů v podsíti = 2^h − 2', 'příklad: 192.168.1.0/24 → /26 = 4 podsítě po 62 hostech (.0, .64, .128, .192)']],
      ['Postup výpočtu', ['z prefixu určím masku a „velikost bloku“ (256 − hodnota masky v daném oktetu)', 'adresa sítě = násobek bloku, broadcast = další síť − 1', 'první host = síť + 1, poslední = broadcast − 1']],
      ['Sumarizace (supernetting)', ['sdružení více souvislých sítí do jedné trasy', 'např. 192.168.0.0/24 – 192.168.3.0/24 → 192.168.0.0/22', 'zmenšuje směrovací tabulky']],
    ],
    [
      ['CIDR', 'Classless Inter-Domain Routing – beztřídní adresace s prefixem /n.'],
      ['prefix', 'Počet bitů síťové části adresy (např. /26).'],
      ['subnetting', 'Dělení sítě na menší podsítě výpůjčkou hostitelských bitů.'],
      ['sumarizace', 'Sloučení více sítí do jedné souhrnné trasy (supernet).'],
      ['wildcard maska', 'Inverzní maska (např. 0.0.0.255) používaná v ACL a OSPF.'],
    ],
    [
      ['Kolik hostů má podsíť /26?', '62', ['64', '30', '126']],
      ['Jaká je maska pro prefix /27?', '255.255.255.224', ['255.255.255.192', '255.255.255.240', '255.255.255.248']],
      ['Do které podsítě patří adresa 192.168.1.100/26?', '192.168.1.64', ['192.168.1.0', '192.168.1.96', '192.168.1.128']],
      ['Jaká souhrnná trasa pokryje sítě 10.1.0.0/24 až 10.1.3.0/24?', '10.1.0.0/22', ['10.1.0.0/23', '10.1.0.0/16', '10.0.0.0/8']],
      ['Na kolik podsítí rozdělíš /24, když si půjčíš 3 bity?', '8', ['3', '6', '16']],
    ],
    [
      {
        q: 'Rozděl síť 192.168.10.0/24 na 4 stejně velké podsítě a popiš postup.',
        answer:
          'Pro 4 podsítě potřebuji vypůjčit 2 bity (2^2 = 4), prefix bude /26, maska 255.255.255.192. Velikost bloku je 256 − 192 = 64. Podsítě: 192.168.10.0/26 (hosté .1–.62, broadcast .63), 192.168.10.64/26 (.65–.126, broadcast .127), 192.168.10.128/26 (.129–.190, broadcast .191), 192.168.10.192/26 (.193–.254, broadcast .255). Každá má 62 použitelných adres.',
        points: [
          ['2 vypůjčené bity, /26', ['26', '2 bit', 'vypůjč']],
          ['maska 255.255.255.192', ['192']],
          ['blok 64', ['64']],
          ['62 hostů', ['62']],
          ['broadcasty .63/.127/.191/.255', ['63', '127', '191']],
        ],
      },
    ],
  ),
  topic(
    8,
    'vlsm',
    'VLSM',
    'VLSM (Variable Length Subnet Mask) umožňuje v jedné síti použít podsítě různé velikosti podle počtu hostů. Šetří adresy – např. spoj mezi routery dostane /30 místo celé /24.',
    [
      ['Princip', ['podsítě s různou maskou v rámci jednoho adresního bloku', 'každá podsíť má jen tolik adres, kolik potřebuje', 'vyžaduje beztřídní směrovací protokol (OSPF, EIGRP, RIPv2) nebo statické trasy']],
      ['Postup návrhu', ['seřadit požadavky od největšího počtu hostů', 'pro každou zvolit nejmenší prefix, kde 2^h − 2 ≥ počet hostů', 'přidělovat postupně od začátku bloku – vždy od první volné adresy (zarovnané na velikost bloku)', 'nakonec spoje mezi routery (/30 = 2 hosté, případně /31)']],
      ['Příklad', ['blok 192.168.1.0/24, LAN A 100 hostů, LAN B 50, LAN C 20, 2 spoje', 'A: 192.168.1.0/25 (126 hostů), B: .128/26 (62), C: .192/27 (30)', 'spoje: .224/30 a .228/30']],
      ['Výhody a souvislosti', ['úspora adres (důležité kvůli nedostatku IPv4)', 'lepší sumarizace v hierarchické síti', 'nutná pečlivá dokumentace adresního plánu']],
    ],
    [
      ['VLSM', 'Variable Length Subnet Mask – podsítě různé velikosti v jedné síti.'],
      ['/30', 'Podsíť se 2 použitelnými adresami – typicky spoj mezi dvěma routery.'],
      ['adresní plán', 'Dokumentace přidělení podsítí a adres v síti.'],
    ],
    [
      ['Jaký prefix je nejmenší vhodný pro LAN se 100 hosty?', '/25', ['/24', '/26', '/27'], '/25 má 126 hostů, /26 jen 62.'],
      ['Jaký prefix se typicky použije na spoj mezi dvěma routery?', '/30', ['/24', '/28', '/16']],
      ['Od čeho se začíná při návrhu VLSM?', 'od podsítě s největším počtem hostů', ['od spojů mezi routery', 'od nejmenší podsítě', 'na pořadí nezáleží']],
      ['Který směrovací protokol nepodporuje VLSM?', 'RIPv1', ['OSPF', 'EIGRP', 'RIPv2'], 'RIPv1 je třídní – neposílá masky.'],
      ['Kolik hostů má podsíť /28?', '14', ['16', '30', '6']],
    ],
    [
      {
        q: 'Navrhni VLSM pro blok 10.0.0.0/24: LAN1 60 hostů, LAN2 25 hostů, spoj mezi routery.',
        answer:
          'Seřadím od největší. LAN1 60 hostů → /26 (62 hostů): 10.0.0.0/26, hosté .1–.62, broadcast .63. LAN2 25 hostů → /27 (30 hostů): 10.0.0.64/27, hosté .65–.94, broadcast .95. Spoj → /30: 10.0.0.96/30, adresy .97 a .98, broadcast .99. Zbytek bloku (od 10.0.0.100) zůstává volný pro další růst.',
        points: [
          ['seřadit od největší', ['seřad', 'největ']],
          ['LAN1 /26', ['26']],
          ['LAN2 /27 od .64', ['27', '64']],
          ['spoj /30 od .96', ['30', '96']],
        ],
      },
    ],
  ),
  topic(
    9,
    'ipv6',
    'Adresace IPv6',
    'IPv6 adresa má 128 bitů zapsaných v osmi hexadecimálních skupinách. Řeší nedostatek IPv4 adres, nemá broadcast a každé rozhraní má i link-local adresu. Adresy se zkracují vynecháním úvodních nul a jednou použitým „::“.',
    [
      ['Zápis a zkracování', ['128 bitů, 8 skupin po 16 bitech (4 hex číslice) oddělených „:“', 'vynechání úvodních nul ve skupině (0db8 → db8)', 'nejdelší souvislou řadu nulových skupin lze jednou nahradit „::“', 'prefix sítě zápisem /64 (64 b síť + 64 b identifikátor rozhraní)']],
      ['Typy adres', ['global unicast – veřejné, 2000::/3', 'link-local – fe80::/10, jen v rámci segmentu, má ji každé rozhraní', 'unique local – fc00::/7 (obdoba privátních)', 'multicast – ff00::/8 (např. ff02::1 všechny uzly), anycast', 'loopback ::1, neurčená ::', 'broadcast neexistuje']],
      ['Identifikátor rozhraní', ['ruční konfigurace, SLAAC s EUI-64 (z MAC + FFFE, invertuje se 7. bit) nebo náhodný', 'DHCPv6']],
      ['Přechod z IPv4', ['dual stack – IPv4 i IPv6 současně', 'tunelování (IPv6 v IPv4)', 'překlad NAT64/DNS64']],
    ],
    [
      ['link-local adresa', 'IPv6 adresa fe80::/10 platná jen v lokálním segmentu; má ji každé rozhraní.'],
      ['global unicast', 'Veřejná směrovatelná IPv6 adresa (2000::/3).'],
      ['EUI-64', 'Vytvoření identifikátoru rozhraní z MAC adresy vložením FFFE.'],
      ['dual stack', 'Současný provoz IPv4 i IPv6 na zařízení.'],
      ['::', 'Zkrácený zápis nejdelší řady nulových skupin; v adrese jen jednou.'],
    ],
    [
      ['Kolik bitů má IPv6 adresa?', '128', ['32', '64', '256']],
      ['Jak se správně zkrátí 2001:0db8:0000:0000:0000:0000:0000:0001?', '2001:db8::1', ['2001:db8:0:1', '2001:db8::0001::', '21:db8::1']],
      ['Jakým prefixem začínají link-local adresy?', 'fe80::/10', ['2000::/3', 'ff00::/8', 'fc00::/7']],
      ['Který typ komunikace IPv6 nemá?', 'broadcast', ['multicast', 'unicast', 'anycast']],
      ['Jaká je loopback adresa v IPv6?', '::1', ['127.0.0.1', 'fe80::1', 'ff02::1']],
      ['Kolikrát smí být v IPv6 adrese použito „::“?', 'jednou', ['dvakrát', 'libovolněkrát', 'vůbec, je to chyba']],
    ],
    [
      {
        q: 'Jaké jsou hlavní rozdíly mezi IPv4 a IPv6?',
        answer:
          'IPv6 má 128bitové adresy (IPv4 32 bitů), zapisují se hexadecimálně. Nemá broadcast – nahrazuje ho multicast. Každé rozhraní má link-local adresu a umí se samo nakonfigurovat (SLAAC). Hlavička má pevných 40 B a je jednodušší, routery nefragmentují. Díky velkému prostoru adres není potřeba NAT. ARP nahrazuje NDP (ICMPv6).',
        points: [
          ['128 × 32 bitů', ['128', '32']],
          ['bez broadcastu, multicast', ['broadcast', 'multicast']],
          ['SLAAC / link-local', ['slaac', 'link']],
          ['bez NAT', ['nat']],
          ['NDP místo ARP / jednodušší hlavička', ['ndp', 'hlavič', 'arp']],
        ],
      },
    ],
  ),
  topic(
    10,
    'staticke-smerovani',
    'Statické interní směrování',
    'Router rozhoduje o cestě paketu podle směrovací tabulky. Statické trasy zadává správce ručně – jsou jednoduché a bezpečné, ale nehodí se pro velké a měnící se sítě.',
    [
      ['Směrovací tabulka', ['přímo připojené sítě (C) a lokální adresy (L)', 'statické (S) a dynamické trasy (O – OSPF, D – EIGRP, R – RIP)', 'výběr cesty: nejdelší shoda prefixu, pak administrativní vzdálenost, pak metrika']],
      ['Statická trasa', ['ip route <síť> <maska> <next-hop | výstupní rozhraní>', 'výchozí trasa 0.0.0.0 0.0.0.0 – pro vše, co není v tabulce (typicky do internetu)', 'plovoucí statická trasa – vyšší administrativní vzdálenost, záloha jiné trasy', 'souhrnná statická trasa']],
      ['Administrativní vzdálenost (AD)', ['důvěryhodnost zdroje trasy: přímo připojená 0, statická 1', 'EIGRP 90, OSPF 110, RIP 120, eBGP 20', 'nižší AD = preferovaná trasa']],
      ['Výhody a nevýhody', ['+ žádná režie, předvídatelné, bezpečné', '− ruční správa, při změně topologie se samo nepřizpůsobí, neškáluje', 'vhodné pro malé sítě a koncové (stub) sítě']],
    ],
    [
      ['směrovací tabulka', 'Seznam známých sítí a cest k nim na routeru.'],
      ['statická trasa', 'Ručně zadaná cesta k síti.'],
      ['výchozí trasa', 'Trasa 0.0.0.0/0 pro všechny neznámé cíle.'],
      ['next-hop', 'IP adresa dalšího routeru na cestě.'],
      ['administrativní vzdálenost', 'Číslo vyjadřující důvěryhodnost zdroje trasy; nižší má přednost.'],
      ['plovoucí statická trasa', 'Záložní statická trasa s vyšší administrativní vzdáleností.'],
    ],
    [
      ['Jakou administrativní vzdálenost má statická trasa?', '1', ['0', '110', '120']],
      ['Jak se na Cisco routeru zapíše výchozí trasa přes 10.0.0.1?', 'ip route 0.0.0.0 0.0.0.0 10.0.0.1', ['ip default 10.0.0.1', 'route add default 10.0.0.1', 'ip route 10.0.0.1 0.0.0.0']],
      ['Podle čeho router vybere trasu, když se cíl shoduje s více trasami?', 'podle nejdelší shody prefixu', ['podle nejnižší metriky', 'podle pořadí v tabulce', 'náhodně']],
      ['Co označuje v tabulce Cisco routeru písmeno C?', 'přímo připojenou síť', ['statickou trasu', 'OSPF', 'výchozí trasu']],
      ['K čemu je plovoucí statická trasa?', 'jako záloha, platí jen při výpadku hlavní trasy', ['k vyrovnávání zátěže', 'k šifrování provozu', 'k překladu adres']],
    ],
    [
      {
        q: 'Kdy je vhodné statické směrování a jaké má nevýhody oproti dynamickému?',
        answer:
          'Statické směrování se hodí pro malé a stabilní sítě, koncové (stub) sítě s jedinou cestou ven a pro výchozí trasu do internetu. Nemá režii (neposílá aktualizace), je předvídatelné a bezpečné. Nevýhodou je ruční správa – při změně topologie nebo výpadku linky se samo nepřizpůsobí (lze částečně řešit plovoucí statickou trasou) a ve velké síti je nepřehledné a náchylné k chybám.',
        points: [
          ['malé / stub sítě, výchozí trasa', ['mal', 'stub', 'výchoz']],
          ['bez režie, bezpečné', ['režie', 'bezpeč']],
          ['ruční správa', ['ruč']],
          ['nereaguje na změny / výpadky', ['změn', 'výpad']],
        ],
      },
    ],
  ),
];
