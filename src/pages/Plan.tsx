import { CalendarDays, CheckCircle2, Circle, Play, RefreshCw, X } from 'lucide-react';
import type { StudyWeek } from '../types';
import { useStore } from '../store';
import { currentWeek, generatePlan } from '../lib/insights';
import { bookProgress, daysUntil } from '../lib/progress';
import { useStartSession } from './SessionPage';
import { Button, Card, EmptyState, PageHeader, ProgressBar, cx, plural } from '../components/ui';

export function Plan() {
  const { data, setPlan, updateSettings, toast } = useStore();
  const start = useStartSession();
  const plan = data.plan;
  const days = daysUntil(data.settings.examDate);
  const cur = currentWeek(plan);

  const regenerate = () => {
    if (!data.settings.examDate) {
      toast('Nejdřív zadej datum maturity.', 'error');
      return;
    }
    setPlan(generatePlan(data, data.settings.examDate));
    toast('Studijní plán byl vytvořen.', 'success');
  };

  const updateWeek = (index: number, patch: Partial<StudyWeek>) => {
    if (!plan) return;
    setPlan({ ...plan, weeks: plan.weeks.map((w) => (w.index === index ? { ...w, ...patch } : w)) });
  };

  const moveBook = (bookId: string, to: number) => {
    if (!plan) return;
    setPlan({
      ...plan,
      weeks: plan.weeks.map((w) => ({
        ...w,
        bookIds: w.index === to ? [...new Set([...w.bookIds, bookId])] : w.bookIds.filter((x) => x !== bookId),
      })),
    });
  };

  const unplanned = plan ? data.books.filter((b) => !plan.weeks.some((w) => w.bookIds.includes(b.id))) : [];
  const doneWeeks = plan?.weeks.filter((w) => w.done).length ?? 0;

  return (
    <div>
      <PageHeader
        title="Studijní plán"
        emoji="🗓️"
        sub={days !== null ? (days >= 0 ? `Do maturity zbývá ${days} ${plural(days, 'den', 'dny', 'dní')}.` : 'Datum maturity už proběhlo – uprav ho.') : 'Zadej datum maturity a aplikace ti vytvoří plán.'}
        action={
          <Button icon={<RefreshCw size={17} />} onClick={regenerate} variant={plan ? 'secondary' : 'primary'}>
            {plan ? 'Přegenerovat plán' : 'Vytvořit plán'}
          </Button>
        }
      />

      <Card className="mb-5 flex flex-wrap items-end gap-4 p-5">
        <div>
          <label className="label" htmlFor="exam-date">
            Datum ústní maturity
          </label>
          <input id="exam-date" type="date" className="input w-auto" value={data.settings.examDate} onChange={(e) => updateSettings({ examDate: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="daily">
            Denně chci věnovat
          </label>
          <select id="daily" className="input w-auto" value={data.settings.dailyMinutes} onChange={(e) => updateSettings({ dailyMinutes: Number(e.target.value) })}>
            {[5, 15, 30, 45, 60].map((m) => (
              <option key={m} value={m}>
                {m} minut
              </option>
            ))}
          </select>
        </div>
        {plan && (
          <div className="min-w-[180px] flex-1">
            <div className="mb-1 text-sm text-slate-500">
              Splněno {doneWeeks}/{plan.weeks.length} týdnů
            </div>
            <ProgressBar value={plan.weeks.length ? doneWeeks / plan.weeks.length : 0} height="h-3" />
          </div>
        )}
      </Card>

      {!plan ? (
        <EmptyState icon={<CalendarDays size={40} className="mx-auto text-brand-500" />} title="Plán zatím neexistuje" text="Plán rozdělí knihy do týdnů (nejslabší knihy dřív), přidá literární pojmy a neumělecký text a poslední týden nechá na celkové opakování a simulace." action={<Button onClick={regenerate}>Vytvořit plán</Button>} />
      ) : (
        <div className="space-y-3">
          {unplanned.length > 0 && (
            <Card className="border-amber-300 p-4 dark:border-amber-800">
              <div className="text-sm font-semibold">Knihy mimo plán: {unplanned.map((b) => b.title).join(', ')}</div>
              <p className="text-xs text-slate-500">Přidej je do některého týdne pomocí výběru „+ přidat knihu“.</p>
            </Card>
          )}
          {plan.weeks.map((w) => {
            const isCur = cur?.index === w.index;
            const startDate = new Date(w.start + 'T12:00:00');
            const end = new Date(startDate);
            end.setDate(end.getDate() + 6);
            return (
              <Card key={w.index} className={cx('p-4 sm:p-5', isCur && 'ring-2 ring-brand-500', w.done && 'opacity-70')}>
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => updateWeek(w.index, { done: !w.done })} className="text-slate-400 hover:text-emerald-600" aria-label={w.done ? 'Označit jako nesplněné' : 'Označit jako splněné'}>
                    {w.done ? <CheckCircle2 size={22} className="text-emerald-600" /> : <Circle size={22} />}
                  </button>
                  <h3 className="font-bold">Týden {w.index}</h3>
                  <span className="text-sm text-slate-500">
                    {startDate.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })} – {end.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })}
                  </span>
                  {isCur && <span className="chip bg-brand-600 text-white">tento týden</span>}
                  {w.bookIds.length > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto"
                      icon={<Play size={14} />}
                      onClick={() =>
                        start({
                          title: `Studijní plán – týden ${w.index}`,
                          mode: 'plan',
                          difficulty: 'medium',
                          bookIds: w.bookIds,
                          areas: [],
                          types: ['abc', 'truefalse', 'flashcard', 'fill', 'match', 'order', 'identifyWork', 'open'],
                          count: 20,
                          includeTerms: w.extras.some((e) => e.includes('pojmy')),
                          includeNonArt: w.extras.some((e) => e.includes('Neumělecký')),
                        })
                      }
                    >
                      Trénovat
                    </Button>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {w.bookIds.map((id) => {
                    const b = data.books.find((x) => x.id === id);
                    if (!b) return null;
                    return (
                      <span key={id} className="inline-flex items-center gap-2 rounded-xl bg-brand-50 py-1 pl-3 pr-1 text-sm font-medium text-brand-900 dark:bg-brand-500/15 dark:text-brand-100">
                        {b.title}
                        <span className="text-xs text-brand-600 dark:text-brand-300">{Math.round(bookProgress(data, b) * 100)} %</span>
                        <select
                          className="rounded-lg bg-transparent text-xs"
                          value={w.index}
                          onChange={(e) => moveBook(id, Number(e.target.value))}
                          aria-label={`Přesunout ${b.title} do jiného týdne`}
                          title="Přesunout do týdne"
                        >
                          {plan.weeks.map((x) => (
                            <option key={x.index} value={x.index}>
                              T{x.index}
                            </option>
                          ))}
                        </select>
                        <button onClick={() => updateWeek(w.index, { bookIds: w.bookIds.filter((x) => x !== id) })} className="rounded-md p-0.5 hover:bg-brand-100 dark:hover:bg-brand-500/20" aria-label="Odebrat z týdne">
                          <X size={14} />
                        </button>
                      </span>
                    );
                  })}
                  {w.extras.map((e) => (
                    <span key={e} className="rounded-xl bg-slate-100 px-3 py-1 text-sm dark:bg-slate-800">
                      {e}
                    </span>
                  ))}
                  <select
                    className="rounded-xl border border-dashed border-slate-300 bg-transparent px-2 py-1 text-sm text-slate-500 dark:border-slate-600"
                    value=""
                    onChange={(e) => e.target.value && updateWeek(w.index, { bookIds: [...new Set([...w.bookIds, e.target.value])] })}
                    aria-label="Přidat knihu do týdne"
                  >
                    <option value="">+ přidat knihu</option>
                    {data.books
                      .filter((b) => !w.bookIds.includes(b.id))
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title}
                        </option>
                      ))}
                  </select>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
