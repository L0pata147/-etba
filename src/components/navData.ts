import {
  BarChart3,
  BookOpen,
  Bot,
  Cable,
  Calculator,
  Printer,
  CalendarDays,
  CircleUserRound,
  ClipboardList,
  Cloud,
  Cpu,
  Dices,
  Dumbbell,
  FileText,
  GraduationCap,
  HelpCircle,
  Home,
  Library,
  ListOrdered,
  MousePointerClick,
  Network,
  Newspaper,
  PenLine,
  Search,
  Server,
  Settings,
  Shuffle,
  SpellCheck,
  Swords,
  SquareTerminal,
  Terminal,
  TriangleAlert,
  UserRound,
  Users,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { SubjectId } from '../types';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export interface NavExam {
  id: string;
  label: string;
  /** Forma zkoušky (krátce) */
  format: string;
  items: NavItem[];
}

export interface NavSubject {
  id: SubjectId;
  label: string;
  emoji: string;
  exams: NavExam[];
}

export const NAV_TOP: NavItem[] = [
  { to: '/', label: 'Dnes', icon: Home },
  { to: '/zkousky', label: 'Všechny zkoušky', icon: GraduationCap },
  { to: '/hledat', label: 'Hledat', icon: Search },
  { to: '/otazka-dne', label: 'Otázka dne', icon: HelpCircle },
];

export const NAV_SUBJECTS: NavSubject[] = [
  {
    id: 'cjl',
    label: 'Čeština',
    emoji: '📚',
    exams: [
      {
        id: 'cjl-ustni',
        label: 'Ústní zkouška',
        format: 'literatura a neumělecký text',
        items: [
          { to: '/knihy', label: 'Moje knihy', icon: Library },
          { to: '/autori', label: 'Autoři', icon: UserRound },
          { to: '/trenink', label: 'Trénink', icon: Dumbbell },
          { to: '/simulace', label: 'Simulace zkoušení', icon: GraduationCap },
          { to: '/pojmy', label: 'Literární pojmy', icon: BookOpen },
          { to: '/neumelecky', label: 'Neumělecký text', icon: Newspaper },
          { to: '/hry', label: 'Hry na opakování', icon: Dices },
          { to: '/tahak?zk=cjl-ustni', label: 'Taháky k tisku', icon: Printer },
        ],
      },
      {
        id: 'cjl-pisemna',
        label: 'Písemná práce',
        format: '120 min, min. 250 slov',
        items: [
          { to: '/sloh', label: 'Psát slohovku', icon: PenLine },
          { to: '/sloh?tab=prace', label: 'Moje práce', icon: FileText },
          { to: '/sloh?tab=pravopis', label: 'Pravopis', icon: SpellCheck },
          { to: '/sloh?tab=utvary', label: 'Slohové útvary', icon: BookOpen },
          { to: '/tahak?zk=cjl-pisemna', label: 'Taháky k tisku', icon: Printer },
        ],
      },
    ],
  },
  {
    id: 'site',
    label: 'Počítačové sítě',
    emoji: '🌐',
    exams: [
      {
        id: 'site-ustni',
        label: 'Ústní zkouška',
        format: '20 témat, 15 + 15 min',
        items: [
          { to: '/site', label: 'Témata', icon: Network },
          { to: '/site/losovani', label: 'Simulace ústní', icon: Shuffle },
          { to: '/site/trenink', label: 'Trénink', icon: Dumbbell },
          { to: '/tahak?zk=site-ustni', label: 'Taháky k tisku', icon: Printer },
        ],
      },
      {
        id: 'site-prakticka',
        label: 'Praktická zkouška',
        format: 'Packet Tracer → Debian 13 / Windows Server',
        items: [
          { to: '/site/prakticka', label: 'Zadání nanečisto', icon: Terminal },
          { to: '/terminal', label: 'Terminál (Cisco, Linux)', icon: SquareTerminal },
          { to: '/site/prakticka?tab=prikazy', label: 'Příkazy', icon: Terminal },
          { to: '/site/prakticka?tab=postupy', label: 'Postupy', icon: ListOrdered },
          { to: '/site/prakticka?tab=kabelaz', label: 'Stavebnice topologie', icon: Cable },
          { to: '/site/prakticka?tab=klikani', label: 'Klikací trénink (Windows)', icon: MousePointerClick },
          { to: '/site/prakticka?tab=chyby', label: 'Najdi chybu', icon: Wrench },
          { to: '/site/prakticka?tab=vypocty', label: 'Výpočty (adresace)', icon: Calculator },
          { to: '/dril?predmet=site', label: 'Dril na čas', icon: Zap },
          { to: '/tahak?zk=site-prakticka', label: 'Taháky k tisku', icon: Printer },
        ],
      },
    ],
  },
  {
    id: 'hw',
    label: 'Technické vybavení PC',
    emoji: '🖥️',
    exams: [
      {
        id: 'hw-test',
        label: 'Písemný test',
        format: 'Moodle, 60 min',
        items: [
          { to: '/hw/test', label: 'Cvičný test', icon: ClipboardList },
          { to: '/hw', label: 'Okruhy a převody', icon: Cpu },
          { to: '/hw/trenink', label: 'Trénink', icon: Dumbbell },
          { to: '/dril?predmet=hw', label: 'Dril na čas', icon: Zap },
          { to: '/tahak?zk=hw-test', label: 'Taháky k tisku', icon: Printer },
        ],
      },
    ],
  },
  {
    id: 'cloud',
    label: 'Programové vybavení cloudu',
    emoji: '☁️',
    exams: [
      {
        id: 'cloud-prakticka',
        label: 'Praktická zkouška',
        format: 'virtualizace a kontejnery',
        items: [
          { to: '/cloud/prakticka', label: 'Zadání nanečisto', icon: Server },
          { to: '/cloud', label: 'Okruhy', icon: Cloud },
          { to: '/cloud/prakticka?tab=prikazy', label: 'Příkazy', icon: Terminal },
          { to: '/cloud/prakticka?tab=postupy', label: 'Postupy', icon: ListOrdered },
          { to: '/cloud/prakticka?tab=chyby', label: 'Najdi chybu', icon: Wrench },
          { to: '/terminal?os=linux', label: 'Terminál (NFS, GlusterFS)', icon: SquareTerminal },
          { to: '/cloud/trenink', label: 'Trénink', icon: Dumbbell },
          { to: '/tahak?zk=cloud-prakticka', label: 'Taháky k tisku', icon: Printer },
        ],
      },
    ],
  },
];

export const NAV_BOTTOM: NavItem[] = [
  { to: '/doucit', label: 'Musím se doučit', icon: TriangleAlert },
  { to: '/pokrok', label: 'Můj pokrok', icon: BarChart3 },
  { to: '/kamaradi', label: 'Kamarádi', icon: Users },
  { to: '/souteze', label: 'Soutěže', icon: Swords },
  { to: '/profil', label: 'Můj profil', icon: CircleUserRound },
  { to: '/plan', label: 'Studijní plán', icon: CalendarDays },
  { to: '/tahak', label: 'Taháky k tisku', icon: Printer },
  { to: '/ai', label: 'AI učitel', icon: Bot },
  { to: '/nastaveni', label: 'Nastavení', icon: Settings },
];

const ALL_ITEMS: { item: NavItem; subject?: SubjectId }[] = [
  ...NAV_TOP.map((item) => ({ item })),
  ...NAV_SUBJECTS.flatMap((s) => s.exams.flatMap((e) => e.items.map((item) => ({ item, subject: s.id })))),
  ...NAV_BOTTOM.map((item) => ({ item })),
];

/** Nejlépe odpovídající položka menu pro aktuální adresu (cesta + parametry) */
export function activeNavItem(pathname: string, search: string): { to: string; subject?: SubjectId } | null {
  const params = new URLSearchParams(search);
  // detail tématu patří k „Témata/Okruhy“ svého předmětu
  const topic = pathname.match(/^\/tema\/(site|hw|cloud)-/);
  if (topic) return { to: `/${topic[1]}`, subject: topic[1] as SubjectId };
  let best: { to: string; subject?: SubjectId; score: number } | null = null;
  for (const { item, subject } of ALL_ITEMS) {
    const [path, q] = item.to.split('?');
    const exact = pathname === path;
    const prefix = path !== '/' && pathname.startsWith(path + '/');
    if (!exact && !prefix) continue;
    let score = exact ? 10 : 5;
    if (q) {
      const want = new URLSearchParams(q);
      const ok = [...want.entries()].every(([k, v]) => params.get(k) === v);
      if (!ok) continue;
      score += 3;
    } else if (params.get('tab')) score -= 1;
    if (!best || score > best.score) best = { to: item.to, subject, score };
  }
  return best ? { to: best.to, subject: best.subject } : null;
}
