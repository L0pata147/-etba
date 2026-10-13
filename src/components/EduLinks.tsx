import { ExternalLink, PlayCircle, Search } from 'lucide-react';
import { eduSearchUrl, type EduLink } from '../data/ctedu';
import { Card } from './ui';

/** Odkazy na výuková videa (ČT edu, YouTube…) – otevřou se v prohlížeči */
export function EduLinks({ links, search, title = 'Videa' }: { links: EduLink[]; search: string; title?: string }) {
  const unique = links.filter((l, i) => links.findIndex((x) => x.url === l.url) === i);
  const ct = unique.filter((l) => l.source === 'ČT edu');
  const other = unique.filter((l) => l.source !== 'ČT edu');
  return (
    <Card className="p-5">
      <h2 className="mb-3 flex items-center gap-2.5 text-lg font-bold">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
          <PlayCircle size={17} />
        </span>
        {title}
      </h2>
      <div className="space-y-4">
        <div>
          <div className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">ČT edu – Česká televize</div>
          <ul className="space-y-1.5">
            {ct.map((l) => (
              <LinkRow key={l.url} l={l} />
            ))}
            <li>
              <a href={eduSearchUrl(search)} target="_blank" rel="noreferrer" className="inline-flex items-start gap-2 text-sm text-slate-500 hover:underline dark:text-slate-400">
                <Search size={14} className="mt-0.5 shrink-0" />
                {ct.length ? 'Další videa' : 'Hledat'} „{search}“ na ČT edu
              </a>
            </li>
          </ul>
        </div>
        {other.length > 0 && (
          <div>
            <div className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Další zdroje</div>
            <ul className="space-y-1.5">
              {other.map((l) => (
                <LinkRow key={l.url} l={l} />
              ))}
            </ul>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Videa od jiných autorů než ČT – kvalita se liší, fakta si ověř v rozboru nebo u vyučujícího.</p>
          </div>
        )}
      </div>
    </Card>
  );
}

function LinkRow({ l }: { l: EduLink }) {
  return (
    <li>
      <a href={l.url} target="_blank" rel="noreferrer" className="inline-flex items-start gap-2 text-[15px] font-medium text-brand-700 hover:underline dark:text-brand-300">
        <ExternalLink size={15} className="mt-1 shrink-0" />
        <span>
          {l.title}
          {l.source && l.source !== 'ČT edu' && <span className="ml-1.5 text-xs font-normal text-slate-500 dark:text-slate-400">· {l.source}</span>}
        </span>
      </a>
    </li>
  );
}
