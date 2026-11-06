import { useMemo } from 'react';
import { Calculator, ClipboardList, Dumbbell } from 'lucide-react';
import { useStore } from '../../store';
import { HW_EXTRA_FROM, HW_TOPICS } from '../../data/hw/topics';
import { HW_GENERATORS, generateHwCalcQuestions } from '../../lib/hwgen';
import { areaMastery, topicLastStudied, topicProgress } from '../../lib/progress';
import { shuffle } from '../../lib/random';
import { Button, PageHeader, SectionTitle } from '../../components/ui';
import { ExamCard, ExamCards } from '../../components/SubjectPage';
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
      <PageHeader title="Technické vybavení počítačů" emoji="🖥️" sub="Písemný test v Moodlu (60 minut). Okruhy podle maturitního zadání, látka podle učitelova textu." />
      <ExamCards>
        <ExamCard
          subject="hw"
          title="Písemný test"
          value={tests.length ? best : null}
          info={tests.length ? `${tests.length}× napsáno, nejlepší výsledek` : 'Zatím žádný pokus – test jako v Moodlu, 60 minut.'}
        >
          <Button size="sm" icon={<ClipboardList size={16} />} to="/hw/test">
            Napsat cvičný test
          </Button>
        </ExamCard>
        <ExamCard subject="hw" title="Okruhy (teorie)" value={theory} info={`${rows.filter((r) => r.p >= 0.75).length} z ${rows.length} okruhů zvládnuto`}>
          <Button
            size="sm"
            icon={<Dumbbell size={16} />}
            onClick={() =>
              start(
                topicConfig(
                  weakest.map((w) => w.t.id),
                  'Hardware – nejslabší okruhy',
                ),
              )
            }
          >
            Nejslabší okruhy
          </Button>
        </ExamCard>
        <ExamCard subject="hw" title="Převody a výpočty" value={calc} info="Jednotky, soustavy, přenosové rychlosti – pokaždé nové příklady.">
          <Button size="sm" icon={<Calculator size={16} />} onClick={() => start(calcConfig(12, 'hw'))}>
            Mix příkladů
          </Button>
        </ExamCard>
      </ExamCards>

      <SectionTitle
        sub="Klikni na okruh – výklad, pojmy, kvíz a trénink."
        action={
          <Button size="sm" variant="secondary" to="/hw/trenink">
            Vlastní trénink
          </Button>
        }
      >
        Okruhy podle maturitního zadání ({rows.filter((r) => r.t.number < HW_EXTRA_FROM).length})
      </SectionTitle>
      <TopicGrid rows={rows.filter((r) => r.t.number < HW_EXTRA_FROM)} />
      <div className="mt-7">
        <SectionTitle sub="Kapitoly z učitelova textu, které zadání výslovně nejmenuje – v testu se ale objevit můžou.">Další látka z učitelova textu</SectionTitle>
        <TopicGrid rows={rows.filter((r) => r.t.number >= HW_EXTRA_FROM)} />
      </div>
      <div className="mt-7">
        <SectionTitle sub="Příklady se generují pokaždé nové, výsledek píšeš přesně.">Převody podle druhu</SectionTitle>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {kinds.map(([kind, g]) => (
            <button key={kind} onClick={() => runKind(kind, g.label)} className="card p-3 text-left text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-md">
              {g.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
