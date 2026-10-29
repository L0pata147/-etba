/**
 * Schémata k tahákům a tématům ze sítí: stavba rámců a hlaviček (Ethernet II, IEEE 802.1Q, IPv4 – RFC 791,
 * IPv6 – RFC 8200, UDP – RFC 768, TCP – RFC 9293), výměna zpráv, tabulky, řetězce kroků, zapojení RJ-45
 * (T568A/B) a rozpis adres na bity. Obsah odpovídá osnovám témat (topics1.ts, topics2.ts).
 */

export interface DiagramField {
  label: string;
  /** Velikost pole (např. „6 B“, „16 b“) */
  size: string;
  /** Šířka v řádku – u hlaviček počet bitů z 32, u rámce poměrná šířka */
  span: number;
  /** Zvýraznit (data / užitečný obsah) */
  data?: boolean;
}

interface Base {
  title: string;
  note?: string;
  /** Přes celou šířku taháku (jinak do sloupce); výchozí u rámců a hlaviček */
  wide?: boolean;
}

export interface FieldDiagram extends Base {
  kind: 'fields';
  /** Hlavička po 32bitových řádcích (true) nebo rámec v jednom pruhu */
  words?: boolean;
  rows: DiagramField[][];
}

export interface FlowDiagram extends Base {
  kind: 'flow';
  left: string;
  right: string;
  /** Zprávy shora dolů; dir „>“ = zleva doprava */
  steps: { dir: '>' | '<'; label: string; note?: string }[];
}

/** Buňka tabulky – text, nebo text s barevným vzorkem (vodič) / zvýrazněním */
export type Cell = string | { text: string; swatch?: string; stripe?: boolean; hl?: boolean };

export interface TableDiagram extends Base {
  kind: 'table';
  headers: string[];
  rows: Cell[][];
}

/** Řetězec kroků / zařízení spojených šipkami */
export interface ChainDiagram extends Base {
  kind: 'chain';
  nodes: { label: string; sub?: string }[];
  /** Popisky šipek mezi uzly (o jeden méně než uzlů) */
  links?: string[];
  /** Šipka z posledního uzlu zpět na začátek (opakování) */
  loop?: string;
}

/** Číslované kroky mezi více stranami */
export interface StepsDiagram extends Base {
  kind: 'steps';
  steps: { from: string; to: string; label: string }[];
}

/** Adresy rozepsané na bity, síťová část zvýrazněná podle prefixu */
export interface BitsDiagram extends Base {
  kind: 'bits';
  prefix: number;
  rows: { label: string; addr: string }[];
}

export type Diagram = FieldDiagram | FlowDiagram | TableDiagram | ChainDiagram | StepsDiagram | BitsDiagram;

// ===== výpočty IPv4 (kvůli přesnosti se příklady počítají, ne opisují) =====

export const ipToInt = (ip: string) => ip.split('.').reduce((a, o) => a * 256 + Number(o), 0);
export const intToIp = (n: number) => [24, 16, 8, 0].map((sh) => Math.floor(n / 2 ** sh) % 256).join('.');
export const prefixMask = (p: number) => intToIp(p === 0 ? 0 : 2 ** 32 - 2 ** (32 - p));

export function subnetInfo(ip: string, prefix: number) {
  const block = 2 ** (32 - prefix);
  const net = Math.floor(ipToInt(ip) / block) * block;
  return { mask: prefixMask(prefix), network: intToIp(net), broadcast: intToIp(net + block - 1), first: intToIp(net + 1), last: intToIp(net + block - 2), hosts: block - 2, block };
}

const f = (label: string, size: string, span: number, data?: boolean): DiagramField => ({ label, size, span, data });

const ETHERNET: FieldDiagram = {
  kind: 'fields',
  title: 'Ethernetový rámec (Ethernet II)',
  rows: [
    [f('Preambule', '7 B', 10), f('SFD', '1 B', 4), f('Cílová MAC', '6 B', 10), f('Zdrojová MAC', '6 B', 10), f('EtherType', '2 B', 7), f('Data (paket)', '46–1500 B', 20, true), f('FCS', '4 B', 6)],
  ],
  note: 'Rámec bez preambule a SFD má 64–1518 B. EtherType: 0x0800 IPv4, 0x86DD IPv6, 0x0806 ARP.',
};

const ENCAPSULATION: FieldDiagram = {
  kind: 'fields',
  title: 'Zapouzdření (L2 → L4)',
  rows: [[f('Ethernet hlavička', 'L2', 9), f('IP hlavička', 'L3 · 20 B', 8), f('TCP/UDP hlavička', 'L4 · 20/8 B', 9), f('Data aplikace', 'L7', 16, true), f('FCS', 'L2', 5)]],
  note: 'Každá vrstva přidá svou hlavičku: segment (L4) → paket (L3) → rámec (L2) → bity (L1).',
};

const DOT1Q: FieldDiagram = {
  kind: 'fields',
  title: 'Rámec s tagem 802.1Q (trunk)',
  rows: [
    [f('Cílová MAC', '6 B', 9), f('Zdrojová MAC', '6 B', 9), f('Tag 802.1Q', '4 B', 9), f('EtherType', '2 B', 6), f('Data', '46–1500 B', 14, true), f('FCS', '4 B', 5)],
    [f('TPID 0x8100', '16 b', 16), f('PCP (priorita)', '3 b', 6), f('DEI', '1 b', 3), f('VLAN ID', '12 b', 12)],
  ],
  note: 'Druhý řádek rozkládá tag: 12bitové VLAN ID → VLAN 1–4094. Tag se vkládá za zdrojovou MAC, rámec je o 4 B delší.',
};

const IPV4: FieldDiagram = {
  kind: 'fields',
  title: 'Hlavička IPv4 (min. 20 B)',
  words: true,
  rows: [
    [f('Verze', '4 b', 4), f('IHL', '4 b', 4), f('DSCP / ECN', '8 b', 8), f('Celková délka', '16 b', 16)],
    [f('Identifikace', '16 b', 16), f('Příznaky', '3 b', 3), f('Offset fragmentu', '13 b', 13)],
    [f('TTL', '8 b', 8), f('Protokol', '8 b', 8), f('Kontrolní součet hlavičky', '16 b', 16)],
    [f('Zdrojová IP adresa', '32 b', 32)],
    [f('Cílová IP adresa', '32 b', 32)],
    [f('Volby (nepovinné)', '0–40 B', 32)],
  ],
  note: 'Protokol: 1 ICMP, 6 TCP, 17 UDP. TTL se na každém routeru sníží o 1, při 0 se paket zahodí.',
};

const IPV6: FieldDiagram = {
  kind: 'fields',
  title: 'Hlavička IPv6 (pevně 40 B)',
  words: true,
  rows: [
    [f('Verze', '4 b', 4), f('Třída provozu', '8 b', 8), f('Značka toku (Flow Label)', '20 b', 20)],
    [f('Délka dat', '16 b', 16), f('Další hlavička', '8 b', 8), f('Hop Limit', '8 b', 8)],
    [f('Zdrojová adresa', '128 b', 32)],
    [f('Cílová adresa', '128 b', 32)],
  ],
  note: 'Bez kontrolního součtu a fragmentace na routerech; Hop Limit nahrazuje TTL.',
};

const UDP: FieldDiagram = {
  kind: 'fields',
  title: 'Hlavička UDP (8 B)',
  words: true,
  rows: [[f('Zdrojový port', '16 b', 16), f('Cílový port', '16 b', 16)], [f('Délka', '16 b', 16), f('Kontrolní součet', '16 b', 16)], [f('Data', '', 32, true)]],
};

const TCP: FieldDiagram = {
  kind: 'fields',
  title: 'Hlavička TCP (min. 20 B)',
  words: true,
  rows: [
    [f('Zdrojový port', '16 b', 16), f('Cílový port', '16 b', 16)],
    [f('Pořadové číslo (SEQ)', '32 b', 32)],
    [f('Číslo potvrzení (ACK)', '32 b', 32)],
    [f('Délka hl.', '4 b', 4), f('Rezerva', '4 b', 4), f('Příznaky', '8 b', 8), f('Velikost okna', '16 b', 16)],
    [f('Kontrolní součet', '16 b', 16), f('Ukazatel naléhavých dat', '16 b', 16)],
    [f('Volby (nepovinné)', '0–40 B', 32)],
  ],
  note: 'Příznaky: CWR, ECE, URG, ACK, PSH, RST, SYN, FIN.',
};

const TCP_FLOW: FlowDiagram = {
  kind: 'flow',
  title: 'Navázání a ukončení spojení TCP',
  left: 'Klient',
  right: 'Server',
  steps: [
    { dir: '>', label: 'SYN', note: 'SEQ = x' },
    { dir: '<', label: 'SYN-ACK', note: 'SEQ = y, ACK = x + 1' },
    { dir: '>', label: 'ACK', note: 'ACK = y + 1 – spojení navázáno' },
    { dir: '>', label: 'FIN' },
    { dir: '<', label: 'ACK' },
    { dir: '<', label: 'FIN' },
    { dir: '>', label: 'ACK', note: 'spojení ukončeno' },
  ],
};

const DHCP_FLOW: FlowDiagram = {
  kind: 'flow',
  title: 'DHCPv4 – DORA',
  left: 'Klient (UDP 68)',
  right: 'Server (UDP 67)',
  steps: [
    { dir: '>', label: 'Discover', note: 'broadcast – hledám DHCP server' },
    { dir: '<', label: 'Offer', note: 'nabídka adresy' },
    { dir: '>', label: 'Request', note: 'žádám o nabízenou adresu' },
    { dir: '<', label: 'Acknowledge', note: 'potvrzení – adresa, maska, brána, DNS, doba pronájmu' },
  ],
};

const ARP_FLOW: FlowDiagram = {
  kind: 'flow',
  title: 'ARP – zjištění MAC adresy',
  left: 'PC A',
  right: 'PC B',
  steps: [
    { dir: '>', label: 'ARP Request', note: 'broadcast FF:FF:FF:FF:FF:FF – kdo má IP B?' },
    { dir: '<', label: 'ARP Reply', note: 'unicast – IP B má MAC …' },
  ],
  note: 'Výsledek se uloží do ARP tabulky (cache).',
};

// ===== 1. Přenos bitů =====

const OSI: TableDiagram = {
  kind: 'table',
  title: 'Model OSI a TCP/IP',
  wide: true,
  headers: ['OSI', 'Vrstva', 'PDU', 'Protokoly a příklady', 'Zařízení', 'TCP/IP'],
  rows: [
    ['7', 'Aplikační', 'data', 'HTTP, DNS, SMTP, SSH', '', { text: 'Aplikační', hl: true }],
    ['6', 'Prezentační', 'data', 'kódování, šifrování (TLS), komprese', '', { text: 'Aplikační', hl: true }],
    ['5', 'Relační', 'data', 'řízení relací', '', { text: 'Aplikační', hl: true }],
    ['4', 'Transportní', 'segment / datagram', 'TCP, UDP, porty', 'firewall', 'Transportní'],
    ['3', 'Síťová', 'paket', 'IP, ICMP, směrování', 'router, L3 switch', { text: 'Internetová', hl: true }],
    ['2', 'Linková', 'rámec', 'Ethernet, MAC, ARP, 802.1Q', 'switch, AP', 'Síťového rozhraní'],
    ['1', 'Fyzická', 'bit', 'kabel, optika, rádio, kódování signálu', 'hub, opakovač, kabel', 'Síťového rozhraní'],
  ],
  note: 'Odesílatel zapouzdřuje shora dolů (každá vrstva přidá hlavičku), příjemce rozbaluje zdola nahoru.',
};

const CSMA_CD: ChainDiagram = {
  kind: 'chain',
  title: 'CSMA/CD (sdílený Ethernet, half-duplex)',
  nodes: [
    { label: 'Naslouchá', sub: 'je médium volné?' },
    { label: 'Vysílá', sub: 'a sleduje kolizi' },
    { label: 'Kolize', sub: 'pošle jam signál' },
    { label: 'Backoff', sub: 'náhodné čekání' },
  ],
  links: ['volno', 'kolize!', ''],
  loop: 'zkusí znovu',
  note: 'Bez kolize se rámec odešle. Wi-Fi používá CSMA/CA – kolizím se vyhýbá (čekání, ACK, RTS/CTS).',
};

// ===== 2. Kabely =====

const W = (c: string, t: string) => ({ text: t, swatch: c, stripe: true });
const C = (c: string, t: string) => ({ text: t, swatch: c });
const RJ45: TableDiagram = {
  kind: 'table',
  title: 'Zapojení RJ-45 – T568A a T568B',
  wide: true,
  headers: ['Pin', '1', '2', '3', '4', '5', '6', '7', '8'],
  rows: [
    [
      'T568A',
      W('#16a34a', 'bílo-zelená'),
      C('#16a34a', 'zelená'),
      W('#f97316', 'bílo-oranžová'),
      C('#2563eb', 'modrá'),
      W('#2563eb', 'bílo-modrá'),
      C('#f97316', 'oranžová'),
      W('#92400e', 'bílo-hnědá'),
      C('#92400e', 'hnědá'),
    ],
    [
      'T568B',
      W('#f97316', 'bílo-oranžová'),
      C('#f97316', 'oranžová'),
      W('#16a34a', 'bílo-zelená'),
      C('#2563eb', 'modrá'),
      W('#2563eb', 'bílo-modrá'),
      C('#16a34a', 'zelená'),
      W('#92400e', 'bílo-hnědá'),
      C('#92400e', 'hnědá'),
    ],
  ],
  note: 'A a B se liší jen prohozeným zeleným a oranžovým párem. Přímý kabel = oba konce stejně, křížený = jeden konec A, druhý B.',
};

const CABLE_USE: TableDiagram = {
  kind: 'table',
  title: 'Který kabel kam',
  headers: ['Kabel', 'Zapojení', 'Použití'],
  rows: [
    ['přímý', 'B – B (nebo A – A)', 'PC ↔ switch, router ↔ switch'],
    ['křížený', 'A – B', 'stejná zařízení: PC ↔ PC, switch ↔ switch (dnes Auto-MDIX)'],
    ['konzolový (rollover)', 'piny obráceně 1↔8', 'PC (COM/USB) ↔ konzolový port Cisco'],
  ],
};

const CABLE_CAT: TableDiagram = {
  kind: 'table',
  title: 'Kategorie a optika',
  headers: ['Médium', 'Rychlost / dosah'],
  rows: [
    ['Cat5e', '1 Gb/s, 100 m'],
    ['Cat6', '1 Gb/s; 10 Gb/s do cca 55 m'],
    ['Cat6a', '10 Gb/s, 100 m'],
    ['multi-mode', 'stovky m, levnější (LED/VCSEL)'],
    ['single-mode', 'desítky km, laser, páteř'],
  ],
};

// ===== 5. IP a ICMP =====

const PING: FlowDiagram = {
  kind: 'flow',
  title: 'ping a traceroute (ICMP)',
  left: 'PC',
  right: 'Routery → cíl',
  steps: [
    { dir: '>', label: 'Echo Request', note: 'typ 8' },
    { dir: '<', label: 'Echo Reply', note: 'typ 0 – cíl dostupný, doba odezvy' },
    { dir: '>', label: 'TTL = 1', note: 'traceroute' },
    { dir: '<', label: 'Time Exceeded', note: 'typ 11 od 1. routeru' },
    { dir: '>', label: 'TTL = 2' },
    { dir: '<', label: 'Time Exceeded', note: 'od 2. routeru … až odpoví cíl' },
  ],
};

// ===== 6. IPv4 =====

const EX = subnetInfo('192.168.1.70', 26);
const IPV4_BITS: BitsDiagram = {
  kind: 'bits',
  title: 'Adresa a maska po bitech – 192.168.1.70/26',
  wide: true,
  prefix: 26,
  rows: [
    { label: 'Adresa', addr: '192.168.1.70' },
    { label: 'Maska /26', addr: EX.mask },
    { label: 'Síť (AND)', addr: EX.network },
    { label: 'Broadcast', addr: EX.broadcast },
  ],
  note: `Zvýrazněná je síťová část (26 b), zbytek je hostitelská část (6 b → 2⁶ − 2 = ${EX.hosts} hostů). Hosté ${EX.first} – ${EX.last}.`,
};

const IPV4_SPECIAL: TableDiagram = {
  kind: 'table',
  title: 'Speciální rozsahy',
  headers: ['Rozsah', 'Význam'],
  rows: [
    ['10.0.0.0/8', 'privátní (RFC 1918)'],
    ['172.16.0.0/12', 'privátní (172.16 – 172.31)'],
    ['192.168.0.0/16', 'privátní'],
    ['127.0.0.0/8', 'loopback'],
    ['169.254.0.0/16', 'APIPA (chybí DHCP)'],
    ['224.0.0.0/4', 'multicast (třída D)'],
  ],
};

// ===== 7. CIDR =====

const CIDR_TABLE: TableDiagram = {
  kind: 'table',
  title: 'Prefixy v posledním oktetu',
  headers: ['Prefix', 'Maska', 'Blok', 'Hostů'],
  rows: [24, 25, 26, 27, 28, 29, 30].map((p) => [`/${p}`, prefixMask(p), String(2 ** (32 - p)), String(2 ** (32 - p) - 2)]),
  note: 'Blok = 256 − hodnota masky v oktetu; sítě začínají na násobcích bloku.',
};

const CIDR_SPLIT: FieldDiagram = {
  kind: 'fields',
  title: '192.168.1.0/24 rozdělená na /26',
  rows: [[0, 64, 128, 192].map((o) => f(`192.168.1.${o}/26`, `hosté .${o + 1} – .${o + 62}, bc .${o + 63}`, 64))],
  note: 'Vypůjčené 2 bity → 2² = 4 podsítě po 2⁶ − 2 = 62 hostech.',
};

// ===== 8. VLSM =====

const VLSM_PLAN = [
  { name: 'LAN A', need: 100, p: 25 },
  { name: 'LAN B', need: 50, p: 26 },
  { name: 'LAN C', need: 20, p: 27 },
  { name: 'spoj 1', need: 2, p: 30 },
  { name: 'spoj 2', need: 2, p: 30 },
];
const vlsmRows = (() => {
  let at = ipToInt('192.168.1.0');
  return VLSM_PLAN.map((x) => {
    const net = intToIp(at);
    const i = subnetInfo(net, x.p);
    at += i.block;
    return { ...x, net, ...i };
  });
})();
const VLSM_TABLE: TableDiagram = {
  kind: 'table',
  title: 'VLSM – 192.168.1.0/24',
  wide: true,
  headers: ['Podsíť', 'Potřeba', 'Prefix', 'Síť', 'Rozsah hostů', 'Broadcast', 'Hostů'],
  rows: vlsmRows.map((r) => [r.name, String(r.need), `/${r.p}`, r.net, `${r.first} – ${r.last}`, r.broadcast, String(r.hosts)]),
  note: `Od největší podsítě, vždy od první volné adresy. Volné zůstává ${intToIp(ipToInt(vlsmRows[vlsmRows.length - 1].broadcast) + 1)} – 192.168.1.255.`,
};
const VLSM_STRIP: FieldDiagram = {
  kind: 'fields',
  title: 'Rozdělení bloku (není v měřítku u spojů)',
  rows: [[...vlsmRows.map((r) => f(r.name, `.${r.net.split('.')[3]}/${r.p}`, Math.max(r.block, 24), r.p < 30)), f('volné', '.232 – .255', 24)]],
};

// ===== 9. IPv6 =====

const IPV6_ADDR: FieldDiagram = {
  kind: 'fields',
  title: 'Struktura globální unicast adresy (typicky)',
  rows: [[f('Globální směrovací prefix (od ISP)', '48 b', 48), f('ID podsítě', '16 b', 16, true), f('ID rozhraní (SLAAC / EUI-64 / ručně)', '64 b', 64)]],
  note: 'Prefix sítě /64 = 48 b + 16 b; ID rozhraní tvoří zbylých 64 b.',
};
const IPV6_SHORT: TableDiagram = {
  kind: 'table',
  title: 'Zkracování zápisu',
  headers: ['Krok', 'Zápis'],
  rows: [
    ['plný', '2001:0db8:0000:0000:0000:ff00:0042:8329'],
    ['bez úvodních nul', '2001:db8:0:0:0:ff00:42:8329'],
    ['nuly jednou → ::', { text: '2001:db8::ff00:42:8329', hl: true }],
  ],
};

// ===== 10. Statické směrování =====

const AD: TableDiagram = {
  kind: 'table',
  title: 'Administrativní vzdálenost',
  headers: ['Zdroj trasy', 'Kód', 'AD'],
  rows: [
    ['přímo připojená', 'C', '0'],
    ['statická', 'S', '1'],
    ['eBGP', 'B', '20'],
    ['EIGRP', 'D', '90'],
    ['OSPF', 'O', '110'],
    ['RIP', 'R', '120'],
    ['iBGP', 'B', '200'],
  ],
  note: 'Nižší AD = důvěryhodnější. Plovoucí statická trasa má AD vyšší než hlavní trasa.',
};
const ROUTE_PICK: ChainDiagram = {
  kind: 'chain',
  title: 'Výběr trasy routerem',
  wide: true,
  nodes: [
    { label: 'Nejdelší shoda prefixu', sub: '/26 má přednost před /24' },
    { label: 'Nejnižší AD', sub: 'když je stejný prefix z více zdrojů' },
    { label: 'Nejnižší metrika', sub: 'v rámci jednoho protokolu' },
  ],
  links: ['remíza', 'remíza'],
  note: 'Když nic nesedí, použije se výchozí trasa 0.0.0.0/0; bez ní se paket zahodí.',
};

// ===== 11. Dynamické směrování =====

const IGP_COMPARE: TableDiagram = {
  kind: 'table',
  title: 'Srovnání směrovacích protokolů',
  wide: true,
  headers: ['', 'RIP', 'EIGRP', 'OSPF', 'BGP'],
  rows: [
    ['typ', 'distance-vector', 'distance-vector (Cisco)', 'link-state', 'path-vector'],
    ['metrika', 'počet skoků (max 15)', 'šířka pásma + zpoždění', 'cost (ref. šířka / šířka linky)', 'atributy, politika (AS_PATH)'],
    ['algoritmus', 'Bellman-Ford', 'DUAL', 'Dijkstra (SPF)', 'výběr podle atributů'],
    ['AD', '120', '90', '110', '20 eBGP / 200 iBGP'],
    ['použití', 'malé sítě', 'sítě s Cisco', 'velké sítě, oblasti', 'mezi AS (internet)'],
  ],
};

// ===== 12. Externí směrování =====

const BGP_CHAIN: ChainDiagram = {
  kind: 'chain',
  title: 'Autonomní systémy a BGP',
  wide: true,
  nodes: [
    { label: 'AS 65001 – firma', sub: 'uvnitř IGP (OSPF), iBGP' },
    { label: 'AS poskytovatele (ISP)', sub: 'tranzit do internetu' },
    { label: 'IXP (NIX.CZ)', sub: 'peering s dalšími sítěmi' },
    { label: 'ostatní AS', sub: 'internet' },
  ],
  links: ['eBGP, TCP 179', 'eBGP', 'eBGP'],
  note: 'AS_PATH nese seznam AS, kterými trasa prošla – router odmítne trasu se svým AS (ochrana proti smyčce).',
};

// ===== 13. UDP a porty =====

const PORT_RANGES: FieldDiagram = {
  kind: 'fields',
  title: 'Rozsahy portů (16 b: 0–65535)',
  rows: [[f('well-known', '0 – 1023', 3), f('registrované', '1024 – 49151', 5), f('dynamické (klient)', '49152 – 65535', 3, true)]],
  note: 'Není v měřítku. Klient si bere dynamický zdrojový port, server naslouchá na známém portu.',
};
const TCP_UDP: TableDiagram = {
  kind: 'table',
  title: 'TCP × UDP',
  headers: ['', 'TCP', 'UDP'],
  rows: [
    ['spojení', 'navazuje (3-way handshake)', 'bez spojení'],
    ['spolehlivost', 'ACK, opakování, pořadí', 'žádná'],
    ['hlavička', 'min. 20 B', '8 B'],
    ['použití', 'web, e-mail, SSH, FTP', 'DNS, DHCP, VoIP, video, hry'],
  ],
};

// ===== 15. Autokonfigurace =====

const SLAAC_FLOW: FlowDiagram = {
  kind: 'flow',
  title: 'IPv6 SLAAC',
  left: 'Host',
  right: 'Router',
  steps: [
    { dir: '>', label: 'Router Solicitation (RS)', note: 'na ff02::2 – všechny routery' },
    { dir: '<', label: 'Router Advertisement (RA)', note: 'prefix /64, brána, příznaky M a O' },
  ],
  note: 'Host si složí adresu: prefix + ID rozhraní (EUI-64 nebo náhodné), pak DAD – Neighbor Solicitation na vlastní adresu.',
};

// ===== 16. DNS =====

const DNS_STEPS: StepsDiagram = {
  kind: 'steps',
  title: 'Překlad www.seznam.cz',
  wide: true,
  steps: [
    { from: 'Klient', to: 'Resolver', label: 'rekurzivní dotaz: jaká je IP www.seznam.cz?' },
    { from: 'Resolver', to: 'Kořenový server „.“', label: 'iterativní dotaz → odkaz na servery domény cz' },
    { from: 'Resolver', to: 'TLD server .cz', label: 'iterativní dotaz → odkaz na autoritativní server seznam.cz' },
    { from: 'Resolver', to: 'Autoritativní server', label: 'odpověď: záznam A (IPv4) / AAAA (IPv6)' },
    { from: 'Resolver', to: 'Klient', label: 'IP adresa; resolver i klient ji uloží do cache na dobu TTL' },
  ],
};
const DNS_RECORDS: TableDiagram = {
  kind: 'table',
  title: 'Typy záznamů',
  headers: ['Záznam', 'Obsah'],
  rows: [
    ['A / AAAA', 'IPv4 / IPv6 adresa'],
    ['CNAME', 'alias na jiné jméno'],
    ['MX', 'poštovní server domény'],
    ['NS', 'jmenný server zóny'],
    ['PTR', 'reverzní překlad IP → jméno'],
    ['SOA', 'hlavní údaje o zóně'],
    ['TXT / SRV', 'text (SPF) / služby (AD)'],
  ],
};

// ===== 17. NAT =====

const NAT_CHAIN: ChainDiagram = {
  kind: 'chain',
  title: 'PAT (NAT overload)',
  wide: true,
  nodes: [
    { label: 'LAN (inside)', sub: 'inside local 192.168.1.x' },
    { label: 'Router s NAT', sub: 'přepíše zdrojovou IP a port' },
    { label: 'Internet (outside)', sub: 'vidí inside global 203.0.113.5' },
  ],
  links: ['odchozí paket', 'přeložený paket'],
};
const NAT_TABLE: TableDiagram = {
  kind: 'table',
  title: 'Tabulka překladů (show ip nat translations)',
  wide: true,
  headers: ['Inside local', 'Inside global', 'Outside global'],
  rows: [
    ['192.168.1.10:51000', '203.0.113.5:51000', '198.51.100.20:443'],
    ['192.168.1.11:51000', { text: '203.0.113.5:51001', hl: true }, '198.51.100.20:443'],
  ],
  note: 'Dva hosté sdílí jednu veřejnou adresu; když se zdrojové porty shodují, router jeden z nich změní. Adresy jsou z rozsahů pro dokumentaci.',
};

// ===== 18. Aplikační služby =====

const MAIL_CHAIN: ChainDiagram = {
  kind: 'chain',
  title: 'Cesta e-mailu',
  wide: true,
  nodes: [
    { label: 'Odesílatel', sub: 'poštovní klient' },
    { label: 'Server odesílatele', sub: 'SMTP' },
    { label: 'Server příjemce', sub: 'najde se přes DNS záznam MX' },
    { label: 'Příjemce', sub: 'poštovní klient' },
  ],
  links: ['SMTP 587', 'SMTP 25', 'IMAP 993 / POP3 995'],
  note: 'SMTP mail odesílá a předává mezi servery, IMAP/POP3 ho stahuje ze schránky (IMAP nechá poštu na serveru).',
};
const PROXY_CHAIN: ChainDiagram = {
  kind: 'chain',
  title: 'Proxy × NAT',
  nodes: [{ label: 'Klient' }, { label: 'Proxy (L7)', sub: 'ukončí spojení, čte data' }, { label: 'Server' }],
  links: ['spojení 1', 'spojení 2'],
  note: 'NAT jen přepisuje adresy a porty (L3/L4) v jednom spojení.',
};

// ===== 19. Wi-Fi =====

const WIFI_STD: TableDiagram = {
  kind: 'table',
  title: 'Standardy IEEE 802.11',
  wide: true,
  headers: ['Standard', 'Označení', 'Pásmo', 'Max. rychlost / novinka'],
  rows: [
    ['802.11b', '', '2,4 GHz', '11 Mb/s'],
    ['802.11a', '', '5 GHz', '54 Mb/s'],
    ['802.11g', '', '2,4 GHz', '54 Mb/s'],
    ['802.11n', 'Wi-Fi 4', '2,4 + 5 GHz', 'MIMO, až 600 Mb/s'],
    ['802.11ac', 'Wi-Fi 5', '5 GHz', 'MU-MIMO, gigabitové rychlosti'],
    ['802.11ax', 'Wi-Fi 6 / 6E', '2,4 + 5 (+ 6) GHz', 'OFDMA, víc zařízení najednou'],
    ['802.11be', 'Wi-Fi 7', '2,4 + 5 + 6 GHz', 'další zrychlení'],
  ],
};
const WIFI_CHANNELS: FieldDiagram = {
  kind: 'fields',
  title: 'Kanály v pásmu 2,4 GHz (zvýrazněné se nepřekrývají)',
  rows: [Array.from({ length: 13 }, (_, i) => f(String(i + 1), '', 1, [1, 6, 11].includes(i + 1)))],
  note: 'Kanály jsou 5 MHz od sebe, ale široké 20 MHz – nepřekrývají se jen 1, 6 a 11.',
};
const WIFI_SEC: TableDiagram = {
  kind: 'table',
  title: 'Zabezpečení Wi-Fi',
  headers: ['', 'Šifrování', 'Stav'],
  rows: [
    ['WEP', 'RC4', { text: 'prolomené', hl: true }],
    ['WPA', 'TKIP', 'zastaralé'],
    ['WPA2', 'AES-CCMP', 'běžné'],
    ['WPA3', 'SAE', 'nejlepší'],
  ],
  note: 'Personal = sdílené heslo (PSK), Enterprise = 802.1X + RADIUS.',
};

// ===== 20. Zabezpečení =====

const ZONES: ChainDiagram = {
  kind: 'chain',
  title: 'Síťové zóny a firewall',
  wide: true,
  nodes: [
    { label: 'Internet', sub: 'nedůvěryhodná zóna' },
    { label: 'Firewall', sub: 'stavový, ACL, NAT' },
    { label: 'DMZ', sub: 'veřejné servery (web, mail)' },
    { label: 'LAN', sub: 'vnitřní síť – zvenku nepřístupná' },
  ],
  links: ['jen vybrané porty', 'do DMZ', 'LAN ven přes NAT'],
};
const L2_ATTACKS: TableDiagram = {
  kind: 'table',
  title: 'Útok → obrana',
  wide: true,
  headers: ['Útok', 'Co dělá', 'Obrana'],
  rows: [
    ['MAC flooding', 'zahltí CAM tabulku switche', 'port security'],
    ['ARP spoofing', 'podvržené ARP → MITM', 'Dynamic ARP Inspection'],
    ['DHCP starvation / falešný DHCP', 'vyčerpá adresy / rozdává špatnou bránu', 'DHCP snooping'],
    ['VLAN hopping', 'DTP, double tagging', 'switchport nonegotiate, nativní VLAN ≠ uživatelská'],
    ['SYN flood', 'polootevřená TCP spojení', 'firewall, SYN cookies'],
    ['brute force', 'zkouší hesla', 'silná hesla, MFA, blokace'],
  ],
};

/** Schémata podle id tématu */
export const TOPIC_DIAGRAMS: Record<string, Diagram[]> = {
  'site-prenos-bitu': [OSI, CSMA_CD],
  'site-kabely': [RJ45, CABLE_USE, CABLE_CAT],
  'site-ramce': [ETHERNET, ENCAPSULATION, ARP_FLOW],
  'site-switching-vlan': [DOT1Q],
  'site-ip-icmp': [IPV4, PING],
  'site-ipv4': [IPV4_BITS, IPV4_SPECIAL],
  'site-cidr': [CIDR_SPLIT, CIDR_TABLE],
  'site-vlsm': [VLSM_TABLE, VLSM_STRIP],
  'site-ipv6': [IPV6, IPV6_ADDR, IPV6_SHORT],
  'site-staticke-smerovani': [ROUTE_PICK, AD],
  'site-dynamicke-smerovani': [IGP_COMPARE],
  'site-externi-smerovani': [BGP_CHAIN],
  'site-udp-porty': [UDP, PORT_RANGES, TCP_UDP],
  'site-tcp': [TCP, TCP_FLOW],
  'site-autokonfigurace': [DHCP_FLOW, SLAAC_FLOW],
  'site-dns': [DNS_STEPS, DNS_RECORDS],
  'site-nat': [NAT_CHAIN, NAT_TABLE],
  'site-aplikacni-sluzby': [MAIL_CHAIN, PROXY_CHAIN],
  'site-wifi': [WIFI_STD, WIFI_CHANNELS, WIFI_SEC],
  'site-zabezpeceni': [ZONES, L2_ATTACKS],
};
