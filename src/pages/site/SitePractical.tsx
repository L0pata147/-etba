import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calculator, Check, Dices, ExternalLink, Eye, EyeOff, Flag, ListOrdered, Lock, RefreshCw, Terminal, Timer } from 'lucide-react';
import type { Platform } from '../../types';
import { ALL_COMMANDS, COMMAND_GROUPS, PLATFORM_LABEL } from '../../data/site/commands';
import { ALL_PROCEDURES } from '../../data/site/procedures';
import { GENERATORS, generateCalcQuestions, generateScenario, type Scenario, type ScenarioTask } from '../../lib/netgen';
import { generateCommandQuestions, generateTroubleQuestions } from '../../lib/topicgen';
import { TROUBLE } from '../../data/troubleshoot';
import { sample, shuffle, uid } from '../../lib/random';
import { useStore } from '../../store';
import { Button, Card, PageHeader, Segmented, SectionTitle, Tag, cx } from '../../components/ui';
import { useStartSession } from '../SessionPage';
import { Topology } from './Topology';
import { ClickTab } from './ClickTrainer';
import { PLATFORMS, calcConfig, commandsConfig, proceduresConfig, siteConfig } from './common';

type Tab = 'zadani' | 'prikazy' | 'postupy' | 'klikani' | 'chyby' | 'vypocty';

export function SitePractical() {
  const [params, setParams] = useSearchParams();
  const tab = (['zadani', 'prikazy', 'postupy', 'klikani', 'chyby', 'vypocty'].includes(params.get('tab') ?? '') ? params.get('tab') : 'zadani') as Tab;
  return (
    <div>
      <PageHeader
        title="Praktická zkouška – sítě"
        emoji="🛠️"
        sub="Nejdřív Packet Tracer (Cisco), potom se losuje Linux (Debian 13), nebo Windows Server."
      />
      <Segmented
        className="mb-5"
        value={tab}
        onChange={(v) => setParams(v === 'zadani' ? {} : { tab: v }, { replace: true })}
        options={[
          { value: 'zadani', label: 'Zadání nanečisto' },
          { value: 'prikazy', label: 'Příkazy' },
          { value: 'postupy', label: 'Postupy' },
          { value: 'klikani', label: 'Klikání (Windows)' },
          { value: 'chyby', label: 'Najdi chybu' },
          { value: 'vypocty', label: 'Výpočty' },
        ]}
      />
      {tab === 'zadani' && <ScenarioTab />}
      {tab === 'prikazy' && <CommandsTab />}
      {tab === 'postupy' && <ProceduresTab />}
      {tab === 'klikani' && <ClickTab />}
      {tab === 'chyby' && <TroubleTab />}
      {tab === 'vypocty' && <CalcTab />}
    </div>
  );
}

// ---------- Zadání nanečisto ----------

interface ExamState {
  sc: Scenario;
  done: string[];
  osShown: boolean;
  /** 0 = bez časového limitu */
  minutes: number;
  startedAt: number;
  finishedAt?: number;
}

const EXAM_KEY = 'maturitni-trener:prakticka-nanecisto';
export const TIME_OPTIONS = [0, 45, 60, 90, 120] as const;

function loadExam(): ExamState | null {
  try {
    const e = JSON.parse(localStorage.getItem(EXAM_KEY) ?? 'null') as ExamState | null;
    return e && e.sc && Array.isArray(e.done) ? e : null;
  } catch {
    return null;
  }
}

function saveExam(e: ExamState | null) {
  try {
    if (e) localStorage.setItem(EXAM_KEY, JSON.stringify(e));
    else localStorage.removeItem(EXAM_KEY);
  } catch {
    /* úložiště nedostupné */
  }
}

export const clock = (sec: number) => {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return `${h ? `${h}:` : ''}${String(m).padStart(h ? 2 : 1, '0')}:${String(r).padStart(2, '0')}`;
};

function ScenarioTab() {
  const { recordSession } = useStore();
  const [osMode, setOsMode] = useState<'los' | 'linux' | 'windows'>('los');
  const [minutes, setMinutes] = useState<number>(0);
  // rozpracované zadání přežije zavření stránky (i zkouška na čas)
  const [exam, setExam] = useState<ExamState | null>(() => loadExam());
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(Date.now());

  const update = useCallback((fn: (e: ExamState) => ExamState) => {
    setExam((e) => {
      if (!e) return e;
      const n = fn(e);
      saveExam(n);
      return n;
    });
  }, []);

  const sc = exam?.sc ?? null;
  const done = new Set(exam?.done ?? []);
  const osShown = exam?.osShown ?? false;
  const timed = !!exam && exam.minutes > 0;
  const running = timed && !exam!.finishedAt;
  const left = timed ? exam!.startedAt + exam!.minutes * 60000 - now : 0;
  const total = sc ? sc.ptTasks.length + sc.osTasks.length : 0;

  const examRef = useRef(exam);
  examRef.current = exam;
  const finish = useCallback(() => {
    const e = examRef.current;
    if (!e || e.finishedAt) return;
    const n = { ...e, finishedAt: Date.now(), osShown: true };
    examRef.current = n;
    saveExam(n);
    setExam(n);
    const all = n.sc.ptTasks.length + n.sc.osTasks.length;
    const score = all ? n.done.length / all : 0;
    recordSession(
      {
        id: uid(),
        date: Date.now(),
        mode: 'site-zkouska',
        title: `Praktická zkouška nanečisto – Packet Tracer + ${n.sc.os === 'linux' ? 'Debian 13' : 'Windows Server'}`,
        difficulty: 'maturita',
        total: all,
        score,
        seconds: Math.round((n.finishedAt - n.startedAt) / 1000),
        bookIds: ['site-prakticka'],
        sections: { 'it-prakticke': { score, total: all } },
      },
      20 + Math.round(40 * score),
    );
  }, [recordSession]);

  // odpočet; po vypršení času se zadání samo ukončí
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running]);
  useEffect(() => {
    if (running && left <= 0) finish();
  }, [running, left, finish]);

  const generate = () => {
    const e: ExamState = { sc: generateScenario(osMode === 'los' ? undefined : osMode), done: [], osShown: osMode !== 'los', minutes, startedAt: Date.now() };
    saveExam(e);
    setExam(e);
    setOpen(new Set());
    setNow(Date.now());
  };
  const flip = (set: Set<string>, id: string) => {
    const n = new Set(set);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    return n;
  };

  const task = (t: ScenarioTask, i: number) => (
    <TaskCard
      key={t.id}
      t={t}
      i={i}
      done={done.has(t.id)}
      open={open.has(t.id)}
      locked={running}
      onDone={() => update((e) => ({ ...e, done: e.done.includes(t.id) ? e.done.filter((x) => x !== t.id) : [...e.done, t.id] }))}
      onOpen={() => setOpen((s) => flip(s, t.id))}
    />
  );

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <h2 className="font-bold">Vygeneruj si zadání ve stylu praktické zkoušky</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Pokaždé jiné adresy, počty hostů i doména. Úkoly si plň v Packet Traceru a ve virtuálce, odškrtávej je a řešení si otevři až nakonec. Skutečné zadání od školy se může lišit – jde o procvičení typických úkolů.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Segmented
            value={osMode}
            onChange={setOsMode}
            options={[
              { value: 'los', label: '🎲 Losovat OS' },
              { value: 'linux', label: 'Linux (Debian 13)' },
              { value: 'windows', label: 'Windows Server' },
            ]}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            <Timer size={15} className="mr-1 inline" />
            Na čas:
          </span>
          <Segmented value={minutes} onChange={setMinutes} options={TIME_OPTIONS.map((m) => ({ value: m, label: m ? `${m} min` : 'Bez času' }))} />
          <Button icon={<RefreshCw size={17} />} onClick={generate} disabled={running}>
            {sc ? 'Nové zadání' : 'Vygenerovat zadání'}
          </Button>
        </div>
        {minutes > 0 && !running && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Na čas jsou řešení zamčená až do konce. Délku si nastav podle toho, kolik času máte u zkoušky.</p>}
      </Card>

      {running && (
        <div className="sticky top-16 z-20 flex flex-wrap items-center gap-3 rounded-2xl border border-brand-500/40 bg-white px-4 py-3 shadow-lg lg:top-3 dark:bg-slate-900">
          <span className={cx('font-display text-2xl font-bold tabular-nums', left < 5 * 60000 ? 'text-rose-600 dark:text-rose-400' : '')}>{clock(left / 1000)}</span>
          <span className="text-sm text-slate-500 dark:text-slate-400">zbývá · splněno {done.size}/{total}</span>
          <Button size="sm" variant="secondary" className="ml-auto" icon={<Flag size={15} />} onClick={finish}>
            Ukončit a vyhodnotit
          </Button>
        </div>
      )}

      {exam?.finishedAt && timed && sc && <ExamSummary exam={exam} onNew={() => (saveExam(null), setExam(null))} />}

      {sc && (
        <>
          <Card className="p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Tag tone="brand">Firma {sc.company}</Tag>
              <Tag>Blok {sc.block}</Tag>
              <Tag>Doména {sc.domain}</Tag>
              <Tag tone="emerald">
                Splněno {done.size}/{sc.ptTasks.length + (osShown ? sc.osTasks.length : 0)}
              </Tag>
            </div>
            <div className="mt-4 rounded-xl bg-slate-50 p-2 dark:bg-slate-800/60">
              <Topology sc={sc} showAddresses={open.has('adresace') || !!exam?.finishedAt} />
            </div>
            {!open.has('adresace') && !exam?.finishedAt && <p className="mt-1 text-xs text-slate-500">Adresy se ve schématu ukážou, až si otevřeš řešení adresního plánu.</p>}
          </Card>

          <section>
            <SectionTitle sub="Cisco – router R1, switch SW1, ISP">Část 1: Packet Tracer</SectionTitle>
            <div className="space-y-3">{sc.ptTasks.map(task)}</div>
          </section>

          <section>
            <SectionTitle sub="Server ve virtuálce">Část 2: {osShown ? (sc.os === 'linux' ? 'Linux (Debian 13)' : 'Windows Server') : 'losovaný operační systém'}</SectionTitle>
            {osShown ? (
              <>
                <Card className="mb-3 p-4 text-sm">
                  {sc.os === 'windows' ? (
                    <>
                      VirtualBox · Windows Server 2016/2022 + klient Windows 10/11 · server <b>{sc.server.host}</b> · vnitřní síť {sc.server.net} · doména {sc.domain}
                      <div className="mt-1 text-xs text-slate-500">Podle školního cvičení „OS Windows“ a hodiny 1. 10. (svazek O:, domovská složka, cestovní profil, přihlašovací skript) – úkoly označené „Navíc“ jsou rozšíření pro trénink.</div>
                    </>
                  ) : (
                    <>
                      Debian 13 ve VirtualBoxu · server <b>{sc.server.host}</b> · síťovka enp0s3 · síť {sc.server.net} · adresa {sc.server.ip} · brána {sc.server.gateway}
                    </>
                  )}
                </Card>
                <div className="space-y-3">{sc.osTasks.map((t, i) => task(t, i))}</div>
              </>
            ) : (
              <Card className="p-6 text-center">
                <p className="mb-4 text-slate-600 dark:text-slate-300">Až dokončíš Packet Tracer, vylosuj si, jestli dostaneš Linux, nebo Windows Server.</p>
                <Button size="lg" icon={<Dices size={18} />} onClick={() => update((e) => ({ ...e, osShown: true }))}>
                  Vylosovat operační systém
                </Button>
              </Card>
            )}
          </section>
        </>
      )}
    </div>
  );
}

/** Vyhodnocení zadání na čas */
function ExamSummary({ exam, onNew }: { exam: ExamState; onNew: () => void }) {
  const { sc } = exam;
  const done = new Set(exam.done);
  const pt = sc.ptTasks.filter((t) => done.has(t.id)).length;
  const os = sc.osTasks.filter((t) => done.has(t.id)).length;
  const all = sc.ptTasks.length + sc.osTasks.length;
  const pct = all ? Math.round(((pt + os) / all) * 100) : 0;
  const used = Math.round(((exam.finishedAt ?? exam.startedAt) - exam.startedAt) / 1000);
  const missing = [...sc.ptTasks, ...sc.osTasks].filter((t) => !done.has(t.id));
  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-br from-brand-600 to-brand-900 p-5 text-white sm:p-6">
        <div className="text-3xl">{pct >= 80 ? '🏆' : pct >= 50 ? '💪' : '📚'}</div>
        <h2 className="mt-1 font-display text-2xl font-bold">Praktická zkouška nanečisto – hotovo</h2>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div>
            <div className="font-display text-3xl font-bold tabular-nums">{pct} %</div>
            <div className="text-sm text-white/80">splněno</div>
          </div>
          <div>
            <div className="font-display text-3xl font-bold tabular-nums">{clock(used)}</div>
            <div className="text-sm text-white/80">z {exam.minutes} min</div>
          </div>
          <div>
            <div className="font-display text-3xl font-bold tabular-nums">
              {pt + os}/{all}
            </div>
            <div className="text-sm text-white/80">úkolů</div>
          </div>
        </div>
      </div>
      <div className="space-y-3 p-5 text-sm">
        <div className="flex flex-wrap gap-2">
          <Tag tone="brand">
            Packet Tracer {pt}/{sc.ptTasks.length}
          </Tag>
          <Tag tone="violet">
            {sc.os === 'linux' ? 'Debian 13' : 'Windows Server'} {os}/{sc.osTasks.length}
          </Tag>
        </div>
        {missing.length > 0 ? (
          <p className="text-slate-600 dark:text-slate-300">
            Nesplněné úkoly: <b>{missing.map((t) => t.title).join(', ')}</b>. Řešení jsou teď odemčená níže.
          </p>
        ) : (
          <p className="font-semibold text-emerald-600 dark:text-emerald-400">Všechny úkoly splněné. Výborně!</p>
        )}
        <p className="text-xs text-slate-500 dark:text-slate-400">Výsledek se uložil do Mého pokroku. Hodnotíš se sám – odškrtávej jen to, co opravdu funguje.</p>
        <Button size="sm" icon={<RefreshCw size={15} />} onClick={onNew}>
          Nové zadání
        </Button>
      </div>
    </Card>
  );
}

// ---------- Příkazy ----------

export function CommandsTab({ platforms = PLATFORMS }: { platforms?: Platform[] }) {
  const start = useStartSession();
  const [platform, setPlatform] = useState<Platform>(platforms[0]);
  const [group, setGroup] = useState<string>('');
  const [hide, setHide] = useState(false);
  const [shown, setShown] = useState<Set<string>>(new Set());
  const groups = COMMAND_GROUPS(platform);
  const list = ALL_COMMANDS.filter((c) => c.platform === platform && (!group || c.group === group));

  const trainGroup = () => {
    const qs = generateCommandQuestions([platform]).filter((q) => list.some((c) => q.factKey === c.id));
    const fills = qs.filter((q) => q.type === 'fill');
    start({ ...siteConfig(`Příkazy ${PLATFORM_LABEL[platform]}${group ? ` – ${group}` : ''}`, { topics: false, commands: [platform] }, { mode: 'site-prikazy' }), questions: shuffle(sample(fills, 15)) });
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Segmented
          value={platform}
          onChange={(p) => {
            setPlatform(p);
            setGroup('');
            setShown(new Set());
          }}
          options={platforms.map((p) => ({ value: p, label: PLATFORM_LABEL[p] }))}
        />
        <select value={group} onChange={(e) => setGroup(e.target.value)} aria-label="Skupina příkazů" className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900">
          <option value="">Všechny skupiny</option>
          {groups.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <Button icon={<Terminal size={17} />} onClick={trainGroup}>
          Napiš příkaz – trénink {group ? `(${group})` : ''}
        </Button>
        <Button variant="secondary" onClick={() => start(commandsConfig([platform], `Příkazy ${PLATFORM_LABEL[platform]} – mix`))}>
          Mix (psaní + výběr)
        </Button>
        <Button variant="ghost" icon={hide ? <Eye size={16} /> : <EyeOff size={16} />} onClick={() => (setHide((h) => !h), setShown(new Set()))}>
          {hide ? 'Ukázat příkazy' : 'Skrýt příkazy (otestuj se)'}
        </Button>
      </div>
      <Card className="divide-y divide-slate-100 dark:divide-white/[0.06]">
        {list.map((c) => (
          <div key={c.id} className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[15px] font-medium">{c.task}</span>
              {!group && <Tag>{c.group}</Tag>}
            </div>
            {hide && !shown.has(c.id) ? (
              <button onClick={() => setShown((s) => new Set(s).add(c.id))} className="mt-1 text-sm font-semibold text-brand-600 dark:text-brand-400">
                Ukázat příkaz
              </button>
            ) : (
              <>
                <code className="mt-1 block overflow-x-auto whitespace-pre rounded-lg bg-slate-900 px-3 py-2 font-mono text-[13px] text-emerald-300">{c.command}</code>
                {c.note && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{c.note}</p>}
              </>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}

// ---------- Postupy ----------

export function ProceduresTab({ platforms = PLATFORMS }: { platforms?: Platform[] }) {
  const start = useStartSession();
  const [platform, setPlatform] = useState<Platform>(platforms[0]);
  const list = ALL_PROCEDURES.filter((p) => p.platform === platform);
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Segmented value={platform} onChange={setPlatform} options={platforms.map((p) => ({ value: p, label: PLATFORM_LABEL[p] }))} />
        <Button icon={<ListOrdered size={17} />} onClick={() => start(proceduresConfig([platform], `Postupy ${PLATFORM_LABEL[platform]} – seřaď kroky`))}>
          Seřazování kroků
        </Button>
      </div>
      <div className="space-y-3">
        {list.map((p) => (
          <details key={p.id} className="card group p-4">
            <summary className="cursor-pointer list-none">
              <div className="font-bold">{p.title}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">{p.goal}</div>
            </summary>
            <ol className="mt-3 space-y-2">
              {p.steps.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-800 dark:bg-brand-500/20 dark:text-brand-200">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px]">{s.text}</div>
                    {s.cmd && <pre className="mt-1 whitespace-pre-wrap break-words rounded-lg bg-slate-900 px-3 py-2 font-mono text-[13px] text-emerald-300">{s.cmd}</pre>}
                  </div>
                </li>
              ))}
            </ol>
            {p.source && (
              <a href={p.source.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300">
                <ExternalLink size={15} /> {p.source.label}
              </a>
            )}
          </details>
        ))}
      </div>
    </div>
  );
}

// ---------- Výpočty ----------

function CalcTab() {
  const start = useStartSession();
  const kinds = useMemo(() => Object.entries(GENERATORS), []);
  const run = (kind: string, label: string) => start({ ...siteConfig(`Výpočty: ${label}`, { topics: false, calc: true }, { mode: 'site-vypocty' }), questions: shuffle(generateCalcQuestions(8, [kind])) });
  return (
    <div>
      <Card className="mb-4 p-5">
        <h2 className="font-bold">Příklady se generují pokaždé nové</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Adresy sítí, broadcast, rozsahy, masky, VLSM, IPv6 i převody do dvojkové soustavy. Výsledek píšeš přesně – jako při návrhu adresace v Packet Traceru.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button icon={<Calculator size={17} />} onClick={() => start(calcConfig(12))}>
            Mix všech výpočtů (12 příkladů)
          </Button>
          <Button variant="secondary" to="/dril?predmet=site">
            ⚡ Rychlostní dril
          </Button>
        </div>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {kinds.map(([kind, g]) => (
          <button key={kind} onClick={() => run(kind, g.label)} className="card p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="font-bold">{g.label}</div>
            <div className="mt-1 text-sm text-slate-500">8 příkladů →</div>
          </button>
        ))}
      </div>
    </div>
  );
}

/** Úkol zadání s odškrtnutím a skrytým řešením */
export function TaskCard({ t, i, done, open, onDone, onOpen, locked }: { t: ScenarioTask; i: number; done: boolean; open: boolean; onDone: () => void; onOpen: () => void; locked?: boolean }) {
  return (
    <div className={cx('rounded-xl border p-4 transition', done ? 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-500/10' : 'border-slate-200 dark:border-white/[0.07]')}>
      <div className="flex items-start gap-3">
        <button
          onClick={onDone}
          className={cx('mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border-2', done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600')}
          aria-label={done ? 'Označit jako nesplněné' : 'Označit jako splněné'}
        >
          {done && <Check size={16} />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="font-semibold">
            {i + 1}. {t.title}
          </div>
          <p className="mt-1 text-[15px] text-slate-600 dark:text-slate-300">{t.detail}</p>
          {locked ? (
            <div className="mt-2 inline-flex items-center gap-1 text-sm text-slate-400">
              <Lock size={14} /> Řešení se odemkne po skončení
            </div>
          ) : (
            <button onClick={onOpen} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 dark:text-brand-400">
              {open ? <EyeOff size={15} /> : <Eye size={15} />} {open ? 'Skrýt řešení' : 'Ukázat řešení'}
            </button>
          )}
          {open && !locked && <pre className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-slate-900 p-3 font-mono text-[13px] leading-relaxed text-slate-100">{t.solution}</pre>}
        </div>
      </div>
    </div>
  );
}

/** Hledání chyb v konfiguraci */
export function TroubleTab({ platforms = PLATFORMS }: { platforms?: Platform[] }) {
  const start = useStartSession();
  const [shown, setShown] = useState<Set<string>>(new Set());
  const list = TROUBLE.filter((t) => platforms.includes(t.platform));
  return (
    <div>
      <Card className="mb-4 p-5">
        <h2 className="font-bold">Najdi chybu v konfiguraci</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">U praktické zkoušky často něco nefunguje a musíš zjistit proč. Prohlédni si výpis, zkus chybu najít sám a teprve pak se podívej na řešení.</p>
        <Button className="mt-3" onClick={() => start({ ...siteConfig('Najdi chybu v konfiguraci', { topics: false, commands: platforms }, { mode: 'chyby' }), questions: shuffle(generateTroubleQuestions(platforms)) })}>
          Trénink – {list.length} úloh
        </Button>
      </Card>
      <div className="space-y-3">
        {list.map((t) => (
          <Card key={t.id} className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Tag>{PLATFORM_LABEL[t.platform]}</Tag>
              <span className="font-bold">{t.title}</span>
            </div>
            <p className="mt-1 text-[15px] text-slate-600 dark:text-slate-300">{t.symptom}</p>
            <pre className="mt-2 overflow-x-auto whitespace-pre rounded-lg bg-slate-900 p-3 font-mono text-[13px] leading-relaxed text-emerald-300">{t.config}</pre>
            {shown.has(t.id) ? (
              <div className="mt-2 rounded-lg bg-emerald-50 p-3 text-sm dark:bg-emerald-500/10">
                <div className="font-semibold">Chyba: {t.answer}</div>
                <pre className="mt-1 whitespace-pre-wrap font-sans">{t.fix}</pre>
              </div>
            ) : (
              <button onClick={() => setShown((s) => new Set(s).add(t.id))} className="mt-2 text-sm font-semibold text-brand-600 dark:text-brand-400">
                Ukázat řešení
              </button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
