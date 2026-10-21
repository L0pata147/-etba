/** Stavebnice topologie – zařízení a porty podle výchozích modelů v Cisco Packet Traceru, typy kabelů a kontrola zapojení (bez UI) */

export type DeviceModel = 'pc' | 'server' | 'switch' | 'router' | 'router-serial';
export type CableType = 'rovny' | 'krizeny' | 'konzolovy' | 'serial-dce' | 'serial-dte';

export interface Device {
  id: string;
  model: DeviceModel;
  x: number;
  y: number;
}

export interface Link {
  id: string;
  cable: CableType;
  /** Konec, na který se kliklo jako první (u sériového kabelu DCE / DTE podle typu kabelu) */
  a: string;
  aPort: string;
  b: string;
  bPort: string;
}

export interface RequiredLink {
  a: string;
  b: string;
  /** Konkrétní port, když ho zadání určuje */
  aPort?: string;
  bPort?: string;
  /** Sériová linka: zařízení, které má být DCE (dává takt – clock rate) */
  dce?: string;
}

export interface CablingTask {
  id: string;
  title: string;
  goal: string;
  devices: Device[];
  links: RequiredLink[];
  hint?: string;
}

const range = (prefix: string, from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => `${prefix}${from + i}`);

export const MODEL_INFO: Record<DeviceModel, { label: string; ports: string[] }> = {
  pc: { label: 'PC (PC-PT)', ports: ['FastEthernet0', 'RS 232'] },
  server: { label: 'Server (Server-PT)', ports: ['FastEthernet0'] },
  switch: { label: 'Switch 2960', ports: [...range('FastEthernet0/', 1, 24), 'GigabitEthernet0/1', 'GigabitEthernet0/2', 'Console'] },
  router: { label: 'Router 2911', ports: ['GigabitEthernet0/0', 'GigabitEthernet0/1', 'GigabitEthernet0/2', 'Console'] },
  'router-serial': { label: 'Router 2911 + modul HWIC-2T', ports: ['GigabitEthernet0/0', 'GigabitEthernet0/1', 'GigabitEthernet0/2', 'Serial0/0/0', 'Serial0/0/1', 'Console'] },
};

export const CABLE_INFO: Record<CableType, { label: string; short: string; color: string; dashed?: boolean }> = {
  rovny: { label: 'Rovný (Copper Straight-Through)', short: 'Rovný', color: '#0f172a' },
  krizeny: { label: 'Křížený (Copper Cross-Over)', short: 'Křížený', color: '#0f172a', dashed: true },
  konzolovy: { label: 'Konzolový (Console)', short: 'Konzolový', color: '#38bdf8' },
  'serial-dce': { label: 'Sériový DCE (Serial DCE)', short: 'Sériový DCE', color: '#dc2626' },
  'serial-dte': { label: 'Sériový DTE (Serial DTE)', short: 'Sériový DTE', color: '#dc2626' },
};

export const isRouter = (m: DeviceModel) => m === 'router' || m === 'router-serial';

type PortKind = 'ethernet' | 'serial' | 'console' | 'rs232';
export function portKind(port: string): PortKind {
  if (port.startsWith('Serial')) return 'serial';
  if (port === 'Console') return 'console';
  if (port === 'RS 232') return 'rs232';
  return 'ethernet';
}

/** Porty, do kterých jde daný kabel zapojit (Packet Tracer jiné ani nenabídne) */
export function portFits(cable: CableType, port: string): boolean {
  const k = portKind(port);
  if (cable === 'rovny' || cable === 'krizeny') return k === 'ethernet';
  if (cable === 'konzolovy') return k === 'console' || k === 'rs232';
  return k === 'serial';
}

/** Zkrácený název portu jako na štítku v Packet Traceru */
export function shortPort(port: string): string {
  return port.replace('GigabitEthernet', 'Gi').replace('FastEthernet', 'Fa').replace('Serial', 'Se').replace('RS 232', 'RS232').replace('Console', 'Con');
}

/**
 * Správný měděný kabel mezi dvěma zařízeními:
 * různé „skupiny“ (koncové zařízení / router × switch) → rovný, stejné (PC–PC, switch–switch, router–router, PC–router) → křížený.
 */
export function ethernetCable(a: DeviceModel, b: DeviceModel): CableType {
  const sw = (m: DeviceModel) => m === 'switch';
  return sw(a) === sw(b) ? 'krizeny' : 'rovny';
}

/** Který kabel patří mezi dva porty dvou zařízení */
export function expectedCable(aModel: DeviceModel, aPort: string, bModel: DeviceModel, bPort: string): CableType | 'serial' | null {
  const ka = portKind(aPort);
  const kb = portKind(bPort);
  if (ka === 'ethernet' && kb === 'ethernet') return ethernetCable(aModel, bModel);
  if (ka === 'serial' && kb === 'serial') return 'serial';
  if ((ka === 'rs232' && kb === 'console') || (ka === 'console' && kb === 'rs232')) return 'konzolovy';
  return null;
}

/** Zařízení na DCE konci sériového kabelu (u DCE kabelu první kliknutý konec, u DTE druhý) */
export function dceEnd(l: Link): string | undefined {
  if (l.cable === 'serial-dce') return l.a;
  if (l.cable === 'serial-dte') return l.b;
  return undefined;
}

export type IssueKind = 'missing' | 'cable' | 'port' | 'dce' | 'extra';
export interface Issue {
  kind: IssueKind;
  text: string;
  linkId?: string;
}

export interface CheckResult {
  ok: boolean;
  /** Kolik požadovaných spojení je správně */
  correct: number;
  total: number;
  issues: Issue[];
}

const cableName = (c: CableType | 'serial') => (c === 'serial' ? 'sériový' : CABLE_INFO[c].short.toLowerCase());

/** Vysvětlení, proč mezi dvěma zařízeními patří daný kabel */
export function cableReason(need: CableType): string {
  if (need === 'konzolovy') return 'Konzolový kabel vede z RS 232 počítače do portu Console routeru nebo switche.';
  if (need === 'krizeny') return 'Mezi zařízeními stejného typu (PC–PC, switch–switch, router–router) a také mezi PC a routerem patří křížený kabel.';
  if (need === 'rovny') return 'Mezi různými typy zařízení (PC, server nebo router do switche) patří rovný kabel.';
  return 'Sériová linka mezi routery se zapojuje sériovým kabelem (DCE nebo DTE) do portů Serial.';
}

export function checkCabling(task: CablingTask, links: Link[]): CheckResult {
  const model = (id: string) => task.devices.find((d) => d.id === id)!.model;
  const used = new Set<string>();
  const issues: Issue[] = [];
  let correct = 0;

  for (const r of task.links) {
    const l = links.find((x) => !used.has(x.id) && ((x.a === r.a && x.b === r.b) || (x.a === r.b && x.b === r.a)));
    if (!l) {
      issues.push({ kind: 'missing', text: `Chybí spojení ${r.a} – ${r.b}${r.aPort ? ` (${r.a} ${r.aPort})` : ''}.` });
      continue;
    }
    used.add(l.id);
    // porty orientované podle zadání
    const pa = l.a === r.a ? l.aPort : l.bPort;
    const pb = l.a === r.a ? l.bPort : l.aPort;
    let fine = true;
    if ((r.aPort && pa !== r.aPort) || (r.bPort && pb !== r.bPort)) {
      fine = false;
      const want = [r.aPort && `${r.a} ${r.aPort}`, r.bPort && `${r.b} ${r.bPort}`].filter(Boolean).join(', ');
      issues.push({ kind: 'port', linkId: l.id, text: `${r.a} – ${r.b}: zapojeno do ${r.a} ${pa} a ${r.b} ${pb}, zadání chce ${want}.` });
    }
    const need = expectedCable(model(l.a), l.aPort, model(l.b), l.bPort);
    const isSerial = l.cable === 'serial-dce' || l.cable === 'serial-dte';
    if (need === 'serial' ? !isSerial : need !== l.cable) {
      fine = false;
      const why = need && need !== 'serial' ? ` ${cableReason(need)}` : '';
      issues.push({ kind: 'cable', linkId: l.id, text: `${r.a} – ${r.b}: ${cableName(l.cable)} kabel je špatně, patří sem ${need ? cableName(need) : 'jiný'}.${why}` });
    } else if (r.dce && dceEnd(l) !== r.dce) {
      fine = false;
      issues.push({
        kind: 'dce',
        linkId: l.id,
        text: `${r.a} – ${r.b}: DCE konec (s hodinami, clock rate) má být na ${r.dce}, je na ${dceEnd(l)}. U kabelu Serial DCE je DCE ten konec, který zapojíš jako první.`,
      });
    }
    if (fine) correct++;
  }
  for (const l of links) if (!used.has(l.id)) issues.push({ kind: 'extra', linkId: l.id, text: `Spojení ${l.a} ${shortPort(l.aPort)} – ${l.b} ${shortPort(l.bPort)} zadání nechce.` });

  return { ok: issues.length === 0, correct, total: task.links.length, issues };
}

/** Text řešení pro jedno požadované spojení */
export function solutionText(task: CablingTask, r: RequiredLink): string {
  const da = task.devices.find((d) => d.id === r.a)!;
  const db = task.devices.find((d) => d.id === r.b)!;
  const pa = r.aPort ?? MODEL_INFO[da.model].ports.find((p) => portKind(p) !== 'console')!;
  const pb = r.bPort ?? MODEL_INFO[db.model].ports.find((p) => portKind(p) !== 'console')!;
  const need = expectedCable(da.model, pa, db.model, pb);
  const cable = need === 'serial' ? `sériový kabel, DCE na ${r.dce ?? r.a}` : need ? `${cableName(need)} kabel` : '?';
  return `${r.a}${r.aPort ? ` ${r.aPort}` : ''} – ${r.b}${r.bPort ? ` ${r.bPort}` : ''}: ${cable}`;
}
