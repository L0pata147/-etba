import { useMemo, useState } from 'react';
import { Play } from 'lucide-react';
import type { Difficulty, Platform, QuestionType } from '../../types';
import { SITE_TOPICS } from '../../data/site';
import { PLATFORM_LABEL } from '../../data/site/commands';
import { useStore } from '../../store';
import { DIFFICULTY_INFO, DIFFICULTY_TYPES, buildPool } from '../../lib/session';
import { topicProgress } from '../../lib/progress';
import { Button, Card, PageHeader, Pct, Segmented, SectionTitle, Toggle, cx } from '../../components/ui';
import { useStartSession } from '../SessionPage';
import { PLATFORMS, siteConfig } from './common';

export function SiteTraining() {
  const { data } = useStore();
  const start = useStartSession();
  const [topicIds, setTopicIds] = useState<string[]>([]);
  const [useTopics, setUseTopics] = useState(true);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [procedures, setProcedures] = useState(false);
  const [calc, setCalc] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [count, setCount] = useState(15);

  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const nothing = !useTopics && !platforms.length && !calc;

  const types: QuestionType[] = [...DIFFICULTY_TYPES[difficulty], ...(platforms.length || calc ? (['fill'] as QuestionType[]) : []), ...(procedures ? (['order'] as QuestionType[]) : [])];

  const cfg = siteConfig(
    `Sítě – ${DIFFICULTY_INFO[difficulty].label.toLowerCase()} obtížnost${topicIds.length === 1 ? ` – téma ${SITE_TOPICS.find((t) => t.id === topicIds[0])?.number}` : ''}`,
    { topics: useTopics, topicIds, commands: platforms, procedures: procedures && platforms.length > 0, calc },
    { difficulty, count, types, mode: `site-${difficulty}` },
  );
  const site = cfg.site;
  const available = useMemo(() => {
    if (nothing) return 0;
    const set = new Set(types);
    return buildPool([], [], { subject: 'site', site }).filter((q) => set.has(q.type) && (difficulty !== 'maturita' || q.difficulty === 'maturita' || q.difficulty === 'hard')).length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nothing, JSON.stringify(site), types.join(), difficulty]);

  return (
    <div>
      <PageHeader title="Trénink – sítě" emoji="🏋️" sub="Poskládej si trénink z témat, příkazů, postupů a výpočtů." />
      <div className="space-y-5">
        <Card className="p-5">
          <SectionTitle>Obtížnost</SectionTitle>
          <Segmented
            value={difficulty}
            onChange={setDifficulty}
            options={(['easy', 'medium', 'hard', 'maturita'] as Difficulty[]).map((d) => ({ value: d, label: `${DIFFICULTY_INFO[d].emoji} ${DIFFICULTY_INFO[d].label}` }))}
          />
          <p className="mt-2 text-sm text-slate-500">{DIFFICULTY_INFO[difficulty].description}</p>
        </Card>

        <Card className="p-5">
          <SectionTitle
            sub={useTopics ? (topicIds.length ? `Vybráno ${topicIds.length} témat` : 'Všech 20 témat') : 'Témata vypnuta'}
            action={<Toggle checked={useTopics} onChange={setUseTopics} label="Ústní témata" />}
          >
            Témata
          </SectionTitle>
          {useTopics && (
            <div className="grid gap-2 sm:grid-cols-2">
              {SITE_TOPICS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTopicIds((s) => toggle(s, t.id))}
                  className={cx(
                    'flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition',
                    topicIds.includes(t.id) ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/15' : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800',
                  )}
                >
                  <span className="w-6 font-bold text-slate-500">{t.number}.</span>
                  <span className="flex-1">{t.title}</span>
                  <span className="text-xs text-slate-500">
                    <Pct value={topicProgress(data, t.id)} />
                  </span>
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <SectionTitle sub="Praktická část">Příkazy, postupy, výpočty</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <Toggle key={p} checked={platforms.includes(p)} onChange={() => setPlatforms((s) => toggle(s, p))} label={`Příkazy ${PLATFORM_LABEL[p]}`} />
            ))}
            <Toggle checked={procedures} onChange={setProcedures} label="Postupy (seřazování)" />
            <Toggle checked={calc} onChange={setCalc} label="Výpočty (adresace)" />
          </div>
          {procedures && !platforms.length && <p className="mt-2 text-sm text-amber-600">Postupy se berou pro vybrané platformy – zapni aspoň jednu.</p>}
        </Card>

        <Card className="p-5">
          <SectionTitle>Počet otázek</SectionTitle>
          <Segmented value={count} onChange={setCount} options={[10, 15, 25, 40].map((n) => ({ value: n, label: String(n) }))} />
        </Card>

        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg" icon={<Play size={18} />} disabled={nothing || !available} onClick={() => start(cfg)}>
            Spustit trénink
          </Button>
          <span className="text-sm text-slate-500">{nothing ? 'Vyber, co chceš trénovat.' : `K dispozici ${available} otázek`}</span>
        </div>
      </div>
    </div>
  );
}
