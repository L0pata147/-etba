import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bot, CheckCircle2, Dices, PenLine, Trash2 } from 'lucide-react';
import type { Writing } from '../types';
import { useStore } from '../store';
import { MIN_WORDS, WRITING_CRITERIA, WRITING_FORMS, WRITING_MINUTES, WRITING_PROMPTS, type WritingPrompt } from '../data/writing';
import { analyzeWriting, countWords } from '../lib/writingcheck';
import { describeAiError, streamTeacher } from '../lib/ai';
import { sample, uid } from '../lib/random';
import { SPELLING, SPELLING_CATEGORIES, type SpellingCategory } from '../data/spelling';
import { generateSpellingQuestions } from '../lib/spellinggen';
import { areaMastery } from '../lib/progress';
import { shuffle } from '../lib/random';
import { useStartSession } from './SessionPage';
import { Button, Card, EmptyState, Modal, PageHeader, ProgressBar, Segmented, SectionTitle, Tag, cx, formatDate } from '../components/ui';

type Tab = 'psat' | 'prace' | 'pravopis' | 'utvary' | 'kriteria';

const formName = (id: string) => WRITING_FORMS.find((f) => f.id === id)?.name.split(' (')[0] ?? id;

export function WritingPage() {
  const [params, setParams] = useSearchParams();
  const { data } = useStore();
  const editId = params.get('psat');
  const reviewId = params.get('prace');
  const tab = (params.get('tab') as Tab) || 'psat';

  const editing = editId ? data.writings.find((w) => w.id === editId) : undefined;
  if (editing) return <Editor key={editing.id} w={editing} onDone={() => setParams({ prace: editing.id })} />;
  const reviewing = reviewId ? data.writings.find((w) => w.id === reviewId) : undefined;
  if (reviewing) return <Review key={reviewing.id} w={reviewing} onBack={() => setParams({ tab: 'prace' })} onContinue={() => setParams({ psat: reviewing.id })} />;

  return (
    <div>
      <PageHeader title="Písemná práce z češtiny" emoji="✍️" sub={`Slohová práce na ${WRITING_MINUTES} minut, nejméně ${MIN_WORDS} slov. Trénuj na zadáních, kontroluj si chyby a hodnoť se podle kritérií.`} />
      <Segmented
        className="mb-5"
        value={tab}
        onChange={(v) => setParams(v === 'psat' ? {} : { tab: v })}
        options={[
          { value: 'psat', label: 'Psát' },
          { value: 'prace', label: `Moje práce (${data.writings.length})` },
          { value: 'pravopis', label: 'Pravopis' },
          { value: 'utvary', label: 'Slohové útvary' },
          { value: 'kriteria', label: 'Kritéria' },
        ]}
      />
      {tab === 'psat' && <NewWriting onOpen={(id) => setParams({ psat: id })} />}
      {tab === 'prace' && <WritingList onOpen={(w) => setParams(w.finished ? { prace: w.id } : { psat: w.id })} />}
      {tab === 'pravopis' && <Spelling />}
      {tab === 'utvary' && <Forms />}
      {tab === 'kriteria' && <Criteria />}
    </div>
  );
}

function NewWriting({ onOpen }: { onOpen: (id: string) => void }) {
  const { saveWriting } = useStore();
  const [drawn, setDrawn] = useState<WritingPrompt[]>([]);
  const [own, setOwn] = useState({ title: '', form: 'uvaha', task: '' });

  const draw = () => {
    // 4 zadání, každé jiného útvaru – jako výběr u zkoušky
    const byForm = new Map<string, WritingPrompt[]>();
    for (const p of WRITING_PROMPTS) byForm.set(p.form, [...(byForm.get(p.form) ?? []), p]);
    const forms = sample([...byForm.keys()], 4);
    setDrawn(forms.map((f) => sample(byForm.get(f)!, 1)[0]));
  };
  const begin = (p: { title: string; form: string; task: string }) => {
    const w: Writing = { id: uid(), createdAt: Date.now(), updatedAt: Date.now(), prompt: p.task, form: p.form, title: p.title, text: '', seconds: 0, finished: false };
    saveWriting(w);
    onOpen(w.id);
  };

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <h2 className="font-bold">Vylosuj si zadání</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Dostaneš 4 zadání různých útvarů a jedno si vybereš. Jde o ukázková zadání pro trénink, ne o oficiální zadání.</p>
        <Button className="mt-3" icon={<Dices size={18} />} onClick={draw}>
          {drawn.length ? 'Vylosovat jiná zadání' : 'Vylosovat 4 zadání'}
        </Button>
        {drawn.length > 0 && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {drawn.map((p) => (
              <button key={p.id} onClick={() => begin(p)} className="card p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md">
                <Tag tone="violet">{formName(p.form)}</Tag>
                <div className="mt-2 font-bold">{p.title}</div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{p.task}</p>
                <div className="mt-2 text-sm font-semibold text-brand-600 dark:text-brand-400">Psát na toto téma →</div>
              </button>
            ))}
          </div>
        )}
      </Card>
      <Card className="p-5">
        <h2 className="font-bold">Vlastní zadání</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Máš zadání od učitele nebo z loňských maturit? Zadej ho sem.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Název
            <input value={own.title} onChange={(e) => setOwn({ ...own, title: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-normal dark:border-slate-700 dark:bg-slate-900" />
          </label>
          <label className="text-sm font-semibold">
            Útvar
            <select value={own.form} onChange={(e) => setOwn({ ...own, form: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-normal dark:border-slate-700 dark:bg-slate-900">
              {WRITING_FORMS.map((f) => (
                <option key={f.id} value={f.id}>
                  {formName(f.id)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="mt-3 block text-sm font-semibold">
          Zadání
          <textarea value={own.task} onChange={(e) => setOwn({ ...own, task: e.target.value })} rows={3} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-normal dark:border-slate-700 dark:bg-slate-900" />
        </label>
        <Button className="mt-3" icon={<PenLine size={17} />} disabled={!own.title.trim() || !own.task.trim()} onClick={() => begin(own)}>
          Začít psát
        </Button>
      </Card>
    </div>
  );
}

function Editor({ w, onDone }: { w: Writing; onDone: () => void }) {
  const { saveWriting } = useStore();
  const [text, setText] = useState(w.text);
  const [seconds, setSeconds] = useState(w.seconds);
  const [showForm, setShowForm] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const latest = useRef({ text, seconds });
  latest.current = { text, seconds };
  const finished = useRef(false);
  const words = countWords(text);
  const left = WRITING_MINUTES * 60 - seconds;
  const form = WRITING_FORMS.find((f) => f.id === w.form);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  // Průběžné ukládání konceptu
  useEffect(() => {
    const t = setTimeout(() => saveWriting({ ...w, text: latest.current.text, seconds: latest.current.seconds, updatedAt: Date.now() }), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, Math.floor(seconds / 15)]);

  // Při odchodu ze stránky ulož poslední stav
  useEffect(
    () => () => {
      if (!finished.current) saveWriting({ ...w, text: latest.current.text, seconds: latest.current.seconds, updatedAt: Date.now() });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const finish = () => {
    finished.current = true;
    saveWriting({ ...w, text, seconds, finished: true, updatedAt: Date.now() });
    onDone();
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="sticky top-14 z-20 -mx-4 mb-3 flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 lg:top-0">
        <span className={cx('font-semibold tabular-nums', left < 0 ? 'text-rose-600' : left < 600 ? 'text-amber-600' : '')}>
          ⏱ {left < 0 ? '+' : ''}
          {String(Math.floor(Math.abs(left) / 60)).padStart(2, '0')}:{String(Math.abs(left) % 60).padStart(2, '0')}
        </span>
        <span className={cx('font-semibold tabular-nums', words >= MIN_WORDS ? 'text-emerald-600' : 'text-slate-600 dark:text-slate-300')}>
          {words} / {MIN_WORDS} slov
        </span>
        <div className="hidden w-32 sm:block">
          <ProgressBar value={words / MIN_WORDS} />
        </div>
        <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setShowForm((x) => !x)}>
          {showForm ? 'Skrýt tahák' : 'Tahák k útvaru'}
        </Button>
        <Button size="sm" icon={<CheckCircle2 size={16} />} onClick={() => setConfirm(true)}>
          Dokončit
        </Button>
      </div>
      <Card className="mb-3 p-4">
        <Tag tone="violet">{formName(w.form)}</Tag>
        <div className="mt-2 font-bold">{w.title}</div>
        <p className="text-[15px] text-slate-600 dark:text-slate-300">{w.prompt}</p>
      </Card>
      {showForm && form && <FormCard f={form} />}
      <label htmlFor="sloh" className="sr-only">
        Text slohové práce
      </label>
      <textarea
        id="sloh"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={22}
        spellCheck={false}
        placeholder="Piš sem. Odstavce odděluj prázdným řádkem."
        className="w-full rounded-2xl border border-slate-300 bg-white p-4 text-[16px] leading-relaxed dark:border-slate-700 dark:bg-slate-900"
      />
      <p className="mt-1 text-xs text-slate-500">Kontrola pravopisu prohlížeče je vypnutá – u zkoušky ji také mít nebudeš. Koncept se ukládá automaticky.</p>
      <Modal open={confirm} onClose={() => setConfirm(false)} title="Dokončit práci?">
        <p>
          Napsáno <b>{words}</b> slov{words < MIN_WORDS ? ` – chybí ještě ${MIN_WORDS - words} do minima` : ''}.
        </p>
        <p className="mt-1 text-sm text-slate-500">Potom uvidíš automatickou kontrolu a ohodnotíš se podle kritérií. Text půjde dál upravit.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirm(false)}>
            Psát dál
          </Button>
          <Button onClick={finish}>Dokončit a zkontrolovat</Button>
        </div>
      </Modal>
    </div>
  );
}

function Review({ w, onBack, onContinue }: { w: Writing; onBack: () => void; onContinue: () => void }) {
  const { data, saveWriting, deleteWriting, recordSession, toast } = useStore();
  const a = useMemo(() => analyzeWriting(w.text), [w.text]);
  const [scores, setScores] = useState<Record<string, number>>(w.selfScores ?? {});
  const [ai, setAi] = useState(w.aiFeedback ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const rated = WRITING_CRITERIA.filter((c) => scores[c.id] !== undefined).length;
  const total = WRITING_CRITERIA.reduce((s, c) => s + (scores[c.id] ?? 0), 0);
  const max = WRITING_CRITERIA.length * 4;

  const unchanged = !!w.selfScores && WRITING_CRITERIA.every((c) => w.selfScores![c.id] === scores[c.id]);
  const saveScores = () => {
    const first = !w.selfScores;
    saveWriting({ ...w, selfScores: scores, updatedAt: Date.now() });
    toast('Hodnocení uloženo', 'success');
    // XP a záznam do statistik jen při prvním ohodnocení
    if (first)
      recordSession(
      {
        id: uid(),
        date: Date.now(),
        mode: 'sloh',
        title: `Písemná práce: ${w.title}`,
        difficulty: 'maturita',
        total: WRITING_CRITERIA.length,
        score: total / max,
        seconds: w.seconds,
        bookIds: [],
        sections: {},
      },
      40,
    );
  };

  const askAi = async () => {
    setBusy(true);
    setErr(null);
    setAi('');
    const system =
      'Jsi zkušená učitelka češtiny a hodnotitelka maturitních písemných prací. Hodnotíš česky, věcně a povzbudivě. Nehodnoť podle vymyšlených oficiálních bodových tabulek – použij tato kritéria: splnění zadání a obsah; útvar a komunikační situace; pravopis; tvarosloví a stavba vět; slovní zásoba; kompozice a členění. U každého kritéria napiš krátké hodnocení a body 0–4. Pak vypiš konkrétní chyby (citace → oprava) a 3 rady, co příště zlepšit. Nepřepisuj celý text.';
    const content = `Útvar: ${formName(w.form)}\nZadání: ${w.prompt}\nPočet slov: ${a.words} (minimum ${MIN_WORDS})\n\nText:\n${w.text}`;
    try {
      const out = await streamTeacher(data.settings.aiApiKey, data.settings.aiModel, system, [{ role: 'user', content }], (d) => setAi((x) => x + d));
      setAi(out);
      saveWriting({ ...w, selfScores: scores, aiFeedback: out, updatedAt: Date.now() });
    } catch (e) {
      setErr(await describeAiError(e));
    } finally {
      setBusy(false);
    }
  };

  const issueTone = { chyba: 'rose', čárka: 'amber', styl: 'slate' } as const;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← Moje práce
        </Button>
        <Button variant="secondary" size="sm" icon={<PenLine size={15} />} className="ml-auto" onClick={onContinue}>
          Upravit text
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={<Trash2 size={15} />}
          onClick={() => {
            if (window.confirm('Opravdu smazat tuto práci?')) {
              deleteWriting(w.id);
              onBack();
            }
          }}
        >
          Smazat
        </Button>
      </div>
      <Card className="p-5">
        <Tag tone="violet">{formName(w.form)}</Tag>
        <h1 className="mt-2 text-xl font-bold">{w.title}</h1>
        <p className="text-sm text-slate-500">{w.prompt}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
          {[
            ['Slov', `${a.words}`, a.words >= MIN_WORDS],
            ['Odstavců', `${a.paragraphs}`, a.paragraphs >= 3],
            ['Ø délka věty', `${Math.round(a.avgSentence)} slov`, a.avgSentence <= 25],
            ['Čas', `${Math.round(w.seconds / 60)} min`, w.seconds <= WRITING_MINUTES * 60],
          ].map(([l, v, ok]) => (
            <div key={l as string} className={cx('rounded-xl p-3', ok ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-amber-50 dark:bg-amber-500/10')}>
              <div className="text-lg font-bold">{v as string}</div>
              <div className="text-xs text-slate-500">{l as string}</div>
            </div>
          ))}
        </div>
        {a.words < MIN_WORDS && <p className="mt-3 text-sm font-semibold text-rose-600">Text nemá požadovaných {MIN_WORDS} slov – u zkoušky by to byl vážný problém.</p>}
      </Card>

      <Card className="p-5">
        <SectionTitle sub="Automatické upozornění – jen pomůcka, ne všechna jsou chyba a ne všechny chyby najde.">Kontrola textu</SectionTitle>
        {a.issues.length ? (
          <ul className="space-y-2">
            {a.issues.map((x, k) => (
              <li key={k} className="flex flex-wrap items-start gap-2 text-sm">
                <Tag tone={issueTone[x.kind]}>{x.kind}</Tag>
                <span className="font-medium">{x.message}</span>
                <span className="text-slate-500">{x.excerpt}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">Žádná z hlídaných chyb nenalezena.</p>
        )}
        {a.repeated.length > 0 && (
          <p className="mt-3 text-sm">
            <span className="font-semibold">Často opakovaná slova:</span> {a.repeated.map(([word, c]) => `${word} (${c}×)`).join(', ')}
          </p>
        )}
      </Card>

      <Card className="p-5">
        <SectionTitle sub="Ohodnoť se poctivě 0–4 body u každého kritéria.">Sebehodnocení</SectionTitle>
        <div className="space-y-4">
          {WRITING_CRITERIA.map((c) => (
            <div key={c.id}>
              <div className="font-semibold">{c.label}</div>
              <div className="text-sm text-slate-500">{c.hint}</div>
              <Segmented className="mt-1" value={scores[c.id] ?? -1} onChange={(v) => setScores({ ...scores, [c.id]: v })} options={[0, 1, 2, 3, 4].map((n) => ({ value: n, label: String(n) }))} />
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="font-bold">
            {total} / {max} bodů ({Math.round((total / max) * 100)} %)
          </span>
          <Button size="sm" disabled={rated < WRITING_CRITERIA.length || unchanged} onClick={saveScores}>
            {unchanged ? 'Uloženo ✓' : 'Uložit hodnocení'}
          </Button>
          {rated < WRITING_CRITERIA.length && <span className="text-sm text-slate-500">Ohodnoť všechna kritéria.</span>}
        </div>
      </Card>

      <Card className="p-5">
        <SectionTitle sub="Volitelné – vyžaduje API klíč v Nastavení.">Hodnocení od AI</SectionTitle>
        {data.settings.aiApiKey ? (
          <Button icon={<Bot size={17} />} disabled={busy || !w.text.trim()} onClick={askAi}>
            {busy ? 'Hodnotím…' : ai ? 'Ohodnotit znovu' : 'Nechat ohodnotit AI'}
          </Button>
        ) : (
          <Button variant="secondary" to="/nastaveni">
            Nastavit API klíč
          </Button>
        )}
        {err && <p className="mt-3 text-sm text-rose-600">{err}</p>}
        {ai && <div className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-[15px] leading-relaxed dark:bg-slate-800/60">{ai}</div>}
      </Card>

      <Card className="p-5">
        <SectionTitle>Tvůj text</SectionTitle>
        <div className="whitespace-pre-wrap text-[15px] leading-relaxed">{w.text || '(prázdné)'}</div>
      </Card>
    </div>
  );
}

function WritingList({ onOpen }: { onOpen: (w: Writing) => void }) {
  const { data } = useStore();
  if (!data.writings.length) return <EmptyState icon="✍️" title="Zatím žádná práce" text="Vylosuj si zadání v záložce Psát." />;
  return (
    <div className="space-y-2">
      {data.writings.map((w) => {
        const s = w.selfScores ? Object.values(w.selfScores).reduce((a, b) => a + b, 0) : null;
        return (
          <button key={w.id} onClick={() => onOpen(w)} className="card flex w-full flex-wrap items-center gap-3 p-4 text-left">
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{w.title}</div>
              <div className="text-sm text-slate-500">
                {formName(w.form)} · {formatDate(w.updatedAt)} · {countWords(w.text)} slov
              </div>
            </div>
            {!w.finished ? <Tag tone="amber">rozepsáno</Tag> : s !== null ? <Tag tone="emerald">{s} / {WRITING_CRITERIA.length * 4} b.</Tag> : <Tag>neohodnoceno</Tag>}
          </button>
        );
      })}
    </div>
  );
}

function FormCard({ f }: { f: (typeof WRITING_FORMS)[number] }) {
  return (
    <Card className="mb-3 p-5">
      <h3 className="font-bold">{f.name}</h3>
      <p className="text-sm text-slate-500">{f.style}</p>
      <p className="mt-2 text-[15px]">{f.purpose}</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-3">
        {(
          [
            ['Stavba', f.structure],
            ['Jazyk', f.language],
            ['Pozor na', f.pitfalls],
          ] as const
        ).map(([h, items]) => (
          <div key={h}>
            <div className="text-sm font-semibold">{h}</div>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-slate-600 dark:text-slate-300">
              {items.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Forms() {
  return (
    <div>
      {WRITING_FORMS.map((f) => (
        <FormCard key={f.id} f={f} />
      ))}
    </div>
  );
}

function Criteria() {
  return (
    <Card className="p-5">
      <p className="mb-3 text-sm text-slate-500">
        Zjednodušená kritéria pro sebehodnocení v aplikaci. Přesná pravidla a bodování písemné práce ti řekne vyučující – podle nich se řiď.
      </p>
      <ul className="space-y-3">
        {WRITING_CRITERIA.map((c) => (
          <li key={c.id}>
            <div className="font-semibold">{c.label}</div>
            <div className="text-sm text-slate-600 dark:text-slate-300">{c.hint}</div>
          </li>
        ))}
      </ul>
      <h3 className="mt-5 font-bold">Obecné rady</h3>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-[15px] text-slate-600 dark:text-slate-300">
        <li>Prvních 5–10 minut věnuj osnově – úvod, stať, závěr a hlavní myšlenky.</li>
        <li>Pohlídej útvar: úvaha není vypravování, dopis musí mít formální náležitosti.</li>
        <li>Minimum slov ber jako spodní hranici, ne cíl. Delší text ale znamená víc příležitostí k chybám.</li>
        <li>Na konci si nech 10 minut na kontrolu: i/y, čárky, velká písmena, shoda podmětu s přísudkem, tvary „abychom, byste“.</li>
      </ul>
    </Card>
  );
}

function Spelling() {
  const { data } = useStore();
  const start = useStartSession();
  const run = (title: string, cats?: SpellingCategory[]) =>
    start({ title, mode: 'pravopis', difficulty: 'medium', bookIds: [], areas: [], types: ['abc'], count: 15, questions: shuffle(generateSpellingQuestions(cats)).slice(0, 15) });
  const mastery = areaMastery(data, 'pravopis', 'pravopis');
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h2 className="font-bold">Pravopisná cvičení</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Nejčastější chyby ve slohových pracích: i/y, shoda přísudku s podmětem, mě/mně, s/z, velká písmena, čárky a tvary jako „abychom“. Zvládnutí: {Math.round(mastery * 100)} %.
        </p>
        <Button className="mt-3" onClick={() => run('Pravopis – mix')}>
          Mix ({SPELLING.length} vět) – 15 otázek
        </Button>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2">
        {(Object.keys(SPELLING_CATEGORIES) as SpellingCategory[]).map((c) => (
          <button key={c} onClick={() => run(`Pravopis – ${SPELLING_CATEGORIES[c]}`, [c])} className="card p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="font-bold">{SPELLING_CATEGORIES[c]}</div>
            <div className="text-sm text-slate-500">{SPELLING.filter((x) => x.category === c).length} vět</div>
          </button>
        ))}
      </div>
    </div>
  );
}
