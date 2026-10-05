import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { HYPERVISOR_LABEL, generateCloudScenario, type CloudScenario, type Hypervisor } from '../../lib/cloudgen';
import { Button, Card, PageHeader, Segmented, SectionTitle, Tag } from '../../components/ui';
import { CommandsTab, ProceduresTab, TaskCard, TroubleTab } from '../site/SitePractical';
import { SUBJECT_PLATFORMS } from '../../data/subjects';

type Tab = 'zadani' | 'prikazy' | 'postupy' | 'chyby';

export function CloudPractical() {
  const [params, setParams] = useSearchParams();
  const tab = (['zadani', 'prikazy', 'postupy', 'chyby'].includes(params.get('tab') ?? '') ? params.get('tab') : 'zadani') as Tab;
  return (
    <div>
      <PageHeader title="Praktická zkouška – cloud" emoji="🛠️" sub="Virtualizace, virtuální sítě, snapshoty a zálohy, kontejnery." />
      <Segmented
        className="mb-5"
        value={tab}
        onChange={(v) => setParams(v === 'zadani' ? {} : { tab: v }, { replace: true })}
        options={[
          { value: 'zadani', label: 'Zadání nanečisto' },
          { value: 'prikazy', label: 'Příkazy' },
          { value: 'postupy', label: 'Postupy' },
          { value: 'chyby', label: 'Najdi chybu' },
        ]}
      />
      {tab === 'zadani' && <CloudScenarioTab />}
      {tab === 'prikazy' && <CommandsTab platforms={SUBJECT_PLATFORMS.cloud} />}
      {tab === 'postupy' && <ProceduresTab platforms={SUBJECT_PLATFORMS.cloud} />}
      {tab === 'chyby' && <TroubleTab platforms={SUBJECT_PLATFORMS.cloud} />}
    </div>
  );
}

function CloudScenarioTab() {
  const [hv, setHv] = useState<Hypervisor>('virtualbox');
  const [sc, setSc] = useState<CloudScenario | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<Set<string>>(new Set());
  const flip = (set: Set<string>, id: string) => {
    const n = new Set(set);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    return n;
  };
  const generate = () => {
    setSc(generateCloudScenario(hv));
    setDone(new Set());
    setOpen(new Set());
  };

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <h2 className="font-bold">Vygeneruj si zadání ve stylu praktické zkoušky</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Pokaždé jiné adresy a parametry virtuálních počítačů. Úkoly plň ve virtualizaci, odškrtávej je a řešení si otevři až nakonec. Skutečné zadání a použitá platforma se u zkoušky mohou lišit – jde o procvičení typických úkolů.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Segmented
            value={hv}
            onChange={setHv}
            options={[
              { value: 'virtualbox', label: 'VirtualBox' },
              { value: 'hyperv', label: 'Hyper-V' },
              { value: 'proxmox', label: 'Proxmox VE' },
            ]}
          />
          <Button icon={<RefreshCw size={17} />} onClick={generate}>
            {sc ? 'Nové zadání' : 'Vygenerovat zadání'}
          </Button>
        </div>
      </Card>
      {sc && (
        <>
          <Card className="flex flex-wrap gap-2 p-5">
            <Tag tone="brand">Firma {sc.company}</Tag>
            <Tag>{HYPERVISOR_LABEL[sc.hypervisor]}</Tag>
            <Tag>Síť {sc.net}</Tag>
            <Tag>Brána {sc.gateway}</Tag>
            <Tag tone="emerald">
              Splněno {done.size}/{sc.tasks.length}
            </Tag>
          </Card>
          <section>
            <SectionTitle sub="Virtualizace, kontejnery, zálohy">Úkoly</SectionTitle>
            <div className="space-y-3">
              {sc.tasks.map((t, i) => (
                <TaskCard key={t.id} t={t} i={i} done={done.has(t.id)} open={open.has(t.id)} onDone={() => setDone((s) => flip(s, t.id))} onOpen={() => setOpen((s) => flip(s, t.id))} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
