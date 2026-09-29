import { useState } from 'react';
import { ChevronDown, Play } from 'lucide-react';
import type { NonArtText } from '../types';
import { NONART_TEXTS } from '../data/nonart';
import type { SessionConfig } from '../lib/session';
import { useStartSession } from './SessionPage';
import { Button, Card, PageHeader, Tag, cx } from '../components/ui';

export function nonArtConfig(title: string, ids?: string[], count = 10): SessionConfig {
  return {
    title,
    mode: 'neumelecky',
    difficulty: 'medium',
    bookIds: ['__none__'],
    areas: ['nonart1', 'nonart2'],
    types: ['abc', 'truefalse', 'open', 'flashcard'],
    count,
    includeNonArt: true,
    nonArtIds: ids,
    includeGlobal: false,
    bySection: true,
  };
}

export function NonArt() {
  const start = useStartSession();
  return (
    <div>
      <PageHeader
        title="Analýza neuměleckého textu"
        emoji="📰"
        sub="Cvičné texty k procvičení I. a II. části analýzy neuměleckého textu."
        action={
          <Button icon={<Play size={18} />} onClick={() => start(nonArtConfig('Neumělecký text – mix', undefined, 12))}>
            Procvičit vše
          </Button>
        }
      />
      <Card className="mb-5 grid gap-4 p-5 md:grid-cols-2">
        <div>
          <h2 className="font-bold">I. část</h2>
          <ul className="mt-1 list-disc pl-5 text-sm text-slate-600 dark:text-slate-300">
            <li>souvislost mezi výňatky</li>
            <li>hlavní myšlenka textu</li>
            <li>podstatné a nepodstatné informace</li>
            <li>různé možné způsoby čtení a interpretace</li>
            <li>domněnky a fakta</li>
            <li>komunikační situace (účel, adresát)</li>
          </ul>
        </div>
        <div>
          <h2 className="font-bold">II. část</h2>
          <ul className="mt-1 list-disc pl-5 text-sm text-slate-600 dark:text-slate-300">
            <li>funkční styl</li>
            <li>slohový postup</li>
            <li>slohový útvar</li>
            <li>kompoziční výstavba výňatku</li>
            <li>jazykové prostředky a jejich funkce</li>
          </ul>
        </div>
      </Card>
      <div className="space-y-4">
        {NONART_TEXTS.map((t) => (
          <TextCard key={t.id} t={t} onPractice={() => start(nonArtConfig(t.title, [t.id], 10))} />
        ))}
      </div>
      <p className="mt-4 text-xs text-slate-500">Texty jsou cvičné – vytvořené pro potřeby aplikace, nejde o skutečné články.</p>
    </div>
  );
}

function TextCard({ t, onPractice }: { t: NonArtText; onPractice: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold">{t.title}</h3>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Tag tone="brand">{t.form.split(' (')[0]}</Tag>
            {t.excerpts.length > 1 && <Tag tone="violet">{t.excerpts.length} výňatky</Tag>}
          </div>
        </div>
        <Button size="sm" icon={<Play size={14} />} onClick={onPractice}>
          Procvičit
        </Button>
      </div>
      <div className="mt-4 space-y-3">
        {t.excerpts.map((e) => (
          <div key={e.label} className="rounded-xl border-l-4 border-brand-400 bg-slate-50 p-4 dark:bg-slate-800/60">
            <div className="mb-1 text-xs font-semibold uppercase text-slate-500">{e.label}</div>
            <p className="whitespace-pre-line text-[15px] leading-relaxed">{e.text}</p>
          </div>
        ))}
      </div>
      <button onClick={() => setOpen(!open)} className="mt-3 flex items-center gap-1 text-sm font-semibold text-brand-700 dark:text-brand-400">
        <ChevronDown size={16} className={cx('transition', open && 'rotate-180')} /> {open ? 'Skrýt rozbor' : 'Zobrazit vzorový rozbor'}
      </button>
      {open && (
        <dl className="animate-fade-up mt-3 grid gap-3 text-[15px] md:grid-cols-2">
          {t.relation && <Item label="Souvislost mezi výňatky" v={t.relation} />}
          <Item label="Hlavní myšlenka" v={t.mainIdea} />
          <Item label="Komunikační situace" v={t.communication} />
          <Item label="Podstatné × nepodstatné" v={t.essential} />
          <Item label="Způsoby čtení" v={t.interpretations} />
          <Item label="Fakta × domněnky" v={t.factsVsOpinions.map((f) => `${f.isFact ? 'FAKT' : 'NÁZOR/DOMNĚNKA'}: „${f.statement}“ – ${f.why}`).join('\n')} />
          <Item label="Funkční styl" v={t.style} />
          <Item label="Slohový postup" v={t.procedure} />
          <Item label="Slohový útvar" v={t.form} />
          <Item label="Kompozice" v={t.composition} />
          <div className="md:col-span-2">
            <Item label="Jazykové prostředky" v={t.language} />
          </div>
        </dl>
      )}
    </Card>
  );
}

function Item({ label, v }: { label: string; v: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
      <dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-line">{v}</dd>
    </div>
  );
}
