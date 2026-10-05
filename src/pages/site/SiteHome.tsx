import { useMemo } from 'react';
import { Calculator, Dumbbell, Network, Shuffle, Terminal } from 'lucide-react';
import { useStore } from '../../store';
import { SITE_TOPICS } from '../../data/site';
import { sitePracticalProgress, topicLastStudied, topicProgress } from '../../lib/progress';
import { Button, Card, PageHeader, Pct, ProgressBar, SectionTitle } from '../../components/ui';
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
        action={
          <Button icon={<Shuffle size={18} />} to="/site/losovani">
            Losovat téma
          </Button>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="font-bold">Ústní zkouška</div>
            <span className="text-lg font-bold">
              <Pct value={avg} />
            </span>
          </div>
          <ProgressBar value={avg} className="mt-2" height="h-2.5" />
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {rows.filter((r) => r.p >= 0.75).length} z {rows.length} témat zvládnuto · 15 min příprava + 15 min zkoušení
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" icon={<Shuffle size={16} />} to="/site/losovani">
              Simulace ústní
            </Button>
            <Button size="sm" variant="secondary" icon={<Dumbbell size={16} />} onClick={() => start(topicConfig(weakest.map((w) => w.t.id), 'Sítě – nejslabší témata'))}>
              Nejslabší témata
            </Button>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="font-bold">Praktická zkouška</div>
            <span className="text-lg font-bold">
              <Pct value={pracAvg} />
            </span>
          </div>
          <ProgressBar value={pracAvg} className="mt-2" height="h-2.5" />
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Cisco <Pct value={prac.cisco} /> · Linux <Pct value={prac.linux} /> · Windows <Pct value={prac.windows} /> · výpočty <Pct value={prac.vypocty} />
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" icon={<Network size={16} />} to="/site/prakticka">
              Zadání nanečisto
            </Button>
            <Button size="sm" variant="secondary" icon={<Terminal size={16} />} to="/site/prakticka?tab=prikazy">
              Příkazy
            </Button>
            <Button size="sm" variant="secondary" icon={<Calculator size={16} />} onClick={() => start(calcConfig())}>
              Výpočty
            </Button>
            <Button size="sm" variant="secondary" to="/terminal">
              💻 Terminál
            </Button>
            <Button size="sm" variant="secondary" to="/dril?predmet=site">
              ⚡ Dril na čas
            </Button>
          </div>
        </Card>
      </div>

      <SectionTitle sub="Klikni na téma – výklad, pojmy, kvíz a trénink." action={<Button size="sm" variant="secondary" to="/site/trenink">Vlastní trénink</Button>}>
        20 témat ústní zkoušky
      </SectionTitle>
      <TopicGrid rows={rows} />
    </div>
  );
}
