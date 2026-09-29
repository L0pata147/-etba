import { useId, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Save, Trash2 } from 'lucide-react';
import type { Book, CategoryId, Character, LiteraryKind, Scene } from '../types';
import { useStore } from '../store';
import { BOOK_DATABASE, BOOK_TEMPLATES, emptyBook } from '../data/books';
import { CATEGORIES, CATEGORY_ORDER, KINDS } from '../data/osnova';
import { Button, Card, EmptyState, PageHeader, cx } from '../components/ui';

const lines = (s: string) =>
  s
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);

export function BookEdit() {
  const { id } = useParams();
  const { data, addBook, updateBook, toast } = useStore();
  const navigate = useNavigate();
  const existing = id ? data.books.find((b) => b.id === id) : undefined;
  const isNew = !id;
  const [book, setBook] = useState<Book>(() => (existing ? structuredClone(existing) : emptyBook()));
  const [template, setTemplate] = useState<string>('');
  const [errors, setErrors] = useState<string[]>([]);

  if (id && !existing) return <EmptyState icon="❓" title="Kniha nenalezena" action={<Button to="/knihy">Zpět na knihy</Button>} />;

  const set = <K extends keyof Book>(k: K, v: Book[K]) => setBook((b) => ({ ...b, [k]: v }));

  const applyTemplate = (tid: string) => {
    setTemplate(tid);
    const tpl = BOOK_TEMPLATES.find((t) => t.id === tid);
    if (tpl) {
      setBook((b) => ({ ...b, ...tpl.patch, templateId: tid }));
      return;
    }
    const seed = BOOK_DATABASE.find((s) => s.id === tid);
    if (seed) {
      setBook((b) => ({ ...b, ...structuredClone(seed), id: b.id, source: 'custom', templateId: seed.id, notes: b.notes }));
      toast('Formulář byl předvyplněn z databáze – uprav, co potřebuješ.', 'info');
    }
  };

  const save = () => {
    const errs: string[] = [];
    if (!book.title.trim()) errs.push('Vyplň název díla.');
    if (!book.author.trim()) errs.push('Vyplň autora (případně „Autor neznámý“).');
    setErrors(errs);
    if (errs.length) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const clean: Book = {
      ...book,
      title: book.title.trim(),
      author: book.author.trim(),
      mainCharacters: book.mainCharacters.filter((c) => c.name.trim()),
      sideCharacters: book.sideCharacters.filter((c) => c.name.trim()),
      scenes: book.scenes.filter((s) => s.scene.trim()),
      updatedAt: Date.now(),
    };
    if (isNew) {
      let newId = clean.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      if (!newId || data.books.some((b) => b.id === newId)) newId = `${newId || 'kniha'}-${Date.now().toString(36)}`;
      addBook({ ...clean, id: newId, createdAt: Date.now() });
      toast(`Kniha ${clean.title} byla přidána.`, 'success');
      navigate(`/knihy/${newId}`);
    } else {
      updateBook(clean.id, clean);
      toast('Změny uloženy.', 'success');
      navigate(`/knihy/${clean.id}`);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={isNew ? 'Přidat knihu' : `Upravit: ${existing?.title}`}
        sub="Vyplň, co víš – prázdná pole můžeš doplnit později. Z vyplněných údajů se automaticky tvoří otázky."
        action={
          <Button icon={<Save size={18} />} onClick={save}>
            Uložit
          </Button>
        }
      />

      {errors.length > 0 && (
        <div className="mb-4 rounded-xl border border-rose-300 bg-rose-50 p-4 text-rose-800 dark:border-rose-800 dark:bg-rose-500/10 dark:text-rose-300">
          {errors.map((e) => (
            <div key={e}>• {e}</div>
          ))}
        </div>
      )}

      {isNew && (
        <Card className="mb-5 p-5">
          <h2 className="mb-1 font-bold">Začít ze šablony</h2>
          <p className="mb-3 text-sm text-slate-500">Šablona předvyplní strukturu podle druhu díla, nebo zvol známé dílo z databáze.</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {BOOK_TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => applyTemplate(t.id)}
                className={cx(
                  'rounded-xl border-2 p-3 text-left transition',
                  template === t.id ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'border-slate-200 hover:border-brand-300 dark:border-slate-700',
                )}
              >
                <div className="font-semibold">{t.label}</div>
                <div className="text-xs text-slate-500">{t.description}</div>
              </button>
            ))}
          </div>
          <div className="mt-3">
            <label className="label" htmlFor="db-template">
              …nebo předvyplnit z databáze
            </label>
            <select id="db-template" className="input" value={BOOK_DATABASE.some((s) => s.id === template) ? template : ''} onChange={(e) => e.target.value && applyTemplate(e.target.value)}>
              <option value="">— vyber dílo —</option>
              {BOOK_DATABASE.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} – {s.author}
                </option>
              ))}
            </select>
          </div>
        </Card>
      )}

      <div className="space-y-5">
        <Section title="Základní informace">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Název *" value={book.title} onChange={(v) => set('title', v)} />
            <Input label="Autor *" value={book.author} onChange={(v) => set('author', v)} />
            <Input label="Život autora" placeholder="např. 1883–1924" value={book.authorLife} onChange={(v) => set('authorLife', v)} />
            <Input label="Rok vydání / vzniku" value={book.year} onChange={(v) => set('year', v)} />
            <div>
              <label className="label" htmlFor="book-category">
                Kategorie maturitního seznamu
              </label>
              <select id="book-category" className="input" value={book.category} onChange={(e) => set('category', e.target.value as CategoryId)}>
                {CATEGORY_ORDER.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORIES[c].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="book-kind">
                Literární druh
              </label>
              <select id="book-kind" className="input" value={book.kind} onChange={(e) => set('kind', e.target.value as LiteraryKind)}>
                {Object.entries(KINDS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <Input label="Žánr" value={book.genre} onChange={(v) => set('genre', v)} />
            <Input label="Literární období" value={book.period} onChange={(v) => set('period', v)} />
            <Input label="Literární směr" value={book.movement} onChange={(v) => set('movement', v)} />
          </div>
        </Section>

        <Section title="Téma, motivy, myšlenka">
          <Area label="Téma" value={book.theme} onChange={(v) => set('theme', v)} />
          <Area label="Motivy (každý na nový řádek)" value={book.motifs.join('\n')} onChange={(v) => set('motifs', lines(v))} rows={4} />
          <Area label="Hlavní myšlenka" value={book.mainIdea} onChange={(v) => set('mainIdea', v)} />
          <Area label="Interpretace" value={book.interpretation} onChange={(v) => set('interpretation', v)} />
        </Section>

        <Section title="Postavy">
          <Characters label="Hlavní postavy" list={book.mainCharacters} onChange={(v) => set('mainCharacters', v)} />
          <Characters label="Vedlejší postavy" list={book.sideCharacters} onChange={(v) => set('sideCharacters', v)} />
        </Section>

        <Section title="Děj a časoprostor">
          <Area label="Děj" value={book.plot} onChange={(v) => set('plot', v)} rows={6} />
          <Area label="Klíčové události ve správném pořadí (každá na nový řádek – použije se pro seřazování)" value={book.plotEvents.join('\n')} onChange={(v) => set('plotEvents', lines(v))} rows={5} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Area label="Prostředí" value={book.setting} onChange={(v) => set('setting', v)} />
            <Area label="Čas" value={book.time} onChange={(v) => set('time', v)} />
          </div>
          <Input label="Prostředí stručně (pro testy)" value={book.settingShort} onChange={(v) => set('settingShort', v)} />
        </Section>

        <Section title="Kompozice, vypravěč, promluvy">
          <Area label="Kompozice" value={book.composition} onChange={(v) => set('composition', v)} />
          <Area label="Vypravěč / lyrický subjekt" value={book.narrator} onChange={(v) => set('narrator', v)} />
          <Input label="Vypravěč stručně (pro testy, např. „ich-forma“)" value={book.narratorShort} onChange={(v) => set('narratorShort', v)} />
          <Area label="Vyprávěcí způsoby" value={book.narrativeModes} onChange={(v) => set('narrativeModes', v)} />
          <Area label="Typy promluv" value={book.speechTypes} onChange={(v) => set('speechTypes', v)} />
          <Area label="Veršová výstavba (u prózy nech prázdné)" value={book.verse} onChange={(v) => set('verse', v)} />
        </Section>

        <Section title="Jazyk">
          <Area label="Jazykové prostředky" value={book.language} onChange={(v) => set('language', v)} />
          <Area label="Tropy a figury" value={book.tropes} onChange={(v) => set('tropes', v)} />
        </Section>

        <Section title="Kontext">
          <Area label="Kontext autora (tvorby)" value={book.authorContext} onChange={(v) => set('authorContext', v)} rows={4} />
          <Area label="Další díla autora (každé na nový řádek)" value={book.otherWorks.join('\n')} onChange={(v) => set('otherWorks', lines(v))} rows={3} />
          <Area label="Literárněhistorický kontext" value={book.historicalContext} onChange={(v) => set('historicalContext', v)} rows={4} />
        </Section>

        <Section title="K ústní maturitě">
          <Area label="Na co se zaměřit u zkoušky" value={book.examTips} onChange={(v) => set('examTips', v)} />
          <Area label="Naučit se za 10 minut – nejdůležitější body (každý na nový řádek)" value={book.quick.join('\n')} onChange={(v) => set('quick', lines(v))} rows={5} />
          <Area label="Nápovědy pro poznávání díla – bez názvu a autora (každá na nový řádek)" value={book.clues.join('\n')} onChange={(v) => set('clues', lines(v))} rows={3} />
          <Scenes list={book.scenes} onChange={(v) => set('scenes', v)} />
          <Area label="Vlastní poznámky" value={book.notes} onChange={(v) => set('notes', v)} rows={4} />
        </Section>

        <div className="flex justify-end gap-2 pb-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            Zrušit
          </Button>
          <Button icon={<Save size={18} />} onClick={save}>
            Uložit knihu
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="space-y-4 p-5">
      <h2 className="text-lg font-bold">{title}</h2>
      {children}
    </Card>
  );
}

function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const id = useId();
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <input id={id} className="input" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Area({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  const id = useId();
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <textarea id={id} className="input resize-y" rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Characters({ label, list, onChange }: { label: string; list: Character[]; onChange: (v: Character[]) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="space-y-2">
        {list.map((c, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-xl border border-slate-200 p-2 dark:border-slate-700 sm:flex-row">
            <input className="input sm:w-48" placeholder="Jméno" value={c.name} onChange={(e) => onChange(list.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
            <textarea className="input flex-1" rows={2} placeholder="Charakteristika" value={c.description} onChange={(e) => onChange(list.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} />
            <button className="self-end rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 sm:self-center" onClick={() => onChange(list.filter((_, j) => j !== i))} aria-label="Odebrat postavu">
              <Trash2 size={17} />
            </button>
          </div>
        ))}
        <Button size="sm" variant="secondary" icon={<Plus size={15} />} onClick={() => onChange([...list, { name: '', description: '' }])}>
          Přidat postavu
        </Button>
      </div>
    </div>
  );
}

function Scenes({ list, onChange }: { list: Scene[]; onChange: (v: Scene[]) => void }) {
  return (
    <div>
      <label className="label">Scény pro „zasazení výňatku do kontextu“</label>
      <div className="space-y-2">
        {list.map((s, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-xl border border-slate-200 p-2 dark:border-slate-700 sm:flex-row">
            <textarea className="input flex-1" rows={2} placeholder="Popis scény / výňatku" value={s.scene} onChange={(e) => onChange(list.map((x, j) => (j === i ? { ...x, scene: e.target.value } : x)))} />
            <textarea className="input flex-1" rows={2} placeholder="Kam scéna v díle patří (co předchází, co následuje)" value={s.context} onChange={(e) => onChange(list.map((x, j) => (j === i ? { ...x, context: e.target.value } : x)))} />
            <button className="self-end rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 sm:self-center" onClick={() => onChange(list.filter((_, j) => j !== i))} aria-label="Odebrat scénu">
              <Trash2 size={17} />
            </button>
          </div>
        ))}
        <Button size="sm" variant="secondary" icon={<Plus size={15} />} onClick={() => onChange([...list, { scene: '', context: '' }])}>
          Přidat scénu
        </Button>
      </div>
    </div>
  );
}
