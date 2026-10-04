import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Clock, NotebookPen, Shuffle } from 'lucide-react';
import type { AnswerResult, Question, SessionRecord, Topic } from '../../types';
import { useStore } from '../../store';
import { SITE_TOPICS, TOPIC_MAP } from '../../data/site';
import { generateTopicQuestions, topicExamQuestion } from '../../lib/topicgen';
import { topicProgress } from '../../lib/progress';
import { pick, sample, uid } from '../../lib/random';
import { QuestionBody } from '../../components/questions';
import { Button, Card, PageHeader, Pct, ProgressBar, Tag, Toggle, cx } from '../../components/ui';
import { useStartSession } from '../SessionPage';
import { topicConfig } from './common';

const PREP = 15 * 60;
const ANSWER = 15 * 60;

export function Countdown({ since, seconds }: { since: number; seconds: number }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const left = Math.round(seconds - (Date.now() - since) / 1000);
  const abs = Math.abs(left);
  return (
    <span className={cx('inline-flex items-center gap-1 font-semibold tabular-nums', left < 0 ? 'text-rose-600' : left < 60 ? 'text-amber-600' : '')}>
      <Clock size={15} /> {left < 0 ? '+' : ''}
      {String(Math.floor(abs / 60)).padStart(2, '0')}:{String(abs % 60).padStart(2, '0')}
    </span>
  );
}

export function SiteOral() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { data } = useStore();
  const preset = params.get('tema');
  const [weakFirst, setWeakFirst] = useState(false);
  const [topic, setTopic] = useState<Topic | null>(preset ? (TOPIC_MAP[preset] ?? null) : null);
  const [runKey, setRunKey] = useState(0);

  if (topic) return <OralRun key={`${topic.id}-${runKey}`} topic={topic} onAgain={() => (setTopic(null), setRunKey((k) => k + 1), navigate('/site/losovani', { replace: true }))} />;

  const draw = () => {
    if (weakFirst) {
      const sorted = [...SITE_TOPICS].sort((a, b) => topicProgress(data, a.id) - topicProgress(data, b.id));
      setTopic(pick(sorted.slice(0, 6)));
    } else setTopic(pick(SITE_TOPICS));
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Simulace ústní zkoušky – sítě" emoji="🎓" sub="Počítačové sítě a síťové operační systémy" />
      <Card className="p-6">
        <h2 className="font-bold">Jak to probíhá</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-[15px] text-slate-600 dark:text-slate-300">
          <li>Vylosuješ si jedno z 20 témat.</li>
          <li>
            <b>15 minut příprava</b> – můžeš si psát poznámky (jako na papír u zkoušky).
          </li>
          <li>
            <b>15 minut zkoušení</b> – vyložíš téma vlastními slovy (písemně nebo diktováním), aplikace zkontroluje klíčové body.
          </li>
          <li>Komise se doptává – 2 doplňující otázky k výkladu a 2 rychlé kontrolní.</li>
          <li>Na konci uvidíš orientační hodnocení a co si doplnit.</li>
        </ol>
        <div className="mt-4">
          <Toggle checked={weakFirst} onChange={setWeakFirst} label="Losovat spíš ze slabších témat" />
        </div>
        <Button size="lg" className="mt-5 w-full" icon={<Shuffle size={18} />} onClick={draw}>
          Vylosovat téma
        </Button>
      </Card>
    </div>
  );
}

interface StepResult {
  q: Question;
  score: number;
}

function OralRun({ topic, onAgain }: { topic: Topic; onAgain: () => void }) {
  const { recordAnswer, recordSession } = useStore();
  const start = useStartSession();
  const [phase, setPhase] = useState<'drawn' | 'prep' | 'exam' | 'done'>('drawn');
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(true);
  const [steps] = useState<Question[]>(() => {
    const all = generateTopicQuestions(topic);
    const deep = sample(
      all.filter((q) => q.type === 'open' && q.factKey.startsWith('deep-')),
      2,
    );
    const quick = sample(
      all.filter((q) => q.type === 'abc' && q.area === 'it-teorie'),
      2,
    );
    return [topicExamQuestion(topic), ...deep, ...quick];
  });
  const [i, setI] = useState(0);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [results, setResults] = useState<StepResult[]>([]);
  const phaseStart = useRef(Date.now());
  const startedAt = useRef(Date.now());
  const qStart = useRef(Date.now());
  const saved = useRef(false);

  useEffect(() => {
    qStart.current = Date.now();
  }, [i]);

  useEffect(() => {
    if (phase !== 'done' || saved.current || !results.length) return;
    saved.current = true;
    const score = results.reduce((s, r) => s + r.score * (r.q.factKey === 'exam' ? 2 : 1), 0) / (results.length + (results.some((r) => r.q.factKey === 'exam') ? 1 : 0));
    const rec: SessionRecord = {
      id: uid(),
      date: Date.now(),
      mode: 'simulace-site',
      title: `Simulace ústní (sítě): ${topic.number}. ${topic.title}`,
      difficulty: 'maturita',
      total: results.length,
      score,
      seconds: Math.round((Date.now() - startedAt.current) / 1000),
      bookIds: [topic.id],
      sections: { 'it-teorie': { score, total: results.length } },
    };
    recordSession(rec, 80);
  }, [phase, results, topic, recordSession]);

  const go = (p: typeof phase) => {
    phaseStart.current = Date.now();
    setPhase(p);
  };

  if (phase === 'drawn') {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-brand-700 to-brand-950 p-6 text-white sm:p-8">
            <div className="text-sm text-brand-200">Vylosované téma</div>
            <div className="mt-2 flex items-center gap-4">
              <div className="text-5xl font-extrabold">{topic.number}</div>
              <h1 className="text-2xl font-extrabold leading-tight">{topic.title}</h1>
            </div>
          </div>
          <div className="space-y-3 p-6">
            <p className="text-slate-600 dark:text-slate-300">Máš 15 minut na přípravu. Napiš si osnovu, klíčové pojmy, příklady (adresy, příkazy, schéma).</p>
            <Button
              size="lg"
              className="w-full"
              icon={<NotebookPen size={18} />}
              onClick={() => {
                startedAt.current = Date.now();
                go('prep');
              }}
            >
              Začít přípravu (15 min)
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => go('exam')}>
              Přeskočit přípravu a rovnou odpovídat
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (phase === 'prep') {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="mb-3 flex items-center justify-between">
          <Tag tone="brand">Příprava · téma {topic.number}</Tag>
          <Countdown since={phaseStart.current} seconds={PREP} />
        </div>
        <Card className="p-5">
          <h1 className="text-xl font-bold">{topic.title}</h1>
          <label htmlFor="oral-notes" className="mt-3 block text-sm font-semibold text-slate-500">
            Tvoje poznámky
          </label>
          <textarea
            id="oral-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={14}
            placeholder={'Např.\n1) definice …\n2) jak to funguje …\n3) příklad / příkazy …'}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 font-mono text-[15px] dark:border-slate-700 dark:bg-slate-900"
          />
          <Button size="lg" className="mt-4 w-full" icon={<ArrowRight size={18} />} onClick={() => go('exam')}>
            Jsem připraven(a) – ke zkoušení
          </Button>
        </Card>
      </div>
    );
  }

  if (phase === 'done') return <OralSummary topic={topic} results={results} onAgain={onAgain} onTrain={() => start(topicConfig([topic.id], `Téma ${topic.number}: ${topic.title}`))} />;

  const q = steps[i];
  const isMain = i === 0;
  const advance = () => {
    const next = [...results, { q, score: result?.score ?? 0 }];
    setResults(next);
    setResult(null);
    if (i + 1 >= steps.length) go('done');
    else setI(i + 1);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-3 flex items-center gap-3">
        <button onClick={() => (results.length ? go('done') : onAgain())} className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
          Ukončit
        </button>
        <ProgressBar value={(i + (result ? 1 : 0)) / steps.length} color="bg-brand-500" height="h-2.5" />
        <span className="shrink-0 text-sm text-slate-500">
          <Countdown since={phaseStart.current} seconds={ANSWER} />
        </span>
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        <Tag tone="brand">
          Téma {topic.number}: {topic.title}
        </Tag>
        <Tag tone="violet">{isMain ? 'Výklad tématu' : `Doplňující otázka ${i}/${steps.length - 1}`}</Tag>
      </div>
      {notes.trim() && (
        <Card className="mb-3 p-4">
          <button onClick={() => setShowNotes((s) => !s)} className="text-sm font-semibold text-slate-500">
            {showNotes ? '▾' : '▸'} Moje poznámky z přípravy
          </button>
          {showNotes && <pre className="mt-2 whitespace-pre-wrap font-mono text-sm">{notes}</pre>}
        </Card>
      )}
      <Card className="p-5 sm:p-7">
        <div className="mb-3 text-sm font-semibold text-brand-700 dark:text-brand-400">🧑‍🏫 {isMain ? 'Zkoušející:' : 'Komise se doptává:'}</div>
        <QuestionBody
          q={q}
          result={result}
          onSubmit={(r) => {
            const full = { ...r, questionId: q.id, seconds: (Date.now() - qStart.current) / 1000 };
            setResult(full);
            recordAnswer(q, full);
          }}
        />
      </Card>
      {result && (
        <div className="mt-4 flex justify-end">
          <Button size="lg" icon={<ArrowRight size={18} />} onClick={advance}>
            {i + 1 >= steps.length ? 'Ukončit a zobrazit hodnocení' : 'Další otázka'}
          </Button>
        </div>
      )}
    </div>
  );
}

function OralSummary({ topic, results, onAgain, onTrain }: { topic: Topic; results: StepResult[]; onAgain: () => void; onTrain: () => void }) {
  const main = results.find((r) => r.q.factKey === 'exam');
  const rest = results.filter((r) => r.q.factKey !== 'exam');
  const total = (main ? main.score * 2 : 0) + rest.reduce((s, r) => s + r.score, 0);
  const weight = (main ? 2 : 0) + rest.length;
  const score = weight ? total / weight : 0;
  const grade = score >= 0.88 ? 1 : score >= 0.72 ? 2 : score >= 0.55 ? 3 : score >= 0.4 ? 4 : 5;
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-brand-700 to-brand-950 p-6 text-white sm:p-8">
          <div className="text-sm text-brand-200">
            Simulace ústní · {topic.number}. {topic.title}
          </div>
          <div className="mt-2 flex items-end gap-4">
            <div className="text-6xl font-extrabold">{grade}</div>
            <div className="pb-2">
              <div className="text-lg font-bold">orientační známka</div>
              <div className="text-brand-100">
                <Pct value={score} /> · výklad se počítá dvojnásobně
              </div>
            </div>
          </div>
        </div>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {results.map((r) => (
            <li key={r.q.id} className="flex items-start gap-3 p-4 text-sm">
              <span>{r.score >= 0.85 ? '✅' : r.score > 0 ? '🟡' : '❌'}</span>
              <span className="flex-1 whitespace-pre-line">{r.q.factKey === 'exam' ? 'Výklad celého tématu' : r.q.prompt}</span>
              <span className="font-semibold">
                <Pct value={r.score} />
              </span>
            </li>
          ))}
        </ul>
      </Card>
      <Card className="p-5">
        <h2 className="mb-2 font-bold">Osnova, kterou by komise chtěla slyšet</h2>
        {topic.outline.map((o) => (
          <div key={o.heading} className="mt-3">
            <div className="font-semibold">{o.heading}</div>
            <ul className="list-disc pl-5 text-[15px] text-slate-600 dark:text-slate-300">
              {o.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        ))}
      </Card>
      <div className="flex flex-wrap gap-2">
        <Button icon={<Shuffle size={18} />} onClick={onAgain}>
          Losovat další téma
        </Button>
        <Button variant="secondary" onClick={onTrain}>
          Procvičit toto téma
        </Button>
        <Button variant="ghost" to={`/site/tema/${topic.id}`}>
          Detail tématu
        </Button>
      </div>
    </div>
  );
}
