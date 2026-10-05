import type { AbcQuestion, FillQuestion, Question, TrueFalseQuestion } from '../types';
import { pick, shuffle } from './random';

// ================= IPv4 =================

export const ipToInt = (ip: string): number => ip.split('.').reduce((acc, o) => ((acc << 8) | Number(o)) >>> 0, 0);
export const intToIp = (n: number): string => [24, 16, 8, 0].map((s) => (n >>> s) & 255).join('.');
export const prefixToMaskInt = (p: number): number => (p === 0 ? 0 : (0xffffffff << (32 - p)) >>> 0);
export const prefixToMask = (p: number): string => intToIp(prefixToMaskInt(p));
export const wildcard = (p: number): string => intToIp(~prefixToMaskInt(p) >>> 0);
export const networkOf = (ip: number, p: number): number => (ip & prefixToMaskInt(p)) >>> 0;
export const broadcastOf = (ip: number, p: number): number => (networkOf(ip, p) | (~prefixToMaskInt(p) >>> 0)) >>> 0;
export const hostsFor = (p: number): number => (p >= 31 ? (p === 31 ? 2 : 1) : 2 ** (32 - p) - 2);

/** Nejmenší prefix, do kterého se vejde daný počet hostů */
export function prefixForHosts(hosts: number): number {
  for (let p = 30; p >= 1; p--) if (2 ** (32 - p) - 2 >= hosts) return p;
  return 1;
}

export function maskToPrefix(mask: string): number {
  const n = ipToInt(mask);
  let p = 0;
  while (p < 32 && (n & (0x80000000 >>> p)) !== 0) p++;
  return p;
}

const rnd = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

function randomPrivateIp(): number {
  const base = pick(['10', '172', '192']);
  if (base === '10') return ipToInt(`10.${rnd(0, 255)}.${rnd(0, 255)}.${rnd(1, 254)}`);
  if (base === '172') return ipToInt(`172.${rnd(16, 31)}.${rnd(0, 255)}.${rnd(1, 254)}`);
  return ipToInt(`192.168.${rnd(0, 255)}.${rnd(1, 254)}`);
}

// ================= IPv6 =================

/** Zkrácený zápis IPv6 podle RFC 5952 */
export function ipv6Compress(groups: number[]): string {
  const hex = groups.map((g) => g.toString(16));
  let bestStart = -1;
  let bestLen = 0;
  for (let i = 0; i < 8; ) {
    if (groups[i] !== 0) {
      i++;
      continue;
    }
    let j = i;
    while (j < 8 && groups[j] === 0) j++;
    if (j - i > bestLen) {
      bestLen = j - i;
      bestStart = i;
    }
    i = j;
  }
  if (bestLen < 2) return hex.join(':');
  const left = hex.slice(0, bestStart).join(':');
  const right = hex.slice(bestStart + bestLen).join(':');
  return `${left}::${right}`;
}

export const ipv6Expand = (groups: number[]): string => groups.map((g) => g.toString(16).padStart(4, '0')).join(':');

export function parseIpv6(s: string): number[] | null {
  const t = s.trim().toLowerCase();
  if (!/^[0-9a-f:]+$/.test(t) || (t.match(/::/g)?.length ?? 0) > 1) return null;
  const [l, r] = t.includes('::') ? t.split('::') : [t, null];
  const left = l ? l.split(':') : [];
  const right = r ? r.split(':') : [];
  if (r === null && left.length !== 8) return null;
  const missing = 8 - left.length - right.length;
  if (missing < (r === null ? 0 : 1)) return null;
  const parts = [...left, ...Array(r === null ? 0 : missing).fill('0'), ...right];
  if (parts.some((p) => !/^[0-9a-f]{1,4}$/.test(p))) return null;
  return parts.map((p) => parseInt(p, 16));
}

function randomIpv6(): number[] {
  const g: number[] = [0x2001, 0x0db8, rnd(0, 0xffff), rnd(0, 0xff), 0, 0, 0, rnd(1, 0xffff)];
  // náhodně přidej nebo posuň nulové skupiny
  const variant = rnd(0, 3);
  if (variant === 1) g[3] = 0;
  if (variant === 2) {
    g[5] = rnd(1, 0xfff);
    g[2] = 0;
    g[3] = 0;
  }
  if (variant === 3) {
    g[1] = 0xdb8;
    g[4] = rnd(0, 0xf);
  }
  return g;
}

// ================= Otázky =================

const base = (factKey: string, prompt: string, explanation: string) => ({
  bookId: 'site-vypocty',
  area: 'it-vypocty' as const,
  factKey,
  prompt,
  explanation,
  difficulty: 'medium' as const,
});

function fill(kind: string, i: number, prompt: string, answer: string, accepted: string[], explanation: string, inputLabel = 'Výsledek'): FillQuestion {
  return { ...base(`${kind}-${i}`, prompt, explanation), id: `gen|${kind}|${i}`, type: 'fill', answer, accepted: [answer, ...accepted], exact: true, inputLabel };
}

type Gen = (i: number) => Question;

export const GENERATORS: Record<string, { label: string; gen: Gen }> = {
  'net-address': {
    label: 'Adresa sítě',
    gen: (i) => {
      const p = rnd(8, 30);
      const ip = randomPrivateIp();
      const net = networkOf(ip, p);
      return fill(
        'net-address',
        i,
        `Jaká je adresa sítě, do které patří ${intToIp(ip)}/${p}?`,
        intToIp(net),
        [`${intToIp(net)}/${p}`],
        `Maska /${p} = ${prefixToMask(p)}. Adresa sítě = IP AND maska → ${intToIp(net)} (hostitelské bity nulové).`,
      );
    },
  },
  broadcast: {
    label: 'Broadcastová adresa',
    gen: (i) => {
      const p = rnd(8, 30);
      const ip = randomPrivateIp();
      const net = networkOf(ip, p);
      const bc = broadcastOf(ip, p);
      return fill(
        'broadcast',
        i,
        `Jaká je broadcastová adresa sítě, do které patří ${intToIp(ip)}/${p}?`,
        intToIp(bc),
        [],
        `Síť ${intToIp(net)}/${p}, velikost bloku ${2 ** (32 - p)} adres. Broadcast = poslední adresa bloku (všechny hostitelské bity 1) → ${intToIp(bc)}.`,
      );
    },
  },
  'host-range': {
    label: 'První a poslední host',
    gen: (i) => {
      const p = rnd(16, 30);
      const ip = randomPrivateIp();
      const net = networkOf(ip, p);
      const bc = broadcastOf(ip, p);
      const first = Math.random() < 0.5;
      const ans = intToIp(first ? net + 1 : bc - 1);
      return fill(
        'host-range',
        i,
        `Jaká je ${first ? 'PRVNÍ' : 'POSLEDNÍ'} použitelná adresa hosta v síti, do které patří ${intToIp(ip)}/${p}?`,
        ans,
        [],
        `Síť ${intToIp(net)}, broadcast ${intToIp(bc)}. První host = síť + 1 = ${intToIp(net + 1)}, poslední host = broadcast − 1 = ${intToIp(bc - 1)}.`,
      );
    },
  },
  hosts: {
    label: 'Počet hostů',
    gen: (i) => {
      const p = rnd(16, 30);
      const h = hostsFor(p);
      return fill('hosts', i, `Kolik použitelných adres hostů má podsíť /${p}?`, String(h), [], `Hostitelských bitů: 32 − ${p} = ${32 - p}. Počet hostů = 2^${32 - p} − 2 = ${h} (odečítá se adresa sítě a broadcast).`);
    },
  },
  mask: {
    label: 'Maska ↔ prefix',
    gen: (i) => {
      const p = rnd(8, 30);
      if (Math.random() < 0.5) {
        return fill('mask', i, `Převeď prefix /${p} na masku v tečkovém zápisu.`, prefixToMask(p), [], `/${p} = ${p} jedniček zleva: ${prefixToMask(p)}.`);
      }
      return fill('mask', i, `Jaký prefix odpovídá masce ${prefixToMask(p)}?`, `/${p}`, [String(p)], `Spočítej jedničky v binárním zápisu masky: ${p} → /${p}.`, 'Prefix');
    },
  },
  wildcard: {
    label: 'Wildcard maska',
    gen: (i) => {
      const p = rnd(8, 30);
      return fill('wildcard', i, `Jaká je wildcard maska pro prefix /${p} (např. pro OSPF nebo ACL)?`, wildcard(p), [], `Wildcard = 255.255.255.255 − maska (${prefixToMask(p)}) = ${wildcard(p)}.`);
    },
  },
  split: {
    label: 'Dělení na podsítě',
    gen: (i) => {
      const p = rnd(16, 26);
      const n = pick([2, 3, 4, 5, 6, 8, 10, 16]);
      const bits = Math.ceil(Math.log2(n));
      const np = p + bits;
      const net = networkOf(randomPrivateIp(), p);
      return fill(
        'split',
        i,
        `Síť ${intToIp(net)}/${p} potřebuješ rozdělit na ${n} stejně velkých podsítí. Jaký bude prefix nových podsítí?`,
        `/${np}`,
        [String(np)],
        `Potřebuješ 2^s ≥ ${n} → s = ${bits} bit${bits > 1 ? 'y' : ''}. Nový prefix = ${p} + ${bits} = /${np} (${2 ** bits} podsítí po ${hostsFor(np)} hostech).`,
        'Prefix',
      );
    },
  },
  vlsm: {
    label: 'VLSM – prefix pro počet hostů',
    gen: (i) => {
      const h = pick([2, 5, 12, 20, 28, 30, 45, 60, 62, 100, 120, 200, 250, 500, 1000]);
      const p = prefixForHosts(h);
      return fill(
        'vlsm',
        i,
        `Podsíť potřebuje ${h} adres pro hosty. Jaký nejmenší (nejúspornější) prefix zvolíš?`,
        `/${p}`,
        [String(p)],
        `Hledáš nejmenší blok, kde 2^n − 2 ≥ ${h}: n = ${32 - p} → 2^${32 - p} − 2 = ${hostsFor(p)}. Prefix = 32 − ${32 - p} = /${p}.`,
        'Prefix',
      );
    },
  },
  'ipv6-compress': {
    label: 'Zkrácení IPv6',
    gen: (i) => {
      const g = randomIpv6();
      return fill(
        'ipv6-compress',
        i,
        `Zapiš co nejkratším správným způsobem adresu:\n${ipv6Expand(g)}`,
        ipv6Compress(g),
        [],
        `Vynechej úvodní nuly v každé skupině a nejdelší řadu nulových skupin (alespoň dvě) nahraď jednou „::“ → ${ipv6Compress(g)}.`,
        'Zkrácená adresa',
      );
    },
  },
  'ipv6-expand': {
    label: 'Rozepsání IPv6',
    gen: (i) => {
      const g = randomIpv6();
      return fill(
        'ipv6-expand',
        i,
        `Rozepiš adresu do plného tvaru (8 skupin po 4 číslicích):\n${ipv6Compress(g)}`,
        ipv6Expand(g),
        [],
        `„::“ nahraď tolika nulovými skupinami, aby jich bylo celkem 8, a každou skupinu doplň zleva nulami na 4 číslice → ${ipv6Expand(g)}.`,
        'Plná adresa',
      );
    },
  },
  binary: {
    label: 'Převody soustav',
    gen: (i) => {
      const v = rnd(0, 255);
      const b = v.toString(2).padStart(8, '0');
      const h = v.toString(16).toUpperCase().padStart(2, '0');
      const mode = rnd(0, 2);
      if (mode === 0) return fill('binary', i, `Převeď číslo ${v} do dvojkové soustavy (8 bitů).`, b, [v.toString(2)], `${v} = ${b} (váhy 128, 64, 32, 16, 8, 4, 2, 1).`);
      if (mode === 1) return fill('binary', i, `Převeď binární číslo ${b} do desítkové soustavy.`, String(v), [], `Sečti váhy jedničkových bitů: ${b} = ${v}.`);
      return fill('binary', i, `Převeď číslo ${v} do šestnáctkové soustavy.`, h, [`0x${h}`, v.toString(16)], `${v} = ${Math.floor(v / 16)} × 16 + ${v % 16} → ${h}.`);
    },
  },
  'same-net': {
    label: 'Stejná síť?',
    gen: (i) => {
      const p = rnd(20, 29);
      const a = randomPrivateIp();
      const same = Math.random() < 0.5;
      const size = 2 ** (32 - p);
      const net = networkOf(a, p);
      const b = same ? net + rnd(1, size - 2) : net + size + rnd(1, size - 2);
      const q: TrueFalseQuestion = {
        ...base(`same-net-${i}`, `Jsou adresy ${intToIp(a)}/${p} a ${intToIp(b >>> 0)}/${p} ve stejné podsíti?`, `Síť první adresy: ${intToIp(net)}/${p}, síť druhé: ${intToIp(networkOf(b >>> 0, p))}/${p} → ${same ? 'stejná síť' : 'různé sítě'}.`),
        id: `gen|same-net|${i}`,
        type: 'truefalse',
        isTrue: same,
      };
      return q;
    },
  },
  'port-quiz': {
    label: 'Čísla portů',
    gen: (i) => {
      const ports: [string, string][] = [
        ['HTTP', '80'], ['HTTPS', '443'], ['SSH', '22'], ['Telnet', '23'], ['DNS', '53'], ['SMTP', '25'], ['FTP (řízení)', '21'], ['RDP', '3389'], ['DHCP server', '67'], ['IMAP', '143'], ['POP3', '110'], ['SNMP', '161'], ['NTP', '123'], ['SMB', '445'], ['BGP', '179'], ['TFTP', '69'],
      ];
      const [svc, port] = pick(ports);
      const others = shuffle(ports.filter((x) => x[1] !== port)).slice(0, 3).map((x) => x[1]);
      const options = shuffle([port, ...others]);
      const q: AbcQuestion = {
        ...base(`port-${i}`, `Na jakém portu standardně běží ${svc}?`, `${svc} = port ${port}.`),
        id: `gen|port|${i}`,
        type: 'abc',
        options,
        correctIndex: options.indexOf(port),
      };
      return q;
    },
  },
};

export function generateCalcQuestions(perKind = 3, kinds: string[] = Object.keys(GENERATORS)): Question[] {
  const out: Question[] = [];
  for (const k of kinds) for (let i = 0; i < perKind; i++) out.push(GENERATORS[k].gen(i));
  return out;
}

// ================= Zadání praktické zkoušky =================

export interface Subnet {
  vlan: number;
  name: string;
  hosts: number;
  net: string;
  prefix: number;
  mask: string;
  gateway: string;
  first: string;
  last: string;
  broadcast: string;
}

export interface ScenarioTask {
  id: string;
  title: string;
  detail: string;
  solution: string;
}

export interface Scenario {
  os: 'linux' | 'windows';
  company: string;
  domain: string;
  block: string;
  subnets: Subnet[];
  ispLink: { net: string; r1: string; isp: string };
  server: { ip: string; prefix: number; gateway: string; net: string; dhcpFrom: string; dhcpTo: string; host: string };
  ptTasks: ScenarioTask[];
  osTasks: ScenarioTask[];
}

/** VLSM: přidělí podsítě od největší v rámci bloku */
export function vlsmAllocate(blockNet: number, reqs: { vlan: number; name: string; hosts: number }[]): Subnet[] {
  let cursor = blockNet;
  return [...reqs]
    .sort((a, b) => b.hosts - a.hosts)
    .map((r) => {
      const p = prefixForHosts(r.hosts);
      const size = 2 ** (32 - p);
      cursor = Math.ceil(cursor / size) * size;
      const net = cursor >>> 0;
      cursor += size;
      const bc = (net + size - 1) >>> 0;
      return {
        ...r,
        net: intToIp(net),
        prefix: p,
        mask: prefixToMask(p),
        gateway: intToIp(net + 1),
        first: intToIp(net + 1),
        last: intToIp(bc - 1),
        broadcast: intToIp(bc),
      };
    });
}

const COMPANIES = ['Obaly', 'Tiskarna', 'Papirna', 'Logistika', 'Stavby', 'Pekarna', 'Autodily', 'Nabytek'];

export function generateScenario(os?: 'linux' | 'windows'): Scenario {
  const chosen = os ?? (Math.random() < 0.5 ? 'linux' : 'windows');
  const company = pick(COMPANIES);
  const domain = `${company.toLowerCase()}.local`;
  const third = rnd(1, 250);
  const blockNet = ipToInt(`192.168.${third}.0`);
  const subnets = vlsmAllocate(blockNet, [
    { vlan: 10, name: 'ZAMESTNANCI', hosts: rnd(40, 110) },
    { vlan: 20, name: 'HOSTE', hosts: rnd(12, 28) },
    { vlan: 99, name: 'SPRAVA', hosts: rnd(3, 6) },
  ]).sort((a, b) => a.vlan - b.vlan);
  const linkBase = ipToInt(`10.${rnd(0, 255)}.${rnd(0, 255)}.${rnd(0, 63) * 4}`);
  const ispLink = { net: `${intToIp(linkBase)}/30`, r1: intToIp(linkBase + 2), isp: intToIp(linkBase + 1) };
  const [v10, v20, v99] = [10, 20, 99].map((v) => subnets.find((s) => s.vlan === v)!);
  const sw1 = intToIp(ipToInt(v99.gateway) + 1);

  const ptTasks: ScenarioTask[] = [
    {
      id: 'adresace',
      title: 'Adresní plán (VLSM)',
      detail: `Z bloku 192.168.${third}.0/24 navrhni podsítě metodou VLSM (od největší): VLAN 10 ZAMESTNANCI – ${v10.hosts} hostů, VLAN 20 HOSTE – ${v20.hosts} hostů, VLAN 99 SPRAVA – ${v99.hosts} hostů. Bránou je vždy první použitelná adresa.`,
      solution: subnets
        .slice()
        .sort((a, b) => ipToInt(a.net) - ipToInt(b.net))
        .map((s) => `VLAN ${s.vlan} ${s.name}: ${s.net}/${s.prefix} (maska ${s.mask}), brána ${s.gateway}, hosté ${s.first}–${s.last}, broadcast ${s.broadcast}`)
        .join('\n'),
    },
    {
      id: 'zaklad',
      title: 'Základní nastavení R1 a SW1',
      detail: 'Pojmenuj zařízení R1 a SW1, nastav enable secret „class“, heslo konzole „cisco“, zašifruj hesla, nastav banner a konfiguraci ulož.',
      solution: 'hostname R1   (na switchi SW1)\nenable secret class\nline console 0\n password cisco\n login\n exit\nservice password-encryption\nbanner motd #Pristup jen pro opravnene#\nend\ncopy running-config startup-config',
    },
    {
      id: 'vlan',
      title: 'VLAN a trunk na SW1',
      detail: 'Vytvoř VLAN 10 ZAMESTNANCI, 20 HOSTE a 99 SPRAVA. Porty F0/1–10 do VLAN 10, F0/11–20 do VLAN 20. Port G0/1 k routeru nastav jako trunk s nativní VLAN 99.',
      solution: 'vlan 10\n name ZAMESTNANCI\nvlan 20\n name HOSTE\nvlan 99\n name SPRAVA\ninterface range f0/1-10\n switchport mode access\n switchport access vlan 10\ninterface range f0/11-20\n switchport mode access\n switchport access vlan 20\ninterface g0/1\n switchport mode trunk\n switchport trunk native vlan 99',
    },
    {
      id: 'roas',
      title: 'Směrování mezi VLAN na R1 (router-on-a-stick)',
      detail: 'Na rozhraní G0/0 routeru R1 vytvoř podrozhraní pro VLAN 10, 20 a 99 s adresami bran z adresního plánu.',
      solution: `interface g0/0\n no shutdown\ninterface g0/0.10\n encapsulation dot1Q 10\n ip address ${v10.gateway} ${v10.mask}\ninterface g0/0.20\n encapsulation dot1Q 20\n ip address ${v20.gateway} ${v20.mask}\ninterface g0/0.99\n encapsulation dot1Q 99 native\n ip address ${v99.gateway} ${v99.mask}`,
    },
    {
      id: 'sprava',
      title: 'Správa switche',
      detail: `Na SW1 nastav rozhraní VLAN 99 s adresou ${sw1} a výchozí bránu.`,
      solution: `interface vlan 99\n ip address ${sw1} ${v99.mask}\n no shutdown\nip default-gateway ${v99.gateway}`,
    },
    {
      id: 'dhcp',
      title: 'DHCP na R1',
      detail: 'Pro VLAN 10 a 20 nastav na R1 DHCP pooly. Prvních 5 adres v každé síti vyluč. DNS server 8.8.8.8.',
      solution: [v10, v20]
        .map((s) => {
          const ex = intToIp(ipToInt(s.first) + 4);
          return `ip dhcp excluded-address ${s.first} ${ex}\nip dhcp pool ${s.name}\n network ${s.net} ${s.mask}\n default-router ${s.gateway}\n dns-server 8.8.8.8`;
        })
        .join('\n'),
    },
    {
      id: 'internet',
      title: 'Připojení k ISP a NAT',
      detail: `Spoj R1 – ISP má síť ${ispLink.net}; R1 má adresu ${ispLink.r1} na G0/1, ISP ${ispLink.isp}. Nastav výchozí trasu na ISP a PAT pro VLAN 10 a 20 na adresu rozhraní G0/1.`,
      solution: `interface g0/1\n ip address ${ispLink.r1} 255.255.255.252\n ip nat outside\n no shutdown\ninterface g0/0.10\n ip nat inside\ninterface g0/0.20\n ip nat inside\nip route 0.0.0.0 0.0.0.0 ${ispLink.isp}\naccess-list 1 permit ${v10.net} ${wildcard(v10.prefix)}\naccess-list 1 permit ${v20.net} ${wildcard(v20.prefix)}\nip nat inside source list 1 interface g0/1 overload`,
    },
    {
      id: 'ssh',
      title: 'SSH na R1',
      detail: `Povol na R1 vzdálenou správu jen přes SSH: doména ${domain}, uživatel admin / heslo123.`,
      solution: `ip domain-name ${domain}\ncrypto key generate rsa\n(1024)\nusername admin secret heslo123\nip ssh version 2\nline vty 0 4\n transport input ssh\n login local`,
    },
    {
      id: 'overeni',
      title: 'Ověření',
      detail: 'Ověř, že PC ve VLAN 10 i 20 dostanou adresu z DHCP, navzájem se pingnou a dosáhnou na ISP.',
      solution: 'show vlan brief\nshow interfaces trunk\nshow ip interface brief\nshow ip dhcp binding\nshow ip nat translations\nping z PC: brána, PC v druhé VLAN, adresa ISP',
    },
  ];

  // Windows podle školního cvičení: VirtualBox, vnitřní síť 192.168.100.0/24, server „ds“
  const srvNet = chosen === 'windows' ? ipToInt('192.168.100.0') : ipToInt(`10.${rnd(1, 250)}.${rnd(1, 250)}.0`);
  const server = {
    net: `${intToIp(srvNet)}/24`,
    ip: intToIp(srvNet + (chosen === 'windows' ? rnd(2, 20) : 10)),
    prefix: 24,
    gateway: intToIp(srvNet + 1),
    dhcpFrom: intToIp(srvNet + 100),
    dhcpTo: intToIp(srvNet + 200),
    host: chosen === 'linux' ? 'srv1' : 'ds',
  };
  const netAddr = intToIp(srvNet);

  const osTasks: ScenarioTask[] =
    chosen === 'linux'
      ? [
          {
            id: 'lx-ip',
            title: 'Síť a název serveru',
            detail: `Nastav serveru trvale adresu ${server.ip}/24, bránu ${server.gateway}, DNS sám na sebe a název ${server.host}.`,
            solution: `hostnamectl set-hostname ${server.host}\n# Ubuntu – /etc/netplan/01-netcfg.yaml\nnetwork:\n  version: 2\n  ethernets:\n    ens33:\n      addresses: [${server.ip}/24]\n      routes:\n        - to: default\n          via: ${server.gateway}\n      nameservers:\n        addresses: [${server.ip}]\nnetplan apply\n# Debian – /etc/network/interfaces\nauto ens33\niface ens33 inet static\n  address ${server.ip}/24\n  gateway ${server.gateway}`,
          },
          {
            id: 'lx-dhcp',
            title: 'DHCP server',
            detail: `Nainstaluj isc-dhcp-server a přiděluj adresy ${server.dhcpFrom}–${server.dhcpTo}, brána ${server.gateway}, DNS ${server.ip}, doména ${domain}.`,
            solution: `apt install isc-dhcp-server\n# /etc/default/isc-dhcp-server\nINTERFACESv4="ens33"\n# /etc/dhcp/dhcpd.conf\noption domain-name "${domain}";\noption domain-name-servers ${server.ip};\nauthoritative;\nsubnet ${netAddr} netmask 255.255.255.0 {\n  range ${server.dhcpFrom} ${server.dhcpTo};\n  option routers ${server.gateway};\n}\nsystemctl restart isc-dhcp-server`,
          },
          {
            id: 'lx-dns',
            title: 'DNS server (BIND)',
            detail: `Vytvoř zónu ${domain} se záznamy ${server.host} a www (obojí ${server.ip}).`,
            solution: `apt install bind9\n# /etc/bind/named.conf.local\nzone "${domain}" {\n  type master;\n  file "/etc/bind/db.${domain}";\n};\n# /etc/bind/db.${domain}\n$TTL 604800\n@   IN SOA ${server.host}.${domain}. admin.${domain}. ( 2 604800 86400 2419200 604800 )\n@   IN NS  ${server.host}.${domain}.\n${server.host} IN A ${server.ip}\nwww IN A ${server.ip}\nnamed-checkzone ${domain} /etc/bind/db.${domain}\nsystemctl restart bind9`,
          },
          {
            id: 'lx-web',
            title: 'Web server',
            detail: `Nainstaluj Apache a vytvoř úvodní stránku s názvem firmy ${company}. Web musí být dostupný na http://www.${domain}.`,
            solution: `apt install apache2\necho "<h1>${company}</h1>" > /var/www/html/index.html\nsystemctl enable --now apache2`,
          },
          {
            id: 'lx-users',
            title: 'Uživatelé a sdílený adresář',
            detail: 'Vytvoř skupinu ucetni, uživatele jan a petr ve skupině a adresář /data/ucetni, do kterého smí jen tato skupina (rwx), ostatní nic.',
            solution: 'groupadd ucetni\nadduser jan\nadduser petr\nusermod -aG ucetni jan\nusermod -aG ucetni petr\nmkdir -p /data/ucetni\nchown root:ucetni /data/ucetni\nchmod 770 /data/ucetni',
          },
          {
            id: 'lx-ssh',
            title: 'SSH',
            detail: 'Zprovozni SSH server, zakaž přihlášení roota a dej uživateli jan práva sudo.',
            solution: 'apt install openssh-server\n# /etc/ssh/sshd_config\nPermitRootLogin no\nsystemctl restart ssh\nusermod -aG sudo jan',
          },
        ]
      : (() => {
          const clientIp = intToIp(srvNet + rnd(21, 99));
          const dn = domain.split('.').map((d) => `DC=${d}`).join(',');
          return [
            {
              id: 'win-vm',
              title: 'Virtuální počítače ve VirtualBoxu',
              detail: 'Vytvoř VM pro Windows Server 2016 Standard (s Desktop prostředím): 2 GB RAM, 2 CPU, disk 50 GB s dynamickou alokací, síťová karta v režimu „Vnitřní síť“. Klient (Windows 10 Pro, příp. 7 Pro): 2 GB RAM (Win 7 stačí 1 GB), 1 CPU, disk 30 GB dynamicky, také vnitřní síť. Do obou doinstaluj přídavky pro hosta.',
              solution:
                'VirtualBox → Nový: typ Microsoft Windows, verze Windows 2016 (64-bit)\nPaměť 2048 MB, CPU 2 (Nastavení → Systém → Procesor)\nVytvořit virtuální disk VDI, Dynamicky alokovaný, 50 GB\nNastavení → Síť → Karta 1: Připojena k „Vnitřní síť“, název intnet (u obou VM stejný!)\nNastavení → Úložiště → optická mechanika: ISO Windows Serveru\nPo instalaci: Zařízení → Vložit obraz CD s přídavky pro hosta → spustit VBoxWindowsAdditions.exe → restart\n\nKlient stejně: Windows 10 (64-bit), 2048 MB (Win 7: 1024 MB), 1 CPU, 30 GB dynamicky, vnitřní síť intnet\n\nPříkazy:\nVBoxManage createvm --name ds --ostype Windows2016_64 --register\nVBoxManage modifyvm ds --memory 2048 --cpus 2 --nic1 intnet --intnet1 intnet\nVBoxManage createmedium disk --filename ds.vdi --size 51200 --variant Standard',
            },
            {
              id: 'win-ip',
              title: 'Název serveru a IP adresy',
              detail: `Přejmenuj server na ds. Nastav statické adresy ze sítě 192.168.100.0/24: server ${server.ip}, klient ${clientIp}. Jako DNS server použij u obou adresu serveru.`,
              solution: `Server – Správce serveru → Místní server → Název počítače → Změnit → ds → restart\n(PowerShell) Rename-Computer -NewName ds -Restart\n\nncpa.cpl → Ethernet → Vlastnosti → Protokol IPv4:\n  IP ${server.ip}, maska 255.255.255.0, DNS ${server.ip}\n(PowerShell) New-NetIPAddress -InterfaceAlias "Ethernet" -IPAddress ${server.ip} -PrefixLength 24\nSet-DnsClientServerAddress -InterfaceAlias "Ethernet" -ServerAddresses ${server.ip}\n\nKlient: IP ${clientIp}, maska 255.255.255.0, DNS ${server.ip}\nOvěření: ping ${server.ip} z klienta (když neprojde, povol ve firewallu pravidlo „Sdílení souborů a tiskáren (požadavek na odezvu – ICMPv4)“)\nVe vnitřní síti VirtualBoxu není router – výchozí brána není potřeba.`,
            },
            {
              id: 'win-role',
              title: 'Role DNS a Active Directory Domain Services',
              detail: 'Na server doinstaluj role DNS server a Active Directory Domain Services.',
              solution: 'Správce serveru → Spravovat → Přidat role a funkce → Instalace na základě rolí → server ds → zaškrtnout „Active Directory Domain Services“ a „DNS Server“ (přidat požadované funkce) → Nainstalovat\n(PowerShell) Install-WindowsFeature AD-Domain-Services, DNS -IncludeManagementTools',
            },
            {
              id: 'win-dc',
              title: 'Primární řadič domény',
              detail: `Povyš server na primární řadič domény v nové doménové struktuře (lese). Doména: ${domain}.`,
              solution: `Správce serveru → vlaječka s upozorněním → „Zvýšit úroveň tohoto serveru na řadič domény“\n→ Přidat novou doménovou strukturu → Název kořenové domény: ${domain}\n→ heslo pro režim obnovení adresářových služeb (DSRM) → Další… → Nainstalovat → server se restartuje\n(PowerShell) Install-ADDSForest -DomainName ${domain} -InstallDns\nPo restartu se přihlásíš jako ${domain.split('.')[0].toUpperCase()}\\Administrator`,
            },
            {
              id: 'win-klient',
              title: 'Klient v doméně',
              detail: `Připoj klientskou stanici do domény ${domain}.`,
              solution: `Klient musí mít jako DNS ${server.ip} (jinak řadič domény nenajde)\nsysdm.cpl → Název počítače → Změnit → Člen domény: ${domain} → přihlásit se doménovým účtem (Administrator) → restart\n(PowerShell, Windows 10) Add-Computer -DomainName ${domain} -Restart\nOvěření: na serveru v „Uživatelé a počítače služby Active Directory“ → Computers je klient`,
            },
            {
              id: 'win-users',
              title: 'Doménová struktura: OU, uživatelé, skupiny',
              detail: 'Vytvoř organizační jednotky (např. Ucetni a Vyroba), v nich uživatelské účty a globální skupiny, uživatele přidej do skupin. Přihlas se na klientovi jako nový uživatel.',
              solution: `dsa.msc (Uživatelé a počítače služby Active Directory) → pravým na doménu → Nový → Organizační jednotka\n→ v OU: Nový → Uživatel (přihlašovací jméno, heslo, „uživatel musí změnit heslo“ dle potřeby)\n→ Nový → Skupina (obor Globální, typ Zabezpečení) → Vlastnosti skupiny → Členové → Přidat\n\n(PowerShell)\nNew-ADOrganizationalUnit -Name Ucetni\nNew-ADUser -Name "Jan Novak" -SamAccountName jnovak -Path "OU=Ucetni,${dn}" -AccountPassword (Read-Host -AsSecureString) -Enabled $true\nNew-ADGroup -Name Ucetni -GroupScope Global -Path "OU=Ucetni,${dn}"\nAdd-ADGroupMember -Identity Ucetni -Members jnovak`,
            },
            {
              id: 'win-share',
              title: 'Navíc: sdílená složka pro skupinu',
              detail: 'Vytvoř na serveru složku C:\\Ucetni sdílenou jen pro skupinu Ucetni (sdílení i NTFS) a ověř přístup z klienta.',
              solution: `New-Item -Path C:\\Ucetni -ItemType Directory\nNew-SmbShare -Name Ucetni -Path C:\\Ucetni -FullAccess ${domain.split('.')[0].toUpperCase()}\\Ucetni\n(NTFS: Vlastnosti → Zabezpečení → přidat skupinu Ucetni, odebrat Users)\nZ klienta: \\\\ds\\Ucetni`,
            },
            {
              id: 'win-gpo',
              title: 'Navíc: zásady skupiny',
              detail: 'Vytvoř GPO propojené s OU Vyroba, které uživatelům zakáže přístup k Ovládacím panelům, a ověř na klientovi.',
              solution: `gpmc.msc → OU Vyroba → Vytvořit objekt GPO v této doméně a propojit jej sem → Upravit\n→ Konfigurace uživatele → Zásady → Šablony pro správu → Ovládací panely → „Zakázat přístup k Ovládacím panelům…“ → Povoleno\n(PowerShell) New-GPO -Name "Vyroba-zasady" | New-GPLink -Target "OU=Vyroba,${dn}"\nNa klientovi: gpupdate /force, gpresult /r`,
            },
          ];
        })();

  return { os: chosen, company, domain, block: `192.168.${third}.0/24`, subnets, ispLink, server, ptTasks, osTasks };
}
