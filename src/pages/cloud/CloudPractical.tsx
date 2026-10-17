import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Flag, RefreshCw, Timer } from 'lucide-react';
import { HYPERVISOR_LABEL, cloudExamParts, generateCloudScenario, type CloudScenario, type Hypervisor } from '../../lib/cloudgen';
import { uid } from '../../lib/random';
import { useStore } from '../../store';
import { Button, Card, PageHeader, Segmented, SectionTitle, Tag, cx } from '../../components/ui';
import { CommandsTab, ProceduresTab, TIME_OPTIONS, TaskCard, TroubleTab, clock } from '../site/SitePractical';
import { SUBJECT_PLATFORMS } from '../../data/subjects';

type Tab = 'zadani' | 'prikazy' | 'postupy' | 'chyby';

export function CloudPractical() {
  const [params, setParams] = useSearchParams();
  const tab = (['zadani', 'prikazy', 'postupy', 'chyby'].includes(params.get('tab') ?? '') ? params.get('tab') : 'zadani') as Tab;
  return (
    <div>
      <PageHeader title="Praktická zkouška – cloud" emoji="🛠️" sub="Virtualizace, virtuální sítě, snapshoty a zálohy, kontejnery, NFS a GlusterFS." />
      <Segmented
        className="mb-5"
        value={tab}
        onChange={(v) => setParams(v === 'zadani' ? {} : { tab: v }, { replace: true })}
        options={[
          { value: 'zadani', label: 'Zadání nanečisto' },
          { value: 'prikazy', label: 'Příkazy' },
          { value: 'postupy', label: 'Postupy' },
          { value: 'chyby', label: 'Najdi chybu' },
        ]}
      />
      {tab === 'zadani' && <CloudScenarioTab />}
      {tab === 'prikazy' && <CommandsTab platforms={SUBJECT_PLATFORMS.cloud} />}
      {tab === 'postupy' && <ProceduresTab platforms={SUBJECT_PLATFORMS.cloud} />}
      {tab === 'chyby' && <TroubleTab platforms={SUBJECT_PLATFORMS.cloud} />}
    </div>
  );
}

// ---------- Zadání nanečisto (i na čas) ----------

interface CloudExam {
  sc: CloudScenario;
  done: string[];
  /** 0 = bez časového limitu */
  minutes: number;
  startedAt: number;
  finishedAt?: number;
}

const EXAM_KEY = 'maturitni-trener:cloud-nanecisto';

function loadExam(): CloudExam | null {
  try {
    const e = JSON.parse(localStorage.getItem(EXAM_KEY) ?? 'null') as CloudExam | null;
    return e && e.sc && Array.isArray(e.sc.tasks) && Array.isArray(e.done) ? e : null;
  } catch {
    return null;
  }
}

function saveExam(e: CloudExam | null) {
  try {
    if (e) localStorage.setItem(EXAM_KEY, JSON.stringify(e));
    else localStorage.removeItem(EXAM_KEY);
  } catch {
    /* úložiště nedostupné */
  }
}

function CloudScenarioTab() {
  const { recordSession } = useStore();
  const [hv, setHv] = useState<Hypervisor>(() => loadExam()?.sc.hypervisor ?? 'virtualbox');
  const [minutes, setMinutes] = useState<number>(0);
  // rozpracované zadání přežije zavření stránky (i zkouška na čas)
  const [exam, setExam] = useState<CloudExam | null>(() => loadExam());
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(Date.now());

  const sc = exam?.sc ?? null;
  const done = new Set(exam?.done ?? []);
  const timed = !!exam && exam.minutes > 0;
  const running = timed && !exam!.finishedAt;
  const left = timed ? exam!.startedAt + exam!.minutes * 60000 - now : 0;

  const examRef = useRef(exam);
  examRef.current = exam;
  const finish = useCallback(() => {
    const e = examRef.current;
    if (!e || e.finishedAt) return;
    const n = { ...e, finishedAt: Date.now() };
    examRef.current = n;
    saveExam(n);
    setExam(n);
    const all = n.sc.tasks.length;
    const score = all ? n.done.length / all : 0;
    recordSession(
      {
        id: uid(),
        date: Date.now(),
        mode: 'cloud-zkouska',
        title: `Praktická zkouška z cloudu nanečisto – ${HYPERVISOR_LABEL[n.sc.hypervisor]}`,
        difficulty: 'maturita',
        total: all,
        score,
        seconds: Math.round((n.finishedAt - n.startedAt) / 1000),
        bookIds: ['cloud-prakticka'],
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
    const e: CloudExam = { sc: generateCloudScenario(hv), done: [], minutes, startedAt: Date.now() };
    saveExam(e);
    setExam(e);
    setOpen(new Set());
    setNow(Date.now());
  };
  const toggleDone = (id: string) =>
    setExam((e) => {
      if (!e) return e;
      const n = { ...e, done: e.done.includes(id) ? e.done.filter((x) => x !== id) : [...e.done, id] };
      saveExam(n);
      return n;
    });
  const flip = (set: Set<string>, id: string) => {
    const n = new Set(set);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    return n;
  };

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <h2 className="font-bold">Vygeneruj si zadání ve stylu praktické zkoušky</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Pokaždé jiné adresy a parametry virtuálních počítačů. Úkoly plň ve virtualizaci, odškrtávej je a řešení si otevři až nakonec. Skutečné zadání a použitá platforma se u zkoušky mohou lišit – jde o procvičení typických úkolů.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Segmented
            value={hv}
            onChange={setHv}
            options={[
              { value: 'virtualbox', label: 'VirtualBox' },
              { value: 'hyperv', label: 'Hyper-V' },
              { value: 'proxmox', label: 'Proxmox VE' },
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
          <span className="text-sm text-slate-500 dark:text-slate-400">
            zbývá · splněno {done.size}/{sc!.tasks.length}
          </span>
          <Button size="sm" variant="secondary" className="ml-auto" icon={<Flag size={15} />} onClick={finish}>
            Ukončit a vyhodnotit
          </Button>
        </div>
      )}

      {exam?.finishedAt && timed && sc && <CloudExamSummary exam={exam} onNew={() => (saveExam(null), setExam(null))} />}

      {sc && (
        <>
          <Card className="flex flex-wrap gap-2 p-5">
            <Tag tone="brand">Firma {sc.company}</Tag>
            <Tag>{HYPERVISOR_LABEL[sc.hypervisor]}</Tag>
            <Tag>Síť {sc.net}</Tag>
            <Tag>Brána {sc.gateway}</Tag>
            <Tag tone="emerald">
              Splněno {done.size}/{sc.tasks.length}
            </Tag>
          </Card>
          <section>
            <SectionTitle sub="Virtualizace, kontejnery, úložiště, zálohy">Úkoly</SectionTitle>
            <div className="space-y-3">
              {sc.tasks.map((t, i) => (
                <TaskCard key={t.id} t={t} i={i} done={done.has(t.id)} open={open.has(t.id)} locked={running} onDone={() => toggleDone(t.id)} onOpen={() => setOpen((s) => flip(s, t.id))} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

/** Vyhodnocení zadání z cloudu na čas */
function CloudExamSummary({ exam, onNew }: { exam: CloudExam; onNew: () => void }) {
  const { sc } = exam;
  const all = sc.tasks.length;
  const pct = all ? Math.round((exam.done.length / all) * 100) : 0;
  const used = Math.round(((exam.finishedAt ?? exam.startedAt) - exam.startedAt) / 1000);
  const missing = sc.tasks.filter((t) => !exam.done.includes(t.id));
  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-br from-brand-600 to-brand-900 p-5 text-white sm:p-6">
        <div className="text-3xl">{pct >= 80 ? '🏆' : pct >= 50 ? '💪' : '📚'}</div>
        <h2 className="mt-1 font-display text-2xl font-bold">Zkouška z cloudu nanečisto – hotovo</h2>
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
              {exam.done.length}/{all}
            </div>
            <div className="text-sm text-white/80">úkolů</div>
          </div>
        </div>
      </div>
      <div className="space-y-3 p-5 text-sm">
        <div className="flex flex-wrap gap-2">
          {cloudExamParts(sc, exam.done).map((p) => (
            <Tag key={p.label} tone={p.tone}>
              {p.label} {p.done}/{p.tasks.length}
            </Tag>
          ))}
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
