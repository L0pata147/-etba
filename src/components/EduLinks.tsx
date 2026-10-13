import { ExternalLink, PlayCircle, Search } from 'lucide-react';
import { eduSearchUrl, type EduLink } from '../data/ctedu';
import { Card } from './ui';

/** Odkazy na výuková videa ČT edu (otevřou se v prohlížeči) */
export function EduLinks({ links, search, title = 'Videa na ČT edu' }: { links: EduLink[]; search: string; title?: string }) {
  return (
    <Card className="p-5">
      <h2 className="mb-1 flex items-center gap-2.5 text-lg font-bold">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
          <PlayCircle size={17} />
        </span>
        {title}
      </h2>
      <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">Výuková videa České televize – otevřou se na edu.ceskatelevize.cz.</p>
      <ul className="space-y-1.5">
        {links.map((l) => (
          <li key={l.url}>
            <a href={l.url} target="_blank" rel="noreferrer" className="inline-flex items-start gap-2 text-[15px] font-medium text-brand-700 hover:underline dark:text-brand-300">
              <ExternalLink size={15} className="mt-1 shrink-0" />
              {l.title}
            </a>
          </li>
        ))}
        <li>
          <a href={eduSearchUrl(search)} target="_blank" rel="noreferrer" className="inline-flex items-start gap-2 text-sm text-slate-500 hover:underline dark:text-slate-400">
            <Search size={14} className="mt-0.5 shrink-0" />
            {links.length ? 'Další videa' : 'Hledat'} „{search}“ na ČT edu
          </a>
        </li>
      </ul>
    </Card>
  );
}
