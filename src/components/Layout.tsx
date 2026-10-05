import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, GraduationCap, Home, Menu, Moon, Search, BarChart3, Sun, X } from 'lucide-react';
import { useStore } from '../store';
import { cx } from './ui';
import { StorageWarning } from './StorageWarning';
import { levelFromXp, streak } from '../lib/progress';
import { NAV_BOTTOM, NAV_SUBJECTS, NAV_TOP, activeNavItem, type NavItem } from './navData';

const MOBILE: NavItem[] = [
  { to: '/', label: 'Dnes', icon: Home },
  { to: '/zkousky', label: 'Zkoušky', icon: GraduationCap },
  { to: '/hledat', label: 'Hledat', icon: Search },
  { to: '/pokrok', label: 'Pokrok', icon: BarChart3 },
];

const OPEN_KEY = 'maturitni-trener:nav-open';

export function useTheme() {
  const { data, updateSettings } = useStore();
  const pref = data.settings.theme;
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const fn = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);
  const dark = pref === 'dark' || (pref === 'system' && systemDark);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#020617' : '#1e3a8a');
  }, [dark]);
  return { dark, toggle: () => updateSettings({ theme: dark ? 'light' : 'dark' }) };
}

export function Layout({ children }: { children: ReactNode }) {
  const { data, toasts, dismissToast } = useStore();
  const { dark, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const loc = useLocation();
  const lvl = levelFromXp(data.xp);
  const st = streak(data);
  const unknownCount = Object.keys(data.unknown).length;
  const inSession = loc.pathname.startsWith('/trenink/relace') || loc.pathname.startsWith('/simulace/') || (loc.pathname === '/terminal' && loc.search.includes('uloha='));

  useEffect(() => {
    setMenuOpen(false);
  }, [loc.pathname]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [loc.pathname]);

  const active = activeNavItem(loc.pathname, loc.search);
  const [open, setOpen] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(OPEN_KEY) ?? '[]') as string[]);
    } catch {
      return new Set();
    }
  });
  // předmět s aktivní stránkou je vždy rozbalený
  useEffect(() => {
    const subj = active?.subject;
    if (subj && !open.has(subj)) setOpen((o) => new Set(o).add(subj));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.subject]);
  const toggleSubject = (id: string) =>
    setOpen((o) => {
      const n = new Set(o);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      try {
        localStorage.setItem(OPEN_KEY, JSON.stringify([...n]));
      } catch {
        /* nevadí */
      }
      return n;
    });

  const link = (n: NavItem, small = false) => {
    const isActive = active?.to === n.to;
    return (
      <Link
        key={n.to}
        to={n.to}
        aria-current={isActive ? 'page' : undefined}
        className={cx(
          'flex items-center gap-3 rounded-xl px-3 font-medium transition',
          small ? 'py-1.5 text-[14px]' : 'py-2.5 text-[15px]',
          isActive
            ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white',
        )}
      >
        <n.icon size={small ? 16 : 19} />
        <span className="flex-1">{n.label}</span>
        {n.to === '/doucit' && unknownCount > 0 && <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-bold text-white">{unknownCount}</span>}
      </Link>
    );
  };

  const navList = (
    <nav className="flex flex-col gap-0.5" aria-label="Hlavní menu">
      {NAV_TOP.map((n) => link(n))}
      <div className="mt-4 px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Předměty a zkoušky</div>
      {NAV_SUBJECTS.map((subj) => {
        const isOpen = open.has(subj.id);
        const hasActive = active?.subject === subj.id;
        return (
          <div key={subj.id}>
            <button
              onClick={() => toggleSubject(subj.id)}
              aria-expanded={isOpen}
              className={cx(
                'flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[15px] font-semibold transition hover:bg-slate-100 dark:hover:bg-slate-800',
                hasActive ? 'text-brand-700 dark:text-brand-300' : 'text-slate-700 dark:text-slate-200',
              )}
            >
              <span className="w-5 text-center">{subj.emoji}</span>
              <span className="flex-1">{subj.label}</span>
              <ChevronDown size={16} className={cx('shrink-0 text-slate-400 transition', isOpen && 'rotate-180')} />
            </button>
            {isOpen && (
              <div className="mb-1 ml-4 border-l border-slate-200 pl-2 dark:border-slate-800">
                {subj.exams.map((ex) => (
                  <div key={ex.id} className="mt-1">
                    <div className="px-3 pb-0.5 pt-1.5">
                      <div className="text-[12px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{ex.label}</div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">{ex.format}</div>
                    </div>
                    {ex.items.map((n) => link(n, true))}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <div className="mt-4 px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Moje příprava</div>
      {NAV_BOTTOM.map((n) => link(n))}
    </nav>
  );

  return (
    <div className="min-h-screen">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white/80 px-3 py-5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 lg:flex">
        <Brand />
        <div className="mt-6 flex-1 overflow-y-auto">{navList}</div>
        <div className="mt-4 rounded-xl bg-slate-100 p-3 text-sm dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Úroveň {lvl.level}</span>
            <span className="text-slate-500 dark:text-slate-400">🔥 {st} {st === 1 ? 'den' : st >= 2 && st <= 4 ? 'dny' : 'dní'}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.round(lvl.progress * 100)}%` }} />
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {data.xp} / {lvl.next} XP
          </div>
        </div>
        <button onClick={toggle} className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
          {dark ? <Sun size={18} /> : <Moon size={18} />}
          {dark ? 'Světlý režim' : 'Tmavý režim'}
        </button>
      </aside>

      {/* Top bar (mobile) */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/85 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85 lg:hidden">
        <Brand compact />
        <div className="flex items-center gap-1">
          <span className="mr-1 text-sm font-semibold text-slate-600 dark:text-slate-300">🔥 {st}</span>
          <NavLink to="/hledat" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" aria-label="Hledat">
            <Search size={20} />
          </NavLink>
          <button onClick={toggle} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" aria-label="Přepnout motiv">
            {dark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={() => setMenuOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" aria-label="Menu">
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm lg:hidden" onClick={() => setMenuOpen(false)}>
          <div className="animate-fade-up absolute inset-y-0 right-0 w-[82%] max-w-xs overflow-y-auto bg-white p-4 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <Brand compact />
              <button onClick={() => setMenuOpen(false)} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Zavřít menu">
                <X size={22} />
              </button>
            </div>
            {navList}
          </div>
        </div>
      )}

      <main className={cx('mx-auto max-w-6xl px-4 pt-5 sm:px-6 lg:ml-64 lg:px-10 lg:pt-8', inSession ? 'pb-10' : 'pb-28 lg:pb-12')}>
        <StorageWarning />
        <div key={loc.pathname} className="animate-fade-up">
          {children}
        </div>
      </main>

      {/* Bottom nav (mobile) */}
      {!inSession && (
        <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 lg:hidden">
          <div className="grid grid-cols-5">
            {MOBILE.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === "/"}
                className={({ isActive }) =>
                  cx(
                    'flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium',
                    isActive || (n.to === '/zkousky' && !!active?.subject) ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400',
                  )
                }
              >
                <n.icon size={22} />
                {n.label}
              </NavLink>
            ))}
            <button onClick={() => setMenuOpen(true)} className="flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <Menu size={22} />
              Více
            </button>
          </div>
        </nav>
      )}

      {/* Toasts */}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <button
            key={t.id}
            onClick={() => dismissToast(t.id)}
            className={cx(
              'animate-fade-up pointer-events-auto max-w-md rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg',
              t.tone === 'success' ? 'bg-emerald-600' : t.tone === 'error' ? 'bg-rose-600' : 'bg-slate-800',
            )}
          >
            {t.text}
          </button>
        ))}
      </div>
    </div>
  );
}

function Brand({ compact }: { compact?: boolean }) {
  return (
    <NavLink to="/" className="flex items-center gap-2.5 px-2">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-800 text-white shadow-md shadow-brand-700/30">
        <GraduationCap size={20} />
      </div>
      <div className="leading-tight">
        <div className="font-extrabold tracking-tight">Maturitní trenér</div>
        {!compact && <div className="text-xs text-slate-500 dark:text-slate-400">Maturita IT – 4 předměty</div>}
      </div>
    </NavLink>
  );
}
