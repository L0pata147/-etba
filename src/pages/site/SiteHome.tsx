import { useMemo } from 'react';
import { Calculator, Dumbbell, Network, Shuffle } from 'lucide-react';
import { useStore } from '../../store';
import { SITE_TOPICS } from '../../data/site';
import { sitePracticalProgress, topicLastStudied, topicProgress } from '../../lib/progress';
import { Button, PageHeader, SectionTitle } from '../../components/ui';
import { ExamCard, ExamCards } from '../../components/SubjectPage';
import { useStartSession } from '../SessionPage';
import { TopicGrid } from './TopicGrid';
import { calcConfig, topicConfig } from './common';

export function SiteHome() {
  const { data } = useStore();
  const start = useStartSession();
  const rows = useMemo(() => SITE_TOPICS.map((t) => ({ t, p: topicProgress(data, t.id), last: topicLastStudied(data, t.id) })), [data]);
  const avg = rows.reduce((s, r) => s + r.p, 0) / rows.length;
  const prac = sitePracticalProgress(data);
  const pracAvg = (prac.cisco + (prac.linux + prac.windows) / 2 + prac.postupy + prac.vypocty) / 4;
  const weakest = [...rows].sort((a, b) => a.p - b.p || a.last - b.last).slice(0, 3);

  return (
    <div>
      <PageHeader
        title="Počítačové sítě"
        emoji="🌐"
        sub="Počítačové sítě a síťové operační systémy – ústní zkouška (20 témat) a praktická zkouška (Packet Tracer, pak vylosovaný Linux nebo Windows Server)."
      />

      <ExamCards>
        <ExamCard subject="site" title="Ústní zkouška" value={avg} info={`${rows.filter((r) => r.p >= 0.75).length} z ${rows.length} témat zvládnuto · 15 min příprava + 15 min zkoušení`}>
          <Button size="sm" icon={<Shuffle size={16} />} to="/site/losovani">
            Simulace ústní
          </Button>
          <Button
            size="sm"
            variant="secondary"
            icon={<Dumbbell size={16} />}
            onClick={() =>
              start(
                topicConfig(
                  weakest.map((w) => w.t.id),
                  'Sítě – nejslabší témata',
                ),
              )
            }
          >
            Nejslabší témata
          </Button>
        </ExamCard>
        <ExamCard subject="site" title="Praktická zkouška" value={pracAvg} info="Packet Tracer, potom vylosovaný Linux nebo Windows Server.">
          <Button size="sm" icon={<Network size={16} />} to="/site/prakticka">
            Zadání nanečisto
          </Button>
          <Button size="sm" variant="secondary" to="/site/prakticka?tab=pt&cast=prikazy">
            Packet Tracer
          </Button>
          <Button size="sm" variant="secondary" to="/site/prakticka?tab=linux&cast=prikazy">
            Linux
          </Button>
          <Button size="sm" variant="secondary" to="/site/prakticka?tab=windows&cast=postupy">
            Windows
          </Button>
        </ExamCard>
        <ExamCard subject="site" title="Výpočty (adresace)" value={prac.vypocty} info="Podsítě, VLSM, IPv6 – příklady se pokaždé generují nové.">
          <Button size="sm" icon={<Calculator size={16} />} onClick={() => start(calcConfig())}>
            Procvičit výpočty
          </Button>
          <Button size="sm" variant="secondary" to="/site/prakticka?tab=vypocty">
            Podle druhu
          </Button>
        </ExamCard>
      </ExamCards>

      <SectionTitle
        sub="Klikni na téma – výklad, schémata, pojmy, kvíz a trénink."
        action={
          <Button size="sm" variant="secondary" to="/site/trenink">
            Vlastní trénink
          </Button>
        }
      >
        Témata ústní zkoušky ({rows.length})
      </SectionTitle>
      <TopicGrid rows={rows} />
    </div>
  );
}
