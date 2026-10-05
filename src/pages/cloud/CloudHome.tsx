import { useMemo } from 'react';
import { Dumbbell, ListOrdered, Server, Terminal } from 'lucide-react';
import { useStore } from '../../store';
import { CLOUD_TOPICS } from '../../data/cloud/topics';
import { cloudPracticalProgress, topicLastStudied, topicProgress } from '../../lib/progress';
import { Button, Card, PageHeader, Pct, ProgressBar, SectionTitle } from '../../components/ui';
import { useStartSession } from '../SessionPage';
import { commandsConfig, topicConfig } from '../site/common';
import { TopicGrid } from '../site/TopicGrid';

export function CloudHome() {
  const { data } = useStore();
  const start = useStartSession();
  const rows = useMemo(() => CLOUD_TOPICS.map((t) => ({ t, p: topicProgress(data, t.id), last: topicLastStudied(data, t.id) })), [data]);
  const theory = rows.reduce((s, r) => s + r.p, 0) / rows.length;
  const prac = cloudPracticalProgress(data);
  const weakest = [...rows].sort((a, b) => a.p - b.p || a.last - b.last).slice(0, 3);

  return (
    <div>
      <PageHeader
        title="Programové vybavení cloudu"
        emoji="☁️"
        sub="Praktická zkouška – virtualizace, virtuální sítě a úložiště, zálohy, vysoká dostupnost, kontejnery a veřejný cloud."
        action={
          <Button icon={<Server size={18} />} to="/cloud/prakticka">
            Zadání nanečisto
          </Button>
        }
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="font-bold">Teorie (okruhy)</div>
            <span className="text-lg font-bold">
              <Pct value={theory} />
            </span>
          </div>
          <ProgressBar value={theory} className="mt-2" height="h-2.5" />
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Pojmy a principy, které budeš u praktické zkoušky potřebovat vysvětlit i použít.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" icon={<Dumbbell size={16} />} onClick={() => start(topicConfig(weakest.map((w) => w.t.id), 'Cloud – nejslabší okruhy'))}>
              Nejslabší okruhy
            </Button>
            <Button size="sm" variant="secondary" to="/cloud/trenink">
              Vlastní trénink
            </Button>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="font-bold">Praxe (příkazy a postupy)</div>
            <span className="text-lg font-bold">
              <Pct value={prac} />
            </span>
          </div>
          <ProgressBar value={prac} className="mt-2" height="h-2.5" />
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">VirtualBox, Docker, Hyper-V (PowerShell) a Proxmox VE.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" icon={<Terminal size={16} />} onClick={() => start(commandsConfig(['virtualbox', 'docker', 'hyperv', 'proxmox'], 'Cloud – příkazy (mix)'))}>
              Příkazy
            </Button>
            <Button size="sm" variant="secondary" icon={<ListOrdered size={16} />} to="/cloud/prakticka?tab=postupy">
              Postupy
            </Button>
          </div>
        </Card>
      </div>
      <SectionTitle sub="Klikni na okruh – výklad, pojmy, kvíz a trénink.">Okruhy</SectionTitle>
      <TopicGrid rows={rows} />
    </div>
  );
}
