import { useMemo, useRef, useState, type PointerEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, Cable, CheckCircle2, ChevronRight, Lightbulb, RotateCcw, Trash2, X } from 'lucide-react';
import type { FlashcardQuestion, SessionRecord } from '../../types';
import { CABLING_TASKS } from '../../data/site/cabling';
import { CABLE_INFO, MODEL_INFO, checkCabling, dceEnd, portFits, shortPort, solutionText, type CableType, type CablingTask, type CheckResult, type Device, type Link } from '../../lib/cabling';
import { uid } from '../../lib/random';
import { useStore } from '../../store';
import { Button, Card, Modal, Tag, cx } from '../../components/ui';

const doneKey = (id: string) => `site-kabelaz-${id}`;
/** Výřez plochy podle rozmístění zařízení v úloze – na mobilu tak vyjdou zařízení i popisky větší */
function viewBox(task: CablingTask) {
  const xs = task.devices.map((d) => d.x);
  const ys = task.devices.map((d) => d.y);
  const x = Math.min(...xs) - 80;
  const y = Math.min(...ys) - 55;
  return { x, y, w: Math.max(...xs) + 80 - x, h: Math.max(...ys) + 65 - y };
}

/** Seznam úloh stavebnice, nebo běžící úloha (?uloha=) */
export function CablingTab() {
  const [params, setParams] = useSearchParams();
  const { data } = useStore();
  const taskId = params.get('uloha');
  const task = taskId ? CABLING_TASKS.find((t) => t.id === taskId) : undefined;
  const done = useMemo(() => new Set(data.sessions.filter((s) => s.mode === 'site-kabelaz').flatMap((s) => s.bookIds)), [data.sessions]);
  const open = (id: string | null) => setParams(id ? { tab: 'kabelaz', uloha: id } : { tab: 'kabelaz' });

  if (task) {
    const next = CABLING_TASKS[(CABLING_TASKS.indexOf(task) + 1) % CABLING_TASKS.length];
    return <CablingRun key={task.id} task={task} onBack={() => open(null)} onNext={() => open(next.id)} />;
  }
  const count = CABLING_TASKS.filter((t) => done.has(doneKey(t.id))).length;
  return (
    <div>
      <Card className="mb-4 p-5">
        <h2 className="flex items-center gap-2 font-bold">
          <Cable size={20} /> Stavebnice topologie – kabeláž jako v Packet Traceru
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Vyber typ kabelu, klepni na první zařízení a vyber port, pak na druhé zařízení a jeho port. Zařízení můžeš přetahovat. Nakonec zapojení nech zkontrolovat – dozvíš se, který kabel nebo port
          je špatně a proč.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Tag tone="emerald">
            Splněno {count}/{CABLING_TASKS.length}
          </Tag>
        </div>
      </Card>
      <CableRules />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {CABLING_TASKS.map((t, i) => (
          <button key={t.id} onClick={() => open(t.id)} className="card p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start gap-2">
              <span className="font-bold">
                {i + 1}. {t.title}
              </span>
              {done.has(doneKey(t.id)) && <CheckCircle2 className="ml-auto shrink-0 text-emerald-600" size={20} />}
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.goal}</p>
            <div className="mt-2 text-xs text-slate-400">
              {t.devices.length} zařízení · {t.links.length} {t.links.length === 1 ? 'spojení' : 'spojení'}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function CableRules() {
  return (
    <Card className="p-5 text-sm">
      <h3 className="mb-2 font-bold">Které kabely kam</h3>
      <ul className="space-y-1.5 text-slate-700 dark:text-slate-300">
        <li>
          <b>Rovný</b> – mezi různými typy zařízení: PC, server nebo router → switch.
        </li>
        <li>
          <b>Křížený</b> – mezi stejnými typy: PC–PC, switch–switch, router–router, a také PC–router napřímo.
        </li>
        <li>
          <b>Konzolový</b> – z portu RS 232 počítače do portu Console routeru nebo switche (konfigurace přes terminál).
        </li>
        <li>
          <b>Sériový DCE / DTE</b> – mezi porty Serial routerů (router potřebuje modul, např. HWIC-2T). DCE konec dává takt (<code>clock rate</code>); u kabelu Serial DCE je to první zapojený konec.
        </li>
      </ul>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        Moderní zařízení s funkcí Auto-MDIX si poradí i s „nesprávným“ měděným kabelem, ale u zkoušky se znalost správného typu kabelu vyžaduje.
      </p>
    </Card>
  );
}

function CablingRun({ task, onBack, onNext }: { task: CablingTask; onBack: () => void; onNext: () => void }) {
  const { recordAnswer, recordSession, toast } = useStore();
  const [devices, setDevices] = useState<Device[]>(() => task.devices.map((d) => ({ ...d })));
  const [links, setLinks] = useState<Link[]>([]);
  const [cable, setCable] = useState<CableType | null>(null);
  const [pending, setPending] = useState<{ device: string; port: string } | null>(null);
  const [picker, setPicker] = useState<string | null>(null);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const recorded = useRef(false);
  const vb = useMemo(() => viewBox(task), [task]);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ id: string; dx: number; dy: number; moved: boolean; sx: number; sy: number } | null>(null);

  const dev = (id: string) => devices.find((d) => d.id === id)!;
  const usedPorts = (id: string) => new Set(links.flatMap((l) => [l.a === id ? l.aPort : null, l.b === id ? l.bPort : null]).filter((x): x is string => !!x));
  const bad = new Set(result?.issues.map((i) => i.linkId).filter(Boolean));

  const toSvg = (e: PointerEvent) => {
    const m = svgRef.current?.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  };
  const onDown = (e: PointerEvent, d: Device) => {
    const p = toSvg(e);
    drag.current = { id: d.id, dx: p.x - d.x, dy: p.y - d.y, moved: false, sx: p.x, sy: p.y };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    const g = drag.current;
    if (!g) return;
    const p = toSvg(e);
    if (!g.moved && Math.hypot(p.x - g.sx, p.y - g.sy) < 6) return;
    g.moved = true;
    const x = Math.min(vb.x + vb.w - 40, Math.max(vb.x + 40, p.x - g.dx));
    const y = Math.min(vb.y + vb.h - 50, Math.max(vb.y + 35, p.y - g.dy));
    setDevices((ds) => ds.map((d) => (d.id === g.id ? { ...d, x, y } : d)));
  };
  const onUp = () => {
    const g = drag.current;
    drag.current = null;
    if (!g || g.moved) return;
    if (!cable) {
      toast('Nejdřív vyber typ kabelu nahoře.');
      return;
    }
    if (pending?.device === g.id) {
      toast('Kabel musí vést do jiného zařízení.', 'error');
      return;
    }
    setPicker(g.id);
  };
  const pickPort = (port: string) => {
    const id = picker!;
    setPicker(null);
    if (!pending) {
      setPending({ device: id, port });
      return;
    }
    setLinks((ls) => [...ls, { id: uid(), cable: cable!, a: pending.device, aPort: pending.port, b: id, bPort: port }]);
    setPending(null);
    setResult(null);
  };
  const chooseCable = (c: CableType) => {
    setCable(c === cable ? null : c);
    setPending(null);
  };
  const removeLink = (id: string) => {
    setLinks((ls) => ls.filter((l) => l.id !== id));
    setResult(null);
  };
  const reset = () => {
    setLinks([]);
    setPending(null);
    setResult(null);
    setDevices(task.devices.map((d) => ({ ...d })));
  };

  const check = () => {
    const r = checkCabling(task, links);
    const n = attempts + 1;
    setAttempts(n);
    setResult(r);
    if (r.ok && !recorded.current) {
      recorded.current = true;
      const score = n === 1 ? 1 : Math.max(0.4, 1 - 0.2 * (n - 1));
      const q: FlashcardQuestion = {
        id: `kabelaz|${task.id}`,
        bookId: 'site-postupy-cisco',
        area: 'it-postupy',
        factKey: `kabelaz-${task.id}`,
        difficulty: 'medium',
        type: 'flashcard',
        prompt: `Kabeláž: ${task.title}`,
        explanation: task.links.map((l) => solutionText(task, l)).join('\n'),
        answer: task.links.map((l) => solutionText(task, l)).join('; '),
      };
      recordAnswer(q, { questionId: q.id, score, userAnswer: '(stavebnice)', seconds: 0 });
      const rec: SessionRecord = {
        id: uid(),
        date: Date.now(),
        mode: 'site-kabelaz',
        title: `Stavebnice topologie: ${task.title}`,
        difficulty: 'medium',
        total: task.links.length,
        score,
        seconds: 0,
        bookIds: ['site-postupy-cisco', doneKey(task.id)],
        sections: { 'it-prakticke': { score, total: task.links.length } },
      };
      recordSession(rec, 10 + Math.round(20 * score));
    }
  };

  const pickerDev = picker ? dev(picker) : null;
  const pickerPorts = pickerDev ? MODEL_INFO[pickerDev.model].ports.filter((p) => cable && portFits(cable, p)) : [];
  const taken = picker ? usedPorts(picker) : new Set<string>();

  return (
    <div>
      <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />} onClick={onBack} className="mb-3">
        Všechny úlohy stavebnice
      </Button>
      <Card className="mb-3 p-4">
        <h2 className="font-display text-xl font-bold">{task.title}</h2>
        <p className="mt-1 text-[15px]">{task.goal}</p>
        {task.hint && attempts > 0 && !result?.ok && (
          <p className="mt-2 flex items-start gap-1.5 text-sm text-amber-700 dark:text-amber-300">
            <Lightbulb size={16} className="mt-0.5 shrink-0" /> {task.hint}
          </p>
        )}
      </Card>

      <div className="mb-2 flex flex-wrap gap-1.5">
        {(Object.keys(CABLE_INFO) as CableType[]).map((c) => (
          <button
            key={c}
            onClick={() => chooseCable(c)}
            className={cx(
              'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ring-1 transition',
              cable === c ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white ring-slate-200 hover:ring-brand-400 dark:bg-slate-900 dark:ring-white/10',
            )}
          >
            <svg width="22" height="8" aria-hidden>
              <line
                x1="1"
                y1="4"
                x2="21"
                y2="4"
                stroke={cable === c ? '#fff' : CABLE_INFO[c].color === '#0f172a' ? 'currentColor' : CABLE_INFO[c].color}
                strokeWidth="2.5"
                strokeDasharray={CABLE_INFO[c].dashed ? '4 3' : undefined}
              />
            </svg>
            {CABLE_INFO[c].short}
          </button>
        ))}
      </div>
      <p className="mb-2 min-h-5 text-sm text-slate-600 dark:text-slate-300">
        {!cable
          ? 'Vyber typ kabelu.'
          : pending
            ? `${CABLE_INFO[cable].short}: zapojeno do ${pending.device} ${pending.port}${cable === 'serial-dce' ? ' (DCE)' : cable === 'serial-dte' ? ' (DTE)' : ''} – teď klepni na druhé zařízení.`
            : `${CABLE_INFO[cable].short}: klepni na první zařízení.`}
        {pending && (
          <button className="ml-2 font-semibold text-rose-600 hover:underline" onClick={() => setPending(null)}>
            Zrušit
          </button>
        )}
      </p>

      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 dark:ring-white/10">
        <svg
          ref={svgRef}
          viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
          className="block w-full touch-none select-none"
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={() => (drag.current = null)}
        >
          <defs>
            <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M24 0H0V24" fill="none" stroke="#e2e8f0" strokeWidth="0.6" />
            </pattern>
          </defs>
          <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill="url(#grid)" />
          {links.map((l) => (
            <LinkView key={l.id} link={l} a={dev(l.a)} b={dev(l.b)} bad={bad.has(l.id)} />
          ))}
          {devices.map((d) => (
            <g key={d.id} transform={`translate(${d.x} ${d.y})`} onPointerDown={(e) => onDown(e, d)} className="cursor-pointer">
              <DeviceIcon device={d} active={pending?.device === d.id} />
            </g>
          ))}
        </svg>
      </div>

      {links.length > 0 && (
        <Card className="mt-3 p-4">
          <h3 className="mb-2 text-sm font-bold">Zapojené kabely</h3>
          <ul className="space-y-1 text-sm">
            {links.map((l) => (
              <li key={l.id} className={cx('flex items-center gap-2 rounded-lg px-2 py-1', bad.has(l.id) && 'bg-rose-50 dark:bg-rose-500/10')}>
                <span className="min-w-0 flex-1">
                  <b>{CABLE_INFO[l.cable].short}</b>: {l.a} {l.aPort} – {l.b} {l.bPort}
                  {dceEnd(l) && <span className="text-slate-500 dark:text-slate-400"> · DCE na {dceEnd(l)}</span>}
                </span>
                <button onClick={() => removeLink(l.id)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Odpojit kabel" title="Odpojit kabel">
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button icon={<CheckCircle2 size={18} />} onClick={check} disabled={!links.length}>
          Zkontrolovat zapojení
        </Button>
        <Button variant="secondary" icon={<RotateCcw size={17} />} onClick={reset}>
          Začít znovu
        </Button>
        {attempts >= 2 && !result?.ok && (
          <Button variant="ghost" icon={<Lightbulb size={17} />} onClick={() => setShowSolution((v) => !v)}>
            {showSolution ? 'Skrýt řešení' : 'Ukázat řešení'}
          </Button>
        )}
      </div>

      {result && (
        <Card className={cx('mt-3 p-4', result.ok ? 'ring-2 ring-emerald-500' : 'ring-2 ring-rose-400')}>
          {result.ok ? (
            <div>
              <p className="font-bold text-emerald-700 dark:text-emerald-400">Všechno zapojeno správně! {attempts === 1 ? 'Napoprvé 👏' : ''}</p>
              <Button className="mt-3" icon={<ChevronRight size={18} />} onClick={onNext}>
                Další úloha
              </Button>
            </div>
          ) : (
            <div>
              <p className="font-bold">
                Správně {result.correct}/{result.total} spojení. Oprav:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {result.issues.map((i, k) => (
                  <li key={k}>{i.text}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {showSolution && !result?.ok && (
        <Card className="mt-3 p-4 text-sm">
          <h3 className="mb-1 font-bold">Řešení</h3>
          <ul className="list-disc space-y-1 pl-5">
            {task.links.map((l, k) => (
              <li key={k}>{solutionText(task, l)}</li>
            ))}
          </ul>
        </Card>
      )}

      <Modal open={!!picker} onClose={() => setPicker(null)} title={pickerDev ? `${pickerDev.id} – vyber port` : ''}>
        {pickerDev && (
          <div>
            <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
              {MODEL_INFO[pickerDev.model].label} · kabel {cable ? CABLE_INFO[cable].short.toLowerCase() : ''}
            </p>
            {pickerPorts.length === 0 ? (
              <p className="text-sm">Do tohoto zařízení tenhle kabel zapojit nejde – nemá na něj vhodný port.</p>
            ) : (
              <div className="grid max-h-80 grid-cols-2 gap-1.5 overflow-y-auto sm:grid-cols-3">
                {pickerPorts.map((p) => (
                  <button
                    key={p}
                    disabled={taken.has(p)}
                    onClick={() => pickPort(p)}
                    className={cx(
                      'rounded-lg px-2 py-2 text-left text-sm ring-1',
                      taken.has(p)
                        ? 'cursor-not-allowed text-slate-400 ring-slate-200 dark:ring-white/10'
                        : 'font-medium ring-slate-300 hover:bg-brand-50 hover:ring-brand-500 dark:ring-white/15 dark:hover:bg-brand-500/10',
                    )}
                  >
                    {p}
                    {taken.has(p) && <span className="block text-xs">obsazeno</span>}
                  </button>
                ))}
              </div>
            )}
            <Button className="mt-3" size="sm" variant="ghost" icon={<X size={15} />} onClick={() => setPicker(null)}>
              Zavřít
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function LinkView({ link: l, a, b, bad }: { link: Link; a: Device; b: Device; bad: boolean }) {
  const info = CABLE_INFO[l.cable];
  const at = (t: number) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  const pa = at(0.22);
  const pb = at(0.78);
  const dce = dceEnd(l);
  const dp = dce === l.a ? at(0.36) : at(0.64);
  return (
    <g>
      {bad && <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#fb7185" strokeWidth="9" strokeOpacity="0.45" />}
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={info.color} strokeWidth="2.5" strokeDasharray={info.dashed ? '7 5' : undefined} />
      <PortLabel x={pa.x} y={pa.y} text={shortPort(l.aPort)} />
      <PortLabel x={pb.x} y={pb.y} text={shortPort(l.bPort)} />
      {dce && (
        <g transform={`translate(${dp.x} ${dp.y})`}>
          <circle r="9" fill="#fff" stroke="#dc2626" strokeWidth="1.5" />
          <path d="M0 -5V0L3.5 2.5" stroke="#dc2626" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </g>
      )}
    </g>
  );
}

function PortLabel({ x, y, text }: { x: number; y: number; text: string }) {
  const w = text.length * 7.6 + 10;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-w / 2} y="-10" width={w} height="19" rx="4" fill="#fff" stroke="#cbd5e1" />
      <text textAnchor="middle" y="4.5" fontSize="13" fontWeight="600" fill="#334155">
        {text}
      </text>
    </g>
  );
}

/** Jednoduché ikony zařízení ve stylu Packet Traceru */
function DeviceIcon({ device: d, active }: { device: Device; active: boolean }) {
  const ring = active ? '#f59e0b' : 'transparent';
  let icon;
  if (d.model === 'switch') {
    icon = (
      <g>
        <rect x="-36" y="-17" width="72" height="34" rx="6" fill="#0369a1" stroke={ring} strokeWidth="4" />
        <path d="M-20 -6H16M10 -11L16 -6L10 -1M20 6H-16M-10 1L-16 6L-10 11" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    );
  } else if (d.model === 'router' || d.model === 'router-serial') {
    icon = (
      <g>
        <ellipse cx="0" cy="0" rx="30" ry="22" fill="#0e7490" stroke={ring} strokeWidth="4" />
        <path d="M-15 -9L-6 -3M15 9L6 3M-15 9L-6 3M15 -9L6 -3" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      </g>
    );
  } else if (d.model === 'server') {
    icon = (
      <g>
        <rect x="-16" y="-26" width="32" height="52" rx="4" fill="#475569" stroke={ring} strokeWidth="4" />
        <path d="M-9 -15H9M-9 -7H9M-9 1H9" stroke="#cbd5e1" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="0" cy="15" r="3" fill="#4ade80" />
      </g>
    );
  } else {
    icon = (
      <g>
        <rect x="-24" y="-24" width="48" height="34" rx="4" fill="#334155" stroke={ring} strokeWidth="4" />
        <rect x="-19" y="-19" width="38" height="24" rx="2" fill="#7dd3fc" />
        <path d="M-6 10V17M6 10V17M-14 19H14" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
      </g>
    );
  }
  return (
    <g>
      <rect x="-42" y="-34" width="84" height="80" fill="transparent" />
      {icon}
      <text y="44" textAnchor="middle" fontSize="16" fontWeight="700" fill="#0f172a">
        {d.id}
      </text>
    </g>
  );
}
