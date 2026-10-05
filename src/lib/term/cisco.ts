import type { Simulator, TermResult, TermTask } from './types';

/** Zjednodušený Cisco IOS (router 1941/4321, switch 2960) – stav se mění příkazy, výpis běžící konfigurace se z něj generuje */

type Mode = 'user' | 'priv' | 'config' | 'if' | 'subif' | 'range' | 'line' | 'vlan' | 'dhcp' | 'router';

interface IfState {
  name: string;
  ip?: string;
  mask?: string;
  shutdown: boolean;
  desc?: string;
  swMode?: 'access' | 'trunk';
  accessVlan: number;
  nativeVlan: number;
  allowed?: string;
  nonegotiate?: boolean;
  encap?: { vlan: number; native: boolean };
  nat?: 'inside' | 'outside';
  portSec?: { max: number; violation: string; sticky: boolean };
  portfast?: boolean;
}

interface LineState {
  password?: string;
  login: 'none' | 'line' | 'local';
  transport?: string;
}

const ipToInt = (ip: string) => ip.split('.').reduce((a, o) => ((a << 8) | Number(o)) >>> 0, 0);
const intToIp = (n: number) => [24, 16, 8, 0].map((s) => (n >>> s) & 255).join('.');
const isIp = (s: string) => /^(\d{1,3}\.){3}\d{1,3}$/.test(s) && s.split('.').every((o) => Number(o) <= 255);
const maskPrefix = (mask: string): number | null => {
  const b = ipToInt(mask).toString(2).padStart(32, '0');
  return /^1*0*$/.test(b) ? b.indexOf('0') === -1 ? 32 : b.indexOf('0') : null;
};
const netOf = (ip: string, mask: string) => intToIp((ipToInt(ip) & ipToInt(mask)) >>> 0);
const inNet = (ip: string, net: string, mask: string) => ((ipToInt(ip) & ipToInt(mask)) >>> 0) === ((ipToInt(net) & ipToInt(mask)) >>> 0);
/** Odpovídá adresa síti zadané wildcard maskou (OSPF, ACL)? */
const wildMatch = (ip: string, net: string, wild: string) => ((ipToInt(ip) & ~ipToInt(wild)) >>> 0) === ((ipToInt(net) & ~ipToInt(wild)) >>> 0);

const IF_TYPES: [string, string][] = [
  ['gigabitethernet', 'GigabitEthernet'],
  ['fastethernet', 'FastEthernet'],
  ['serial', 'Serial'],
  ['vlan', 'Vlan'],
  ['loopback', 'Loopback'],
];
const SHORT: Record<string, string> = { GigabitEthernet: 'Gig', FastEthernet: 'Fa', Serial: 'Se', Vlan: 'Vlan', Loopback: 'Lo' };
export const shortIf = (n: string) => n.replace(/^[A-Za-z]+/, (t) => SHORT[t] ?? t);

/** „g0/0“, „gig 0/0.10“, „FastEthernet0/1“ → kanonický název (bez kontroly existence) */
export function parseIf(raw: string): string | null {
  const m = raw
    .trim()
    .toLowerCase()
    .match(/^([a-z]+)\s*(\d+(?:\/\d+){0,2}(?:\.\d+)?)$/);
  if (!m) return null;
  const t = IF_TYPES.find(([full]) => full.startsWith(m[1]));
  return t ? `${t[1]}${m[2]}` : null;
}

type Out = string[] | void;
interface Cmd {
  p: string[];
  run: (args: string[], raw: string) => Out;
  /** Jen pro router / switch */
  only?: 'router' | 'switch';
}

const BAD = ["% Invalid input detected at '^' marker."];
/** Jednoduchý „hash“ hesla do výpisu konfigurace */
const hash = (p: string) => {
  let h = 5381;
  for (const ch of p) h = ((h * 33) ^ ch.charCodeAt(0)) >>> 0;
  return h.toString(36).padStart(7, '0').slice(0, 7) + (h >>> 3).toString(36).slice(0, 6);
};

export class CiscoSim implements Simulator {
  kind: 'router' | 'switch';
  hostname: string;
  mode: Mode = 'user';
  ctx: { ifs: string[]; line?: 'con' | 'vty'; vlan?: number; pool?: string; ospf?: number } = { ifs: [] };
  enableSecret?: string;
  enablePassword?: string;
  passwordEncryption = false;
  banner?: string;
  ifs = new Map<string, IfState>();
  vlans = new Map<number, string>();
  lines: { con: LineState; vty: LineState } = { con: { login: 'none' }, vty: { login: 'none' } };
  users = new Map<string, string>();
  domain?: string;
  rsaBits = 0;
  sshVersion?: number;
  defaultGateway?: string;
  routes: { net: string; mask: string; next: string }[] = [];
  dhcpExcluded: [string, string][] = [];
  pools = new Map<string, { network?: string; mask?: string; router?: string; dns?: string; domain?: string }>();
  acls = new Map<number, string[]>();
  nat: { list: number; iface: string; overload: boolean }[] = [];
  ospf = new Map<number, { net: string; wild: string; area: string }[]>();
  ospfPassive = new Set<string>();
  saved = '';
  pending: 'rsa' | null = null;
  history: string[] = [];
  private cmds: Record<Mode, Cmd[]>;

  constructor(kind: 'router' | 'switch', hostname?: string) {
    this.kind = kind;
    this.hostname = hostname ?? (kind === 'router' ? 'Router' : 'Switch');
    const names =
      kind === 'router'
        ? ['GigabitEthernet0/0', 'GigabitEthernet0/1', 'GigabitEthernet0/2', 'Serial0/0/0', 'Serial0/0/1']
        : [...Array.from({ length: 24 }, (_, i) => `FastEthernet0/${i + 1}`), 'GigabitEthernet0/1', 'GigabitEthernet0/2', 'Vlan1'];
    for (const n of names) this.ifs.set(n, this.newIf(n));
    if (kind === 'switch') this.vlans.set(1, 'default');
    this.cmds = this.buildCommands();
    this.saved = this.runningConfig();
  }

  newIf(name: string): IfState {
    // na routeru jsou rozhraní ve výchozím stavu vypnutá, porty switche zapnuté (Vlan1 vypnutá)
    const shutdown = this.kind === 'router' ? !name.includes('.') && !name.startsWith('Loopback') : name.startsWith('Vlan');
    return { name, shutdown, accessVlan: 1, nativeVlan: 1 };
  }

  /** Připraví výchozí konfiguraci úlohy (příkazy bez výstupu) */
  preset(lines: string[]): this {
    for (const l of lines) this.exec(l);
    this.mode = 'user';
    this.ctx = { ifs: [] };
    this.history = [];
    this.saved = this.runningConfig();
    return this;
  }

  get isSaved() {
    return this.saved === this.runningConfig();
  }

  prompt() {
    if (this.pending === 'rsa') return 'How many bits in the modulus [512]:';
    const suffix: Record<Mode, string> = {
      user: '>',
      priv: '#',
      config: '(config)#',
      if: '(config-if)#',
      subif: '(config-subif)#',
      range: '(config-if-range)#',
      line: '(config-line)#',
      vlan: '(config-vlan)#',
      dhcp: '(dhcp-config)#',
      router: '(config-router)#',
    };
    return `${this.hostname}${suffix[this.mode]}`;
  }

  // ---------- zpracování řádku ----------

  exec(raw: string): TermResult {
    if (this.pending === 'rsa') {
      this.pending = null;
      const bits = raw.trim() === '' ? 512 : Number(raw.trim());
      if (!Number.isInteger(bits) || bits < 360 || bits > 4096) return { out: ['% Invalid modulus size'] };
      this.rsaBits = bits;
      return { out: [`% Generating ${bits} bit RSA keys, keys will be non-exportable...`, '[OK] (elapsed time was 1 seconds)'] };
    }
    const line = raw.replace(/\s+$/, '');
    if (!line.trim()) return { out: [] };
    this.history.push(line.trim());
    if (line.trim() === '?') return { out: this.help() };
    return { out: this.run(line, this.mode) ?? [] };
  }

  private help(): string[] {
    const firsts = [...new Set(this.available(this.mode).map((c) => c.p[0]))].sort();
    return ['Dostupné příkazy v tomto režimu (simulace):', ...firsts.map((f) => `  ${f}`)];
  }

  private available(mode: Mode): Cmd[] {
    return this.cmds[mode].filter((c) => !c.only || c.only === this.kind);
  }

  private run(line: string, mode: Mode): Out {
    const tokens = line.trim().split(/\s+/);
    // do <příkaz> v konfiguračních režimech
    if (mode !== 'user' && mode !== 'priv' && /^do$/i.test(tokens[0]) && tokens.length > 1) return this.run(tokens.slice(1).join(' '), 'priv');
    let r = this.match(tokens, this.available(mode));
    // příkazy globální konfigurace fungují i v podrežimech (jako v IOS)
    if (!r.cmd && !['user', 'priv', 'config'].includes(mode)) {
      const g = this.match(tokens, this.available('config'));
      if (g.cmd) {
        this.mode = 'config';
        this.ctx = { ifs: [] };
        r = g;
      }
    }
    if (r.error === 'ambiguous') return [`% Ambiguous command:  "${line.trim()}"`];
    if (r.error === 'incomplete') return ['% Incomplete command.'];
    if (!r.cmd) {
      const offset = line.length - line.trimStart().length + tokens.slice(0, r.pos).reduce((s, t) => s + t.length + 1, 0);
      return [' '.repeat(this.prompt().length + offset) + '^', ...BAD];
    }
    return r.cmd.run(r.args, line);
  }

  /** Porovná tokeny se vzory příkazů – zkratky klíčových slov, zástupné hodnoty */
  private match(tokens: string[], cmds: Cmd[]): { cmd?: Cmd; args: string[]; error?: 'ambiguous' | 'incomplete'; pos: number } {
    type Cand = { cmd: Cmd; ti: number; pi: number; args: string[] };
    let cands: Cand[] = cmds.map((cmd) => ({ cmd, ti: 0, pi: 0, args: [] }));
    let maxPos = 0;
    while (true) {
      const active = cands.filter((c) => c.ti < tokens.length && c.pi < c.cmd.p.length);
      if (!active.length) break;
      const next: Cand[] = [];
      // nejednoznačnost klíčového slova na stejné pozici
      const tok = tokens[active[0].ti]?.toLowerCase();
      const lits = new Set(
        active
          .filter((c) => !c.cmd.p[c.pi].startsWith('<') && c.ti === active[0].ti && c.cmd.p[c.pi].startsWith(tok))
          .map((c) => c.cmd.p[c.pi]),
      );
      if (lits.size > 1 && !lits.has(tok) && active.every((c) => c.ti === active[0].ti)) {
        const sameFirst = [...lits];
        if (sameFirst.length > 1) return { args: [], error: 'ambiguous', pos: active[0].ti };
      }
      for (const c of active) {
        const spec = c.cmd.p[c.pi];
        const t = tokens[c.ti];
        const consumed = this.consume(spec, tokens, c.ti);
        if (consumed === null) continue;
        if (consumed.n === 0) continue;
        next.push({ cmd: c.cmd, ti: c.ti + consumed.n, pi: c.pi + 1, args: consumed.value === undefined ? c.args : [...c.args, consumed.value] });
        void t;
      }
      const done = cands.filter((c) => c.ti >= tokens.length || c.pi >= c.cmd.p.length);
      cands = [...done, ...next];
      if (next.length) maxPos = Math.max(maxPos, ...next.map((c) => c.ti));
      if (!next.length) break;
    }
    const complete = cands.filter((c) => c.ti === tokens.length && c.pi === c.cmd.p.length);
    if (complete.length) {
      // přednost má vzor s nejvíce klíčovými slovy (konkrétnější)
      complete.sort((a, b) => b.cmd.p.filter((x) => !x.startsWith('<')).length - a.cmd.p.filter((x) => !x.startsWith('<')).length);
      return { cmd: complete[0].cmd, args: complete[0].args, pos: tokens.length };
    }
    if (cands.some((c) => c.ti === tokens.length && c.pi < c.cmd.p.length)) return { args: [], error: 'incomplete', pos: tokens.length };
    return { args: [], pos: maxPos };
  }

  private consume(spec: string, tokens: string[], i: number): { n: number; value?: string } | null {
    const t = tokens[i];
    if (t === undefined) return null;
    if (!spec.startsWith('<')) return spec.startsWith(t.toLowerCase()) ? { n: 1 } : null;
    switch (spec) {
      case '<word>':
        return { n: 1, value: t };
      case '<num>':
        return /^\d+$/.test(t) ? { n: 1, value: t } : null;
      case '<ip>':
        return isIp(t) ? { n: 1, value: t } : null;
      case '<text>':
        return { n: tokens.length - i, value: tokens.slice(i).join(' ') };
      case '<if>': {
        const one = parseIf(t);
        if (one) return { n: 1, value: one };
        const two = tokens[i + 1] !== undefined ? parseIf(`${t}${tokens[i + 1]}`) : null;
        return two ? { n: 2, value: two } : null;
      }
      case '<ifr>':
        return { n: tokens.length - i, value: tokens.slice(i).join(' ') };
      default:
        return null;
    }
  }

  // ---------- pomocné ----------

  private ifExists(name: string): boolean {
    if (this.ifs.has(name)) return true;
    if (name.startsWith('Loopback')) return true;
    if (this.kind === 'switch' && /^Vlan\d+$/.test(name)) return true;
    const sub = name.match(/^(.+)\.(\d+)$/);
    return this.kind === 'router' && !!sub && this.ifs.has(sub[1]) && !sub[1].startsWith('Serial');
  }

  private getIf(name: string): IfState {
    let i = this.ifs.get(name);
    if (!i) {
      i = this.newIf(name);
      this.ifs.set(name, i);
    }
    return i;
  }

  private parseRange(text: string): string[] | null {
    const out: string[] = [];
    for (const part of text.replace(/\s*-\s*/g, '-').split(/\s*,\s*/)) {
      const m = part.replace(/\s+/g, '').match(/^([a-zA-Z]+)(\d+\/)(\d+)(?:-(\d+))?$/);
      if (!m) return null;
      const base = parseIf(`${m[1]}${m[2]}${m[3]}`);
      if (!base) return null;
      const prefix = base.replace(/\d+$/, '');
      const from = Number(m[3]);
      const to = m[4] ? Number(m[4]) : from;
      if (to < from) return null;
      for (let n = from; n <= to; n++) {
        const name = `${prefix}${n}`;
        if (!this.ifs.has(name)) return null;
        out.push(name);
      }
    }
    return out;
  }

  private current(): IfState[] {
    return this.ctx.ifs.map((n) => this.getIf(n));
  }

  private connected(): { name: string; net: string; mask: string; ip: string }[] {
    return [...this.ifs.values()].filter((i) => i.ip && i.mask && !i.shutdown && (!i.name.includes('.') || !this.ifs.get(i.name.split('.')[0])?.shutdown)).map((i) => ({ name: i.name, net: netOf(i.ip!, i.mask!), mask: i.mask!, ip: i.ip! }));
  }

  // ---------- příkazy ----------

  private buildCommands(): Record<Mode, Cmd[]> {
    const c = (p: string, run: Cmd['run'], only?: Cmd['only']): Cmd => ({ p: p.split(' '), run, only });
    const toPriv = () => {
      this.mode = 'priv';
      this.ctx = { ifs: [] };
    };
    const toConfig = () => {
      this.mode = 'config';
      this.ctx = { ifs: [] };
    };
    const subExit = [c('exit', toConfig), c('end', toPriv)];

    const show: Cmd[] = [
      c('show running-config', () => this.runningConfig().split('\n')),
      c('show startup-config', () => (this.everSaved ? this.saved.split('\n') : ['startup-config is not present'])),
      c('show ip interface brief', () => this.showIpIntBrief()),
      c('show ip route', () => this.showIpRoute()),
      c('show ip dhcp binding', () => ['Bindings from all pools not associated with VRF:', 'IP address          Client-ID/              Lease expiration        Type', '                    Hardware address/', '                    User name']),
      c('show ip dhcp pool', () => [...this.pools.entries()].flatMap(([n, p]) => [`Pool ${n} :`, ` Network ${p.network ?? '-'} ${p.mask ?? ''}`, ` Default router ${p.router ?? '-'}`, ` DNS ${p.dns ?? '-'}`])),
      c('show ip nat translations', () => ['Pro Inside global      Inside local       Outside local      Outside global']),
      c('show ip ssh', () => (this.rsaBits ? [`SSH Enabled - version ${this.sshVersion === 2 ? '2.0' : '1.99'}`, 'Authentication timeout: 120 secs; Authentication retries: 3'] : ['SSH Disabled - version 1.99', '%Please create RSA keys to enable SSH (and of atleast 768 bits for SSH v2).'])),
      c('show ip ospf neighbor', () => ['Neighbor ID     Pri   State           Dead Time   Address         Interface', '(v simulaci nejsou připojení sousedé)']),
      c('show ip protocols', () => [...this.ospf.entries()].flatMap(([id, nets]) => [`Routing Protocol is "ospf ${id}"`, '  Routing for Networks:', ...nets.map((n) => `    ${n.net} ${n.wild} area ${n.area}`)])),
      c('show vlan brief', () => this.showVlan(), 'switch'),
      c('show vlan', () => this.showVlan(), 'switch'),
      c('show interfaces trunk', () => this.showTrunk(), 'switch'),
      c('show port-security', () => [...this.ifs.values()].filter((i) => i.portSec).map((i) => `${shortIf(i.name)}  max ${i.portSec!.max}  ${i.portSec!.violation}${i.portSec!.sticky ? '  sticky' : ''}`), 'switch'),
      c('show access-lists', () => [...this.acls.entries()].flatMap(([n, e]) => [`Standard IP access list ${n}`, ...e.map((x, k) => `    ${(k + 1) * 10} ${x}`)])),
      c('show version', () => [this.kind === 'router' ? 'Cisco IOS Software, C1900 Software (C1900-UNIVERSALK9-M), Version 15.1(4)M4' : 'Cisco IOS Software, C2960 Software (C2960-LANBASEK9-M), Version 15.0(2)SE4', '(simulace pro trénink)']),
      c('show history', () => this.history.slice(-20)),
      c('show clock', () => [new Date().toTimeString().slice(0, 8)]),
    ];

    const user: Cmd[] = [
      c('enable', toPriv),
      c('exit', () => ['(v simulaci zůstáváš připojený)']),
      c('logout', () => ['(v simulaci zůstáváš připojený)']),
      c('ping <ip>', ([ip]) => this.ping(ip)),
      ...show.filter((x) => ['version', 'clock', 'history'].includes(x.p[1])),
    ];

    const save = () => {
      this.saved = this.runningConfig();
      this.everSaved = true;
      return ['Building configuration...', '[OK]'];
    };
    const priv: Cmd[] = [
      c('configure terminal', () => {
        this.mode = 'config';
        return ['Enter configuration commands, one per line.  End with CNTL/Z.'];
      }),
      c('disable', () => {
        this.mode = 'user';
      }),
      c('exit', () => {
        this.mode = 'user';
      }),
      c('enable', () => undefined),
      c('copy running-config startup-config', () => ['Destination filename [startup-config]? ', ...save()]),
      c('write memory', save),
      c('write', save),
      c('ping <ip>', ([ip]) => this.ping(ip)),
      c('reload', () => ['(restart se v simulaci neprovádí – neuložená konfigurace by se ztratila!)']),
      c('clock set <text>', () => undefined),
      ...show,
    ];

    const lineSet = (login: LineState['login']) => () => {
      const l = this.lines[this.ctx.line!];
      if (login === 'line' && !l.password) {
        l.login = 'line';
        return ['% Login disabled on line, until \'password\' is set'];
      }
      l.login = login;
    };

    const config: Cmd[] = [
      c('exit', toPriv),
      c('end', toPriv),
      c('hostname <word>', ([n]) => {
        this.hostname = n;
      }),
      c('enable secret <word>', ([p]) => {
        this.enableSecret = p;
      }),
      c('enable password <word>', ([p]) => {
        this.enablePassword = p;
      }),
      c('service password-encryption', () => {
        this.passwordEncryption = true;
      }),
      c('no service password-encryption', () => {
        this.passwordEncryption = false;
      }),
      c('banner motd <text>', ([t]) => {
        const d = t[0];
        const end = t.indexOf(d, 1);
        if (end < 0) return ['(v simulaci zadej banner na jeden řádek: banner motd #text#)'];
        this.banner = t.slice(1, end);
      }),
      c('no ip domain-lookup', () => undefined),
      c('ip domain-name <word>', ([d]) => {
        this.domain = d;
      }),
      c('ip domain name <word>', ([d]) => {
        this.domain = d;
      }),
      c('ip routing', () => undefined),
      c('ip default-gateway <ip>', ([g]) => {
        this.defaultGateway = g;
      }),
      c('ip route <ip> <ip> <ip>', ([n, m, h]) => this.addRoute(n, m, h)),
      c('ip route <ip> <ip> <if>', ([n, m, h]) => this.addRoute(n, m, h)),
      c('no ip route <ip> <ip> <ip>', ([n, m, h]) => {
        this.routes = this.routes.filter((r) => !(r.net === n && r.mask === m && r.next === h));
      }),
      c('ip ssh version <num>', ([v]) => {
        if (v !== '1' && v !== '2') return BAD;
        if (!this.rsaBits) return ['Please create RSA keys to enable SSH (and of atleast 768 bits for SSH v2).'];
        this.sshVersion = Number(v);
      }),
      c('crypto key generate rsa', () => this.rsa()),
      c('crypto key generate rsa general-keys', () => this.rsa()),
      c('crypto key generate rsa modulus <num>', ([b]) => this.rsa(Number(b))),
      c('crypto key generate rsa general-keys modulus <num>', ([b]) => this.rsa(Number(b))),
      c('username <word> secret <word>', ([u, p]) => {
        this.users.set(u, p);
      }),
      c('username <word> password <word>', ([u, p]) => {
        this.users.set(u, p);
      }),
      c('username <word> privilege <num> secret <word>', ([u, , p]) => {
        this.users.set(u, p);
      }),
      c('interface <if>', ([n]) => {
        if (!this.ifExists(n)) return BAD;
        if (n.includes('.') && !this.ifs.has(n)) this.getIf(n);
        this.getIf(n);
        this.mode = n.includes('.') ? 'subif' : 'if';
        this.ctx = { ifs: [n] };
      }),
      c('interface range <ifr>', ([t]) => {
        const list = this.parseRange(t);
        if (!list) return ['% Invalid input detected – zkus např. interface range f0/1 - 10'];
        this.mode = 'range';
        this.ctx = { ifs: list };
      }),
      c(
        'vlan <num>',
        ([v]) => {
          const n = Number(v);
          if (n < 1 || n > 4094) return ['% Bad VLAN list'];
          if (!this.vlans.has(n)) this.vlans.set(n, `VLAN${String(n).padStart(4, '0')}`);
          this.mode = 'vlan';
          this.ctx = { ifs: [], vlan: n };
        },
        'switch',
      ),
      c(
        'no vlan <num>',
        ([v]) => {
          this.vlans.delete(Number(v));
        },
        'switch',
      ),
      c('line console <num>', ([n]) => {
        if (n !== '0') return BAD;
        this.mode = 'line';
        this.ctx = { ifs: [], line: 'con' };
      }),
      c('line vty <num> <num>', ([a, b]) => {
        if (Number(a) !== 0 || ![4, 15].includes(Number(b))) return ['% (v simulaci použij line vty 0 4 nebo 0 15)'];
        this.mode = 'line';
        this.ctx = { ifs: [], line: 'vty' };
      }),
      c('ip dhcp excluded-address <ip>', ([a]) => {
        this.dhcpExcluded.push([a, a]);
      }, 'router'),
      c('ip dhcp excluded-address <ip> <ip>', ([a, b]) => {
        if (ipToInt(b) < ipToInt(a)) return ['% Invalid address range'];
        this.dhcpExcluded.push([a, b]);
      }, 'router'),
      c('ip dhcp pool <word>', ([n]) => {
        if (!this.pools.has(n)) this.pools.set(n, {});
        this.mode = 'dhcp';
        this.ctx = { ifs: [], pool: n };
      }, 'router'),
      c('access-list <num> permit <ip> <ip>', ([n, a, w]) => this.addAcl(n, `permit ${a}, wildcard bits ${w}`, a, w)),
      c('access-list <num> deny <ip> <ip>', ([n, a, w]) => this.addAcl(n, `deny   ${a}, wildcard bits ${w}`, a, w)),
      c('access-list <num> permit host <ip>', ([n, a]) => this.addAcl(n, `permit ${a}`, a, '0.0.0.0')),
      c('access-list <num> deny host <ip>', ([n, a]) => this.addAcl(n, `deny   ${a}`, a, '0.0.0.0')),
      c('access-list <num> permit any', ([n]) => this.addAcl(n, 'permit any', '0.0.0.0', '255.255.255.255')),
      c('access-list <num> deny any', ([n]) => this.addAcl(n, 'deny   any', '0.0.0.0', '255.255.255.255')),
      c('no access-list <num>', ([n]) => {
        this.acls.delete(Number(n));
      }),
      c('ip nat inside source list <num> interface <if> overload', ([n, i]) => {
        if (!this.ifs.has(i)) return ['% Invalid interface'];
        this.nat = this.nat.filter((x) => x.list !== Number(n));
        this.nat.push({ list: Number(n), iface: i, overload: true });
      }, 'router'),
      c('ip nat inside source list <num> interface <if>', ([n, i]) => {
        if (!this.ifs.has(i)) return ['% Invalid interface'];
        this.nat.push({ list: Number(n), iface: i, overload: false });
      }, 'router'),
      c('router ospf <num>', ([n]) => {
        if (!this.ospf.has(Number(n))) this.ospf.set(Number(n), []);
        this.mode = 'router';
        this.ctx = { ifs: [], ospf: Number(n) };
      }, 'router'),
      c('spanning-tree mode <word>', () => undefined, 'switch'),
    ];

    const ifCmds: Cmd[] = [
      ...subExit,
      c('shutdown', () => this.current().forEach((i) => (i.shutdown = true))),
      c('no shutdown', () => {
        const out: string[] = [];
        for (const i of this.current()) {
          if (i.shutdown) out.push(`%LINK-5-CHANGED: Interface ${i.name}, changed state to up`);
          i.shutdown = false;
        }
        return out;
      }),
      c('description <text>', ([t]) => this.current().forEach((i) => (i.desc = t))),
      c('ip address <ip> <ip>', ([ip, mask]) => this.setIp(ip, mask)),
      c('no ip address', () => this.current().forEach((i) => ((i.ip = undefined), (i.mask = undefined)))),
      c('ip nat inside', () => this.current().forEach((i) => (i.nat = 'inside')), 'router'),
      c('ip nat outside', () => this.current().forEach((i) => (i.nat = 'outside')), 'router'),
      c('duplex <word>', () => undefined),
      c('speed <word>', () => undefined),
      c('switchport mode access', () => this.swOnly((i) => (i.swMode = 'access')), 'switch'),
      c('switchport mode trunk', () => this.swOnly((i) => (i.swMode = 'trunk')), 'switch'),
      c('switchport access vlan <num>', ([v]) => {
        const n = Number(v);
        const out: string[] = [];
        if (!this.vlans.has(n)) {
          this.vlans.set(n, `VLAN${String(n).padStart(4, '0')}`);
          out.push('% Access VLAN does not exist. Creating vlan ' + n);
        }
        this.swOnly((i) => (i.accessVlan = n));
        return out;
      }, 'switch'),
      c('switchport trunk native vlan <num>', ([v]) => this.swOnly((i) => (i.nativeVlan = Number(v))), 'switch'),
      c('switchport trunk allowed vlan <text>', ([v]) => this.swOnly((i) => (i.allowed = v)), 'switch'),
      c('switchport nonegotiate', () => this.swOnly((i) => (i.nonegotiate = true)), 'switch'),
      c('switchport port-security', () => this.portSec((p) => p), 'switch'),
      c('switchport port-security maximum <num>', ([n]) => this.portSec((p) => ({ ...p, max: Number(n) })), 'switch'),
      c('switchport port-security violation <word>', ([v]) => {
        const full = ['shutdown', 'restrict', 'protect'].find((x) => x.startsWith(v.toLowerCase()));
        if (!full) return BAD;
        return this.portSec((p) => ({ ...p, violation: full }));
      }, 'switch'),
      c('switchport port-security mac-address sticky', () => this.portSec((p) => ({ ...p, sticky: true })), 'switch'),
      c('spanning-tree portfast', () => this.current().forEach((i) => (i.portfast = true)), 'switch'),
    ];

    const subifCmds: Cmd[] = [
      ...subExit,
      c('encapsulation dot1q <num>', ([v]) => {
        this.current().forEach((i) => (i.encap = { vlan: Number(v), native: false }));
      }),
      c('encapsulation dot1q <num> native', ([v]) => {
        this.current().forEach((i) => (i.encap = { vlan: Number(v), native: true }));
      }),
      c('ip address <ip> <ip>', ([ip, mask]) => {
        if (!this.current()[0]?.encap) return ['% Configuring IP routing on a LAN subinterface is only allowed if that', 'subinterface is already configured as part of an IEEE 802.10, IEEE 802.1Q,', 'or ISL vLAN.'];
        return this.setIp(ip, mask);
      }),
      c('ip nat inside', () => this.current().forEach((i) => (i.nat = 'inside'))),
      c('ip nat outside', () => this.current().forEach((i) => (i.nat = 'outside'))),
      c('description <text>', ([t]) => this.current().forEach((i) => (i.desc = t))),
      c('shutdown', () => this.current().forEach((i) => (i.shutdown = true))),
      c('no shutdown', () => this.current().forEach((i) => (i.shutdown = false))),
    ];

    const line: Cmd[] = [
      ...subExit,
      c('password <word>', ([p]) => {
        this.lines[this.ctx.line!].password = p;
      }),
      c('login', lineSet('line')),
      c('login local', lineSet('local')),
      c('no login', lineSet('none')),
      c('transport input <text>', ([t]) => {
        const words = t.toLowerCase().split(/\s+/);
        if (!words.every((w) => ['ssh', 'telnet', 'all', 'none'].includes(w))) return BAD;
        if (this.ctx.line !== 'vty') return BAD;
        this.lines.vty.transport = words.join(' ');
      }),
      c('exec-timeout <num> <num>', () => undefined),
      c('exec-timeout <num>', () => undefined),
      c('logging synchronous', () => undefined),
    ];

    const vlan: Cmd[] = [
      ...subExit,
      c('name <word>', ([n]) => {
        this.vlans.set(this.ctx.vlan!, n);
      }),
    ];

    const pool = () => this.pools.get(this.ctx.pool!)!;
    const dhcp: Cmd[] = [
      ...subExit,
      c('network <ip> <ip>', ([n, m]) => {
        if (maskPrefix(m) === null) return ['% Invalid mask'];
        Object.assign(pool(), { network: n, mask: m });
      }),
      c('default-router <ip>', ([r]) => {
        pool().router = r;
      }),
      c('dns-server <ip>', ([d]) => {
        pool().dns = d;
      }),
      c('domain-name <word>', ([d]) => {
        pool().domain = d;
      }),
    ];

    const router: Cmd[] = [
      ...subExit,
      c('network <ip> <ip> area <num>', ([n, w, a]) => {
        this.ospf.get(this.ctx.ospf!)!.push({ net: n, wild: w, area: a });
      }),
      c('router-id <ip>', () => undefined),
      c('passive-interface <if>', ([i]) => {
        this.ospfPassive.add(i);
      }),
      c('default-information originate', () => undefined),
    ];

    return { user, priv, config, if: ifCmds, subif: subifCmds, range: ifCmds, line, vlan, dhcp, router };
  }

  everSaved = false;

  private addRoute(net: string, mask: string, next: string): Out {
    if (maskPrefix(mask) === null) return ['% Inconsistent address and mask'];
    if (netOf(net, mask) !== net) return ['% Inconsistent address and mask'];
    if (this.routes.some((r) => r.net === net && r.mask === mask && r.next === next)) return;
    this.routes.push({ net, mask, next });
  }

  private addAcl(n: string, entry: string, addr: string, wild: string): Out {
    const num = Number(n);
    if (num < 1 || num > 99) return ['% (v simulaci jsou podporované jen standardní ACL 1–99)'];
    void addr;
    void wild;
    this.acls.set(num, [...(this.acls.get(num) ?? []), entry]);
  }

  private setIp(ip: string, mask: string): Out {
    const p = maskPrefix(mask);
    if (p === null || p === 0) return [`% Invalid mask ${mask}`];
    const out: string[] = [];
    for (const i of this.current()) {
      if (this.kind === 'switch' && !i.name.startsWith('Vlan')) return BAD;
      const host = (ipToInt(ip) & ~ipToInt(mask)) >>> 0;
      if (p < 31 && (host === 0 || host === (~ipToInt(mask) >>> 0))) return [`Bad mask /${p} for address ${ip}`];
      const clash = [...this.ifs.values()].find((o) => o.name !== i.name && o.ip && o.mask && (inNet(ip, o.ip, o.mask) || inNet(o.ip, ip, mask)));
      if (clash) return [`% ${netOf(ip, mask)} overlaps with ${clash.name}`];
      i.ip = ip;
      i.mask = mask;
    }
    return out;
  }

  private swOnly(fn: (i: IfState) => void): Out {
    for (const i of this.current()) {
      if (i.name.startsWith('Vlan')) return BAD;
      fn(i);
    }
  }

  private portSec(fn: (p: NonNullable<IfState['portSec']>) => NonNullable<IfState['portSec']>): Out {
    for (const i of this.current()) {
      if (i.swMode !== 'access') return [`Command rejected: ${i.name} is a dynamic port.`];
      i.portSec = fn(i.portSec ?? { max: 1, violation: 'shutdown', sticky: false });
    }
  }

  private rsa(bits?: number): Out {
    if (this.hostname === 'Router' || this.hostname === 'Switch') return ['% Please define a hostname other than Router.'];
    if (!this.domain) return ['% Please define a domain-name first.'];
    const head = [`The name for the keys will be: ${this.hostname}.${this.domain}`];
    if (bits === undefined) {
      this.pending = 'rsa';
      return [...head, 'Choose the size of the key modulus in the range of 360 to 4096 for your', '  General Purpose Keys. Choosing a key modulus greater than 512 may take', '  a few minutes.', ''];
    }
    if (bits < 360 || bits > 4096) return ['% Invalid modulus size'];
    this.rsaBits = bits;
    return [...head, `% Generating ${bits} bit RSA keys, keys will be non-exportable...`, '[OK] (elapsed time was 1 seconds)'];
  }

  private ping(ip: string): string[] {
    const conn = this.connected();
    const reach = conn.some((c) => inNet(ip, c.net, c.mask)) || (this.routes.some((r) => inNet(ip, r.net, r.mask) && conn.some((c) => inNet(r.next, c.net, c.mask))) && true);
    const ok = reach || (!!this.defaultGateway && conn.some((c) => inNet(this.defaultGateway!, c.net, c.mask)) && ip === this.defaultGateway);
    return ['Type escape sequence to abort.', `Sending 5, 100-byte ICMP Echos to ${ip}, timeout is 2 seconds:`, ok ? '!!!!!' : '.....', `Success rate is ${ok ? 100 : 0} percent (${ok ? 5 : 0}/5)${ok ? ', round-trip min/avg/max = 1/1/2 ms' : ''}`];
  }

  // ---------- výpisy ----------

  runningConfig(): string {
    const enc = (p: string) => (this.passwordEncryption ? `7 ${[...p].map((ch) => ch.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')).join('')}` : p);
    const out: string[] = ['Building configuration...', '', 'Current configuration:', '!', 'version 15.1'];
    out.push(this.passwordEncryption ? 'service password-encryption' : 'no service password-encryption', '!', `hostname ${this.hostname}`, '!');
    if (this.enableSecret) out.push(`enable secret 5 $1$mERr$${hash(this.enableSecret)}`);
    if (this.enablePassword) out.push(`enable password ${enc(this.enablePassword)}`);
    out.push('!');
    if (this.dhcpExcluded.length) {
      for (const [a, b] of this.dhcpExcluded) out.push(`ip dhcp excluded-address ${a}${a !== b ? ` ${b}` : ''}`);
      out.push('!');
    }
    for (const [n, p] of this.pools) {
      out.push(`ip dhcp pool ${n}`);
      if (p.network) out.push(` network ${p.network} ${p.mask}`);
      if (p.router) out.push(` default-router ${p.router}`);
      if (p.dns) out.push(` dns-server ${p.dns}`);
      if (p.domain) out.push(` domain-name ${p.domain}`);
      out.push('!');
    }
    if (this.domain) out.push(`ip domain-name ${this.domain}`);
    for (const [u, p] of this.users) out.push(`username ${u} secret 5 $1$mERr$${hash(p)}`);
    if (this.sshVersion) out.push(`ip ssh version ${this.sshVersion}`);
    out.push('!');
    const ifs = [...this.ifs.values()].sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true }));
    for (const i of ifs) {
      out.push(`interface ${i.name}`);
      if (i.desc) out.push(` description ${i.desc}`);
      if (i.encap) out.push(` encapsulation dot1Q ${i.encap.vlan}${i.encap.native ? ' native' : ''}`);
      if (i.swMode === 'access' && i.accessVlan !== 1) out.push(` switchport access vlan ${i.accessVlan}`);
      if (i.swMode === 'trunk' && i.nativeVlan !== 1) out.push(` switchport trunk native vlan ${i.nativeVlan}`);
      if (i.allowed) out.push(` switchport trunk allowed vlan ${i.allowed}`);
      if (i.swMode) out.push(` switchport mode ${i.swMode}`);
      if (i.nonegotiate) out.push(' switchport nonegotiate');
      if (i.portSec) {
        out.push(' switchport port-security');
        if (i.portSec.max !== 1) out.push(` switchport port-security maximum ${i.portSec.max}`);
        if (i.portSec.violation !== 'shutdown') out.push(` switchport port-security violation ${i.portSec.violation}`);
        if (i.portSec.sticky) out.push(' switchport port-security mac-address sticky');
      }
      if (i.portfast) out.push(' spanning-tree portfast');
      if (i.ip) out.push(` ip address ${i.ip} ${i.mask}`);
      else if (this.kind === 'router' || i.name.startsWith('Vlan')) out.push(' no ip address');
      if (i.nat) out.push(` ip nat ${i.nat}`);
      if (i.shutdown) out.push(' shutdown');
      out.push('!');
    }
    for (const [id, nets] of this.ospf) {
      out.push(`router ospf ${id}`);
      for (const p of this.ospfPassive) out.push(` passive-interface ${p}`);
      for (const n of nets) out.push(` network ${n.net} ${n.wild} area ${n.area}`);
      out.push('!');
    }
    for (const n of this.nat) out.push(`ip nat inside source list ${n.list} interface ${n.iface}${n.overload ? ' overload' : ''}`);
    if (this.defaultGateway) out.push(`ip default-gateway ${this.defaultGateway}`);
    for (const r of this.routes) out.push(`ip route ${r.net} ${r.mask} ${r.next}`);
    out.push('!');
    for (const [n, e] of this.acls) for (const x of e) out.push(`access-list ${n} ${x.replace(/, wildcard bits/, '').replace(/\s+/g, ' ')}`);
    if (this.banner !== undefined) out.push('!', `banner motd ^C${this.banner}^C`);
    out.push('!');
    for (const [key, label] of [
      ['con', 'line con 0'],
      ['vty', 'line vty 0 4'],
    ] as const) {
      const l = this.lines[key];
      out.push(label);
      if (l.password) out.push(` password ${enc(l.password)}`);
      if (l.login === 'line') out.push(' login');
      if (l.login === 'local') out.push(' login local');
      if (key === 'vty' && l.transport) out.push(` transport input ${l.transport}`);
    }
    out.push('!', 'end');
    return out.join('\n');
  }

  private showIpIntBrief(): string[] {
    const out = ['Interface              IP-Address      OK? Method Status                Protocol'];
    const ifs = [...this.ifs.values()].sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true }));
    for (const i of ifs) {
      const parentDown = i.name.includes('.') && this.ifs.get(i.name.split('.')[0])?.shutdown;
      const status = i.shutdown ? 'administratively down' : parentDown ? 'down' : 'up';
      const proto = i.shutdown || parentDown ? 'down' : 'up';
      out.push(`${i.name.padEnd(23)}${(i.ip ?? 'unassigned').padEnd(16)}YES ${(i.ip ? 'manual' : 'unset').padEnd(7)}${status.padEnd(22)}${proto}`);
    }
    return out;
  }

  private showIpRoute(): string[] {
    const out = ['Codes: C - connected, S - static, L - local, O - OSPF, * - candidate default', ''];
    const def = this.routes.find((r) => r.net === '0.0.0.0' && r.mask === '0.0.0.0');
    out.push(def ? `Gateway of last resort is ${def.next} to network 0.0.0.0` : 'Gateway of last resort is not set', '');
    for (const c of this.connected()) {
      out.push(`C        ${c.net}/${maskPrefix(c.mask)} is directly connected, ${c.name}`);
      out.push(`L        ${c.ip}/32 is directly connected, ${c.name}`);
    }
    for (const r of this.routes) out.push(`${r.net === '0.0.0.0' ? 'S*' : 'S '}       ${r.net}/${maskPrefix(r.mask)} [1/0] via ${r.next}`);
    return out;
  }

  private showVlan(): string[] {
    const out = ['VLAN Name                             Status    Ports', '---- -------------------------------- --------- -------------------------------'];
    for (const [id, name] of [...this.vlans.entries()].sort((a, b) => a[0] - b[0])) {
      const ports = [...this.ifs.values()].filter((i) => !i.name.startsWith('Vlan') && i.swMode !== 'trunk' && i.accessVlan === id).map((i) => shortIf(i.name));
      const chunks: string[] = [];
      for (let k = 0; k < Math.max(1, ports.length); k += 4) chunks.push(ports.slice(k, k + 4).join(', '));
      out.push(`${String(id).padEnd(5)}${name.padEnd(33)}active    ${chunks[0] ?? ''}`);
      for (const ch of chunks.slice(1)) out.push(`${' '.repeat(48)}${ch}`);
    }
    return out;
  }

  private showTrunk(): string[] {
    const t = [...this.ifs.values()].filter((i) => i.swMode === 'trunk');
    if (!t.length) return [];
    return ['Port        Mode         Encapsulation  Status        Native vlan', ...t.map((i) => `${shortIf(i.name).padEnd(12)}on           802.1q         trunking      ${i.nativeVlan}`), '', 'Port        Vlans allowed on trunk', ...t.map((i) => `${shortIf(i.name).padEnd(12)}${i.allowed ?? '1-1005'}`)];
  }
}

// ---------- úlohy ----------

const ifc = (s: CiscoSim, n: string) => s.ifs.get(n);
const ipIs = (s: CiscoSim, n: string, ip: string, mask: string) => ifc(s, n)?.ip === ip && ifc(s, n)?.mask === mask;
const up = (s: CiscoSim, n: string) => ifc(s, n)?.shutdown === false;

const router = (presetLines: string[] = [], host?: string) => () => new CiscoSim('router', host).preset(['enable', 'configure terminal', ...presetLines, 'end']);
const sw = (presetLines: string[] = [], host?: string) => () => new CiscoSim('switch', host).preset(['enable', 'configure terminal', ...presetLines, 'end']);

export const CISCO_TASKS: TermTask<CiscoSim>[] = [
  {
    id: 'pt-zaklad',
    title: 'Základní nastavení routeru',
    goal: 'Nový router. Pojmenuj ho, zabezpeč přístup hesly a konfiguraci ulož.',
    steps: ['název R1', 'heslo do privilegovaného režimu: enable secret class', 'konzole: heslo cisco a vyžadovat přihlášení', 'zašifrovat hesla v konfiguraci', 'banner (motd) s libovolným textem', 'uložit konfiguraci'],
    hints: ['Začni: enable → configure terminal (zkráceně en, conf t)', 'hostname R1, enable secret class', 'line console 0 → password cisco → login → exit', 'service password-encryption, banner motd #Jen pro opravnene#', 'end a pak copy running-config startup-config (nebo wr)'],
    solution: 'enable\nconfigure terminal\nhostname R1\nenable secret class\nline console 0\n password cisco\n login\n exit\nservice password-encryption\nbanner motd #Pristup jen pro opravnene#\nend\ncopy running-config startup-config',
    create: router(),
    check: (s) => [
      { label: 'hostname R1', ok: s.hostname === 'R1' },
      { label: 'enable secret class', ok: s.enableSecret === 'class' },
      { label: 'konzole: password cisco + login', ok: s.lines.con.password === 'cisco' && s.lines.con.login === 'line' },
      { label: 'service password-encryption', ok: s.passwordEncryption },
      { label: 'banner motd', ok: !!s.banner?.trim() },
      { label: 'konfigurace uložená (startup = running)', ok: s.isSaved },
    ],
  },
  {
    id: 'pt-rozhrani',
    title: 'Adresy rozhraní routeru',
    goal: 'Nastav adresy rozhraní routeru R1, zapni je a ověř.',
    steps: ['G0/0: 192.168.10.1 /24', 'G0/1: 10.0.0.1 /30 (spoj k ISP)', 'obě rozhraní zapnutá', 'ověř: show ip interface brief'],
    hints: ['interface g0/0 → ip address 192.168.10.1 255.255.255.0 → no shutdown', 'Maska /30 = 255.255.255.252', 'Rozhraní routeru jsou ve výchozím stavu vypnutá – nezapomeň no shutdown'],
    solution: 'enable\nconf t\ninterface g0/0\n ip address 192.168.10.1 255.255.255.0\n no shutdown\ninterface g0/1\n ip address 10.0.0.1 255.255.255.252\n no shutdown\nend\nshow ip interface brief',
    create: router(['hostname R1']),
    check: (s) => [
      { label: 'G0/0 192.168.10.1 255.255.255.0', ok: ipIs(s, 'GigabitEthernet0/0', '192.168.10.1', '255.255.255.0') },
      { label: 'G0/0 zapnuté', ok: up(s, 'GigabitEthernet0/0') },
      { label: 'G0/1 10.0.0.1 255.255.255.252', ok: ipIs(s, 'GigabitEthernet0/1', '10.0.0.1', '255.255.255.252') },
      { label: 'G0/1 zapnuté', ok: up(s, 'GigabitEthernet0/1') },
    ],
  },
  {
    id: 'pt-vlan',
    title: 'VLAN a trunk na switchi',
    goal: 'Na switchi SW1 vytvoř VLAN, přiřaď do nich porty a nastav trunk k routeru.',
    steps: ['VLAN 10 ZAMESTNANCI, VLAN 20 HOSTE, VLAN 99 SPRAVA', 'F0/1–10 jako access ve VLAN 10', 'F0/11–20 jako access ve VLAN 20', 'G0/1 jako trunk s nativní VLAN 99', 'ověř: show vlan brief, show interfaces trunk'],
    hints: ['vlan 10 → name ZAMESTNANCI (a totéž pro 20 a 99)', 'interface range f0/1 - 10 → switchport mode access → switchport access vlan 10', 'interface g0/1 → switchport mode trunk → switchport trunk native vlan 99'],
    solution: 'enable\nconf t\nvlan 10\n name ZAMESTNANCI\nvlan 20\n name HOSTE\nvlan 99\n name SPRAVA\ninterface range f0/1 - 10\n switchport mode access\n switchport access vlan 10\ninterface range f0/11 - 20\n switchport mode access\n switchport access vlan 20\ninterface g0/1\n switchport mode trunk\n switchport trunk native vlan 99\nend\nshow vlan brief\nshow interfaces trunk',
    create: sw(['hostname SW1']),
    check: (s) => {
      const range = (from: number, to: number, v: number) => Array.from({ length: to - from + 1 }, (_, k) => s.ifs.get(`FastEthernet0/${from + k}`)!).every((i) => i.swMode === 'access' && i.accessVlan === v);
      return [
        { label: 'VLAN 10 ZAMESTNANCI', ok: s.vlans.get(10) === 'ZAMESTNANCI' },
        { label: 'VLAN 20 HOSTE', ok: s.vlans.get(20) === 'HOSTE' },
        { label: 'VLAN 99 SPRAVA', ok: s.vlans.get(99) === 'SPRAVA' },
        { label: 'F0/1–10 access VLAN 10', ok: range(1, 10, 10) },
        { label: 'F0/11–20 access VLAN 20', ok: range(11, 20, 20) },
        { label: 'G0/1 trunk, nativní VLAN 99', ok: ifc(s, 'GigabitEthernet0/1')?.swMode === 'trunk' && ifc(s, 'GigabitEthernet0/1')?.nativeVlan === 99 },
      ];
    },
  },
  {
    id: 'pt-sprava',
    title: 'Správa switche (VLAN 99)',
    goal: 'Switch SW1 má být spravovatelný přes síť ve VLAN 99.',
    steps: ['rozhraní VLAN 99 s adresou 192.168.99.2 /24, zapnuté', 'výchozí brána switche 192.168.99.1', 'vty: heslo cisco a přihlášení'],
    hints: ['interface vlan 99 → ip address … → no shutdown', 'Výchozí brána switche: ip default-gateway (ne ip route!)', 'line vty 0 4 → password cisco → login'],
    solution: 'enable\nconf t\ninterface vlan 99\n ip address 192.168.99.2 255.255.255.0\n no shutdown\n exit\nip default-gateway 192.168.99.1\nline vty 0 4\n password cisco\n login\nend',
    create: sw(['hostname SW1', 'vlan 99', 'name SPRAVA']),
    check: (s) => [
      { label: 'Vlan99 192.168.99.2 255.255.255.0', ok: ipIs(s, 'Vlan99', '192.168.99.2', '255.255.255.0') },
      { label: 'Vlan99 zapnuté', ok: up(s, 'Vlan99') },
      { label: 'ip default-gateway 192.168.99.1', ok: s.defaultGateway === '192.168.99.1' },
      { label: 'vty: password + login', ok: !!s.lines.vty.password && s.lines.vty.login === 'line' },
    ],
  },
  {
    id: 'pt-roas',
    title: 'Směrování mezi VLAN (router-on-a-stick)',
    goal: 'Na routeru R1 vytvoř podrozhraní pro VLAN 10, 20 a 99 na G0/0.',
    steps: ['G0/0 zapnuté (bez adresy)', 'G0/0.10: dot1Q 10, 192.168.10.1 /24', 'G0/0.20: dot1Q 20, 192.168.20.1 /24', 'G0/0.99: dot1Q 99 native, 192.168.99.1 /24'],
    hints: ['Nejdřív interface g0/0 → no shutdown', 'interface g0/0.10 → encapsulation dot1Q 10 → ip address …', 'encapsulation musí být před ip address', 'Nativní VLAN: encapsulation dot1Q 99 native'],
    solution: 'enable\nconf t\ninterface g0/0\n no shutdown\ninterface g0/0.10\n encapsulation dot1Q 10\n ip address 192.168.10.1 255.255.255.0\ninterface g0/0.20\n encapsulation dot1Q 20\n ip address 192.168.20.1 255.255.255.0\ninterface g0/0.99\n encapsulation dot1Q 99 native\n ip address 192.168.99.1 255.255.255.0\nend\nshow ip interface brief',
    create: router(['hostname R1']),
    check: (s) => {
      const sub = (v: number, ip: string, native = false) => {
        const i = ifc(s, `GigabitEthernet0/0.${v}`);
        return i?.encap?.vlan === v && (!native || i.encap.native) && i.ip === ip && i.mask === '255.255.255.0';
      };
      return [
        { label: 'G0/0 zapnuté', ok: up(s, 'GigabitEthernet0/0') },
        { label: 'G0/0.10 dot1Q 10, 192.168.10.1/24', ok: sub(10, '192.168.10.1') },
        { label: 'G0/0.20 dot1Q 20, 192.168.20.1/24', ok: sub(20, '192.168.20.1') },
        { label: 'G0/0.99 dot1Q 99 native, 192.168.99.1/24', ok: sub(99, '192.168.99.1', true) },
      ];
    },
  },
  {
    id: 'pt-dhcp',
    title: 'DHCP server na routeru',
    goal: 'R1 má na G0/0 adresu 192.168.10.1/24. Nastav DHCP pro tuto síť.',
    steps: ['vyloučit adresy 192.168.10.1–192.168.10.10', 'pool LAN10 se sítí 192.168.10.0 /24', 'výchozí brána 192.168.10.1', 'DNS server 8.8.8.8'],
    hints: ['ip dhcp excluded-address 192.168.10.1 192.168.10.10', 'ip dhcp pool LAN10 → network 192.168.10.0 255.255.255.0', 'V poolu: default-router a dns-server'],
    solution: 'enable\nconf t\nip dhcp excluded-address 192.168.10.1 192.168.10.10\nip dhcp pool LAN10\n network 192.168.10.0 255.255.255.0\n default-router 192.168.10.1\n dns-server 8.8.8.8\nend',
    create: router(['hostname R1', 'interface g0/0', 'ip address 192.168.10.1 255.255.255.0', 'no shutdown']),
    check: (s) => {
      const p = s.pools.get('LAN10');
      return [
        { label: 'vyloučeno 192.168.10.1–192.168.10.10', ok: s.dhcpExcluded.some(([a, b]) => a === '192.168.10.1' && b === '192.168.10.10') },
        { label: 'pool LAN10: network 192.168.10.0 255.255.255.0', ok: p?.network === '192.168.10.0' && p?.mask === '255.255.255.0' },
        { label: 'default-router 192.168.10.1', ok: p?.router === '192.168.10.1' },
        { label: 'dns-server 8.8.8.8', ok: p?.dns === '8.8.8.8' },
      ];
    },
  },
  {
    id: 'pt-static',
    title: 'Statické a výchozí směrování',
    goal: 'R1 je spojen s R2 sítí 10.0.0.0/30 (R2 má 10.0.0.2). Za R2 je síť 192.168.2.0/24 a internet.',
    steps: ['statická trasa do 192.168.2.0 /24 přes 10.0.0.2', 'výchozí trasa přes 10.0.0.2', 'ověř: show ip route'],
    hints: ['ip route SÍŤ MASKA DALŠÍ_SKOK', 'Výchozí trasa: ip route 0.0.0.0 0.0.0.0 …'],
    solution: 'enable\nconf t\nip route 192.168.2.0 255.255.255.0 10.0.0.2\nip route 0.0.0.0 0.0.0.0 10.0.0.2\nend\nshow ip route',
    create: router(['hostname R1', 'interface g0/0', 'ip address 192.168.1.1 255.255.255.0', 'no shutdown', 'interface g0/1', 'ip address 10.0.0.1 255.255.255.252', 'no shutdown']),
    check: (s) => [
      { label: 'ip route 192.168.2.0 255.255.255.0 10.0.0.2', ok: s.routes.some((r) => r.net === '192.168.2.0' && r.mask === '255.255.255.0' && r.next === '10.0.0.2') },
      { label: 'ip route 0.0.0.0 0.0.0.0 10.0.0.2', ok: s.routes.some((r) => r.net === '0.0.0.0' && r.mask === '0.0.0.0' && r.next === '10.0.0.2') },
    ],
  },
  {
    id: 'pt-nat',
    title: 'NAT s přetížením (PAT)',
    goal: 'LAN 192.168.10.0/24 je na G0/0, internet (ISP 203.0.113.1) na G0/1 s adresou 203.0.113.2/30. Zajisti přístup LAN do internetu.',
    steps: ['G0/0 jako ip nat inside, G0/1 jako ip nat outside', 'ACL 1 povolí síť 192.168.10.0 /24', 'PAT na adresu rozhraní G0/1', 'výchozí trasa na ISP'],
    hints: ['V rozhraní: ip nat inside / ip nat outside', 'access-list 1 permit 192.168.10.0 0.0.0.255 (wildcard, ne maska!)', 'ip nat inside source list 1 interface g0/1 overload', 'ip route 0.0.0.0 0.0.0.0 203.0.113.1'],
    solution: 'enable\nconf t\ninterface g0/0\n ip nat inside\ninterface g0/1\n ip nat outside\n exit\naccess-list 1 permit 192.168.10.0 0.0.0.255\nip nat inside source list 1 interface g0/1 overload\nip route 0.0.0.0 0.0.0.0 203.0.113.1\nend',
    create: router(['hostname R1', 'interface g0/0', 'ip address 192.168.10.1 255.255.255.0', 'no shutdown', 'interface g0/1', 'ip address 203.0.113.2 255.255.255.252', 'no shutdown']),
    check: (s) => [
      { label: 'G0/0 ip nat inside', ok: ifc(s, 'GigabitEthernet0/0')?.nat === 'inside' },
      { label: 'G0/1 ip nat outside', ok: ifc(s, 'GigabitEthernet0/1')?.nat === 'outside' },
      { label: 'access-list 1 permit 192.168.10.0 0.0.0.255', ok: !!s.acls.get(1)?.some((e) => /^permit 192\.168\.10\.0, wildcard bits 0\.0\.0\.255$/.test(e)) },
      { label: 'ip nat inside source list 1 interface G0/1 overload', ok: s.nat.some((n) => n.list === 1 && n.iface === 'GigabitEthernet0/1' && n.overload) },
      { label: 'výchozí trasa na 203.0.113.1', ok: s.routes.some((r) => r.net === '0.0.0.0' && r.next === '203.0.113.1') },
    ],
  },
  {
    id: 'pt-ssh',
    title: 'Vzdálená správa přes SSH',
    goal: 'Povol na R1 vzdálenou správu jen přes SSH s místním uživatelem.',
    steps: ['doména firma.local', 'RSA klíče alespoň 1024 bitů', 'uživatel admin s heslem heslo123 (secret)', 'SSH verze 2', 'vty: jen SSH, přihlášení místním uživatelem'],
    hints: ['ip domain-name firma.local', 'crypto key generate rsa → na dotaz zadej 1024', 'username admin secret heslo123, ip ssh version 2', 'line vty 0 4 → transport input ssh → login local'],
    solution: 'enable\nconf t\nip domain-name firma.local\ncrypto key generate rsa\n1024\nusername admin secret heslo123\nip ssh version 2\nline vty 0 4\n transport input ssh\n login local\nend',
    create: router(['hostname R1']),
    check: (s) => [
      { label: 'ip domain-name firma.local', ok: s.domain === 'firma.local' },
      { label: 'RSA klíče ≥ 1024 bitů', ok: s.rsaBits >= 1024 },
      { label: 'username admin secret heslo123', ok: s.users.get('admin') === 'heslo123' },
      { label: 'ip ssh version 2', ok: s.sshVersion === 2 },
      { label: 'vty: transport input ssh', ok: s.lines.vty.transport === 'ssh' },
      { label: 'vty: login local', ok: s.lines.vty.login === 'local' },
    ],
  },
  {
    id: 'pt-ospf',
    title: 'Dynamické směrování OSPF',
    goal: 'Zapni na R1 OSPF (proces 1) pro obě připojené sítě v oblasti 0. Do LAN se směrovací zprávy posílat nemají.',
    steps: ['router ospf 1', 'síť 192.168.1.0 /24 (G0/0) v area 0', 'síť 10.0.0.0 /30 (G0/1) v area 0', 'G0/0 jako passive-interface'],
    hints: ['router ospf 1', 'network SÍŤ WILDCARD area 0 – wildcard pro /24 je 0.0.0.255, pro /30 0.0.0.3', 'passive-interface g0/0'],
    solution: 'enable\nconf t\nrouter ospf 1\n network 192.168.1.0 0.0.0.255 area 0\n network 10.0.0.0 0.0.0.3 area 0\n passive-interface g0/0\nend\nshow ip protocols',
    create: router(['hostname R1', 'interface g0/0', 'ip address 192.168.1.1 255.255.255.0', 'no shutdown', 'interface g0/1', 'ip address 10.0.0.1 255.255.255.252', 'no shutdown']),
    check: (s) => {
      const nets = s.ospf.get(1) ?? [];
      const covers = (ip: string) => nets.some((n) => n.area === '0' && wildMatch(ip, n.net, n.wild));
      return [
        { label: 'router ospf 1', ok: s.ospf.has(1) },
        { label: 'G0/0 (192.168.1.1) je v OSPF area 0', ok: covers('192.168.1.1') },
        { label: 'G0/1 (10.0.0.1) je v OSPF area 0', ok: covers('10.0.0.1') },
        { label: 'passive-interface G0/0', ok: s.ospfPassive.has('GigabitEthernet0/0') },
      ];
    },
  },
  {
    id: 'pt-portsec',
    title: 'Zabezpečení portu (port security)',
    goal: 'Na portu F0/5 switche SW1 smí být jen jedno zařízení; jeho MAC adresu si switch zapamatuje.',
    steps: ['F0/5 v režimu access', 'zapnutá port security', 'maximálně 1 MAC adresa', 'při porušení vypnout port', 'sticky MAC'],
    hints: ['interface f0/5 → switchport mode access (bez toho port security nejde)', 'switchport port-security', 'switchport port-security maximum 1, violation shutdown, mac-address sticky'],
    solution: 'enable\nconf t\ninterface f0/5\n switchport mode access\n switchport port-security\n switchport port-security maximum 1\n switchport port-security violation shutdown\n switchport port-security mac-address sticky\nend',
    create: sw(['hostname SW1']),
    check: (s) => {
      const i = ifc(s, 'FastEthernet0/5');
      return [
        { label: 'F0/5 switchport mode access', ok: i?.swMode === 'access' },
        { label: 'port security zapnutá', ok: !!i?.portSec },
        { label: 'maximum 1', ok: i?.portSec?.max === 1 },
        { label: 'violation shutdown', ok: i?.portSec?.violation === 'shutdown' },
        { label: 'mac-address sticky', ok: !!i?.portSec?.sticky },
      ];
    },
  },
];
