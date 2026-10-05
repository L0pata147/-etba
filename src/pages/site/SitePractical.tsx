import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calculator, Check, Dices, Eye, EyeOff, ListOrdered, RefreshCw, Terminal } from 'lucide-react';
import type { Platform } from '../../types';
import { ALL_COMMANDS, COMMAND_GROUPS, PLATFORM_LABEL } from '../../data/site/commands';
import { ALL_PROCEDURES } from '../../data/site/procedures';
import { GENERATORS, generateCalcQuestions, generateScenario, type Scenario, type ScenarioTask } from '../../lib/netgen';
import { generateCommandQuestions, generateTroubleQuestions } from '../../lib/topicgen';
import { TROUBLE } from '../../data/troubleshoot';
import { sample, shuffle } from '../../lib/random';
import { Button, Card, PageHeader, Segmented, SectionTitle, Tag, cx } from '../../components/ui';
import { useStartSession } from '../SessionPage';
import { Topology } from './Topology';
import { PLATFORMS, calcConfig, commandsConfig, proceduresConfig, siteConfig } from './common';

type Tab = 'zadani' | 'prikazy' | 'postupy' | 'chyby' | 'vypocty';

export function SitePractical() {
  const [params, setParams] = useSearchParams();
  const tab = (['zadani', 'prikazy', 'postupy', 'chyby', 'vypocty'].includes(params.get('tab') ?? '') ? params.get('tab') : 'zadani') as Tab;
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
          { value: 'chyby', label: 'Najdi chybu' },
          { value: 'vypocty', label: 'Výpočty' },
        ]}
      />
      {tab === 'zadani' && <ScenarioTab />}
      {tab === 'prikazy' && <CommandsTab />}
      {tab === 'postupy' && <ProceduresTab />}
      {tab === 'chyby' && <TroubleTab />}
      {tab === 'vypocty' && <CalcTab />}
    </div>
  );
}

// ---------- Zadání nanečisto ----------

function ScenarioTab() {
  const [osMode, setOsMode] = useState<'los' | 'linux' | 'windows'>('los');
  const [sc, setSc] = useState<Scenario | null>(null);
  const [osShown, setOsShown] = useState(false);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<Set<string>>(new Set());

  const generate = () => {
    setSc(generateScenario(osMode === 'los' ? undefined : osMode));
    setOsShown(osMode !== 'los');
    setDone(new Set());
    setOpen(new Set());
  };
  const flip = (set: Set<string>, id: string) => {
    const n = new Set(set);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    return n;
  };

  const task = (t: ScenarioTask, i: number) => (
    <TaskCard key={t.id} t={t} i={i} done={done.has(t.id)} open={open.has(t.id)} onDone={() => setDone((s) => flip(s, t.id))} onOpen={() => setOpen((s) => flip(s, t.id))} />
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
          <Button icon={<RefreshCw size={17} />} onClick={generate}>
            {sc ? 'Nové zadání' : 'Vygenerovat zadání'}
          </Button>
        </div>
      </Card>

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
              <Topology sc={sc} showAddresses={open.has('adresace')} />
            </div>
            {!open.has('adresace') && <p className="mt-1 text-xs text-slate-500">Adresy se ve schématu ukážou, až si otevřeš řešení adresního plánu.</p>}
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
                      VirtualBox · Windows Server 2016 + klient Windows 10 · server <b>{sc.server.host}</b> · vnitřní síť {sc.server.net} · doména {sc.domain}
                      <div className="mt-1 text-xs text-slate-500">Podle školního cvičení „OS Windows“ – úkoly označené „Navíc“ jsou rozšíření pro trénink.</div>
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
                <Button size="lg" icon={<Dices size={18} />} onClick={() => setOsShown(true)}>
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
        <select value={group} onChange={(e) => setGroup(e.target.value)} aria-label="Skupina příkazů" className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
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
      <Card className="divide-y divide-slate-100 dark:divide-slate-800">
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
                    {s.cmd && <pre className="mt-1 overflow-x-auto whitespace-pre rounded-lg bg-slate-900 px-3 py-2 font-mono text-[13px] text-emerald-300">{s.cmd}</pre>}
                  </div>
                </li>
              ))}
            </ol>
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
export function TaskCard({ t, i, done, open, onDone, onOpen }: { t: ScenarioTask; i: number; done: boolean; open: boolean; onDone: () => void; onOpen: () => void }) {
  return (
    <div className={cx('rounded-xl border p-4 transition', done ? 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-500/10' : 'border-slate-200 dark:border-slate-800')}>
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
          <button onClick={onOpen} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 dark:text-brand-400">
            {open ? <EyeOff size={15} /> : <Eye size={15} />} {open ? 'Skrýt řešení' : 'Ukázat řešení'}
          </button>
          {open && <pre className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-slate-900 p-3 font-mono text-[13px] leading-relaxed text-slate-100">{t.solution}</pre>}
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
