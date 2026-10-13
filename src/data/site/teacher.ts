/** Kapitoly učitelových učebnic na randis.cz/wikit (PSS teorie, VRT, CCC) */

export const PSS_CHAPTERS: Record<number, string> = {
  1: 'Úvod do počítačových sítí',
  2: 'Klasifikace počítačových sítí',
  3: 'Modely počítačových sítí (ISO/OSI a TCP/IP)',
  4: 'Přenos bitů, kolize a multiplex',
  5: 'Fyzická vrstva (L1) – Funkce a zařízení',
  6: 'Přenosová média (L1) – Metalické kabely',
  7: 'Přenosová média (L1) – Optická vlákna',
  8: 'Linková vrstva (L2) – Úvod a adresace',
  9: 'Přístupové metody a kolizní domény (L2)',
  10: 'MAC adresa (L2)',
  11: 'L2 Zařízení – Switch a Bridge',
  12: 'Virtuální LAN (VLAN)',
  13: 'Síťové technologie – Úvod',
  14: 'Síťové technologie – Ethernet',
  15: 'Síťové technologie – Wi-Fi',
  16: 'Síťové technologie – Bluetooth',
  17: 'Síťové technologie – Token Ring (IEEE 802.5)',
  18: 'Síťové technologie – 100VG-AnyLAN',
  19: 'Překlad adres (ARP a ND)',
  20: 'Síťová vrstva (L3) – Úvod a principy',
  21: 'Paket IPv4 a lokální směrování',
  22: 'Paket IPv6 a lokální směrování',
  23: 'Adresace IPv4 – Třídy, Masky a Subnetting',
  24: 'Výpočty v sítích IPv4 (Subnetting)',
  25: 'Subnetting v praxi (VLSM)',
  26: 'Adresace IPv6',
  27: 'Protokoly ICMP (Diagnostika sítě)',
  28: 'Protokol IGMP (Správa multicastu)',
  29: 'Protokol MLD (Správa multicastu v IPv6)',
  30: 'Internet – Historie, Struktura a Správa',
  31: 'Principy směrování a směrovací tabulka',
  32: 'Statické směrování',
  33: 'Dynamické směrování',
  34: 'Metriky směrovacích protokolů',
  35: 'Protokol RIP',
  36: 'Protokoly IGRP a EIGRP',
  37: 'Protokol OSPF',
  38: 'Protokol IS-IS',
  39: 'Protokol BGP',
  40: 'Peering a tranzit',
  41: 'Transportní vrstva (L4) – Úvod',
  42: 'UDP (User Datagram Protocol)',
  43: 'TCP (Transmission Control Protocol)',
  44: 'Klouzavé okénko (Sliding Window)',
  45: 'Real-time protokoly (RTP, RTCP, RTSP)',
  46: 'Protokol DHCPv4',
  47: 'Automatická konfigurace IPv6',
  48: 'Protokol DNS – úvod',
  49: 'Protokol DNS – Servery, záznamy a dotazy',
  50: 'Protokol DNS – Zónové soubory a registrace domén',
  51: 'DNS – Transport a Zabezpečení',
  52: 'Překlad síťových adres (NAT)',
  53: 'Proxy servery',
  54: 'Virtuální privátní sítě (VPN)',
  55: 'Úvod do SSL/TLS a kryptografie',
  56: 'Symetrické a Asymetrické šifrování',
  57: 'Hashovací funkce a Integrita dat',
  58: 'PKI a Certifikační autority',
  59: 'SSL/TLS Handshake',
};

/** Které kapitoly učebnice patří k jednotlivým maturitním tématům */
const TOPIC_CHAPTERS: Record<string, number[]> = {
  'site-prenos-bitu': [4, 5, 9],
  'site-kabely': [6, 7],
  'site-ramce': [3, 8, 10, 14, 19],
  'site-switching-vlan': [11, 12],
  'site-ip-icmp': [20, 21, 22, 27],
  'site-ipv4': [23, 24],
  'site-cidr': [23, 24],
  'site-vlsm': [25],
  'site-ipv6': [26, 22, 19],
  'site-staticke-smerovani': [31, 32],
  'site-dynamicke-smerovani': [33, 34, 35, 36, 37, 38],
  'site-externi-smerovani': [39, 40, 30],
  'site-udp-porty': [41, 42, 45],
  'site-tcp': [43, 44],
  'site-autokonfigurace': [46, 47],
  'site-dns': [48, 49, 50, 51],
  'site-nat': [52],
  'site-aplikacni-sluzby': [53, 55, 59],
  'site-wifi': [15, 9],
  'site-zabezpeceni': [54, 56, 57, 58],
};

/** Virtualizace OS (randis.cz/wikit/vrt) */
const VRT_CHAPTERS: Record<number, string> = {
  1: 'Úvod do operačních systémů',
  2: 'Proces bootování',
  3: 'Simulace, Emulace a Virtualizace',
  4: 'Metody a techniky virtualizace',
  5: 'High Availability (HA) a Disaster Recovery',
  6: 'Záložní zdroje napájení (UPS)',
  7: 'Správa procesů a vláken',
  8: 'Úvod do problematiky souborových systémů',
};

/** Clustery a cloud (randis.cz/wikit/ccc) */
const CCC_CHAPTERS: Record<number, string> = {
  1: 'Úvod do Clusterů',
  2: 'Architektura a design clusterů',
  3: 'Komunikace a software v clusteru',
  4: 'Příklady a reálné aplikace clusterů',
  5: 'AI a Strojové učení',
  6: 'Proxy a Reverzní proxy',
  7: 'DNS Load Balancing, RRDNS a Anycast',
  8: 'Úvod do Cloud Computingu',
  9: 'Architektura a bezpečnost cloudu',
  10: 'Servisní modely (IaaS, PaaS, SaaS)',
};

const BOOKS = {
  pss: { name: 'Teorie počítačových sítí', path: 'pss_teorie', chapters: PSS_CHAPTERS },
  vrt: { name: 'Virtualizace OS', path: 'vrt', chapters: VRT_CHAPTERS },
  ccc: { name: 'Clustery a cloud', path: 'ccc', chapters: CCC_CHAPTERS },
};
type BookId = keyof typeof BOOKS;

/** Kapitoly pro cloudová témata ve tvaru [učebnice, číslo] */
const CLOUD_CHAPTERS: Record<string, [BookId, number][]> = {
  'cloud-zaklady': [['ccc', 8], ['ccc', 9]],
  'cloud-sluzby': [['ccc', 10]],
  'cloud-virtualizace': [['vrt', 3], ['vrt', 4]],
  'cloud-platformy': [['vrt', 4]],
  'cloud-uloziste': [['vrt', 8]],
  'cloud-zalohy': [['vrt', 5]],
  'cloud-ha': [['vrt', 5], ['vrt', 6], ['ccc', 1], ['ccc', 2], ['ccc', 3], ['ccc', 7]],
  'cloud-os': [['vrt', 1]],
  'cloud-bootovani': [['vrt', 2]],
  'cloud-procesy': [['vrt', 7]],
  'cloud-souborove-systemy': [['vrt', 8]],
  'cloud-ups': [['vrt', 6]],
  'cloud-clustery-praxe': [['ccc', 4]],
  'cloud-verejny': [['ccc', 8]],
  'cloud-bezpecnost': [['ccc', 9]],
};

export const chapterUrl = (book: BookId, n: number) => `https://randis.cz/wikit/${BOOKS[book].path}/chapter/kapitola${n}.php`;

export interface TeacherChapter {
  key: string;
  book: string;
  n: number;
  title: string;
  url: string;
}

/** Kapitoly učitelových učebnic, ze kterých téma vychází */
export function teacherChapters(topicId: string): TeacherChapter[] {
  const refs: [BookId, number][] = CLOUD_CHAPTERS[topicId] ?? (TOPIC_CHAPTERS[topicId] ?? []).map((n): [BookId, number] => ['pss', n]);
  return refs.map(([book, n]) => ({ key: `${book}-${n}`, book: BOOKS[book].name, n, title: BOOKS[book].chapters[n], url: chapterUrl(book, n) }));
}
