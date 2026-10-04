import { useEffect, useRef, useState } from 'react';
import { Bot, Send, Square, Trash2 } from 'lucide-react';
import { useStore } from '../store';
import { buildTeacherSystemPrompt, describeAiError, streamTeacher, type ChatMessage } from '../lib/ai';
import { Button, Card, PageHeader, cx } from '../components/ui';

const CHAT_KEY = 'maturitni-trener:ai-chat';

export function AiTeacher() {
  const { data } = useStore();
  const hasKey = !!data.settings.aiApiKey.trim();
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      return JSON.parse(sessionStorage.getItem(CHAT_KEY) ?? '[]');
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(CHAT_KEY, JSON.stringify(messages));
    } catch {
      /* nevadí */
    }
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const firstBook = data.books[0]?.title ?? 'Proměna';
  const suggestions = [
    'Vysvětli mi, co je existencialismus.',
    `Vyzkoušej mě z díla ${data.books.find((b) => b.id === 'promena')?.title ?? firstBook}.`,
    'Zeptej se mě na literárněhistorický kontext některé mé knihy.',
    `Vysvětli mi, proč je ${data.books.find((b) => b.id === 'rur')?.title ?? 'R.U.R.'} drama.`,
    'Procvič se mnou tropy a figury – dávej mi příklady a já je budu určovat.',
    'Vyzkoušej mě z tématu VLSM – dej mi příklad a kontroluj můj výpočet.',
    'Vysvětli mi rozdíl mezi OSPF a RIP a pak se mě na to zeptej.',
    'Jak na Linuxu nastavím DHCP server? Krok po kroku.',
  ];

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || busy) return;
    setError(null);
    const history: ChatMessage[] = [...messages, { role: 'user', content }];
    setMessages([...history, { role: 'assistant', content: '' }]);
    setInput('');
    setBusy(true);
    const ctrl = new AbortController();
    abort.current = ctrl;
    try {
      await streamTeacher(
        data.settings.aiApiKey.trim(),
        data.settings.aiModel,
        buildTeacherSystemPrompt(data),
        history,
        (delta) =>
          setMessages((m) => {
            const next = [...m];
            next[next.length - 1] = { role: 'assistant', content: next[next.length - 1].content + delta };
            return next;
          }),
        ctrl.signal,
      );
    } catch (e) {
      if (!ctrl.signal.aborted) {
        setError(await describeAiError(e));
        // odebrat prázdnou odpověď
        setMessages((m) => (m[m.length - 1]?.role === 'assistant' && !m[m.length - 1].content ? m.slice(0, -1) : m));
      }
    } finally {
      setBusy(false);
      abort.current = null;
    }
  };

  if (!hasKey) {
    return (
      <div>
        <PageHeader title="AI učitel" emoji="🤖" sub="Učitel a zkoušející, který se ptá, doptává a vysvětluje." />
        <Card className="p-6">
          <Bot size={40} className="text-brand-600" />
          <h2 className="mt-3 text-xl font-bold">AI učitel zatím není nastavený</h2>
          <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">
            AI učitel používá Claude API. Pro zapnutí vlož v Nastavení svůj API klíč z{' '}
            <a className="font-semibold text-brand-700 underline dark:text-brand-400" href="https://console.anthropic.com/" target="_blank" rel="noreferrer">
              console.anthropic.com
            </a>
            . Klíč se ukládá pouze v tomto prohlížeči a posílá se jen přímo do API Anthropic.
          </p>
          <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">
            Aplikace bez AI funguje plnohodnotně – zkoušení bez AI nabízí <b>Simulace maturity</b> a režim <b>Vlastní odpověď</b> s porovnáním klíčových bodů.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button to="/nastaveni">Nastavit API klíč</Button>
            <Button variant="secondary" to="/simulace">
              Simulace maturity bez AI
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-10rem)] flex-col lg:h-[calc(100dvh-5rem)]">
      <PageHeader
        title="AI učitel"
        emoji="🤖"
        sub="Ptá se, doptává a vysvětluje – nevyklápí rovnou odpovědi."
        action={
          messages.length > 0 && (
            <Button variant="ghost" size="sm" icon={<Trash2 size={15} />} onClick={() => setMessages([])} disabled={busy}>
              Nová konverzace
            </Button>
          )
        }
      />
      <Card className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {!messages.length && (
            <div>
              <p className="mb-3 text-slate-500">Zkus třeba:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => send(s)} className="rounded-xl border border-slate-200 px-3 py-2 text-left text-sm hover:border-brand-400 hover:bg-brand-50 dark:border-slate-700 dark:hover:bg-brand-500/10">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={cx('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div
                className={cx(
                  'max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed',
                  m.role === 'user' ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800',
                )}
              >
                {m.content || (busy && i === messages.length - 1 ? <span className="animate-pulse text-slate-500">Přemýšlím…</span> : '')}
              </div>
            </div>
          ))}
          {error && <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</div>}
          <div ref={bottom} />
        </div>
        <form
          className="flex gap-2 border-t border-slate-200 p-3 dark:border-slate-800"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <textarea
            className="input min-h-[46px] flex-1 resize-none"
            rows={1}
            placeholder="Napiš otázku nebo odpověď…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
          />
          {busy ? (
            <Button variant="secondary" icon={<Square size={16} />} onClick={() => abort.current?.abort()} aria-label="Zastavit">
              <span className="hidden sm:inline">Zastavit</span>
            </Button>
          ) : (
            <Button type="submit" icon={<Send size={16} />} disabled={!input.trim()} aria-label="Odeslat">
              <span className="hidden sm:inline">Odeslat</span>
            </Button>
          )}
        </form>
      </Card>
    </div>
  );
}
