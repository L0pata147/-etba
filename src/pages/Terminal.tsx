import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ChevronUp, Lightbulb, ListChecks, RotateCcw, TerminalSquare } from 'lucide-react';
import type { FlashcardQuestion, SessionRecord } from '../types';
import { useStore } from '../store';
import { CISCO_TASKS } from '../lib/term/cisco';
import { LINUX_TASKS } from '../lib/term/linux';
import type { CheckItem, Simulator, TermTask } from '../lib/term/types';
import { uid } from '../lib/random';
import { Button, Card, Modal, PageHeader, Segmented, Tag, cx } from '../components/ui';

type Platform = 'cisco' | 'linux';
const TASKS: Record<Platform, TermTask[]> = { cisco: CISCO_TASKS as unknown as TermTask[], linux: LINUX_TASKS as unknown as TermTask[] };
const LABEL: Record<Platform, string> = { cisco: 'Cisco IOS', linux: 'Linux' };

export function TerminalPage() {
  const [params, setParams] = useSearchParams();
  const platform: Platform = params.get('os') === 'linux' ? 'linux' : 'cisco';
  const taskId = params.get('uloha');
  const task = taskId ? TASKS[platform].find((t) => t.id === taskId) : undefined;
  const { data } = useStore();
  const done = useMemo(() => new Set(data.sessions.filter((s) => s.mode === 'terminal').flatMap((s) => s.bookIds)), [data.sessions]);

  if (task) return <TerminalRun key={task.id} task={task} platform={platform} onBack={() => setParams({ os: platform })} />;

  return (
    <div>
      <PageHeader
        title="Terminál"
        emoji="💻"
        sub="Simulovaný příkazový řádek Cisco IOS a Linuxu. Splň zadání příkazy – kontroluje se výsledná konfigurace, ne jeden konkrétní příkaz."
      />
      <Segmented
        className="mb-4"
        value={platform}
        onChange={(v) => setParams({ os: v })}
        options={[
          { value: 'cisco', label: '🛜 Cisco IOS (Packet Tracer)' },
          { value: 'linux', label: '🐧 Linux' },
        ]}
      />
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        {platform === 'cisco'
          ? 'Funguje jako CLI v Packet Traceru: režimy Router> / # / (config)#, zkratky (en, conf t, int g0/0, sh ip int br), „do“ v konfiguraci, ? pro nápovědu.'
          : 'Ubuntu/Debian jako root: soubory upravuješ v editoru (nano / vim), služby přes systemctl, balíčky přes apt. Napiš help pro seznam příkazů.'}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {TASKS[platform].map((t) => (
          <button key={t.id} onClick={() => setParams({ os: platform, uloha: t.id })} className="card p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start gap-2">
              <span className="font-bold">{t.title}</span>
              {done.has(t.id) && <CheckCircle2 className="ml-auto shrink-0 text-emerald-600" size={20} />}
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.goal}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

interface Line {
  text: string;
  kind: 'in' | 'out';
}

function TerminalRun({ task, platform, onBack }: { task: TermTask; platform: Platform; onBack: () => void }) {
  const { recordAnswer, recordSession } = useStore();
  const [sim, setSim] = useState<Simulator>(() => task.create());
  const [lines, setLines] = useState<Line[]>(() => welcome(platform));
  const [input, setInput] = useState('');
  const [hist, setHist] = useState<string[]>([]);
  const [histPos, setHistPos] = useState<number | null>(null);
  const [editor, setEditor] = useState<{ path: string; content: string; original: string } | null>(null);
  const [hints, setHints] = useState(0);
  const [checks, setChecks] = useState<CheckItem[] | null>(null);
  const [solution, setSolution] = useState(false);
  const [solved, setSolved] = useState(false);
  const [, force] = useState(0);
  const screen = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recorded = useRef(false);

  useEffect(() => {
    screen.current?.scrollTo({ top: screen.current.scrollHeight });
  }, [lines]);

  const evaluate = (s: Simulator) => {
    const c = task.check(s as never);
    if (c.every((x) => x.ok) && !recorded.current) {
      recorded.current = true;
      setSolved(true);
      setChecks(c);
      const score = solution ? 0.3 : hints >= 2 ? 0.6 : 1;
      const q: FlashcardQuestion = {
        id: `term|${task.id}`,
        bookId: `site-prikazy-${platform}`,
        area: 'it-prikazy',
        factKey: `term-${task.id}`,
        difficulty: 'hard',
        type: 'flashcard',
        prompt: task.title,
        explanation: task.solution,
        answer: task.solution,
      };
      recordAnswer(q, { questionId: q.id, score, userAnswer: '(terminál)', seconds: 0 });
      const rec: SessionRecord = { id: uid(), date: Date.now(), mode: 'terminal', title: `Terminál ${LABEL[platform]}: ${task.title}`, difficulty: 'hard', total: 1, score, seconds: 0, bookIds: [task.id], sections: { 'it-prakticke': { score, total: 1 } } };
      recordSession(rec, 30);
    }
  };

  const submit = () => {
    const cmd = input;
    const prompt = sim.prompt();
    const r = sim.exec(cmd);
    setLines((l) => (r.clear ? [] : [...l, { text: `${prompt} ${cmd}`, kind: 'in' }, ...r.out.map((t) => ({ text: t, kind: 'out' as const }))]));
    if (cmd.trim()) setHist((h) => [...h, cmd]);
    setHistPos(null);
    setInput('');
    if (r.editor) setEditor({ ...r.editor, original: r.editor.content });
    force((x) => x + 1);
    evaluate(sim);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!hist.length) return;
      const p = histPos === null ? hist.length - 1 : Math.max(0, histPos - 1);
      setHistPos(p);
      setInput(hist[p]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histPos === null) return;
      const p = histPos + 1;
      if (p >= hist.length) {
        setHistPos(null);
        setInput('');
      } else {
        setHistPos(p);
        setInput(hist[p]);
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  };

  const saveEditor = (close: boolean) => {
    if (!editor) return;
    const err = sim.saveFile?.(editor.path, editor.content) ?? null;
    setLines((l) => [...l, { text: err ?? `[ Zapsáno: ${editor.path} ]`, kind: 'out' }]);
    if (!err) setEditor(close ? null : { ...editor, original: editor.content });
    evaluate(sim);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const restart = () => {
    setSim(task.create());
    setLines(welcome(platform));
    setChecks(null);
    setSolved(false);
    recorded.current = false;
  };

  return (
    <div className="mx-auto max-w-5xl">
      <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />} onClick={onBack} className="mb-3">
        Všechny úlohy
      </Button>
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="order-2 lg:order-1">
          <div
            ref={screen}
            onClick={() => inputRef.current?.focus()}
            className="h-[26rem] overflow-y-auto rounded-2xl bg-slate-950 p-4 font-mono text-[13px] leading-relaxed text-slate-100 shadow-inner sm:h-[32rem]"
            role="log"
            aria-label="Výstup terminálu"
          >
            {lines.map((l, k) => (
              <div key={k} className={cx('whitespace-pre-wrap break-words', l.kind === 'in' ? 'text-emerald-300' : 'text-slate-200')}>
                {l.text || ' '}
              </div>
            ))}
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-emerald-300">{sim.prompt()}</span>
              <input
                ref={inputRef}
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKey}
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                aria-label="Příkaz"
                className="min-w-0 flex-1 bg-transparent font-mono text-[16px] text-white outline-none sm:text-[13px]"
              />
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={submit}>
              Enter
            </Button>
            <Button size="sm" variant="secondary" icon={<ChevronUp size={15} />} onClick={() => onKey({ key: 'ArrowUp', preventDefault: () => undefined } as KeyboardEvent<HTMLInputElement>)}>
              Předchozí příkaz
            </Button>
            {platform === 'cisco' && (
              <Button size="sm" variant="secondary" onClick={() => (setInput('?'), setTimeout(() => inputRef.current?.focus(), 0))}>
                ?
              </Button>
            )}
            <Button size="sm" variant="ghost" icon={<RotateCcw size={15} />} className="ml-auto" onClick={restart}>
              Začít znovu
            </Button>
          </div>
        </div>

        <div className="order-1 space-y-3 lg:order-2">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <TerminalSquare size={18} className="text-brand-600" />
              <Tag tone="brand">{LABEL[platform]}</Tag>
            </div>
            <h1 className="mt-2 text-lg font-bold">{task.title}</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{task.goal}</p>
            <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm">
              {task.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </Card>
          {solved && (
            <Card className="border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-500/10">
              <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 size={20} /> Hotovo – vše splněno!
              </div>
              <p className="mt-1 text-sm">Úloha se započítala do praktické části. Můžeš si ji zopakovat znovu nebo zkusit další.</p>
              <Button size="sm" className="mt-2" onClick={onBack}>
                Další úloha
              </Button>
            </Card>
          )}
          <Card className="p-4">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" icon={<ListChecks size={15} />} onClick={() => setChecks(task.check(sim as never))}>
                Zkontrolovat
              </Button>
              <Button size="sm" variant="secondary" icon={<Lightbulb size={15} />} disabled={hints >= task.hints.length} onClick={() => setHints((h) => h + 1)}>
                Nápověda {hints}/{task.hints.length}
              </Button>
            </div>
            {checks && (
              <ul className="mt-3 space-y-1 text-sm">
                {checks.map((c) => (
                  <li key={c.label} className={c.ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600'}>
                    {c.ok ? '✓' : '✗'} {c.label}
                  </li>
                ))}
              </ul>
            )}
            {hints > 0 && (
              <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
                {task.hints.slice(0, hints).map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ol>
            )}
            <button onClick={() => setSolution((x) => !x)} className="mt-3 text-sm font-semibold text-brand-600 dark:text-brand-400">
              {solution ? 'Skrýt řešení' : 'Ukázat vzorové řešení'}
            </button>
            {solution && <pre className="mt-2 overflow-x-auto whitespace-pre rounded-lg bg-slate-900 p-3 font-mono text-[12px] leading-relaxed text-emerald-300">{task.solution}</pre>}
          </Card>
        </div>
      </div>

      <Modal open={!!editor} onClose={() => setEditor(null)} title={`GNU nano – ${editor?.path ?? ''}`} wide>
        {editor && (
          <div>
            <textarea
              autoFocus
              value={editor.content}
              onChange={(e) => setEditor({ ...editor, content: e.target.value })}
              onKeyDown={(e) => {
                if (e.ctrlKey && (e.key === 'o' || e.key === 's')) {
                  e.preventDefault();
                  saveEditor(false);
                } else if (e.ctrlKey && e.key === 'x') {
                  e.preventDefault();
                  if (editor.content === editor.original) setEditor(null);
                  else saveEditor(true);
                } else if (e.key === 'Tab') {
                  // tabulátor vloží mezery – v YAML (netplan) se tabulátor nesmí používat
                  e.preventDefault();
                  const t = e.currentTarget;
                  const pos = t.selectionStart;
                  const v = editor.content.slice(0, pos) + '  ' + editor.content.slice(t.selectionEnd);
                  setEditor({ ...editor, content: v });
                  requestAnimationFrame(() => t.setSelectionRange(pos + 2, pos + 2));
                }
              }}
              spellCheck={false}
              rows={16}
              aria-label="Obsah souboru"
              className="w-full rounded-lg bg-slate-950 p-3 font-mono text-[14px] leading-relaxed text-slate-100"
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={() => saveEditor(true)}>
                Uložit a zavřít (Ctrl+X)
              </Button>
              <Button size="sm" variant="secondary" onClick={() => saveEditor(false)}>
                Uložit (Ctrl+O)
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditor(null)}>
                Zavřít bez uložení
              </Button>
              <span className="text-xs text-slate-500">Odsazuj mezerami – Tab vloží 2 mezery.</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function welcome(p: Platform): Line[] {
  return p === 'cisco'
    ? [
        { text: 'Simulace Cisco IOS – napiš ? pro seznam příkazů v aktuálním režimu.', kind: 'out' },
        { text: 'Press RETURN to get started!', kind: 'out' },
        { text: '', kind: 'out' },
      ]
    : [
        { text: 'Simulace Linuxu (přihlášen jako root) – napiš help pro seznam příkazů.', kind: 'out' },
        { text: '', kind: 'out' },
      ];
}
