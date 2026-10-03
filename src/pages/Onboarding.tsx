import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, GraduationCap } from 'lucide-react';
import { useStore } from '../store';
import { BOOK_DATABASE, seedToBook } from '../data/books';
import { CATEGORIES, CATEGORY_ORDER } from '../data/osnova';
import { generatePlan } from '../lib/insights';
import { daysUntil } from '../lib/progress';
import { useTheme } from '../components/Layout';
import { Button, Card, cx, plural } from '../components/ui';
import { StorageWarning } from '../components/StorageWarning';

function defaultExamDate(): string {
  const now = new Date();
  const year = now.getMonth() >= 5 ? now.getFullYear() + 1 : now.getFullYear();
  return `${year}-05-20`;
}

export function Onboarding() {
  useTheme();
  const { data, setBooks, updateSettings, setPlan } = useStore();
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(data.books.filter((b) => b.source === 'database').map((b) => b.templateId ?? b.id)));
  const [examDate, setExamDate] = useState(data.settings.examDate || defaultExamDate());
  const [minutes, setMinutes] = useState(data.settings.dailyMinutes || 15);

  const books = useMemo(() => {
    const kept = data.books.filter((b) => b.source === 'database' && selected.has(b.templateId ?? b.id));
    const keptIds = new Set(kept.map((b) => b.templateId ?? b.id));
    const added = BOOK_DATABASE.filter((s) => selected.has(s.id) && !keptIds.has(s.id)).map((s) => seedToBook(s));
    const custom = data.books.filter((b) => b.source === 'custom');
    return [...kept, ...added, ...custom];
  }, [data.books, selected]);

  const plan = useMemo(() => generatePlan({ ...data, books }, examDate), [data, books, examDate]);
  const days = daysUntil(examDate);

  const finish = () => {
    setBooks(books);
    updateSettings({ examDate, dailyMinutes: minutes, onboarded: true });
    setPlan(plan);
  };

  const steps = ['Seznam knih', 'Datum maturity', 'Čas na učení', 'Tvůj plán'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-slate-100 px-4 py-8 dark:from-slate-950 dark:via-slate-950 dark:to-brand-950">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-800 text-white shadow-lg">
            <GraduationCap size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Vítej v maturitním trenérovi.</h1>
            <p className="text-slate-500 dark:text-slate-400">Připravíme tě na ústní zkoušku z literatury. Nastavení zabere minutu.</p>
          </div>
        </div>

        <StorageWarning />
        <div className="mb-4 flex gap-2">
          {steps.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={cx('h-1.5 rounded-full', i <= step ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-800')} />
              <div className={cx('mt-1 hidden text-xs sm:block', i === step ? 'font-semibold text-brand-700 dark:text-brand-400' : 'text-slate-500')}>
                {i + 1}. {s}
              </div>
            </div>
          ))}
        </div>

        <Card className="animate-fade-up p-5 sm:p-7" key={step}>
          {step === 0 && (
            <div>
              <h2 className="text-xl font-bold">Krok 1: Vyber / uprav svůj seznam knih</h2>
              <p className="mt-1 text-sm text-slate-500">
                Předvyplnili jsme tvůj maturitní seznam ({selected.size} {plural(selected.size, 'kniha', 'knihy', 'knih')}). Seznam můžeš kdykoli změnit v sekci Moje knihy – i přidat vlastní díla.
              </p>
              <div className="mt-4 space-y-4">
                {CATEGORY_ORDER.map((c) => (
                  <div key={c}>
                    <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">{CATEGORIES[c].label}</div>
                    <div className="grid gap-1.5 sm:grid-cols-2">
                      {BOOK_DATABASE.filter((b) => b.category === c).map((b) => {
                        const on = selected.has(b.id);
                        return (
                          <button
                            key={b.id}
                            onClick={() =>
                              setSelected((s) => {
                                const n = new Set(s);
                                if (on) n.delete(b.id);
                                else n.add(b.id);
                                return n;
                              })
                            }
                            className={cx(
                              'flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-left text-sm transition',
                              on ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'border-slate-200 dark:border-slate-700',
                            )}
                          >
                            <span className={cx('grid h-5 w-5 shrink-0 place-items-center rounded-md', on ? 'bg-brand-600 text-white' : 'border border-slate-300 dark:border-slate-600')}>{on && <Check size={14} />}</span>
                            <span className="min-w-0">
                              <span className="block truncate font-semibold">{b.title}</span>
                              <span className="block truncate text-xs text-slate-500">{b.author}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold">Krok 2: Kdy maturuješ?</h2>
              <p className="mt-1 text-sm text-slate-500">Podle data ústní zkoušky rozvrhneme knihy do týdnů. Přesné datum můžeš upravit později.</p>
              <input type="date" className="input mt-4 text-lg" value={examDate} onChange={(e) => setExamDate(e.target.value)} aria-label="Datum maturity" />
              {days !== null && (
                <p className="mt-3 text-lg">
                  {days >= 0 ? (
                    <>
                      Do maturity zbývá <b>{days}</b> {plural(days, 'den', 'dny', 'dní')}.
                    </>
                  ) : (
                    <span className="text-rose-600">Toto datum už proběhlo.</span>
                  )}
                </p>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold">Krok 3: Kolik času chceš denně věnovat učení?</h2>
              <p className="mt-1 text-sm text-slate-500">Podle toho sestavíme délku dnešního doporučeného tréninku.</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  [5, 'Rychlé opakování'],
                  [15, 'Doporučeno'],
                  [30, 'Důkladná příprava'],
                  [60, 'Intenzivně'],
                ].map(([m, t]) => (
                  <button
                    key={m}
                    onClick={() => setMinutes(m as number)}
                    className={cx('rounded-2xl border-2 p-4 text-left transition', minutes === m ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'border-slate-200 dark:border-slate-700')}
                  >
                    <div className="text-2xl font-extrabold">{m} min</div>
                    <div className="text-sm text-slate-500">{t}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold">Krok 4: Tvůj doporučený plán</h2>
              <p className="mt-1 text-sm text-slate-500">
                {books.length} {plural(books.length, 'kniha', 'knihy', 'knih')} rozděleno do {plan.weeks.length} {plural(plan.weeks.length, 'týdne', 'týdnů', 'týdnů')}, denně {minutes} minut. Plán můžeš kdykoli upravit.
              </p>
              <ul className="mt-4 space-y-2">
                {plan.weeks.slice(0, 4).map((w) => (
                  <li key={w.index} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                    <div className="text-sm font-bold">Týden {w.index}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-300">
                      {[...w.bookIds.map((id) => books.find((b) => b.id === id)?.title).filter(Boolean), ...w.extras].join(' · ')}
                    </div>
                  </li>
                ))}
                {plan.weeks.length > 4 && <li className="px-1 text-sm text-slate-500">… a dalších {plan.weeks.length - 4} týdnů</li>}
              </ul>
            </div>
          )}

          <div className="mt-6 flex justify-between gap-2">
            {step > 0 ? (
              <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => setStep(step - 1)}>
                Zpět
              </Button>
            ) : (
              <span />
            )}
            {step < 3 ? (
              <Button icon={<ArrowRight size={18} />} onClick={() => setStep(step + 1)} disabled={step === 0 && selected.size === 0 && !books.length}>
                Pokračovat
              </Button>
            ) : (
              <Button size="lg" icon={<Check size={18} />} onClick={finish}>
                Začít se učit
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
