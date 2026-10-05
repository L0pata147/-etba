import type { Simulator, TermResult, TermTask } from './types';

/** Zjednodušený Linux Debian 13 (trixie) ve VirtualBoxu – soubory, síť, uživatelé, balíčky a služby */

interface FileNode {
  dir: boolean;
  content: string;
  mode: number;
  owner: string;
  group: string;
}

interface Iface {
  name: string;
  /** Adresa v zápisu CIDR, nebo null */
  addr: string | null;
  up: boolean;
}

interface Service {
  active: boolean;
  enabled: boolean;
}

export interface LinuxOptions {
  hostname?: string;
  ifaces?: { name: string; addr: string | null }[];
  gateway?: string | null;
  /** Adresy, které v síti odpovídají na ping */
  hosts?: string[];
  files?: Record<string, string>;
  packages?: string[];
}

const ipToInt = (ip: string) => ip.split('.').reduce((a, o) => ((a << 8) | Number(o)) >>> 0, 0);
const sameNet = (cidr: string, ip: string) => {
  const [a, p] = cidr.split('/');
  const mask = Number(p) === 0 ? 0 : (0xffffffff << (32 - Number(p))) >>> 0;
  return ((ipToInt(a) & mask) >>> 0) === ((ipToInt(ip) & mask) >>> 0);
};
const maskToPrefix = (mask: string) =>
  ipToInt(mask)
    .toString(2)
    .split('')
    .filter((b) => b === '1').length;
const isIp = (s: string) => /^(\d{1,3}\.){3}\d{1,3}$/.test(s) && s.split('.').every((o) => Number(o) <= 255);

const PERM = (m: number, dir: boolean) =>
  (dir ? 'd' : '-') +
  [6, 3, 0]
    .map((sh) => {
      const v = (m >> sh) & 7;
      return `${v & 4 ? 'r' : '-'}${v & 2 ? 'w' : '-'}${v & 1 ? 'x' : '-'}`;
    })
    .join('');

/** Balíčky, které simulace zná – co vytvoří a jakou službu */
const PACKAGES: Record<string, { files?: Record<string, string>; service?: string; autostart?: boolean }> = {
  apache2: { files: { '/var/www/html/index.html': '<html><body><h1>Apache2 Default Page</h1><p>It works!</p></body></html>\n' }, service: 'apache2', autostart: true },
  nginx: { files: { '/var/www/html/index.nginx-debian.html': '<h1>Welcome to nginx!</h1>\n' }, service: 'nginx', autostart: true },
  'openssh-server': {
    files: { '/etc/ssh/sshd_config': '# Konfigurace SSH serveru\nInclude /etc/ssh/sshd_config.d/*.conf\n#Port 22\n#PermitRootLogin prohibit-password\n#PasswordAuthentication yes\nKbdInteractiveAuthentication no\nUsePAM yes\nX11Forwarding yes\n' },
    service: 'ssh',
    autostart: true,
  },
  'isc-dhcp-server': {
    files: {
      '/etc/dhcp/dhcpd.conf': '# dhcpd.conf\n#\n# option definitions common to all supported networks...\noption domain-name "example.org";\noption domain-name-servers ns1.example.org, ns2.example.org;\n\ndefault-lease-time 600;\nmax-lease-time 7200;\n\n# authoritative;\n',
      '/etc/default/isc-dhcp-server': '# On what interfaces should the DHCP server (dhcpd) serve DHCP requests?\n#\tSeparate multiple interfaces with spaces, e.g. "eth0 eth1".\nINTERFACESv4=""\nINTERFACESv6=""\n',
    },
    service: 'isc-dhcp-server',
    autostart: false,
  },
  bind9: { files: { '/etc/bind/named.conf.local': '//\n// Do any local configuration here\n//\n' }, service: 'named', autostart: true },
  'docker.io': { service: 'docker', autostart: true },
  mc: {},
  curl: {},
  'net-tools': {},
};
const SERVICE_ALIAS: Record<string, string> = { sshd: 'ssh', bind9: 'named', 'apache2.service': 'apache2', 'ssh.service': 'ssh' };

export class LinuxSim implements Simulator {
  hostname: string;
  cwd = '/root';
  files = new Map<string, FileNode>();
  ifaces: Iface[];
  gateway: string | null;
  hosts: string[];
  users = new Map<string, Set<string>>();
  groups = new Set<string>(['root', 'sudo', 'users']);
  packages = new Set<string>();
  services = new Map<string, Service>();
  ipForward = 0;
  history: string[] = [];

  constructor(o: LinuxOptions) {
    this.hostname = o.hostname ?? 'server';
    this.ifaces = (o.ifaces ?? [{ name: 'enp0s3', addr: '192.168.1.57/24' }]).map((i) => ({ ...i, up: true }));
    this.gateway = o.gateway ?? null;
    this.hosts = o.hosts ?? [];
    this.users.set('root', new Set(['root']));
    for (const d of ['/', '/root', '/etc', '/etc/network', '/home', '/var', '/var/www', '/tmp', '/data', '/proc', '/proc/sys', '/proc/sys/net', '/proc/sys/net/ipv4'])
      this.files.set(d, { dir: true, content: '', mode: 0o755, owner: 'root', group: 'root' });
    this.write('/etc/hostname', `${this.hostname}\n`);
    this.write('/etc/hosts', `127.0.0.1\tlocalhost\n127.0.1.1\t${this.hostname}\n`);
    this.write('/etc/sysctl.conf', '#\n# /etc/sysctl.conf - Configuration file for setting system variables\n#\n# Uncomment the next line to enable packet forwarding for IPv4\n#net.ipv4.ip_forward=1\n');
    this.write('/etc/resolv.conf', 'nameserver 127.0.0.53\n');
    // výchozí /etc/network/interfaces podle rozhraní (statická adresa, nebo DHCP)
    this.write(
      '/etc/network/interfaces',
      '# This file describes the network interfaces available on your system\n# and how to activate them. For more information, see interfaces(5).\n\nsource /etc/network/interfaces.d/*\n\n# The loopback network interface\nauto lo\niface lo inet loopback\n' +
        this.ifaces
          .map((i, k) =>
            i.addr && i.addr !== '192.168.1.57/24'
              ? `\n${k === 0 ? '# The primary network interface\n' : ''}auto ${i.name}\niface ${i.name} inet static\n    address ${i.addr}${k === 0 && this.gateway ? `\n    gateway ${this.gateway}` : ''}\n`
              : `\n${k === 0 ? '# The primary network interface\n' : ''}allow-hotplug ${i.name}\niface ${i.name} inet dhcp\n`,
          )
          .join(''),
    );
    for (const [p, c] of Object.entries(o.files ?? {})) this.write(p, c);
    for (const p of o.packages ?? []) this.install(p);
  }

  // ---------- soubory ----------

  abs(p: string): string {
    if (!p) return this.cwd;
    let path = p.startsWith('/') ? p : `${this.cwd === '/' ? '' : this.cwd}/${p}`;
    if (p === '~' || p.startsWith('~/')) path = `/root${p.slice(1)}`;
    const parts: string[] = [];
    for (const seg of path.split('/')) {
      if (!seg || seg === '.') continue;
      if (seg === '..') parts.pop();
      else parts.push(seg);
    }
    return '/' + parts.join('/');
  }
  parent(p: string) {
    const i = p.lastIndexOf('/');
    return i <= 0 ? '/' : p.slice(0, i);
  }
  mkdirp(p: string) {
    const parts = p.split('/').filter(Boolean);
    let cur = '';
    for (const seg of parts) {
      cur += '/' + seg;
      if (!this.files.has(cur)) this.files.set(cur, { dir: true, content: '', mode: 0o755, owner: 'root', group: 'root' });
    }
  }
  write(p: string, content: string, append = false) {
    this.mkdirp(this.parent(p));
    const f = this.files.get(p);
    if (f && !f.dir) f.content = append ? f.content + content : content;
    else this.files.set(p, { dir: false, content, mode: 0o644, owner: 'root', group: 'root' });
  }
  read(p: string): string | null {
    const f = this.files.get(p);
    return f && !f.dir ? f.content : null;
  }

  saveFile(path: string, content: string): string | null {
    const p = this.abs(path);
    const par = this.files.get(this.parent(p));
    if (!par || !par.dir) return `[ Chyba při zápisu ${path}: Adresář neexistuje ]`;
    this.write(p, content.endsWith('\n') ? content : content + '\n');
    return null;
  }

  // ---------- síť ----------

  /** Uplatní /etc/network/interfaces (Debian) */
  interfacesApply(only?: string): string[] {
    const text = this.read('/etc/network/interfaces') ?? '';
    for (const ifc of this.ifaces) {
      if (only && ifc.name !== only) continue;
      const m = text.match(new RegExp(`iface\\s+${ifc.name}\\s+inet\\s+(static|dhcp)([\\s\\S]*?)(?=\\n\\s*(?:auto|allow-hotplug|iface)\\b|$)`));
      if (!m) continue;
      if (m[1] === 'dhcp') {
        ifc.addr = ifc.addr ?? '192.168.1.57/24';
        continue;
      }
      const body = m[2];
      const address = body.match(/address\s+([\d./]+)/)?.[1];
      const netmask = body.match(/netmask\s+([\d.]+)/)?.[1];
      if (!address) return [`ifup: missing address for ${ifc.name}`];
      ifc.addr = address.includes('/') ? address : `${address}/${netmask ? maskToPrefix(netmask) : 24}`;
      const gw = body.match(/gateway\s+([\d.]+)/)?.[1];
      if (gw) this.gateway = gw;
    }
    return [];
  }

  reachable(ip: string): boolean {
    if (this.ifaces.some((i) => i.addr?.split('/')[0] === ip)) return true;
    const local = this.ifaces.find((i) => i.up && i.addr && sameNet(i.addr, ip));
    if (local) return ip === this.gateway || this.hosts.includes(ip);
    return !!this.gateway && this.ifaces.some((i) => i.addr && sameNet(i.addr, this.gateway!)) && this.hosts.includes(ip);
  }

  // ---------- balíčky a služby ----------

  install(pkg: string) {
    const def = PACKAGES[pkg];
    if (!def) return false;
    this.packages.add(pkg);
    for (const [p, c] of Object.entries(def.files ?? {})) if (!this.files.has(p)) this.write(p, c);
    if (def.service) this.services.set(def.service, { active: !!def.autostart && this.serviceOk(def.service) === null, enabled: true });
    return true;
  }

  /** Kontrola konfigurace služby – null = v pořádku, jinak chybová hláška */
  serviceOk(name: string): string | null {
    if (name === 'isc-dhcp-server') {
      const ifs = (this.read('/etc/default/isc-dhcp-server') ?? '').match(/^INTERFACESv4="([^"]*)"/m)?.[1]?.trim();
      if (!ifs) return 'No subnet declaration for interfaces – INTERFACESv4 je prázdné';
      const ifc = this.ifaces.find((i) => i.name === ifs.split(/\s+/)[0]);
      if (!ifc?.addr) return `Not configured to listen on any interfaces (${ifs} nemá adresu)`;
      const conf = dhcpSubnets(this.read('/etc/dhcp/dhcpd.conf') ?? '');
      if (conf.error) return conf.error;
      const sub = conf.subnets.find((s) => sameNet(ifc.addr!, s.net) && Number(ifc.addr!.split('/')[1]) === maskToPrefix(s.mask));
      if (!sub) return `No subnet declaration for ${ifc.name} (${ifc.addr.split('/')[0]})`;
      for (const s of conf.subnets) {
        const pref = `${s.net}/${maskToPrefix(s.mask)}`;
        if (s.range && !(sameNet(pref, s.range[0]) && sameNet(pref, s.range[1]))) return `Address range ${s.range[0]} to ${s.range[1]} not on net ${s.net}/${s.mask}!`;
      }
      return null;
    }
    return null;
  }

  // ---------- příkazy ----------

  prompt() {
    const dir = this.cwd === '/root' ? '~' : this.cwd;
    return `root@${this.hostname}:${dir}#`;
  }

  exec(raw: string): TermResult {
    const line = raw.trim();
    if (!line) return { out: [] };
    this.history.push(line);
    // přesměrování echo "…" > soubor
    const redir = line.match(/^(?:sudo\s+)?echo\s+(-e\s+)?(["']?)([\s\S]*?)\2\s*(>>?)\s*(\S+)$/);
    if (redir) {
      const p = this.abs(redir[5]);
      const par = this.files.get(this.parent(p));
      if (!par?.dir) return { out: [`bash: ${redir[5]}: Adresář nebo soubor neexistuje`] };
      const text = redir[1] ? redir[3].replace(/\\n/g, '\n') : redir[3];
      this.write(p, text + '\n', redir[4] === '>>');
      return { out: [] };
    }
    let args = tokenize(line);
    if (args[0] === 'sudo') args = args.slice(1);
    const [cmd, ...a] = args;
    const flags = a.filter((x) => x.startsWith('-'));
    const pos = a.filter((x) => !x.startsWith('-'));
    switch (cmd) {
      case 'help':
        return {
          out: [
            'Podporované příkazy (simulace):',
            '  ls, cd, pwd, cat, mkdir, touch, cp, rm, echo "…" > soubor',
            '  nano / vim / vi <soubor>  – editor',
            '  ip a, ip r, ip addr add, ping, systemctl restart networking, ifup/ifdown',
            '  hostname, hostnamectl set-hostname',
            '  apt update, apt install <balíček>',
            '  systemctl start|stop|restart|enable|disable|status <služba>',
            '  useradd, adduser, groupadd, usermod -aG, passwd, id, groups',
            '  chmod, chown, chgrp, sysctl, curl, whoami, clear',
          ],
        };
      case 'clear':
        return { out: [], clear: true };
      case 'whoami':
        return { out: ['root'] };
      case 'pwd':
        return { out: [this.cwd] };
      case 'history':
        return { out: this.history.map((h, i) => `${String(i + 1).padStart(4)}  ${h}`) };
      case 'cd': {
        const p = this.abs(pos[0] ?? '/root');
        if (!this.files.get(p)?.dir) return { out: [`bash: cd: ${pos[0]}: Adresář nebo soubor neexistuje`] };
        this.cwd = p;
        return { out: [] };
      }
      case 'ls':
      case 'll': {
        const long = cmd === 'll' || flags.some((f) => f.includes('l'));
        const target = this.abs(pos[0] ?? this.cwd);
        const node = this.files.get(target);
        if (!node) return { out: [`ls: nelze přistoupit k '${pos[0]}': Adresář nebo soubor neexistuje`] };
        const entries = node.dir
          ? [...this.files.keys()].filter((k) => k !== target && this.parent(k) === target).sort()
          : [target];
        if (!long) return { out: [entries.map((e) => e.split('/').pop()).join('  ')].filter(Boolean) };
        if (flags.some((f) => f.includes('d'))) return { out: [this.lsLine(target)] };
        return { out: entries.map((e) => this.lsLine(e)) };
      }
      case 'cat': {
        if (!pos.length) return { out: [] };
        const p = this.abs(pos[0]);
        if (p === '/proc/sys/net/ipv4/ip_forward') return { out: [String(this.ipForward)] };
        const f = this.files.get(p);
        if (!f) return { out: [`cat: ${pos[0]}: Adresář nebo soubor neexistuje`] };
        if (f.dir) return { out: [`cat: ${pos[0]}: Je adresářem`] };
        return { out: f.content.replace(/\n$/, '').split('\n') };
      }
      case 'mkdir': {
        for (const d of pos) {
          const p = this.abs(d);
          if (this.files.has(p)) {
            if (!flags.includes('-p')) return { out: [`mkdir: nelze vytvořit adresář „${d}“: Soubor existuje`] };
            continue;
          }
          if (!flags.includes('-p') && !this.files.get(this.parent(p))?.dir) return { out: [`mkdir: nelze vytvořit adresář „${d}“: Adresář nebo soubor neexistuje`] };
          this.mkdirp(p);
        }
        return { out: [] };
      }
      case 'touch':
        for (const f of pos) if (!this.files.has(this.abs(f))) this.write(this.abs(f), '');
        return { out: [] };
      case 'rm': {
        for (const f of pos) {
          const p = this.abs(f);
          if (!this.files.has(p)) return { out: [`rm: nelze odstranit '${f}': Adresář nebo soubor neexistuje`] };
          for (const k of [...this.files.keys()]) if (k === p || k.startsWith(p + '/')) this.files.delete(k);
        }
        return { out: [] };
      }
      case 'cp': {
        const src = this.read(this.abs(pos[0] ?? ''));
        if (src === null || !pos[1]) return { out: [`cp: nelze získat informace o '${pos[0] ?? ''}': Adresář nebo soubor neexistuje`] };
        this.write(this.abs(pos[1]), src);
        return { out: [] };
      }
      case 'nano':
      case 'vim':
      case 'vi':
      case 'mcedit':
      case 'pico': {
        if (!pos[0]) return { out: [`${cmd}: chybí název souboru`] };
        const p = this.abs(pos[0]);
        if (this.files.get(p)?.dir) return { out: [`${cmd}: ${pos[0]} je adresář`] };
        return { out: [], editor: { path: p, content: this.read(p) ?? '' } };
      }
      case 'hostname':
        if (pos[0]) {
          this.hostname = pos[0];
          return { out: [] };
        }
        return { out: [this.hostname] };
      case 'hostnamectl':
        if (pos[0] === 'set-hostname' && pos[1]) {
          this.hostname = pos[1];
          this.write('/etc/hostname', `${pos[1]}\n`);
          return { out: [] };
        }
        return { out: [` Static hostname: ${this.hostname}`, 'Operating System: Debian GNU/Linux 13 (trixie)'] };
      case 'ip':
        return this.ipCmd(a);
      case 'ifconfig':
        if (!this.packages.has('net-tools')) return { out: ['bash: ifconfig: příkaz nenalezen (v Debianu použij ip a, případně apt install net-tools)'] };
        return { out: this.ifaces.flatMap((i) => [`${i.name}: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500`, i.addr ? `        inet ${i.addr.split('/')[0]}  netmask ${prefixToMask(Number(i.addr.split('/')[1]))}` : '', '']).filter((x) => x !== '') };
      case 'ping': {
        const target = pos.find((x) => isIp(x) || /^[a-z]/i.test(x));
        if (!target) return { out: ['ping: usage error: Je potřeba zadat cílovou adresu'] };
        if (!isIp(target)) return { out: [`ping: ${target}: Dočasné selhání při překladu názvu`] };
        if (!this.ifaces.some((i) => i.addr && (sameNet(i.addr, target) || !!this.gateway))) return { out: ['ping: connect: Síť není dostupná'] };
        const ok = this.reachable(target);
        const out = [`PING ${target} (${target}) 56(84) bytes of data.`];
        for (let i = 1; i <= 4; i++) out.push(ok ? `64 bytes from ${target}: icmp_seq=${i} ttl=64 time=0.${300 + i * 41} ms` : `From ${this.ifaces[0].addr?.split('/')[0] ?? '?'} icmp_seq=${i} Destination Host Unreachable`);
        out.push('', `--- ${target} ping statistics ---`, `4 packets transmitted, ${ok ? 4 : 0} received, ${ok ? 0 : 100}% packet loss`);
        return { out };
      }
      case 'ifup':
      case 'ifdown': {
        const name = pos[0];
        const ifc = this.ifaces.find((i) => i.name === name);
        if (!ifc) return { out: [`${cmd}: unknown interface ${name}`] };
        if (cmd === 'ifdown') {
          ifc.up = false;
          return { out: [] };
        }
        ifc.up = true;
        return { out: this.interfacesApply(name) };
      }
      case 'systemctl':
      case 'service':
        return this.systemctl(cmd === 'service' ? [pos[1] ?? '', pos[0] ?? ''] : pos, flags);
      case 'apt':
      case 'apt-get':
        if (pos[0] === 'update') return { out: ['Načítání seznamů balíků… Hotovo', 'Všechny balíky jsou aktuální.'] };
        if (pos[0] === 'install') {
          const out: string[] = [];
          for (const p of pos.slice(1)) {
            if (!PACKAGES[p]) return { out: [`E: Nelze najít balík ${p}`] };
            if (this.packages.has(p)) out.push(`${p} je již nejnovější verze.`);
            else {
              this.install(p);
              out.push(`Nastavuje se ${p} …`);
            }
          }
          return { out };
        }
        if (pos[0] === 'remove' || pos[0] === 'purge') {
          for (const p of pos.slice(1)) {
            this.packages.delete(p);
            const s = PACKAGES[p]?.service;
            if (s) this.services.delete(s);
          }
          return { out: [] };
        }
        return { out: ['Použití: apt install | remove | update'] };
      case 'groupadd':
        if (!pos[0]) return { out: ['Použití: groupadd SKUPINA'] };
        if (this.groups.has(pos[0])) return { out: [`groupadd: skupina „${pos[0]}“ již existuje`] };
        this.groups.add(pos[0]);
        return { out: [] };
      case 'useradd':
      case 'adduser': {
        // adduser jan skupina = přidání do skupiny (Debian)
        if (cmd === 'adduser' && pos.length === 2 && this.users.has(pos[0])) return this.addToGroup(pos[0], pos[1]);
        const gi = a.findIndex((x) => x === '-G' || x === '--groups');
        const extra = gi >= 0 ? (a[gi + 1] ?? '').split(',').filter(Boolean) : [];
        const name = pos.filter((p) => gi < 0 || p !== a[gi + 1]).pop();
        if (!name) return { out: [`Použití: ${cmd} JMÉNO`] };
        if (this.users.has(name)) return { out: [`${cmd}: uživatel „${name}“ již existuje`] };
        for (const g of extra) if (!this.groups.has(g)) return { out: [`useradd: skupina „${g}“ neexistuje`] };
        this.users.set(name, new Set([name, ...extra]));
        this.groups.add(name);
        if (cmd === 'adduser' || flags.includes('-m')) {
          this.mkdirp(`/home/${name}`);
          Object.assign(this.files.get(`/home/${name}`)!, { owner: name, group: name, mode: 0o750 });
        }
        return { out: cmd === 'adduser' ? [`Přidává se uživatel „${name}“ …`, `Vytváří se domovský adresář „/home/${name}“ …`, 'Nové heslo: ', 'passwd: heslo bylo úspěšně aktualizováno'] : [] };
      }
      case 'usermod': {
        const gi = a.findIndex((x) => /^-a?G$|^-aG$/.test(x));
        if (gi < 0 || !a[gi + 1] || !a[gi + 2]) return { out: ['Použití: usermod -aG SKUPINA UŽIVATEL'] };
        if (!a.includes('-a') && !a[gi].includes('a')) {
          const u = this.users.get(a[gi + 2]);
          if (u) for (const g of [...u]) if (g !== a[gi + 2]) u.delete(g);
        }
        for (const g of a[gi + 1].split(',')) {
          const r = this.addToGroup(a[gi + 2], g);
          if (r.out.length) return r;
        }
        return { out: [] };
      }
      case 'gpasswd':
        if (a[0] === '-a' && a[1] && a[2]) return this.addToGroup(a[1], a[2]);
        return { out: ['Použití: gpasswd -a UŽIVATEL SKUPINA'] };
      case 'passwd':
        if (pos[0] && !this.users.has(pos[0])) return { out: [`passwd: uživatel „${pos[0]}“ neexistuje`] };
        return { out: ['Nové heslo: ', 'Opakujte nové heslo: ', 'passwd: heslo bylo úspěšně aktualizováno'] };
      case 'id':
      case 'groups': {
        const u = pos[0] ?? 'root';
        const g = this.users.get(u);
        if (!g) return { out: [`${cmd}: „${u}“: no such user`] };
        return { out: [cmd === 'id' ? `uid=1001(${u}) gid=1001(${u}) skupiny=${[...g].map((x) => x).join(',')}` : `${u} : ${[...g].join(' ')}`] };
      }
      case 'chmod': {
        const [mode, ...paths] = pos;
        if (!mode || !paths.length) return { out: ['chmod: chybí operand'] };
        for (const p of paths) {
          const f = this.files.get(this.abs(p));
          if (!f) return { out: [`chmod: nelze přistoupit k '${p}': Adresář nebo soubor neexistuje`] };
          const m = applyMode(f.mode, mode);
          if (m === null) return { out: [`chmod: neplatný režim: „${mode}“`] };
          f.mode = m;
        }
        return { out: [] };
      }
      case 'chown':
      case 'chgrp': {
        const [spec, ...paths] = pos;
        if (!spec || !paths.length) return { out: [`${cmd}: chybí operand`] };
        const [owner, group] = cmd === 'chgrp' ? [undefined, spec] : spec.split(':');
        if (owner && !this.users.has(owner)) return { out: [`${cmd}: neplatný uživatel: „${spec}“`] };
        if (group && !this.groups.has(group)) return { out: [`${cmd}: neplatná skupina: „${spec}“`] };
        for (const p of paths) {
          const f = this.files.get(this.abs(p));
          if (!f) return { out: [`${cmd}: nelze přistoupit k '${p}': Adresář nebo soubor neexistuje`] };
          if (owner) f.owner = owner;
          if (group) f.group = group;
        }
        return { out: [] };
      }
      case 'sysctl': {
        if (flags.includes('-p')) {
          const v = (this.read('/etc/sysctl.conf') ?? '').match(/^\s*net\.ipv4\.ip_forward\s*=\s*(\d)/m)?.[1];
          if (v !== undefined) {
            this.ipForward = Number(v);
            return { out: [`net.ipv4.ip_forward = ${v}`] };
          }
          return { out: [] };
        }
        const kv = pos[0]?.match(/^net\.ipv4\.ip_forward(?:=(\d))?$/);
        if (!kv) return { out: [`sysctl: cannot stat /proc/sys/${(pos[0] ?? '').replace(/\./g, '/')}: Adresář nebo soubor neexistuje`] };
        if (kv[1] !== undefined) {
          if (!flags.includes('-w')) return { out: [`sysctl: "${pos[0]}" musí mít přepínač -w`] };
          this.ipForward = Number(kv[1]);
        }
        return { out: [`net.ipv4.ip_forward = ${this.ipForward}`] };
      }
      case 'curl': {
        const url = pos[0] ?? '';
        const host = url.replace(/^https?:\/\//, '').split(/[:/]/)[0];
        if (!['localhost', '127.0.0.1', ...this.ifaces.map((i) => i.addr?.split('/')[0])].includes(host)) return { out: [`curl: (7) Failed to connect to ${host} port 80`] };
        const web = this.services.get('apache2') ?? this.services.get('nginx');
        if (!web?.active) return { out: [`curl: (7) Failed to connect to ${host} port 80: Spojení odmítnuto`] };
        return { out: (this.read('/var/www/html/index.html') ?? '').replace(/\n$/, '').split('\n') };
      }
      case 'exit':
      case 'logout':
        return { out: ['(v simulaci zůstáváš přihlášený)'] };
      default:
        return { out: [`bash: ${cmd}: příkaz nenalezen (napiš help)`] };
    }
  }

  lsLine(p: string) {
    const f = this.files.get(p)!;
    return `${PERM(f.mode, f.dir)} 1 ${f.owner.padEnd(5)} ${f.group.padEnd(7)} ${String(f.dir ? 4096 : f.content.length).padStart(5)} ${p.split('/').pop() || '/'}`;
  }

  addToGroup(user: string, group: string): TermResult {
    const u = this.users.get(user);
    if (!u) return { out: [`uživatel „${user}“ neexistuje`] };
    if (!this.groups.has(group)) return { out: [`skupina „${group}“ neexistuje`] };
    u.add(group);
    return { out: [] };
  }

  ipCmd(a: string[]): TermResult {
    const args = a.filter((x) => !['-4', '-c', '--color'].includes(x));
    const brief = args.includes('-br');
    const rest = args.filter((x) => x !== '-br');
    const sub = rest[0] ?? '';
    if (/^a(d(d(r(e(s(s)?)?)?)?)?)?$/.test(sub) && rest[1] === 'add') {
      const addr = rest[2];
      const dev = rest[rest.indexOf('dev') + 1];
      const ifc = this.ifaces.find((i) => i.name === dev);
      if (!addr || !ifc) return { out: ['Cannot find device'] };
      ifc.addr = addr.includes('/') ? addr : `${addr}/32`;
      return { out: [] };
    }
    if (/^a(d(d(r(e(s(s)?)?)?)?)?)?$/.test(sub) || sub === '') {
      if (brief) return { out: ['lo               UNKNOWN        127.0.0.1/8', ...this.ifaces.map((i) => `${i.name.padEnd(16)} ${(i.up ? 'UP' : 'DOWN').padEnd(14)} ${i.addr ?? ''}`)] };
      const out = ['1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 state UNKNOWN', '    inet 127.0.0.1/8 scope host lo'];
      this.ifaces.forEach((i, k) => {
        out.push(`${k + 2}: ${i.name}: <BROADCAST,MULTICAST${i.up ? ',UP,LOWER_UP' : ''}> mtu 1500 state ${i.up ? 'UP' : 'DOWN'}`);
        if (i.addr) out.push(`    inet ${i.addr} scope global ${i.name}`);
      });
      return { out };
    }
    if (/^r(o(u(t(e)?)?)?)?$/.test(sub)) {
      const out: string[] = [];
      if (this.gateway) out.push(`default via ${this.gateway} dev ${this.ifaces.find((i) => i.addr && sameNet(i.addr, this.gateway!))?.name ?? this.ifaces[0].name}`);
      for (const i of this.ifaces) if (i.addr) out.push(`${netOf(i.addr)} dev ${i.name} proto kernel scope link src ${i.addr.split('/')[0]}`);
      return { out };
    }
    if (sub === 'link') return { out: this.ifaces.map((i, k) => `${k + 2}: ${i.name}: <BROADCAST,MULTICAST${i.up ? ',UP' : ''}> state ${i.up ? 'UP' : 'DOWN'}`) };
    return { out: ['Object "' + sub + '" is unknown, try "ip help".'] };
  }

  systemctl(pos: string[], flags: string[]): TermResult {
    const [action, rawName] = pos;
    if (!action) return { out: ['Použití: systemctl start|stop|restart|enable|disable|status SLUŽBA'] };
    if (!rawName) return { out: ['Too few arguments.'] };
    const name = SERVICE_ALIAS[rawName] ?? rawName.replace(/\.service$/, '');
    if (name === 'networking') {
      if (action === 'restart' || action === 'start') return { out: this.interfacesApply() };
      return { out: [] };
    }
    const svc = this.services.get(name);
    if (!svc) return { out: [`Failed to ${action} ${name}.service: Unit ${name}.service not found.`] };
    const now = flags.includes('--now');
    switch (action) {
      case 'start':
      case 'restart':
      case 'reload': {
        const err = this.serviceOk(name);
        if (err) {
          svc.active = false;
          return { out: [`Job for ${name}.service failed because the control process exited with error code.`, `See "systemctl status ${name}.service" and "journalctl -xeu ${name}.service" for details.`] };
        }
        svc.active = true;
        return { out: [] };
      }
      case 'stop':
        svc.active = false;
        return { out: [] };
      case 'enable':
        svc.enabled = true;
        if (now) return this.systemctl(['start', name], []);
        return { out: [`Created symlink /etc/systemd/system/multi-user.target.wants/${name}.service.`] };
      case 'disable':
        svc.enabled = false;
        if (now) svc.active = false;
        return { out: [] };
      case 'status': {
        const err = svc.active ? null : this.serviceOk(name);
        return {
          out: [
            `● ${name}.service`,
            `     Loaded: loaded (/lib/systemd/system/${name}.service; ${svc.enabled ? 'enabled' : 'disabled'})`,
            `     Active: ${svc.active ? 'active (running)' : err ? 'failed (Result: exit-code)' : 'inactive (dead)'}`,
            ...(err && !svc.active ? [`     ${err}`] : []),
          ],
        };
      }
      case 'is-active':
        return { out: [svc.active ? 'active' : 'inactive'] };
      default:
        return { out: [`Unknown command verb ${action}.`] };
    }
  }
}

// ---------- pomocné funkce ----------

function tokenize(line: string): string[] {
  const out: string[] = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) out.push(m[1] ?? m[2] ?? m[3]);
  return out;
}

function prefixToMask(p: number) {
  const m = p === 0 ? 0 : (0xffffffff << (32 - p)) >>> 0;
  return [24, 16, 8, 0].map((s) => (m >>> s) & 255).join('.');
}

function netOf(cidr: string) {
  const [a, p] = cidr.split('/');
  const m = Number(p) === 0 ? 0 : (0xffffffff << (32 - Number(p))) >>> 0;
  const n = (ipToInt(a) & m) >>> 0;
  return `${[24, 16, 8, 0].map((s) => (n >>> s) & 255).join('.')}/${p}`;
}

function dhcpSubnets(text: string): { subnets: { net: string; mask: string; range?: [string, string]; routers?: string }[]; error?: string } {
  const opens = (text.match(/{/g) ?? []).length;
  const closes = (text.match(/}/g) ?? []).length;
  if (opens !== closes) return { subnets: [], error: '/etc/dhcp/dhcpd.conf: expecting a } – neuzavřená složená závorka' };
  const subnets: { net: string; mask: string; range?: [string, string]; routers?: string }[] = [];
  const re = /subnet\s+([\d.]+)\s+netmask\s+([\d.]+)\s*{([^}]*)}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const body = m[3].replace(/#.*$/gm, '');
    for (const stmt of body.split(';').map((x) => x.trim()).filter(Boolean)) {
      if (!/^(range|option|default-lease-time|max-lease-time|host|authoritative)/.test(stmt)) return { subnets: [], error: `/etc/dhcp/dhcpd.conf: unknown statement „${stmt.split(/\s+/)[0]}“` };
    }
    const r = body.match(/range\s+([\d.]+)\s+([\d.]+)\s*;/);
    if (/range/.test(body) && !r) return { subnets: [], error: '/etc/dhcp/dhcpd.conf: semicolon expected (range)' };
    subnets.push({ net: m[1], mask: m[2], range: r ? [r[1], r[2]] : undefined, routers: body.match(/option\s+routers\s+([\d.]+)\s*;/)?.[1] });
  }
  return { subnets };
}

function applyMode(cur: number, mode: string): number | null {
  if (/^[0-7]{3,4}$/.test(mode)) return parseInt(mode.slice(-3), 8);
  const m = mode.match(/^([ugoa]*)([+\-=])([rwx]+)$/);
  if (!m) return null;
  const who = m[1] || 'a';
  const bits = (m[3].includes('r') ? 4 : 0) | (m[3].includes('w') ? 2 : 0) | (m[3].includes('x') ? 1 : 0);
  let v = cur;
  for (const [ch, sh] of [
    ['u', 6],
    ['g', 3],
    ['o', 0],
  ] as const) {
    if (!who.includes(ch) && !who.includes('a')) continue;
    if (m[2] === '+') v |= bits << sh;
    else if (m[2] === '-') v &= ~(bits << sh);
    else v = (v & ~(7 << sh)) | (bits << sh);
  }
  return v;
}

// ---------- úlohy ----------

const has = (s: string | null, re: RegExp) => !!s && re.test(s);

export const LINUX_TASKS: TermTask<LinuxSim>[] = [
  {
    id: 'lx-intnet',
    title: 'Druhá síťovka ve vnitřní síti VirtualBoxu',
    goal: 'Debian 13 má kartu enp0s3 (NAT, adresa z DHCP) a druhou kartu enp0s8 připojenou do vnitřní sítě. Nastav enp0s8 trvale statickou adresu a zapni ji.',
    steps: ['enp0s8: adresa 192.168.100.1/24 (bez brány – ve vnitřní síti není router)', 'enp0s3 zůstane na DHCP', 'rozhraní zapnout bez restartu serveru', 'ověř: ip a, ping 192.168.100.20 (klient)'],
    hints: ['Konfigurace sítě v Debianu je v /etc/network/interfaces', 'Přidej blok: auto enp0s8 / iface enp0s8 inet static / address 192.168.100.1/24', 'Zapni rozhraní: ifup enp0s8 (nebo systemctl restart networking)'],
    solution: 'nano /etc/network/interfaces\n\nauto enp0s8\niface enp0s8 inet static\n    address 192.168.100.1/24\n\nifup enp0s8\nip a\nping 192.168.100.20',
    create: () =>
      new LinuxSim({
        hostname: 'srv1',
        ifaces: [
          { name: 'enp0s3', addr: '10.0.2.15/24' },
          { name: 'enp0s8', addr: null },
        ],
        gateway: '10.0.2.2',
        hosts: ['10.0.2.2', '192.168.100.20'],
        files: { '/etc/network/interfaces': '# The loopback network interface\nauto lo\niface lo inet loopback\n\n# The primary network interface\nallow-hotplug enp0s3\niface enp0s3 inet dhcp\n' },
      }),
    check: (s) => {
      const f = s.read('/etc/network/interfaces');
      return [
        { label: 'enp0s8 je „inet static“', ok: has(f, /iface\s+enp0s8\s+inet\s+static/) },
        { label: 'adresa 192.168.100.1/24', ok: has(f, /address\s+192\.168\.100\.1\/24/) || (has(f, /address\s+192\.168\.100\.1\b/) && has(f, /netmask\s+255\.255\.255\.0/)) },
        { label: 'enp0s3 zůstává na DHCP', ok: has(f, /iface\s+enp0s3\s+inet\s+dhcp/) },
        { label: 'enp0s8 je zapnuté s adresou 192.168.100.1/24', ok: s.ifaces[1].addr === '192.168.100.1/24' && s.ifaces[1].up },
      ];
    },
  },
  {
    id: 'lx-interfaces',
    title: 'Statická IP adresa (/etc/network/interfaces)',
    goal: 'Server s Debianem 13 má rozhraní enp0s3 v režimu DHCP. Nastav statickou adresu a restartuj síť.',
    steps: ['adresa 192.168.100.20, maska 255.255.255.0', 'brána 192.168.100.1', 'uplatnit změnu (restart sítě)'],
    hints: ['Konfigurace je v souboru /etc/network/interfaces', 'Změň „iface enp0s3 inet dhcp“ na „inet static“ a pod to přidej odsazené řádky address, netmask, gateway', 'Pak: systemctl restart networking (nebo ifdown enp0s3 a ifup enp0s3)'],
    solution: 'nano /etc/network/interfaces\n\nauto enp0s3\niface enp0s3 inet static\n    address 192.168.100.20\n    netmask 255.255.255.0\n    gateway 192.168.100.1\n\nsystemctl restart networking\nip a',
    create: () =>
      new LinuxSim({
        hostname: 'deb1',
        gateway: '192.168.1.1',
        hosts: ['192.168.100.1'],
        files: { '/etc/network/interfaces': '# The loopback network interface\nauto lo\niface lo inet loopback\n\n# The primary network interface\nallow-hotplug enp0s3\niface enp0s3 inet dhcp\n' },
      }),
    check: (s) => {
      const f = s.read('/etc/network/interfaces');
      return [
        { label: 'enp0s3 je „inet static“', ok: has(f, /iface\s+enp0s3\s+inet\s+static/) },
        { label: 'adresa 192.168.100.20 s maskou /24', ok: has(f, /address\s+192\.168\.100\.20(\/24)?\b/) && (has(f, /address\s+192\.168\.100\.20\/24/) || has(f, /netmask\s+255\.255\.255\.0/)) },
        { label: 'brána 192.168.100.1', ok: has(f, /gateway\s+192\.168\.100\.1\b/) },
        { label: 'změna je uplatněná', ok: s.ifaces[0].addr === '192.168.100.20/24' && s.gateway === '192.168.100.1' },
      ];
    },
  },
  {
    id: 'lx-hostname',
    title: 'Název serveru',
    goal: 'Přejmenuj server trvale na srv-web a doplň nový název do /etc/hosts.',
    steps: ['název srv-web (přežije restart)', 'v /etc/hosts řádek 127.0.1.1 srv-web'],
    hints: ['Trvalé nastavení: hostnamectl set-hostname …', 'Soubor /etc/hosts uprav v nano – starý název nahraď novým'],
    solution: 'hostnamectl set-hostname srv-web\nnano /etc/hosts   (127.0.1.1  srv-web)\nhostname',
    create: () => new LinuxSim({ hostname: 'debian' }),
    check: (s) => [
      { label: 'hostname je srv-web', ok: s.hostname === 'srv-web' },
      { label: '/etc/hostname obsahuje srv-web (trvale)', ok: (s.read('/etc/hostname') ?? '').trim() === 'srv-web' },
      { label: '/etc/hosts: 127.0.1.1 srv-web', ok: has(s.read('/etc/hosts'), /^127\.0\.1\.1\s+srv-web\b/m) },
    ],
  },
  {
    id: 'lx-users',
    title: 'Uživatelé, skupina a sdílený adresář',
    goal: 'Vytvoř skupinu ucetni a uživatele jan a petr (s domovským adresářem), oba ve skupině ucetni. Připrav adresář /data/ucetni, kam smí jen tato skupina.',
    steps: ['skupina ucetni', 'uživatelé jan a petr s domovským adresářem', 'oba jsou ve skupině ucetni', '/data/ucetni patří root:ucetni s právy 770'],
    hints: ['groupadd ucetni', 'useradd -m jan (nebo adduser jan)', 'usermod -aG ucetni jan', 'mkdir -p /data/ucetni, pak chown root:ucetni a chmod 770'],
    solution: 'groupadd ucetni\nuseradd -m jan\nuseradd -m petr\nusermod -aG ucetni jan\nusermod -aG ucetni petr\nmkdir -p /data/ucetni\nchown root:ucetni /data/ucetni\nchmod 770 /data/ucetni\nls -ld /data/ucetni',
    create: () => new LinuxSim({ hostname: 'srv1' }),
    check: (s) => {
      const d = s.files.get('/data/ucetni');
      return [
        { label: 'skupina ucetni existuje', ok: s.groups.has('ucetni') },
        { label: 'uživatel jan s /home/jan', ok: s.users.has('jan') && !!s.files.get('/home/jan')?.dir },
        { label: 'uživatel petr s /home/petr', ok: s.users.has('petr') && !!s.files.get('/home/petr')?.dir },
        { label: 'jan i petr jsou ve skupině ucetni', ok: !!s.users.get('jan')?.has('ucetni') && !!s.users.get('petr')?.has('ucetni') },
        { label: '/data/ucetni patří root:ucetni', ok: !!d?.dir && d.owner === 'root' && d.group === 'ucetni' },
        { label: 'práva 770 (rwxrwx---)', ok: d?.mode === 0o770 },
      ];
    },
  },
  {
    id: 'lx-web',
    title: 'Webový server Apache',
    goal: 'Nainstaluj Apache, nastav úvodní stránku s nadpisem „Obaly Štětí“ a zajisti, aby web běžel i po restartu.',
    steps: ['balíček apache2', 'soubor /var/www/html/index.html obsahuje „Obaly Štětí“', 'služba apache2 běží a je povolená', 'ověř: curl http://localhost'],
    hints: ['apt install apache2', 'Stránku uprav v nano, nebo: echo "<h1>Obaly Štětí</h1>" > /var/www/html/index.html', 'systemctl enable --now apache2'],
    solution: 'apt update\napt install apache2\necho "<h1>Obaly Štětí</h1>" > /var/www/html/index.html\nsystemctl enable --now apache2\ncurl http://localhost',
    create: () => new LinuxSim({ hostname: 'web1', ifaces: [{ name: 'enp0s3', addr: '192.168.100.30/24' }] }),
    check: (s) => [
      { label: 'apache2 je nainstalovaný', ok: s.packages.has('apache2') },
      { label: 'index.html obsahuje „Obaly Štětí“', ok: has(s.read('/var/www/html/index.html'), /Obaly Štětí/) },
      { label: 'služba apache2 běží', ok: !!s.services.get('apache2')?.active },
      { label: 'služba apache2 je povolená (enable)', ok: !!s.services.get('apache2')?.enabled },
    ],
  },
  {
    id: 'lx-ssh',
    title: 'SSH server bez přihlášení roota',
    goal: 'Zprovozni SSH server a zakaž v něm přihlášení uživatele root. Změnu uplatni.',
    steps: ['balíček openssh-server', 'v /etc/ssh/sshd_config: PermitRootLogin no (bez # na začátku)', 'restart služby ssh'],
    hints: ['apt install openssh-server', 'nano /etc/ssh/sshd_config – najdi řádek #PermitRootLogin, odstraň # a nastav no', 'systemctl restart ssh'],
    solution: 'apt install openssh-server\nnano /etc/ssh/sshd_config   →   PermitRootLogin no\nsystemctl restart ssh\nsystemctl status ssh',
    create: () => new LinuxSim({ hostname: 'srv1' }),
    check: (s) => {
      const restarted = s.history.slice(s.history.findIndex((h) => /sshd_config/.test(h))).some((h) => /systemctl\s+(restart|reload)\s+(ssh|sshd)|service\s+(ssh|sshd)\s+restart/.test(h));
      return [
        { label: 'openssh-server je nainstalovaný', ok: s.packages.has('openssh-server') },
        { label: 'PermitRootLogin no (aktivní řádek)', ok: has(s.read('/etc/ssh/sshd_config'), /^\s*PermitRootLogin\s+no\b/m) },
        { label: 'služba ssh restartována po úpravě', ok: restarted && !!s.services.get('ssh')?.active },
      ];
    },
  },
  {
    id: 'lx-dhcp',
    title: 'DHCP server (isc-dhcp-server)',
    goal: 'Server má adresu 192.168.100.10/24 na enp0s3. Zprovozni na něm DHCP server pro tuto síť.',
    steps: ['balíček isc-dhcp-server', 'INTERFACESv4="enp0s3" v /etc/default/isc-dhcp-server', 'v /etc/dhcp/dhcpd.conf: subnet 192.168.100.0/24, rozsah .100–.200, brána .1, DNS 192.168.100.10', 'služba isc-dhcp-server běží'],
    hints: ['apt install isc-dhcp-server (služba zatím nenaběhne – chybí konfigurace)', 'nano /etc/default/isc-dhcp-server → INTERFACESv4="enp0s3"', 'Do dhcpd.conf přidej blok subnet … netmask … { range …; option routers …; option domain-name-servers …; }', 'systemctl restart isc-dhcp-server, pak systemctl status isc-dhcp-server'],
    solution: 'apt install isc-dhcp-server\nnano /etc/default/isc-dhcp-server   →   INTERFACESv4="enp0s3"\nnano /etc/dhcp/dhcpd.conf\n\nsubnet 192.168.100.0 netmask 255.255.255.0 {\n  range 192.168.100.100 192.168.100.200;\n  option routers 192.168.100.1;\n  option domain-name-servers 192.168.100.10;\n}\n\nsystemctl restart isc-dhcp-server\nsystemctl status isc-dhcp-server',
    create: () => new LinuxSim({ hostname: 'srv1', ifaces: [{ name: 'enp0s3', addr: '192.168.100.10/24' }], gateway: '192.168.100.1' }),
    check: (s) => {
      const conf = s.read('/etc/dhcp/dhcpd.conf');
      return [
        { label: 'isc-dhcp-server je nainstalovaný', ok: s.packages.has('isc-dhcp-server') },
        { label: 'INTERFACESv4="enp0s3"', ok: has(s.read('/etc/default/isc-dhcp-server'), /^INTERFACESv4="enp0s3"/m) },
        { label: 'subnet 192.168.100.0 netmask 255.255.255.0', ok: has(conf, /subnet\s+192\.168\.100\.0\s+netmask\s+255\.255\.255\.0/) },
        { label: 'rozsah 192.168.100.100 – 192.168.100.200', ok: has(conf, /range\s+192\.168\.100\.100\s+192\.168\.100\.200\s*;/) },
        { label: 'brána (option routers) 192.168.100.1', ok: has(conf, /option\s+routers\s+192\.168\.100\.1\s*;/) },
        { label: 'služba běží', ok: !!s.services.get('isc-dhcp-server')?.active },
      ];
    },
  },
  {
    id: 'lx-forward',
    title: 'Linux jako router (směrování)',
    goal: 'Server má dvě síťovky (192.168.1.1/24 a 192.168.2.1/24). Zapni trvale přeposílání paketů mezi sítěmi.',
    steps: ['net.ipv4.ip_forward=1 v /etc/sysctl.conf (bez #)', 'nastavení uplatnit bez restartu', 'ověřit: cat /proc/sys/net/ipv4/ip_forward → 1'],
    hints: ['nano /etc/sysctl.conf – odkomentuj řádek #net.ipv4.ip_forward=1', 'Uplatnění souboru: sysctl -p'],
    solution: 'nano /etc/sysctl.conf   →   net.ipv4.ip_forward=1\nsysctl -p\ncat /proc/sys/net/ipv4/ip_forward',
    create: () =>
      new LinuxSim({
        hostname: 'router',
        ifaces: [
          { name: 'enp0s3', addr: '192.168.1.1/24' },
          { name: 'enp0s8', addr: '192.168.2.1/24' },
        ],
      }),
    check: (s) => [
      { label: 'v /etc/sysctl.conf je aktivní net.ipv4.ip_forward=1', ok: has(s.read('/etc/sysctl.conf'), /^\s*net\.ipv4\.ip_forward\s*=\s*1/m) },
      { label: 'přeposílání je zapnuté (ip_forward = 1)', ok: s.ipForward === 1 },
    ],
  },
];
