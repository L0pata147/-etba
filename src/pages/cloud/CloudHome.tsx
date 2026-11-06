import { useMemo } from 'react';
import { Dumbbell, ListOrdered, Server, Terminal } from 'lucide-react';
import { useStore } from '../../store';
import { CLOUD_EXTRA_FROM, CLOUD_TOPICS } from '../../data/cloud/topics';
import { cloudPracticalProgress, topicLastStudied, topicProgress } from '../../lib/progress';
import { Button, PageHeader, SectionTitle } from '../../components/ui';
import { ExamCard, ExamCards } from '../../components/SubjectPage';
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
      <PageHeader title="Programové vybavení cloudu" emoji="☁️" sub="Praktická zkouška – virtualizace, virtuální sítě a úložiště, zálohy, vysoká dostupnost, kontejnery a veřejný cloud." />
      <ExamCards>
        <ExamCard subject="cloud" title="Praktická zkouška" value={prac} info="Linux (NFS, GlusterFS), VirtualBox, Docker, Hyper-V a Proxmox VE.">
          <Button size="sm" icon={<Server size={16} />} to="/cloud/prakticka">
            Zadání nanečisto
          </Button>
          <Button size="sm" variant="secondary" icon={<ListOrdered size={16} />} to="/cloud/prakticka?tab=postupy">
            Postupy
          </Button>
          <Button size="sm" variant="secondary" icon={<Terminal size={16} />} onClick={() => start(commandsConfig(['virtualbox', 'docker', 'hyperv', 'proxmox'], 'Cloud – příkazy (mix)'))}>
            Příkazy
          </Button>
        </ExamCard>
        <ExamCard subject="cloud" title="Okruhy (teorie)" value={theory} info={`${rows.filter((r) => r.p >= 0.75).length} z ${rows.length} okruhů zvládnuto – pojmy, které u zkoušky vysvětluješ.`}>
          <Button
            size="sm"
            icon={<Dumbbell size={16} />}
            onClick={() =>
              start(
                topicConfig(
                  weakest.map((w) => w.t.id),
                  'Cloud – nejslabší okruhy',
                ),
              )
            }
          >
            Nejslabší okruhy
          </Button>
        </ExamCard>
        <ExamCard subject="cloud" title="Terminál" value={null} info="Simulovaný Debian – NFS a GlusterFS podle hodin.">
          <Button size="sm" icon={<Terminal size={16} />} to="/terminal">
            Otevřít terminál
          </Button>
        </ExamCard>
      </ExamCards>
      <SectionTitle
        sub="Klikni na okruh – výklad, pojmy, kvíz a trénink."
        action={
          <Button size="sm" variant="secondary" to="/cloud/trenink">
            Vlastní trénink
          </Button>
        }
      >
        Okruhy ({rows.filter((r) => r.t.number < CLOUD_EXTRA_FROM).length})
      </SectionTitle>
      <TopicGrid rows={rows.filter((r) => r.t.number < CLOUD_EXTRA_FROM)} />
      <div className="mt-7">
        <SectionTitle sub="Operační systémy, bootování, procesy, souborové systémy, UPS a clustery z učitelových učebnic VRT a CCC.">Další látka z učitelova textu</SectionTitle>
        <TopicGrid rows={rows.filter((r) => r.t.number >= CLOUD_EXTRA_FROM)} />
      </div>
    </div>
  );
}
