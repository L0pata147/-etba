import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, CircleCheck, CircleX, Flag, ListChecks, Swords, Timer, Trophy, X } from 'lucide-react';
import type { AnswerResult, Question, SectionId } from '../types';
import { useStore } from '../store';
import { AREA_MAP } from '../data/osnova';
import { loadDaily, loadDuels, makeResult, pointsFor, ranked, readPlay, submitResult, timeLimit, writePlay, type ContestEntry, type ContestResult, type Mark, type PlayState } from '../lib/contests';
import { uid } from '../lib/random';
import { QuestionBody, correctAnswerText } from '../components/questions';
import { bookLabel } from '../components/SessionRunner';
import { ContestReview } from '../components/ContestReview';
import { Button, Card, ProgressBar, Tag, cx, formatDuration, plural } from '../components/ui';

/** Co se předá při spuštění hry */
export interface ContestRoute {
  id: string;
  kind: 'den' | 'duel';
  title: string;
  questions: Question[];
  /** duel: přezdívka a identifikátor soupeře, jeho výsledek (pokud už hrál) */
  vs?: string;
  vsPid?: string;
  theirs?: ContestResult;
}

const TIMEOUT = '(čas vypršel)';

export function ContestPlay() {
  const st = useLocation().state as ContestRoute | null;
  const { data } = useStore();
  if (!st?.questions?.length || !data.settings.group) return <Navigate to="/souteze" replace />;
  return <Runner key={st.id} {...st} />;
}

type Phase = 'intro' | 'question' | 'feedback' | 'done';

function initial(r: ContestRoute, group: string): { play: PlayState; phase: Phase } {
  const saved = readPlay(r.id);
  if (!saved) return { play: { id: r.id, kind: r.kind, group, title: r.title, marks: [], answers: [], shown: -1, startedAt: Date.now() }, phase: 'intro' };
  if (saved.result) return { play: saved, phase: 'done' };
  const play = { ...saved, marks: [...saved.marks], answers: [...saved.answers] };
  // otázka byla vidět, ale aplikace se zavřela → počítá se jako špatně (jinak by šlo otázky „okukovat“)
  if (play.shown === play.marks.length && play.shown < r.questions.length) {
    play.marks.push([0, 0, timeLimit(r.questions[play.shown])]);
    play.answers.push(TIMEOUT);
    writePlay(play);
  }
  return { play, phase: play.marks.length ? 'feedback' : 'intro' };
}

function Runner(route: ContestRoute) {
  const { id, kind, title, questions, vs, vsPid, theirs } = route;
  const { data, recordAnswer, recordSession, recordContests, toast } = useStore();
  const g = data.settings.group!;
  const navigate = useNavigate();
  const [init] = useState(() => initial(route, g.code));
  const [play, setPlay] = useState<PlayState>(init.play);
  const [phase, setPhase] = useState<Phase>(init.phase);
  const [current, setCurrent] = useState<AnswerResult | null>(null);
  const [qStart, setQStart] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [sendState, setSendState] = useState<'sending' | 'sent' | 'offline' | ''>(init.play.result ? (init.play.submitted ? 'sent' : '') : '');
  const [others, setOthers] = useState<ContestEntry[]>([]);
  const [review, setReview] = useState(false);
  const finishing = useRef(false);
  // index otázky, na kterou už padla odpověď (klik a vypršení času ve stejnou chvíli)
  const answered = useRef(init.play.marks.length - 1);

  const idx = phase === 'question' ? play.marks.length : play.marks.length - 1;
  const q = questions[Math.max(0, idx)];
  const limit = timeLimit(q);
  const left = phase === 'question' ? Math.max(0, limit - (now - qStart) / 1000) : 0;

  const save = (p: PlayState) => {
    writePlay(p);
    setPlay(p);
  };

  const show = useCallback(
    (i: number) => {
      const p = { ...play, shown: i };
      writePlay(p);
      setPlay(p);
      setCurrent(null);
      setQStart(Date.now());
      setNow(Date.now());
      setPhase('question');
    },
    [play],
  );

  const answer = useCallback(
    (r: Omit<AnswerResult, 'questionId' | 'seconds'>) => {
      if (phase !== 'question' || answered.current >= play.marks.length) return;
      answered.current = play.marks.length;
      const sec = Math.min(limit, (Date.now() - qStart) / 1000);
      const ok = r.score >= 1;
      const mark: Mark = [ok ? 1 : 0, pointsFor(ok, sec, limit), Math.round(sec * 10) / 10];
      const p = { ...play, marks: [...play.marks, mark], answers: [...play.answers, r.userAnswer] };
      writePlay(p);
      setPlay(p);
      const full = { ...r, questionId: q.id, seconds: sec };
      setCurrent(full);
      setPhase('feedback');
      recordAnswer(q, full);
    },
    [phase, limit, qStart, play, q, recordAnswer],
  );

  // odpočet; po vypršení se otázka počítá jako špatně
  useEffect(() => {
    if (phase !== 'question') return;
    const t = setInterval(() => {
      setNow(Date.now());
      if ((Date.now() - qStart) / 1000 >= limit) answer({ score: 0, userAnswer: TIMEOUT });
    }, 100);
    return () => clearInterval(t);
  }, [phase, qStart, limit, answer]);

  const refreshOthers = useCallback(async () => {
    try {
      const list = kind === 'den' ? (await loadDaily(g, id.split(':')[2])).results : ((await loadDuels(g)).find((d) => d.id === id)?.results ?? []);
      setOthers(list.filter((e) => !e.me));
    } catch {
      /* zkusí se příště */
    }
  }, [g, id, kind]);

  const send = useCallback(
    async (p: PlayState) => {
      if (!p.result) return;
      setSendState('sending');
      try {
        const r = await submitResult(g, p.id, p.result);
        writePlay({ ...p, submitted: true });
        setPlay((x) => ({ ...x, submitted: true }));
        setSendState('sent');
        if (r.already) toast('Tuhle hru už máš odehranou z jiného zařízení – platí první výsledek.', 'info');
      } catch (e) {
        setSendState('offline');
        if (!(e instanceof TypeError)) toast((e as Error).message, 'error');
      }
      void refreshOthers();
    },
    [g, toast, refreshOthers],
  );

  const finish = useCallback(() => {
    if (finishing.current) return;
    finishing.current = true;
    const result = makeResult(play.marks);
    const p = { ...play, result };
    save(p);
    setPhase('done');
    const sections: Partial<Record<SectionId, { score: number; total: number }>> = {};
    questions.forEach((x, i) => {
      const sec = AREA_MAP[x.area].section;
      const s = sections[sec] ?? { score: 0, total: 0 };
      s.score += play.marks[i]?.[0] ?? 0;
      s.total += 1;
      sections[sec] = s;
    });
    const score = result.total ? result.correct / result.total : 0;
    recordSession(
      {
        id: uid(),
        date: Date.now(),
        mode: kind === 'den' ? 'kviz-dne' : 'duel',
        title,
        difficulty: 'easy',
        total: result.total,
        score,
        seconds: Math.round((Date.now() - play.startedAt) / 1000),
        bookIds: [...new Set(questions.map((x) => x.bookId))],
        sections: Object.fromEntries(Object.entries(sections).map(([k, v]) => [k, { score: v!.score / v!.total, total: v!.total }])),
      },
      20 + (score >= 0.999 && result.total >= 8 ? 30 : 0),
    );
    if (kind === 'den') recordContests({ daily: { [id.split(':')[2]]: { points: result.points, correct: result.correct, total: result.total } } });
    void send(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- save je jen pomocník
  }, [play, questions, kind, title, id, recordSession, recordContests, send]);

  // výsledek uložený, ale neodeslaný (bez připojení) → zkusit znovu
  useEffect(() => {
    if (phase === 'done' && play.result && !play.submitted && sendState === '') void send(play);
    else if (phase === 'done') void refreshOthers();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- jen po otevření
  }, []);

  const next = useCallback(() => {
    if (play.marks.length >= questions.length) finish();
    else show(play.marks.length);
  }, [play.marks.length, questions.length, finish, show]);

  // Enter = další otázka
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLButtonElement || e.target instanceof HTMLAnchorElement) return;
      if (e.key === 'Enter' && phase === 'feedback') {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, next]);

  if (phase === 'intro') {
    return (
      <div className="mx-auto max-w-xl">
        <Card className="overflow-hidden">
          <div className={cx('p-6 text-white sm:p-8', kind === 'den' ? 'bg-gradient-to-br from-violet-600 via-fuchsia-600 to-rose-500' : 'bg-gradient-to-br from-rose-600 via-orange-500 to-amber-400')}>
            <div className="text-4xl">{kind === 'den' ? '🧠' : '⚔️'}</div>
            <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl">{title}</h1>
            {vs && <p className="mt-1 text-white/85">Soupeř: {vs}{theirs ? ` · má ${theirs.points} bodů` : ''}</p>}
          </div>
          <div className="space-y-3 p-6 text-[15px]">
            <p>
              <b>{questions.length} {plural(questions.length, 'otázka', 'otázky', 'otázek')}</b>, na každou máš pár vteřin (podle délky 15–50 s).
            </p>
            <p>Za správnou odpověď dostaneš 50–100 bodů – čím rychleji, tím víc. Špatná odpověď nebo vypršený čas = 0.</p>
            <p className="text-slate-500 dark:text-slate-400">Hraje se jen jednou. Když hru zavřeš uprostřed otázky, ta otázka se počítá jako špatně.</p>
            <div className="flex gap-2 pt-2">
              <Button icon={kind === 'den' ? <Trophy size={18} /> : <Swords size={18} />} onClick={() => show(0)}>
                Začít
              </Button>
              <Button variant="ghost" onClick={() => navigate('/souteze')}>
                Zpět
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (phase === 'done' && play.result) {
    const r = play.result;
    const mine: ContestEntry = { name: 'Ty', pid: '', me: true, result: r, at: '' };
    const board = ranked([mine, ...others]);
    const myRank = board.find((x) => x.me)?.rank ?? 1;
    const opp = kind === 'duel' ? (others[0]?.result ?? theirs) : undefined;
    const outcome = opp ? (r.points > opp.points ? 'win' : r.points < opp.points ? 'loss' : 'draw') : null;
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Card className="overflow-hidden">
          <div className={cx('p-6 text-white sm:p-8', outcome === 'loss' ? 'bg-gradient-to-br from-slate-600 to-slate-900' : 'bg-gradient-to-br from-violet-600 via-fuchsia-600 to-rose-500')}>
            <div className="text-4xl">{outcome === 'win' ? '🏆' : outcome === 'loss' ? '💪' : outcome === 'draw' ? '🤝' : kind === 'duel' ? '⚔️' : r.correct >= r.total * 0.8 ? '🎉' : '🧠'}</div>
            <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl">{outcome === 'win' ? 'Výhra!' : outcome === 'loss' ? 'Tentokrát prohra' : outcome === 'draw' ? 'Remíza' : kind === 'den' ? 'Kvíz dokončen' : 'Odehráno'}</h1>
            <p className="text-white/85">{title}</p>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <div>
                <div className="font-display text-3xl font-bold tabular-nums">{r.points}</div>
                <div className="text-sm text-white/80">bodů</div>
              </div>
              <div>
                <div className="font-display text-3xl font-bold tabular-nums">
                  {r.correct}/{r.total}
                </div>
                <div className="text-sm text-white/80">správně</div>
              </div>
              <div>
                <div className="font-display text-3xl font-bold tabular-nums">{formatDuration(Math.round(r.seconds))}</div>
                <div className="text-sm text-white/80">čas</div>
              </div>
            </div>
          </div>
          <div className="p-5">
            {sendState === 'sending' && <p className="text-sm text-slate-500">Odesílám výsledek…</p>}
            {sendState === 'offline' && (
              <p className="text-sm text-amber-600 dark:text-amber-300">
                Výsledek je uložený v zařízení a odešle se, až budeš online.{' '}
                <button type="button" className="font-semibold underline" onClick={() => void send(play)}>
                  Zkusit znovu
                </button>
              </p>
            )}
            {kind === 'duel' && (
              <div className="text-[15px]">
                {opp ? (
                  <div className="flex items-center justify-center gap-4 font-display text-2xl font-bold">
                    <span className={cx(outcome === 'win' && 'text-emerald-600 dark:text-emerald-400')}>Ty {r.points}</span>
                    <span className="text-slate-400">:</span>
                    <span className={cx(outcome === 'loss' && 'text-emerald-600 dark:text-emerald-400')}>
                      {opp.points} {vs}
                    </span>
                  </div>
                ) : (
                  <p className="text-slate-600 dark:text-slate-300">
                    Teď je na tahu <b>{vs}</b>. Výsledek uvidíš v Soutěžích, až dohraje (má na to 7 dní).
                  </p>
                )}
              </div>
            )}
            {kind === 'den' && (
              <>
                <div className="mb-2 flex items-baseline justify-between">
                  <h2 className="font-bold">Dnešní pořadí</h2>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {myRank}. místo z {board.length}
                  </span>
                </div>
                <ol className="space-y-1">
                  {board.map((e, i) => (
                    <li key={i} className={cx('flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm', e.me ? 'bg-brand-500/10 font-semibold ring-1 ring-brand-500/30' : 'bg-slate-900/[0.03] dark:bg-white/[0.04]')}>
                      <span className="w-6 text-center font-display font-bold">{e.rank === 1 ? '🥇' : e.rank === 2 ? '🥈' : e.rank === 3 ? '🥉' : e.rank}</span>
                      <span className="flex-1 truncate">{e.name}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {e.result.correct}/{e.result.total} · {formatDuration(Math.round(e.result.seconds))}
                      </span>
                      <span className="w-16 text-right font-bold tabular-nums">{e.result.points}</span>
                    </li>
                  ))}
                </ol>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Ostatní můžou hrát až do půlnoci, konečné pořadí bude zítra. Vítěz dostane +50 XP.</p>
              </>
            )}
          </div>
        </Card>
        <div className="flex flex-wrap gap-2">
          <Button icon={<ListChecks size={18} />} onClick={() => setReview(true)}>
            Projít otázky
          </Button>
          {outcome === 'loss' && vsPid && (
            <Button variant="secondary" icon={<Swords size={18} />} onClick={() => navigate(`/souteze?duel=${vsPid}`)}>
              Odveta
            </Button>
          )}
          <Button variant="secondary" onClick={() => navigate('/souteze')}>
            Zpět na soutěže
          </Button>
        </div>
        <ContestReview open={review} onClose={() => setReview(false)} title={title} questions={questions} marks={play.marks} answers={play.answers} others={others} />
      </div>
    );
  }

  const m = phase === 'feedback' ? play.marks[idx] : undefined;
  const timedOut = phase === 'feedback' && play.answers[idx] === TIMEOUT;
  const total = play.marks.reduce((s, x) => s + x[1], 0);
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-3 flex items-center gap-3">
        <button onClick={() => navigate('/souteze')} className="rounded-lg p-2 text-slate-500 hover:bg-slate-900/[0.05] dark:hover:bg-white/[0.06]" aria-label="Odejít">
          <X size={22} />
        </button>
        <ProgressBar value={(idx + (phase === 'feedback' ? 1 : 0)) / questions.length} color="bg-fuchsia-500" height="h-2.5" />
        <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-500">
          {idx + 1}/{questions.length}
        </span>
        <span className="shrink-0 rounded-lg bg-fuchsia-500/15 px-2 py-1 text-sm font-bold tabular-nums text-fuchsia-700 dark:text-fuchsia-300">{total} b.</span>
      </div>

      <div className="mb-3 flex items-center gap-3">
        <Timer size={18} className={cx(left <= 5 && phase === 'question' ? 'text-rose-500' : 'text-slate-400')} />
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
          <div
            className={cx('h-full rounded-full transition-[width] duration-100 ease-linear', left <= 5 ? 'bg-rose-500' : left <= limit / 2 ? 'bg-amber-400' : 'bg-emerald-500')}
            style={{ width: `${phase === 'question' ? (left / limit) * 100 : m ? Math.max(0, 1 - m[2] / limit) * 100 : 0}%` }}
          />
        </div>
        <span className="w-10 text-right text-sm font-bold tabular-nums">{phase === 'question' ? Math.ceil(left) : m ? `${Math.round(m[2])}` : 0} s</span>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <Tag>{bookLabel(q.bookId, data.books)}</Tag>
        <Tag tone="violet">{AREA_MAP[q.area].short}</Tag>
        <span className="ml-auto hidden text-slate-500 sm:inline">{title}</span>
      </div>

      <Card className="p-5 sm:p-7" key={idx}>
        <QuestionBody q={q} result={phase === 'feedback' ? (current ?? { questionId: q.id, score: m?.[0] ?? 0, userAnswer: play.answers[idx] ?? '', seconds: m?.[2] ?? 0 }) : null} onSubmit={answer} />
      </Card>

      {phase === 'feedback' && m && (
        <div className={cx('animate-fade-up mt-4 rounded-2xl border-2 p-5', m[0] === 1 ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-500/10' : 'border-rose-300 bg-rose-50 dark:border-rose-700 dark:bg-rose-500/10')}>
          <div className={cx('flex items-center gap-2 font-display text-xl font-bold', m[0] === 1 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300')}>
            {m[0] === 1 ? <CircleCheck size={24} /> : timedOut ? <Timer size={24} /> : <CircleX size={24} />}
            {m[0] === 1 ? `Správně! +${m[1]} bodů` : timedOut ? 'Čas vypršel' : 'Špatně'}
          </div>
          {m[0] !== 1 && (
            <p className="mt-1 text-[15px]">
              Správně: <b>{correctAnswerText(q)}</b>
            </p>
          )}
          {q.explanation && <p className="mt-2 whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">{q.explanation}</p>}
          <Button className="mt-4" onClick={next} icon={idx + 1 >= questions.length ? <Flag size={18} /> : <ArrowRight size={18} />}>
            {idx + 1 >= questions.length ? 'Zobrazit výsledek' : 'Další otázka'}
          </Button>
        </div>
      )}
    </div>
  );
}
