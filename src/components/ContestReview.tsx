import { CircleCheck, CircleX, Timer } from 'lucide-react';
import type { Question } from '../types';
import type { ContestEntry, Mark } from '../lib/contests';
import { correctAnswerText } from './questions';
import { Modal, cx } from './ui';

/** Přehled otázek po hře: správná odpověď, moje odpověď a kdo z ostatních to měl dobře */
export function ContestReview({ open, onClose, title, questions, marks, answers, others }: { open: boolean; onClose: () => void; title: string; questions: Question[]; marks?: Mark[]; answers?: string[]; others: ContestEntry[] }) {
  return (
    <Modal open={open} onClose={onClose} title={title} wide>
      <ol className="space-y-3">
        {questions.map((q, i) => {
          const m = marks?.[i];
          const right = others.filter((o) => o.result.q?.[i]?.[0] === 1).map((o) => o.name);
          const wrong = others.filter((o) => o.result.q?.[i] && o.result.q[i][0] !== 1).map((o) => o.name);
          const all = (m ? 1 : 0) + others.filter((o) => o.result.q?.[i]).length;
          const ok = (m?.[0] === 1 ? 1 : 0) + right.length;
          return (
            <li key={i} className={cx('rounded-xl p-3.5 ring-1', m ? (m[0] === 1 ? 'ring-emerald-500/40' : 'ring-rose-500/40') : 'ring-slate-200 dark:ring-white/10')}>
              <div className="flex items-start gap-2">
                <span className="font-display text-sm font-bold text-slate-400">{i + 1}.</span>
                <div className="min-w-0 flex-1">
                  <p className="whitespace-pre-line text-[15px] font-semibold">{q.prompt}</p>
                  {q.type === 'abc' && (
                    <ul className="mt-1.5 space-y-0.5 text-sm">
                      {q.options.map((o, k) => (
                        <li key={k} className={cx(k === q.correctIndex ? 'font-semibold text-emerald-700 dark:text-emerald-300' : answers?.[i] === o ? 'text-rose-600 line-through dark:text-rose-300' : 'text-slate-500 dark:text-slate-400')}>
                          {String.fromCharCode(65 + k)}) {o}
                        </li>
                      ))}
                    </ul>
                  )}
                  {q.type !== 'abc' && <p className="mt-1 text-sm">Správně: <b className="text-emerald-700 dark:text-emerald-300">{correctAnswerText(q)}</b></p>}
                  {m && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                      <span className={cx('inline-flex items-center gap-1 font-semibold', m[0] === 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                        {m[0] === 1 ? <CircleCheck size={15} /> : <CircleX size={15} />}
                        ty: {m[0] === 1 ? `+${m[1]} bodů` : answers?.[i] === '(čas vypršel)' ? 'čas vypršel' : 'špatně'}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <Timer size={13} /> {m[2].toLocaleString('cs-CZ')} s
                      </span>
                    </div>
                  )}
                  {others.length > 0 && (
                    <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                      {all > 1 && <b className="mr-1.5 text-slate-600 dark:text-slate-300">správně {ok} z {all}</b>}
                      {right.length > 0 && <span className="mr-2">✅ {right.join(', ')}</span>}
                      {wrong.length > 0 && <span>❌ {wrong.join(', ')}</span>}
                    </div>
                  )}
                  {q.explanation && <p className="mt-1.5 whitespace-pre-line text-xs text-slate-500 dark:text-slate-400">{q.explanation}</p>}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </Modal>
  );
}
