import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  Bot,
  CalendarDays,
  ClipboardList,
  Cloud,
  Cpu,
  PenLine,
  Server,
  Dumbbell,
  GraduationCap,
  Home,
  Library,
  Menu,
  Moon,
  Network,
  Newspaper,
  Search,
  SquareTerminal,
  Shuffle,
  Terminal,
  Zap,
  Settings,
  Sun,
  TriangleAlert,
  X,
} from 'lucide-react';
import { useStore } from '../store';
import { cx } from './ui';
import { StorageWarning } from './StorageWarning';
import { levelFromXp, streak } from '../lib/progress';

interface NavItem {
  to: string;
  label: string;
  icon: typeof Home;
  end?: boolean;
  group?: string;
}

const NAV: NavItem[] = [
  { to: '/', label: 'Dnes', icon: Home, end: true },
  { to: '/hledat', label: 'Hledat', icon: Search },
  { to: '/knihy', label: 'Moje knihy', icon: Library, group: 'Čeština – literatura' },
  { to: '/trenink', label: 'Trénink', icon: Dumbbell },
  { to: '/simulace', label: 'Simulace maturity', icon: GraduationCap },
  { to: '/pojmy', label: 'Literární pojmy', icon: BookOpen },
  { to: '/neumelecky', label: 'Neumělecký text', icon: Newspaper },
  { to: '/sloh', label: 'Písemná práce', icon: PenLine },
  { to: '/site', label: 'Ústní témata', icon: Network, end: true, group: 'Počítačové sítě' },
  { to: '/site/losovani', label: 'Simulace ústní', icon: Shuffle },
  { to: '/site/prakticka', label: 'Praktická zkouška', icon: Terminal },
  { to: '/terminal', label: 'Terminál (Cisco, Linux)', icon: SquareTerminal },
  { to: '/site/trenink', label: 'Trénink sítí', icon: Dumbbell },
  { to: '/hw', label: 'Okruhy a převody', icon: Cpu, end: true, group: 'Technické vybavení PC' },
  { to: '/hw/test', label: 'Cvičný test', icon: ClipboardList },
  { to: '/cloud', label: 'Okruhy', icon: Cloud, end: true, group: 'Programové vybavení cloudu' },
  { to: '/cloud/prakticka', label: 'Praktická zkouška', icon: Server },
  { to: '/dril', label: 'Rychlostní dril', icon: Zap, group: 'Všechny předměty' },
  { to: '/doucit', label: 'Musím se doučit', icon: TriangleAlert },
  { to: '/pokrok', label: 'Můj pokrok', icon: BarChart3 },
  { to: '/plan', label: 'Studijní plán', icon: CalendarDays },
  { to: '/ai', label: 'AI učitel', icon: Bot },
  { to: '/nastaveni', label: 'Nastavení', icon: Settings },
];

const byPath = (to: string) => NAV.find((n) => n.to === to)!;
const MOBILE: NavItem[] = [byPath('/'), byPath('/knihy'), { ...byPath('/site'), label: 'Sítě', end: false }, byPath('/pokrok')];

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

  const navList = (
    <nav className="flex flex-col gap-0.5">
      {NAV.map((n) => [
        n.group && (
          <div key={`g-${n.group}`} className="mt-4 px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {n.group}
          </div>
        ),
        <NavLink
          key={n.to}
          to={n.to}
          end={n.end}
          className={({ isActive }) =>
            cx(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition',
              isActive
                ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white',
            )
          }
        >
          <n.icon size={19} />
          <span className="flex-1">{n.label}</span>
          {n.to === '/doucit' && unknownCount > 0 && (
            <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-bold text-white">{unknownCount}</span>
          )}
        </NavLink>,
      ])}
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
                end={n.end}
                className={({ isActive }) =>
                  cx('flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium', isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400')
                }
              >
                <n.icon size={22} />
                {n.label === 'Moje knihy' ? 'Knihy' : n.label === 'Můj pokrok' ? 'Pokrok' : n.label}
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
