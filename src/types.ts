// ===== Osnova ústní maturity =====

export type AreaId =
  | 'context'
  | 'theme'
  | 'chronotope'
  | 'composition'
  | 'genre'
  | 'narrator'
  | 'characters'
  | 'narrative'
  | 'speech'
  | 'verse'
  | 'language'
  | 'tropes'
  | 'authorContext'
  | 'litContext'
  | 'basics'
  | 'terms'
  | 'nonart1'
  | 'nonart2'
  // IT předměty
  | 'it-pojmy'
  | 'it-teorie'
  | 'it-ustni'
  | 'it-prikazy'
  | 'it-postupy'
  | 'it-vypocty';

export type SectionId =
  | 'art1'
  | 'art2'
  | 'art3'
  | 'lhk'
  | 'basics'
  | 'terms'
  | 'nonart1'
  | 'nonart2'
  | 'it-teorie'
  | 'it-prakticke'
  | 'it-vypocty';

/** Maturitní předměty */
export type SubjectId = 'cjl' | 'site' | 'hw' | 'cloud';

export type Platform = 'cisco' | 'linux' | 'windows' | 'docker' | 'hyperv' | 'proxmox';

/** Téma ústní zkoušky (IT předměty) */
export interface Topic {
  id: string;
  subject: SubjectId;
  number: number;
  title: string;
  summary: string;
  /** Doporučená osnova odpovědi */
  outline: { heading: string; points: string[] }[];
  terms: { term: string; def: string }[];
  quiz: { q: string; a: string; wrong: string[]; why?: string }[];
  deep: { q: string; answer: string; points: KeyPoint[] }[];
}

/** Příkaz pro trenažér (Cisco IOS, Linux, Windows Server) */
export interface CommandItem {
  id: string;
  platform: Platform;
  group: string;
  task: string;
  command: string;
  /** Další přijatelné zápisy (zkratky, varianty) */
  accepted?: string[];
  note?: string;
}

/** Postup krok za krokem k praktické zkoušce */
export interface Procedure {
  id: string;
  platform: Platform;
  title: string;
  goal: string;
  steps: { text: string; cmd?: string }[];
}

export type CategoryId = 'do18' | 'st19' | 'svet20' | 'cz20';

export type LiteraryKind = 'epika' | 'lyrika' | 'drama' | 'lyricko-epika';

export interface Character {
  name: string;
  description: string;
}

export interface Scene {
  /** Popis výňatku / scény */
  scene: string;
  /** Kam scéna v díle patří (co jí předchází a co následuje) */
  context: string;
}

export interface DeepQuestion {
  q: string;
  area: AreaId;
  answer: string;
  /** Klíčové body – každý bod je seznam klíčových slov (stačí zmínit některé) */
  points: { label: string; keywords: string[] }[];
}

export interface Book {
  id: string;
  title: string;
  author: string;
  authorLife: string;
  year: string;
  category: CategoryId;
  kind: LiteraryKind;
  genre: string;
  period: string;
  movement: string;
  /** Krátké označení vypravěče pro testy (např. „ich-forma“) */
  narratorShort: string;
  /** Stručné prostředí pro testy */
  settingShort: string;
  theme: string;
  motifs: string[];
  mainIdea: string;
  mainCharacters: Character[];
  sideCharacters: Character[];
  plot: string;
  /** Klíčové dějové události ve správném pořadí */
  plotEvents: string[];
  setting: string;
  time: string;
  composition: string;
  narrator: string;
  narrativeModes: string;
  speechTypes: string;
  verse: string;
  language: string;
  tropes: string;
  authorContext: string;
  historicalContext: string;
  otherWorks: string[];
  interpretation: string;
  examTips: string;
  /** Nejdůležitější body – „Naučit se za 10 minut“ */
  quick: string[];
  /** Nápovědy pro identifikaci díla (bez názvu a autora) */
  clues: string[];
  scenes: Scene[];
  deepQuestions: DeepQuestion[];
  notes: string;
  favorite: boolean;
  learned: boolean;
  source: 'database' | 'custom';
  templateId?: string;
  createdAt: number;
  updatedAt: number;
}

// ===== Literární pojmy =====

export type TermCategory =
  | 'tropy'
  | 'figury'
  | 'jazyk'
  | 'vypravec'
  | 'promluvy'
  | 'kompozice'
  | 'druhy'
  | 'zanry'
  | 'vers'
  | 'sloh';

export interface Term {
  id: string;
  name: string;
  category: TermCategory;
  short: string;
  detail: string;
  example: string;
  bookExample?: string;
}

// ===== Neumělecký text =====

export interface NonArtText {
  id: string;
  title: string;
  excerpts: { label: string; text: string }[];
  relation?: string;
  mainIdea: string;
  communication: string;
  factsVsOpinions: { statement: string; isFact: boolean; why: string }[];
  essential: string;
  interpretations: string;
  style: string;
  procedure: string;
  form: string;
  composition: string;
  language: string;
}

// ===== Otázky =====

export type QuestionType =
  | 'flashcard'
  | 'abc'
  | 'truefalse'
  | 'match'
  | 'fill'
  | 'order'
  | 'identifyWork'
  | 'identifyAuthor'
  | 'identifyTerm'
  | 'open'
  | 'speech';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'maturita';

export interface KeyPoint {
  label: string;
  keywords: string[];
  /** Kolik klíčových slov musí odpověď obsahovat (výchozí 1) */
  minHits?: number;
}

interface QuestionBase {
  /** Stabilní ID (pro opakování) */
  id: string;
  /** Klíč faktu – stejný fakt v různých typech otázek */
  factKey: string;
  type: QuestionType;
  bookId: string;
  area: AreaId;
  prompt: string;
  explanation: string;
  difficulty: Difficulty;
  /** Otázka se týká více knih (např. přiřazování) */
  relatedBookIds?: string[];
  /** Text, který se zobrazí nad otázkou (neumělecký text, výňatek) */
  passage?: { label: string; text: string }[];
}

export interface FlashcardQuestion extends QuestionBase {
  type: 'flashcard';
  answer: string;
}

export interface AbcQuestion extends QuestionBase {
  type: 'abc';
  options: string[];
  correctIndex: number;
  optionNotes?: string[];
}

export interface TrueFalseQuestion extends QuestionBase {
  type: 'truefalse';
  isTrue: boolean;
}

export interface MatchQuestion extends QuestionBase {
  type: 'match';
  leftLabel: string;
  rightLabel: string;
  pairs: { left: string; right: string }[];
}

export interface FillQuestion extends QuestionBase {
  type: 'fill' | 'identifyWork' | 'identifyAuthor' | 'identifyTerm';
  accepted: string[];
  answer: string;
  /** Přesné porovnání (adresy, příkazy) – bez tolerance překlepů */
  exact?: boolean;
  /** Text nad polem pro odpověď (např. „Napiš příkaz“) */
  inputLabel?: string;
  /** Povinné části odpovědi (dlouhé příkazy – stačí, když odpověď obsahuje všechny) */
  required?: string[];
  /** Odpověď je příkaz (kontrola tolerantní k mezerám, velikosti písmen, sudo) */
  command?: boolean;
}

export interface OrderQuestion extends QuestionBase {
  type: 'order';
  items: string[];
}

export interface OpenQuestion extends QuestionBase {
  type: 'open' | 'speech';
  modelAnswer: string;
  points: KeyPoint[];
}

export type Question =
  | FlashcardQuestion
  | AbcQuestion
  | TrueFalseQuestion
  | MatchQuestion
  | FillQuestion
  | OrderQuestion
  | OpenQuestion;

/** Výsledek jedné odpovědi: score 0–1 */
export interface AnswerResult {
  questionId: string;
  score: number;
  userAnswer: string;
  /** Uživatel kliknul „Neumím“ */
  dontKnow?: boolean;
  /** Pro flashcards: umím / nejsem si jistý / neumím */
  confidence?: 'good' | 'hard' | 'again';
  seconds: number;
}

// ===== Pokrok =====

export interface SrsItem {
  due: number;
  interval: number;
  ease: number;
  reps: number;
  lapses: number;
  last: number;
  seen: number;
}

export interface MasteryItem {
  /** Vážený počet správných odpovědí (s útlumem) */
  c: number;
  /** Vážený počet pokusů (s útlumem) */
  n: number;
  attempts: number;
  correct: number;
  last: number;
}

export interface SessionRecord {
  id: string;
  date: number;
  mode: string;
  title: string;
  difficulty: Difficulty;
  total: number;
  score: number;
  seconds: number;
  bookIds: string[];
  sections: Partial<Record<SectionId, { score: number; total: number }>>;
}

export interface DayActivity {
  questions: number;
  correct: number;
  seconds: number;
}

export interface UnknownItem {
  question: Question;
  addedAt: number;
  correctStreak: number;
}

export interface StudyWeek {
  index: number;
  start: string;
  bookIds: string[];
  /** Témata IT předmětů v tomto týdnu */
  topicIds?: string[];
  extras: string[];
  done: boolean;
}

export interface StudyPlan {
  createdAt: number;
  weeks: StudyWeek[];
}

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  examDate: string;
  dailyMinutes: number;
  onboarded: boolean;
  aiApiKey: string;
  aiModel: string;
  speechEnabled: boolean;
  /** Denní připomínka v Android aplikaci */
  reminderEnabled: boolean;
  reminderTime: string;
}

export interface AppData {
  version: number;
  books: Book[];
  srs: Record<string, SrsItem>;
  mastery: Record<string, MasteryItem>;
  sessions: SessionRecord[];
  activity: Record<string, DayActivity>;
  unknown: Record<string, UnknownItem>;
  xp: number;
  badges: Record<string, number>;
  plan: StudyPlan | null;
  settings: Settings;
  /** Slohové práce (písemná práce z češtiny) */
  writings: Writing[];
}

/** Slohová práce */
export interface Writing {
  id: string;
  createdAt: number;
  updatedAt: number;
  /** Zadání (text) */
  prompt: string;
  /** Slohový útvar */
  form: string;
  title: string;
  text: string;
  /** Čas psaní v sekundách */
  seconds: number;
  finished: boolean;
  /** Sebehodnocení 0–5 podle kritérií */
  selfScores?: Record<string, number>;
  aiFeedback?: string;
}
