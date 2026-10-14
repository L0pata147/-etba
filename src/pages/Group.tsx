import { useCallback, useEffect, useMemo, useState } from 'react';
import { Copy, Flame, LogOut, Pencil, QrCode, RefreshCw, Share2, Trophy, UserPlus, UserRound, Users } from 'lucide-react';
import { useStore } from '../store';
import { SUBJECTS } from '../data/subjects';
import type { SubjectId } from '../types';
import { createGroup, fetchGroup, formatGroupCode, groupAvailable, groupStats, joinGroup, leaveGroup, normalizeGroupCode, publishStats, type GroupRow } from '../lib/group';
import { PAGES_URL } from '../lib/update';
import { InviteQr } from './Profile';
import { useSearchParams } from 'react-router-dom';
import { dayKey } from '../lib/progress';
import { Avatar } from '../components/Avatar';
import { FriendProfile, memberProfile, memberTitle } from '../components/FriendProfile';
import { ColoredName } from '../components/ProfileCard';
import { STATUS_MAP } from '../lib/profile';
import type { GroupStats } from '../lib/group';
import { SUBJECT_STYLE, SubjectIcon } from '../components/subjectStyle';
import { Button, Card, EmptyState, Modal, PageHeader, Pct, ProgressBar, SectionTitle, Segmented, cx, plural } from '../components/ui';

type SortKey = 'xp' | 'week' | 'streak' | SubjectId;
const SUBJECT_IDS: SubjectId[] = ['cjl', 'site', 'hw', 'cloud'];

/** Skupina kamarádů – žebříček pokroku */
export function Group() {
  const { data, updateSettings, toast } = useStore();
  const g = data.settings.group ?? null;
  const [rows, setRows] = useState<GroupRow[] | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState<SortKey>('xp');
  const [rename, setRename] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [shown, setShown] = useState<{ name: string; stats: GroupStats; rank: number } | null>(null);

  const load = useCallback(async () => {
    if (!g) return;
    setLoading(true);
    try {
      setRows(await fetchGroup(g));
      setError('');
    } catch (e) {
      setError(e instanceof TypeError ? 'Server je nedostupný – zkontroluj připojení.' : (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [g]);

  useEffect(() => {
    if (!g) return;
    // při otevření nejdřív poslat vlastní aktuální stav, pak načíst ostatní
    void publishStats(g, data)
      .catch(() => undefined)
      .then(load);
    const timer = setInterval(() => document.visibilityState === 'visible' && void load(), 60000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- jen při změně skupiny
  }, [g?.code, g?.member, g?.name]);

  const sorted = useMemo(() => {
    if (!rows) return [];
    const val = (r: GroupRow) => (sort === 'xp' || sort === 'week' || sort === 'streak' ? r.stats[sort] : (r.stats.subjects?.[sort] ?? 0));
    return [...rows].sort((a, b) => val(b) - val(a) || b.stats.xp - a.stats.xp);
  }, [rows, sort]);

  if (!groupAvailable()) return <EmptyState icon={<Users size={36} />} title="Skupiny nejsou dostupné" text="Tato verze aplikace nemá nastavený server." />;
  if (!g) return <GroupSetup onDone={(m) => updateSettings({ group: m })} />;

  const share = async () => {
    const text = `Přidej se do mé skupiny v Maturitním trenérovi: ${PAGES_URL}#/kamaradi?skupina=${g.code} (nebo Kamarádi → Mám kód skupiny → ${formatGroupCode(g.code)})`;
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        toast('Pozvánka zkopírována.', 'success');
      }
    } catch {
      /* zrušeno */
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(formatGroupCode(g.code));
      toast('Kód zkopírován.', 'success');
    } catch {
      toast('Kopírování nejde – opiš kód ručně.', 'info');
    }
  };

  const mine = groupStats(data);
  const today = dayKey();

  return (
    <div>
      <PageHeader
        title="Kamarádi"
        sub="Žebříček tvé skupiny. Ostatní vidí jen tvoji přezdívku a souhrn pokroku, ne tvoje odpovědi ani poznámky."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" icon={<UserRound size={16} />} to="/profil">
              Můj profil
            </Button>
            <Button variant="secondary" icon={<RefreshCw size={16} className={cx(loading && 'animate-spin')} />} onClick={() => void load()} disabled={loading}>
              Obnovit
            </Button>
          </div>
        }
      />

      <Card className="mb-5 flex flex-wrap items-center gap-3 p-4">
        <div className="w-full sm:w-auto sm:flex-1">
          <div className="label">Kód skupiny</div>
          <code className="whitespace-nowrap font-mono text-lg font-bold tracking-wider">{formatGroupCode(g.code)}</code>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" icon={<Share2 size={16} />} onClick={share}>
            Pozvat
          </Button>
          <Button size="sm" variant="secondary" icon={<Copy size={16} />} onClick={copy}>
            Kopírovat
          </Button>
          <Button size="sm" variant="secondary" icon={<QrCode size={16} />} onClick={() => setQrOpen(true)}>
            QR kód
          </Button>
          <Button size="sm" variant="ghost" icon={<Pencil size={16} />} onClick={() => setRename(true)}>
            {g.name}
          </Button>
        </div>
      </Card>

      <Segmented
        className="mb-4"
        value={sort}
        onChange={setSort}
        options={[
          { value: 'xp', label: 'XP' },
          { value: 'week', label: 'Tento týden' },
          { value: 'streak', label: 'Série' },
          ...SUBJECT_IDS.map((s) => ({ value: s, label: SUBJECTS[s].short })),
        ]}
      />

      {error && <Card className="mb-4 p-4 text-sm text-rose-600 dark:text-rose-300">{error}</Card>}
      {!rows && !error && <Card className="p-5 text-slate-500 dark:text-slate-400">Načítám skupinu…</Card>}

      <div className="space-y-2.5">
        {sorted.map((r, i) => {
          const s = r.me ? mine : r.stats;
          const active = s.lastActive === today;
          return (
            <Card key={`${r.name}-${i}`} onClick={() => setShown({ name: r.name, stats: s, rank: i + 1 })} className={cx('cursor-pointer p-4 transition hover:-translate-y-0.5 hover:shadow-md', r.me && 'ring-2 ring-brand-500/60')}>
              <div className="flex items-center gap-3">
                <span
                  className={cx(
                    'grid h-7 w-7 shrink-0 place-items-center rounded-lg font-display text-xs font-bold',
                    i === 0 ? 'bg-amber-400 text-amber-950' : i === 1 ? 'bg-slate-300 text-slate-800' : i === 2 ? 'bg-orange-300 text-orange-950' : 'bg-slate-900/[0.06] dark:bg-white/[0.08]',
                  )}
                >
                  {i === 0 ? <Trophy size={14} /> : i + 1}
                </span>
                <Avatar name={r.name} avatar={memberProfile(s).avatar} frame={memberProfile(s).frame} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <ColoredName name={r.name} color={memberProfile(s).color} className="truncate font-display text-[17px] font-bold" />
                    {memberProfile(s).status && <span title={STATUS_MAP[memberProfile(s).status!]?.label}>{STATUS_MAP[memberProfile(s).status!]?.emoji}</span>}
                    {r.me && <span className="rounded-md bg-brand-500/15 px-1.5 py-0.5 text-[11px] font-bold uppercase text-brand-700 dark:text-brand-300">ty</span>}
                  </div>
                  <div className="truncate text-xs font-medium text-brand-700 dark:text-brand-300">{memberTitle(s)}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {active ? `dnes ${s.today} ${plural(s.today, 'otázka', 'otázky', 'otázek')}` : s.lastActive ? `naposledy ${formatDay(s.lastActive)}` : 'zatím bez aktivity'} · úspěšnost <Pct value={s.accuracy} />
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-lg font-bold">{s.xp} XP</div>
                  <div className="flex items-center justify-end gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-0.5">
                      <Flame size={13} className={s.streak ? 'text-orange-500' : ''} />
                      {s.streak}
                    </span>
                    <span>{s.week} / týden</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
                {SUBJECT_IDS.map((id) => (
                  <div key={id} className="flex items-center gap-2">
                    <SubjectIcon subject={id} size="sm" />
                    <ProgressBar value={s.subjects?.[id] ?? 0} color={SUBJECT_STYLE[id].bar} className="flex-1" />
                    <span className={cx('w-9 text-right text-xs font-semibold', sort === id && SUBJECT_STYLE[id].text)}>
                      <Pct value={s.subjects?.[id] ?? 0} />
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={qrOpen} onClose={() => setQrOpen(false)} title="Pozvat kamarády">
        <InviteQr code={g.code} />
      </Modal>

      <FriendProfile open={!!shown} onClose={() => setShown(null)} name={shown?.name ?? ''} stats={shown?.stats ?? null} rank={shown?.rank} mine={shown && shown.stats !== mine ? mine : undefined} />

      {rows && rows.length === 1 && (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Ve skupině zatím nikdo další není. Pošli kamarádům kód tlačítkem Pozvat.</p>
      )}

      <div className="mt-6">
        <Button variant="ghost" size="sm" icon={<LogOut size={16} />} onClick={() => setConfirmLeave(true)}>
          Opustit skupinu
        </Button>
      </div>

      <RenameModal open={rename} name={g.name} onClose={() => setRename(false)} onSave={(name) => updateSettings({ group: { ...g, name } })} />

      <Modal open={confirmLeave} onClose={() => setConfirmLeave(false)} title="Opustit skupinu?">
        <p className="text-slate-600 dark:text-slate-300">Zmizíš ze žebříčku ostatních. Tvůj pokrok v aplikaci zůstane. Vrátit se můžeš kdykoli se stejným kódem.</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmLeave(false)}>
            Zrušit
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              try {
                await leaveGroup(g);
              } catch {
                toast('Ze serveru se nepodařilo odebrat – zkus to znovu online.', 'error');
                return;
              }
              setConfirmLeave(false);
              setRows(null);
              updateSettings({ group: null });
            }}
          >
            Opustit
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function formatDay(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const days = Math.round((new Date(dayKey()).getTime() - new Date(y, m - 1, d).getTime()) / 86400000);
  if (days <= 1) return 'včera';
  if (days < 7) return `před ${days} dny`;
  return `${d}. ${m}.`;
}

const nameOk = (n: string) => n.trim().length >= 1 && n.trim().length <= 30;

function GroupSetup({ onDone }: { onDone: (g: { code: string; member: string; name: string }) => void }) {
  const { data, toast } = useStore();
  const [params] = useSearchParams();
  const invited = params.get('skupina') ?? '';
  const [name, setName] = useState(data.settings.profile?.nick ?? '');
  const [code, setCode] = useState(invited ? formatGroupCode(normalizeGroupCode(invited)) : '');
  const [busy, setBusy] = useState<'create' | 'join' | null>(null);

  const run = async (kind: 'create' | 'join') => {
    if (!nameOk(name)) {
      toast('Nejdřív zadej přezdívku (1–30 znaků).', 'error');
      return;
    }
    setBusy(kind);
    try {
      const g = kind === 'create' ? await createGroup(name, data) : await joinGroup(code, name, data);
      onDone(g);
      toast(kind === 'create' ? 'Skupina vytvořená – pošli kamarádům kód.' : 'Jsi ve skupině.', 'success');
    } catch (e) {
      toast(e instanceof TypeError ? 'Server je nedostupný – zkontroluj připojení.' : (e as Error).message, 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <PageHeader title="Kamarádi" sub="Porovnej si pokrok s kamarády. Ostatní uvidí jen tvoji přezdívku a souhrn: XP, sérii, počet otázek a procenta po předmětech." />
      {invited && (
        <Card className="mb-4 border-brand-500/40 bg-brand-500/10 p-4 text-sm">
          <b>Máš pozvánku do skupiny {formatGroupCode(normalizeGroupCode(invited))}.</b> Zadej přezdívku a klikni na <b>Připojit se</b>.
        </Card>
      )}
      <Card className="mb-4 p-5">
        <label htmlFor="g-name" className="label">
          Tvoje přezdívka
        </label>
        <input id="g-name" className="input max-w-sm" maxLength={30} value={name} onChange={(e) => setName(e.target.value)} placeholder="např. Lukáš" />
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <SectionTitle sub="Vytvoří kód, který pošleš kamarádům.">Nová skupina</SectionTitle>
          <Button icon={<Users size={18} />} onClick={() => run('create')} disabled={!!busy}>
            {busy === 'create' ? 'Vytvářím…' : 'Vytvořit skupinu'}
          </Button>
        </Card>
        <Card className="p-5">
          <SectionTitle sub="Kód ti pošle kamarád, který skupinu založil.">Mám kód skupiny</SectionTitle>
          <input className="input mb-3 font-mono uppercase tracking-wider" placeholder="XXXXX-XXXXX" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" spellCheck={false} aria-label="Kód skupiny" />
          <Button icon={<UserPlus size={18} />} onClick={() => run('join')} disabled={!!busy || !code.trim()}>
            {busy === 'join' ? 'Připojuji…' : 'Připojit se'}
          </Button>
        </Card>
      </div>
    </div>
  );
}

function RenameModal({ open, name, onClose, onSave }: { open: boolean; name: string; onClose: () => void; onSave: (n: string) => void }) {
  const [value, setValue] = useState(name);
  useEffect(() => setValue(name), [name, open]);
  return (
    <Modal open={open} onClose={onClose} title="Změnit přezdívku">
      <input className="input" maxLength={30} value={value} onChange={(e) => setValue(e.target.value)} aria-label="Přezdívka" />
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Zrušit
        </Button>
        <Button
          disabled={!nameOk(value)}
          onClick={() => {
            onSave(value.trim());
            onClose();
          }}
        >
          Uložit
        </Button>
      </div>
    </Modal>
  );
}
