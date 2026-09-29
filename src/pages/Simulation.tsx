import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight, GraduationCap, Mic, PenLine, Shuffle } from 'lucide-react';
import type { AbcQuestion, AnswerResult, AreaId, Book, OpenQuestion, SectionId, SessionRecord } from '../types';
import { useStore } from '../store';
import { AREA_MAP, EXAM_AREAS, SECTIONS } from '../data/osnova';
import { generateBookQuestions } from '../lib/generator';
import { bookProgress } from '../lib/progress';
import { pick, uid } from '../lib/random';
import { speechSupported } from '../lib/speech';
import { QuestionBody, Open } from '../components/questions';
import { TimerBadge } from '../components/SessionRunner';
import { bookTrainingConfig } from './BookDetail';
import { useStartSession } from './SessionPage';
import { Button, Card, EmptyState, PageHeader, ProgressBar, Tag, Toggle, cx } from '../components/ui';

export function Simulation() {
  const { data } = useStore();
  const navigate = useNavigate();
  const [voice, setVoice] = useState(false);
  const [followUps, setFollowUps] = useState(true);
  const go = (id: string) => navigate(`/simulace/${id}?${voice ? 'hlas=1&' : ''}${followUps ? '' : 'bezdoplnujicich=1'}`);
  return (
    <div>
      <PageHeader
        title="Simulace ústní maturity"
        emoji="🎓"
        sub="Zkoušející tě provede celou osnovou analýzy díla. Odpovídáš vlastními slovy – bez nabízených možností."
        action={
          <Button icon={<Shuffle size={18} />} onClick={() => data.books.length && go(pick(data.books).id)} disabled={!data.books.length}>
            Vylosovat knihu
          </Button>
        }
      />
      <Card className="mb-5 p-5">
        <h2 className="font-bold">Jak simulace probíhá</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-[15px] text-slate-600 dark:text-slate-300">
          <li>Dostaneš dílo a popis výňatku.</li>
          <li>Zkoušející se postupně ptá na 14 bodů osnovy (od zasazení výňatku po literárněhistorický kontext).</li>
          <li>Na každou otázku odpovíš písemně nebo hlasem, pak uvidíš, které klíčové body jsi zmínil(a), a ohodnotíš se.</li>
          <li>Když odpověď nebyla dobrá, zkoušející se doptá doplňující otázkou.</li>
          <li>Na konci dostaneš přehled zvládnutých a nezvládnutých oblastí a doporučení.</li>
        </ol>
        <div className="mt-4 flex flex-wrap gap-2">
          <Toggle checked={voice} onChange={setVoice} label={<span className="inline-flex items-center gap-1"><Mic size={15} /> Odpovídat hlasem {speechSupported() ? '' : '(nepodporováno)'}</span>} />
          <Toggle checked={followUps} onChange={setFollowUps} label="Doplňující otázky zkoušejícího" />
        </div>
      </Card>
      {!data.books.length ? (
        <EmptyState icon="📚" title="Nejdřív si přidej knihy" action={<Button to="/knihy">Moje knihy</Button>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.books.map((b) => (
            <button key={b.id} onClick={() => go(b.id)} className="card p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="font-bold">{b.title}</div>
              <div className="text-sm text-slate-500">{b.author}</div>
              <ProgressBar value={bookProgress(data, b)} className="mt-3" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface Step {
  area: AreaId;
  q: OpenQuestion;
  followUp?: AbcQuestion;
}

interface StepResult {
  area: AreaId;
  score: number;
  followUpScore?: number;
}

export function SimulationRun() {
  const { id } = useParams();
  const { data } = useStore();
  const book = data.books.find((b) => b.id === id);
  if (!book) return <EmptyState icon="❓" title="Kniha nenalezena" action={<Button to="/simulace">Zpět</Button>} />;
  return <SimulationInner key={book.id} book={book} />;
}

function SimulationInner({ book }: { book: Book }) {
  const { data, recordAnswer, recordSession } = useStore();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const voice = params.get('hlas') === '1';
  const withFollowUps = params.get('bezdoplnujicich') !== '1';

  const [steps] = useState<Step[]>(() => {
    const all = generateBookQuestions(book, data.books);
    return EXAM_AREAS.map((area): Step | null => {
      const q = all.find((x) => x.type === 'open' && x.factKey === `exam-${area}`) as OpenQuestion | undefined;
      if (!q) return null;
      const abcs = all.filter((x): x is AbcQuestion => x.type === 'abc' && x.area === area);
      return { area, q: voice ? { ...q, type: 'speech' as const } : q, followUp: abcs.length ? pick(abcs) : undefined };
    }).filter((s): s is Step => s !== null);
  });
  const [phase, setPhase] = useState<'intro' | 'exam' | 'done'>('intro');
  const [i, setI] = useState(0);
  const [stage, setStage] = useState<'main' | 'follow'>('main');
  const [mainResult, setMainResult] = useState<AnswerResult | null>(null);
  const [followResult, setFollowResult] = useState<AnswerResult | null>(null);
  const [results, setResults] = useState<StepResult[]>([]);
  const startedAt = useRef(Date.now());
  const qStart = useRef(Date.now());
  const saved = useRef(false);

  const step = steps[i];
  const scene = book.scenes[0];

  useEffect(() => {
    qStart.current = Date.now();
  }, [i, stage]);

  const advance = () => {
    const r: StepResult = { area: step.area, score: mainResult?.score ?? 0, followUpScore: followResult?.score };
    const nextResults = [...results, r];
    setResults(nextResults);
    setMainResult(null);
    setFollowResult(null);
    setStage('main');
    if (i + 1 >= steps.length) setPhase('done');
    else setI(i + 1);
  };

  useEffect(() => {
    if (phase !== 'done' || saved.current || !results.length) return;
    saved.current = true;
    const sections: Partial<Record<SectionId, { score: number; total: number }>> = {};
    for (const r of results) {
      const sec = AREA_MAP[r.area].section;
      const s = sections[sec] ?? { score: 0, total: 0 };
      s.score += r.score;
      s.total += 1;
      sections[sec] = s;
    }
    const rec: SessionRecord = {
      id: uid(),
      date: Date.now(),
      mode: 'simulace',
      title: `Simulace maturity: ${book.title}`,
      difficulty: 'maturita',
      total: results.length,
      score: results.reduce((s, r) => s + r.score, 0) / results.length,
      seconds: Math.round((Date.now() - startedAt.current) / 1000),
      bookIds: [book.id],
      sections: Object.fromEntries(Object.entries(sections).map(([k, v]) => [k, { score: v!.score / v!.total, total: v!.total }])),
    };
    recordSession(rec, 100);
  }, [phase, results, book, recordSession]);

  if (!steps.length) return <EmptyState icon="🤷" title="U této knihy chybí data pro simulaci" text="Doplň v úpravě knihy téma, postavy, kompozici a další údaje." action={<Button to={`/knihy/${book.id}/upravit`}>Upravit knihu</Button>} />;

  if (phase === 'intro') {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-brand-700 to-brand-950 p-6 text-white sm:p-8">
            <GraduationCap size={36} />
            <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">Simulace ústní zkoušky</h1>
            <p className="mt-1 text-brand-100">
              Vylosované dílo: <b className="text-white">{book.title}</b> ({book.author})
            </p>
          </div>
          <div className="space-y-4 p-6">
            {scene && (
              <div className="rounded-xl border-l-4 border-brand-400 bg-slate-50 p-4 dark:bg-slate-800/60">
                <div className="text-xs font-semibold uppercase text-slate-500">Výňatek</div>
                <p className="mt-1 text-[16px] italic">„{scene.scene}“</p>
              </div>
            )}
            <p className="text-slate-600 dark:text-slate-300">
              Zkoušející ti položí {steps.length} otázek podle osnovy. Odpovídej celými větami, jako bys mluvil(a) před komisí. Máš na to čas – skutečná zkouška trvá 15 minut (a 20 minut přípravy).
            </p>
            <div className="flex flex-wrap gap-2">
              <Tag tone="brand">{voice ? '🎤 Odpověď hlasem' : '✍️ Písemná odpověď'}</Tag>
              {withFollowUps && <Tag tone="violet">Doplňující otázky zapnuty</Tag>}
            </div>
            <Button
              size="lg"
              className="w-full"
              icon={<ArrowRight size={18} />}
              onClick={() => {
                startedAt.current = Date.now();
                setPhase('exam');
              }}
            >
              Začít zkoušení
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (phase === 'done') return <SimulationSummary book={book} results={results} seconds={Math.round((Date.now() - startedAt.current) / 1000)} />;

  const needFollow = withFollowUps && mainResult && mainResult.score < 1 && step.followUp;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => (results.length ? setPhase('done') : navigate('/simulace'))} className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
          Ukončit
        </button>
        <ProgressBar value={(i + (mainResult ? 1 : 0)) / steps.length} color="bg-brand-500" height="h-2.5" />
        <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-500">
          {i + 1}/{steps.length}
        </span>
        <span className="hidden text-sm text-slate-500 sm:inline">
          <TimerBadge since={startedAt.current} />
        </span>
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        <Tag tone="brand">{SECTIONS[AREA_MAP[step.area].section].label}</Tag>
        <Tag tone="violet">
          {i + 1}. {AREA_MAP[step.area].label}
        </Tag>
      </div>

      <Card className="p-5 sm:p-7">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-brand-700 dark:text-brand-400">
          <PenLine size={16} /> Zkoušející se ptá:
        </div>
        <Open
          q={step.q}
          result={mainResult}
          onSubmit={(r) => {
            const full = { ...r, questionId: step.q.id, seconds: (Date.now() - qStart.current) / 1000 };
            setMainResult(full);
            recordAnswer(step.q, full);
          }}
        />
      </Card>

      {needFollow && (
        <Card className="animate-fade-up mt-4 border-violet-300 p-5 dark:border-violet-800 sm:p-7">
          <div className="mb-3 text-sm font-semibold text-violet-700 dark:text-violet-300">🧑‍🏫 Zkoušející se doptává:</div>
          <QuestionBody
            q={step.followUp!}
            result={followResult}
            onSubmit={(r) => {
              const full = { ...r, questionId: step.followUp!.id, seconds: (Date.now() - qStart.current) / 1000 };
              setFollowResult(full);
              recordAnswer(step.followUp!, full);
            }}
          />
          {followResult && (
            <p className={cx('mt-3 font-semibold', followResult.score >= 1 ? 'text-emerald-600' : 'text-rose-600')}>
              {followResult.score >= 1 ? '✅ Správně – aspoň na doplňující otázku.' : `❌ Správně je: ${step.followUp!.options[step.followUp!.correctIndex]}`}
            </p>
          )}
        </Card>
      )}

      {mainResult && (!needFollow || followResult) && (
        <div className="mt-4 flex justify-end">
          <Button size="lg" icon={<ArrowRight size={18} />} onClick={advance}>
            {i + 1 >= steps.length ? 'Ukončit zkoušení a zobrazit hodnocení' : 'Další otázka'}
          </Button>
        </div>
      )}
    </div>
  );
}

function SimulationSummary({ book, results, seconds }: { book: Book; results: StepResult[]; seconds: number }) {
  const start = useStartSession();
  const total = results.reduce((s, r) => s + r.score, 0) / results.length;
  const grade = total >= 0.88 ? 1 : total >= 0.72 ? 2 : total >= 0.55 ? 3 : total >= 0.4 ? 4 : 5;
  const good = results.filter((r) => r.score >= 1);
  const partial = results.filter((r) => r.score > 0 && r.score < 1);
  const bad = results.filter((r) => r.score === 0);
  const bySection = useMemo(() => {
    const map = new Map<SectionId, number[]>();
    for (const r of results) {
      const s = AREA_MAP[r.area].section;
      map.set(s, [...(map.get(s) ?? []), r.score]);
    }
    return [...map.entries()];
  }, [results]);
  const weak = [...bad, ...partial];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-brand-700 to-brand-950 p-6 text-white sm:p-8">
          <div className="text-sm text-brand-200">Simulace ústní maturity · {book.title}</div>
          <div className="mt-2 flex items-end gap-4">
            <div className="text-6xl font-extrabold">{grade}</div>
            <div className="pb-2">
              <div className="text-lg font-bold">orientační známka</div>
              <div className="text-brand-100">
                {Math.round(total * 100)} % · {Math.round(seconds / 60)} min
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-slate-100 text-center dark:divide-slate-800">
          <div className="p-4">
            <div className="text-2xl font-bold text-emerald-600">{good.length}</div>
            <div className="text-xs text-slate-500">zvládnuto</div>
          </div>
          <div className="p-4">
            <div className="text-2xl font-bold text-amber-600">{partial.length}</div>
            <div className="text-xs text-slate-500">částečně</div>
          </div>
          <div className="p-4">
            <div className="text-2xl font-bold text-rose-600">{bad.length}</div>
            <div className="text-xs text-slate-500">nezvládnuto</div>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 text-lg font-bold">Výsledky podle osnovy</h2>
        <div className="space-y-3">
          {bySection.map(([s, scores]) => {
            const v = scores.reduce((a, b) => a + b, 0) / scores.length;
            return (
              <div key={s}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-semibold">{SECTIONS[s].label}</span>
                  <span className="tabular-nums">{Math.round(v * 100)} %</span>
                </div>
                <ProgressBar value={v} height="h-3" />
              </div>
            );
          })}
        </div>
        <ul className="mt-5 grid gap-1.5 sm:grid-cols-2">
          {results.map((r) => (
            <li key={r.area} className="flex items-center gap-2 text-sm">
              <span>{r.score >= 1 ? '✅' : r.score > 0 ? '🟡' : '❌'}</span>
              {AREA_MAP[r.area].label}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-5">
        <h2 className="mb-2 text-lg font-bold">Doporučení k dalšímu učení</h2>
        {weak.length ? (
          <>
            <p className="mb-3 text-sm text-slate-500">Tyto oblasti si procvič – nejlépe hned, dokud máš odpovědi v čerstvé paměti.</p>
            <ul className="space-y-2">
              {weak.map((r) => (
                <li key={r.area} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                  <span className="text-sm font-medium">
                    {r.score === 0 ? '❌' : '🟡'} {AREA_MAP[r.area].label}
                  </span>
                  <Button size="sm" onClick={() => start(bookTrainingConfig(book, [r.area]))}>
                    Procvičit
                  </Button>
                </li>
              ))}
            </ul>
            <Button className="mt-4" variant="secondary" onClick={() => start({ ...bookTrainingConfig(book, weak.map((w) => w.area)), title: `Slabé oblasti: ${book.title}`, count: 15 })}>
              Procvičit všechny slabé oblasti najednou
            </Button>
          </>
        ) : (
          <p>Výborně! Všechny oblasti jsi zvládl(a). Zkus simulaci s jinou knihou nebo odpovídej hlasem.</p>
        )}
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button to="/simulace">Další simulace</Button>
        <Button variant="secondary" to={`/knihy/${book.id}`}>
          Přehled knihy
        </Button>
        <Link to="/" className="px-3 py-2.5 font-semibold text-slate-600 dark:text-slate-300">
          Domů
        </Link>
      </div>
    </div>
  );
}
