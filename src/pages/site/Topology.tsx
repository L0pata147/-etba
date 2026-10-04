import type { Scenario } from '../../lib/netgen';

const T = 'fill-slate-700 dark:fill-slate-200';
const SUB = 'fill-slate-500 dark:fill-slate-400';
const BOX = 'fill-white stroke-slate-400 dark:fill-slate-900 dark:stroke-slate-500';
const LINE = 'stroke-slate-400 dark:stroke-slate-500';

/** Schéma topologie k vygenerovanému zadání Packet Traceru */
export function Topology({ sc, showAddresses }: { sc: Scenario; showAddresses: boolean }) {
  const v = (n: number) => sc.subnets.find((s) => s.vlan === n)!;
  const [r10, r20, r99] = [v(10), v(20), v(99)];
  // Adresy podsítí jsou řešením 1. úkolu – bez odhalení jen otazníky
  const hide = <T extends { net: string; gateway: string }>(x: T) => (showAddresses ? x : { ...x, net: '?', gateway: '?' });
  const [v10, v20, v99] = [hide(r10), hide(r20), hide(r99)];
  const sw = showAddresses ? r99.gateway.replace(/\.(\d+)$/, (_, d) => `.${Number(d) + 1}`) : '?';
  return (
    <svg viewBox="0 0 760 300" className="h-auto w-full" role="img" aria-label="Schéma topologie sítě">
      {/* spoje */}
      <line x1="120" y1="70" x2="270" y2="140" className={LINE} strokeWidth="2" />
      <line x1="120" y1="220" x2="270" y2="160" className={LINE} strokeWidth="2" />
      <line x1="350" y1="150" x2="480" y2="150" className="stroke-brand-500" strokeWidth="4" />
      <line x1="560" y1="150" x2="660" y2="150" className="stroke-rose-400" strokeWidth="2" strokeDasharray="6 4" />

      {/* PC VLAN 10 */}
      <rect x="20" y="45" width="100" height="50" rx="8" className={BOX} strokeWidth="1.5" />
      <text x="70" y="66" textAnchor="middle" className={T} fontSize="13" fontWeight="700">PC – VLAN 10</text>
      <text x="70" y="84" textAnchor="middle" className={SUB} fontSize="11">{v10.name}</text>
      <text x="70" y="112" textAnchor="middle" className={SUB} fontSize="11">{showAddresses ? `${v10.net}/${v10.prefix}` : `${v10.hosts} hostů`}</text>
      <text x="200" y="92" textAnchor="middle" className={SUB} fontSize="11">F0/1–10</text>

      {/* PC VLAN 20 */}
      <rect x="20" y="195" width="100" height="50" rx="8" className={BOX} strokeWidth="1.5" />
      <text x="70" y="216" textAnchor="middle" className={T} fontSize="13" fontWeight="700">PC – VLAN 20</text>
      <text x="70" y="234" textAnchor="middle" className={SUB} fontSize="11">{v20.name}</text>
      <text x="70" y="262" textAnchor="middle" className={SUB} fontSize="11">{showAddresses ? `${v20.net}/${v20.prefix}` : `${v20.hosts} hostů`}</text>
      <text x="200" y="212" textAnchor="middle" className={SUB} fontSize="11">F0/11–20</text>

      {/* SW1 */}
      <rect x="270" y="125" width="80" height="50" rx="6" className="fill-sky-50 stroke-sky-500 dark:fill-sky-500/10" strokeWidth="2" />
      <text x="310" y="155" textAnchor="middle" className={T} fontSize="15" fontWeight="800">SW1</text>
      <text x="310" y="195" textAnchor="middle" className={SUB} fontSize="11">VLAN 99: {sw}</text>
      <text x="360" y="140" className={SUB} fontSize="11">G0/1</text>
      <text x="415" y="172" textAnchor="middle" className="fill-brand-600 dark:fill-brand-400" fontSize="11" fontWeight="700">trunk (nativní 99)</text>

      {/* R1 */}
      <circle cx="520" cy="150" r="40" className="fill-emerald-50 stroke-emerald-500 dark:fill-emerald-500/10" strokeWidth="2" />
      <text x="520" y="155" textAnchor="middle" className={T} fontSize="15" fontWeight="800">R1</text>
      <text x="455" y="140" textAnchor="end" className={SUB} fontSize="11">G0/0</text>
      <text x="520" y="215" textAnchor="middle" className={SUB} fontSize="11">.10 → {v10.gateway}</text>
      <text x="520" y="231" textAnchor="middle" className={SUB} fontSize="11">.20 → {v20.gateway}</text>
      <text x="520" y="247" textAnchor="middle" className={SUB} fontSize="11">.99 → {v99.gateway}</text>
      <text x="565" y="140" className={SUB} fontSize="11">G0/1</text>
      <text x="610" y="172" textAnchor="middle" className={SUB} fontSize="11">{sc.ispLink.r1}</text>

      {/* ISP */}
      <ellipse cx="705" cy="150" rx="45" ry="30" className="fill-rose-50 stroke-rose-400 dark:fill-rose-500/10" strokeWidth="2" />
      <text x="705" y="155" textAnchor="middle" className={T} fontSize="14" fontWeight="800">ISP</text>
      <text x="705" y="200" textAnchor="middle" className={SUB} fontSize="11">{sc.ispLink.isp}</text>
      <text x="705" y="216" textAnchor="middle" className={SUB} fontSize="11">{sc.ispLink.net}</text>
    </svg>
  );
}
