import { useMemo, useState } from 'react';
import type { AnswerResult } from '../types';
import { useStore } from '../store';
import { questionOfDay } from '../lib/qotd';
import { QuestionBody, correctAnswerText } from '../components/questions';
import { bookLabel } from '../components/SessionRunner';
import { Button, Card, EmptyState, PageHeader, Tag } from '../components/ui';

export function QuestionOfDay() {
  const { data, recordAnswer } = useStore();
  const q = useMemo(() => questionOfDay(data), [data]);
  const [result, setResult] = useState<AnswerResult | null>(null);
  if (!q) return <EmptyState icon="❓" title="Otázka dne není k dispozici" action={<Button to="/">Na přehled</Button>} />;
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Otázka dne" emoji="❓" sub={new Date().toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' })} />
      <div className="mb-3">
        <Tag>{bookLabel(q.bookId, data.books)}</Tag>
      </div>
      <Card className="p-5 sm:p-7">
        <QuestionBody
          q={q}
          result={result}
          onSubmit={(r) => {
            const full = { ...r, questionId: q.id, seconds: 0 };
            setResult(full);
            recordAnswer(q, full);
          }}
        />
        {result && (
          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-800/60">
            <div className="font-semibold">{result.score >= 1 ? '✅ Správně!' : `❌ Správně je: ${correctAnswerText(q)}`}</div>
            {q.explanation && <p className="mt-1 whitespace-pre-line text-slate-600 dark:text-slate-300">{q.explanation}</p>}
          </div>
        )}
      </Card>
      {result && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button to="/">Dnešní trénink</Button>
          <Button variant="secondary" to="/trenink">
            Další otázky
          </Button>
        </div>
      )}
      <p className="mt-4 text-xs text-slate-500">Každý den je tu jiná otázka ze všech předmětů – stejná jako v upozornění na telefonu.</p>
    </div>
  );
}
