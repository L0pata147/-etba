import { useMemo } from 'react';
import { Calculator, ClipboardList, Dumbbell } from 'lucide-react';
import { useStore } from '../../store';
import { HW_TOPICS } from '../../data/hw/topics';
import { HW_GENERATORS, generateHwCalcQuestions } from '../../lib/hwgen';
import { areaMastery, topicLastStudied, topicProgress } from '../../lib/progress';
import { shuffle } from '../../lib/random';
import { Button, Card, PageHeader, Pct, ProgressBar, SectionTitle } from '../../components/ui';
import { useStartSession } from '../SessionPage';
import { calcConfig, siteConfig, topicConfig } from '../site/common';
import { TopicGrid } from '../site/TopicGrid';

export function HwHome() {
  const { data } = useStore();
  const start = useStartSession();
  const rows = useMemo(() => HW_TOPICS.map((t) => ({ t, p: topicProgress(data, t.id), last: topicLastStudied(data, t.id) })), [data]);
  const theory = rows.reduce((s, r) => s + r.p, 0) / rows.length;
  const calc = areaMastery(data, 'hw-vypocty', 'it-vypocty');
  const tests = data.sessions.filter((s) => s.mode === 'hw-test');
  const best = tests.reduce((m, s) => Math.max(m, s.score), 0);
  const weakest = [...rows].sort((a, b) => a.p - b.p || a.last - b.last).slice(0, 3);
  const kinds = Object.entries(HW_GENERATORS);
  const runKind = (kind: string, label: string) =>
    start({ ...siteConfig(`Převody: ${label}`, { topics: false, calc: true }, { mode: 'hw-vypocty', subject: 'hw' }), questions: shuffle(generateHwCalcQuestions(8, [kind])) });

  return (
    <div>
      <PageHeader
        title="Technické vybavení počítačů"
        emoji="🖥️"
        sub="Písemný test v Moodlu (60 minut) – hardware, paměti, rozhraní, úložiště, periferie, číselné soustavy a jednotky."
        action={
          <Button icon={<ClipboardList size={18} />} to="/hw/test">
            Cvičný test
          </Button>
        }
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="font-bold">Okruhy</div>
            <span className="text-lg font-bold">
              <Pct value={theory} />
            </span>
          </div>
          <ProgressBar value={theory} className="mt-2" height="h-2.5" />
          <Button size="sm" className="mt-3" icon={<Dumbbell size={16} />} onClick={() => start(topicConfig(weakest.map((w) => w.t.id), 'Hardware – nejslabší okruhy'))}>
            Nejslabší okruhy
          </Button>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="font-bold">Převody a výpočty</div>
            <span className="text-lg font-bold">
              <Pct value={calc} />
            </span>
          </div>
          <ProgressBar value={calc} className="mt-2" height="h-2.5" />
          <Button size="sm" className="mt-3" icon={<Calculator size={16} />} onClick={() => start(calcConfig(12, 'hw'))}>
            Mix příkladů
          </Button>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="font-bold">Cvičné testy</div>
            <span className="text-lg font-bold">{tests.length ? <Pct value={best} /> : '—'}</span>
          </div>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{tests.length ? `${tests.length}× napsáno, nejlepší výsledek` : 'Zatím žádný pokus'}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" to="/hw/test">
              Napsat test
            </Button>
            <Button size="sm" variant="secondary" to="/hw/trenink">
              Vlastní trénink
            </Button>
          </div>
        </Card>
      </div>

      <SectionTitle sub="Příklady se generují pokaždé nové, výsledek píšeš přesně.">Převody a výpočty</SectionTitle>
      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {kinds.map(([kind, g]) => (
          <button key={kind} onClick={() => runKind(kind, g.label)} className="card p-3 text-left text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-md">
            {g.label}
          </button>
        ))}
      </div>

      <SectionTitle sub="Klikni na okruh – výklad, pojmy, kvíz a trénink.">Okruhy</SectionTitle>
      <TopicGrid rows={rows} />
    </div>
  );
}
