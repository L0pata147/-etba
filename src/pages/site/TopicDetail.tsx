import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Mic, Shuffle } from 'lucide-react';
import { useStore } from '../../store';
import { SITE_TOPICS, TOPIC_MAP } from '../../data/site';
import { areaMastery, topicProgress } from '../../lib/progress';
import { topicExamQuestion } from '../../lib/topicgen';
import { AREA_MAP } from '../../data/osnova';
import { Button, Card, EmptyState, PageHeader, Pct, ProgressBar, Segmented, SectionTitle, Tag, cx } from '../../components/ui';
import { useStartSession } from '../SessionPage';
import { siteConfig, topicConfig } from './common';

type Tab = 'vyklad' | 'pojmy' | 'kviz';

export function TopicDetail() {
  const { id } = useParams();
  return <TopicInner key={id} id={id} />;
}

function TopicInner({ id }: { id?: string }) {
  const { data } = useStore();
  const start = useStartSession();
  const [tab, setTab] = useState<Tab>('vyklad');
  const [hidden, setHidden] = useState(false);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const t = id ? TOPIC_MAP[id] : undefined;
  if (!t) return <EmptyState icon="❓" title="Téma nenalezeno" action={<Button to="/site">Zpět na témata</Button>} />;

  const p = topicProgress(data, t.id);
  const idx = SITE_TOPICS.findIndex((x) => x.id === t.id);
  const prev = SITE_TOPICS[idx - 1];
  const next = SITE_TOPICS[idx + 1];
  const toggleReveal = (i: number) =>
    setRevealed((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });

  return (
    <div>
      <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />} to="/site" className="mb-3">
        Všechna témata
      </Button>
      <PageHeader title={`${t.number}. ${t.title}`} sub={t.summary} />

      <Card className="mb-5 p-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold">Zvládnutí tématu</span>
          <span className="font-bold">
            <Pct value={p} />
          </span>
        </div>
        <ProgressBar value={p} height="h-2.5" />
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {(['it-pojmy', 'it-teorie', 'it-ustni'] as const).map((a) => (
            <Tag key={a}>
              {AREA_MAP[a].short}: <Pct value={areaMastery(data, t.id, a)} />
            </Tag>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => start(topicConfig([t.id], `Téma ${t.number}: ${t.title} – lehce`, 'easy', 12))}>
            🟢 Lehký trénink
          </Button>
          <Button size="sm" onClick={() => start(topicConfig([t.id], `Téma ${t.number}: ${t.title}`, 'medium', 15))}>
            🟡 Střední
          </Button>
          <Button size="sm" onClick={() => start(topicConfig([t.id], `Téma ${t.number}: ${t.title} – vlastní odpovědi`, 'hard', 6))}>
            🔴 Vlastní odpovědi
          </Button>
          <Button
            size="sm"
            variant="secondary"
            icon={<Mic size={16} />}
            onClick={() => start({ ...siteConfig(`Výklad tématu ${t.number}`, { topicIds: [t.id] }), questions: [topicExamQuestion(t)], count: 1 })}
          >
            Vyložit celé téma
          </Button>
          <Button size="sm" variant="secondary" icon={<Shuffle size={16} />} to={`/site/losovani?tema=${t.id}`}>
            Simulace s tímto tématem
          </Button>
        </div>
      </Card>

      <Segmented
        className="mb-4"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'vyklad', label: 'Osnova výkladu' },
          { value: 'pojmy', label: `Pojmy (${t.terms.length})` },
          { value: 'kviz', label: `Otázky (${t.quiz.length + t.deep.length})` },
        ]}
      />

      {tab === 'vyklad' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" variant="ghost" icon={hidden ? <Eye size={16} /> : <EyeOff size={16} />} onClick={() => setHidden((h) => !h)}>
              {hidden ? 'Ukázat body' : 'Skrýt body (zkus si je říct)'}
            </Button>
          </div>
          {t.outline.map((o, i) => (
            <Card key={o.heading} className="p-5">
              <h3 className="font-bold">
                {i + 1}. {o.heading}
              </h3>
              {hidden && !revealed.has(i) ? (
                <button onClick={() => toggleReveal(i)} className="mt-2 text-sm font-semibold text-brand-600 dark:text-brand-400">
                  Ukázat ({o.points.length} bodů)
                </button>
              ) : (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px] text-slate-700 dark:text-slate-300">
                  {o.points.map((pt) => (
                    <li key={pt}>{pt}</li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </div>
      )}

      {tab === 'pojmy' && (
        <Card className="divide-y divide-slate-100 dark:divide-slate-800">
          {t.terms.map((x) => (
            <div key={x.term} className="p-4">
              <div className="font-semibold">{x.term}</div>
              <div className="text-[15px] text-slate-600 dark:text-slate-300">{x.def}</div>
            </div>
          ))}
        </Card>
      )}

      {tab === 'kviz' && (
        <div className="space-y-3">
          <SectionTitle sub="Klikni na otázku a zobrazí se odpověď.">Kontrolní otázky</SectionTitle>
          {[...t.quiz.map((x) => ({ q: x.q, a: x.why ? `${x.a} – ${x.why}` : x.a })), ...t.deep.map((x) => ({ q: x.q, a: x.answer }))].map((x, i) => (
            <button key={x.q} onClick={() => toggleReveal(100 + i)} className="card block w-full p-4 text-left">
              <div className="font-semibold">{x.q}</div>
              <div className={cx('mt-2 whitespace-pre-line text-[15px] text-slate-600 dark:text-slate-300', !revealed.has(100 + i) && 'hidden')}>{x.a}</div>
              {!revealed.has(100 + i) && <div className="mt-1 text-sm text-brand-600 dark:text-brand-400">Ukázat odpověď</div>}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 flex justify-between gap-2">
        {prev ? (
          <Button variant="secondary" size="sm" to={`/site/tema/${prev.id}`}>
            ← {prev.number}. {prev.title}
          </Button>
        ) : (
          <span />
        )}
        {next && (
          <Button variant="secondary" size="sm" to={`/site/tema/${next.id}`}>
            {next.number}. {next.title} →
          </Button>
        )}
      </div>
    </div>
  );
}
