/**
 * Schémata k tahákům ze sítí: stavba rámců a hlaviček (Ethernet II, IEEE 802.1Q, IPv4 – RFC 791,
 * IPv6 – RFC 8200, UDP – RFC 768, TCP – RFC 9293) a průběh výměny zpráv (TCP, DHCP, ARP).
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

export interface FieldDiagram {
  kind: 'fields';
  title: string;
  /** Hlavička po 32bitových řádcích (true) nebo rámec v jednom pruhu */
  words?: boolean;
  rows: DiagramField[][];
  note?: string;
}

export interface FlowDiagram {
  kind: 'flow';
  title: string;
  left: string;
  right: string;
  /** Zprávy shora dolů; dir „>“ = zleva doprava */
  steps: { dir: '>' | '<'; label: string; note?: string }[];
  note?: string;
}

export type Diagram = FieldDiagram | FlowDiagram;

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

/** Schémata podle id tématu */
export const TOPIC_DIAGRAMS: Record<string, Diagram[]> = {
  'site-ramce': [ETHERNET, ENCAPSULATION, ARP_FLOW],
  'site-switching-vlan': [DOT1Q],
  'site-ip-icmp': [IPV4, IPV6],
  'site-ipv6': [IPV6],
  'site-udp-porty': [UDP],
  'site-tcp': [TCP, TCP_FLOW],
  'site-autokonfigurace': [DHCP_FLOW],
};
