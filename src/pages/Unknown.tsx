import { useState } from 'react';
import { Play, RotateCcw, Trash2 } from 'lucide-react';
import type { Question } from '../types';
import { useStore } from '../store';
import { AREA_MAP } from '../data/osnova';
import { unknownSession } from '../lib/quick';
import { TYPE_INFO } from '../lib/session';
import { correctAnswerText } from '../components/questions';
import { RetryModal, bookLabel } from '../components/SessionRunner';
import { useStartSession } from './SessionPage';
import { Button, Card, EmptyState, PageHeader, Tag, formatDate } from '../components/ui';

export function Unknown() {
  const { data, removeUnknown } = useStore();
  const start = useStartSession();
  const [retry, setRetry] = useState<Question | null>(null);
  const items = Object.entries(data.unknown).sort((a, b) => b[1].addedAt - a[1].addedAt);

  return (
    <div>
      <PageHeader
        title="Musím se doučit"
        emoji="❌"
        sub="Otázky, u kterých jsi klikl(a) na „Neumím“ nebo odpověděl(a) špatně. Po dvou správných odpovědích v řadě ze seznamu zmizí."
        action={
          items.length > 0 && (
            <Button icon={<Play size={18} />} onClick={() => start(unknownSession())}>
              🔥 Trénovat pouze to, co neumím
            </Button>
          )
        }
      />
      {!items.length ? (
        <EmptyState icon="🎉" title="Seznam je prázdný" text="Když u otázky klikneš na „Neumím“ nebo odpovíš špatně, objeví se tady." action={<Button to="/trenink">Jít trénovat</Button>} />
      ) : (
        <div className="space-y-3">
          {items.map(([id, u]) => (
            <Card key={id} className="p-4">
              <div className="mb-1 flex flex-wrap items-center gap-1.5 text-xs">
                <Tag tone="brand">{TYPE_INFO[u.question.type].short}</Tag>
                <Tag>{bookLabel(u.question.bookId, data.books)}</Tag>
                <Tag tone="violet">{AREA_MAP[u.question.area].short}</Tag>
                {u.correctStreak > 0 && <Tag tone="emerald">1× správně</Tag>}
                <span className="ml-auto text-slate-500">přidáno {formatDate(u.addedAt)}</span>
              </div>
              <p className="whitespace-pre-line font-semibold">{u.question.prompt}</p>
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-semibold text-slate-600 dark:text-slate-300">Správná odpověď</summary>
                <p className="mt-1 whitespace-pre-line text-sm">{correctAnswerText(u.question)}</p>
              </details>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="secondary" icon={<RotateCcw size={14} />} onClick={() => setRetry(u.question)}>
                  Zopakovat
                </Button>
                <Button size="sm" variant="ghost" icon={<Trash2 size={14} />} onClick={() => removeUnknown(id)}>
                  Už umím – odebrat
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      <RetryModal q={retry} onClose={() => setRetry(null)} />
    </div>
  );
}
