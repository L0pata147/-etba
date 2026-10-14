import type { Profile, SubjectId } from '../types';
import type { GroupStats } from './group';
import { AVATAR_MAP } from '../data/avatars';
import { SUBJECTS } from '../data/subjects';
import { BADGE_MAP, BANNER_MAP, FRAME_MAP, STATUS_MAP, TITLE_MAP, favoriteSubject } from './profile';
import { levelFromXp, levelName } from './progress';
import { saveImageNative } from './native';

const W = 1080;
const H = 1350;
const DISPLAY = '"Bricolage Grotesque Variable", "Manrope Variable", system-ui, sans-serif';
const SANS = '"Manrope Variable", system-ui, sans-serif';
const INITIAL_COLORS = ['#f43f5e', '#f97316', '#f59e0b', '#10b981', '#14b8a6', '#0ea5e9', '#6366f1', '#8b5cf6', '#d946ef'];
const SUBJECT_COLORS: Record<SubjectId, string> = { cjl: '#f43f5e', site: '#0ea5e9', hw: '#f59e0b', cloud: '#8b5cf6' };

function hash(s: string): number {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.codePointAt(0)!) | 0;
  return Math.abs(h);
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  const a = [...parts[0]][0] ?? '';
  const b = parts.length > 1 ? ([...parts[parts.length - 1]][0] ?? '') : ([...parts[0]][1] ?? '');
  return (a + b).toUpperCase();
}

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });

function gradient(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, stops: string[]) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  stops.forEach((c, i) => g.addColorStop(stops.length === 1 ? 0 : i / (stops.length - 1), c));
  return g;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fitText(ctx: CanvasRenderingContext2D, text: string, max: number): string {
  if (ctx.measureText(text).width <= max) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + '…').width > max) t = t.slice(0, -1);
  return t + '…';
}

/** Vykreslí profilovou kartu do PNG (1080 × 1350, vhodné na Instagram i do zpráv) */
export async function renderProfileCard(name: string, profile: Profile, stats: GroupStats): Promise<Blob> {
  try {
    await Promise.all([document.fonts.load(`700 80px ${DISPLAY}`), document.fonts.load(`500 40px ${SANS}`)]);
  } catch {
    /* písmo se nemusí načíst – použije se systémové */
  }
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  const banner = BANNER_MAP[profile.banner ?? ''] ?? BANNER_MAP.zaklad;

  // pozadí
  ctx.fillStyle = gradient(ctx, 0, 0, W, H, banner.stops);
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath();
  ctx.arc(W - 120, 140, 320, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  roundRect(ctx, 60, 760, W - 120, 470, 40);
  ctx.fill();

  // profilovka s rámečkem
  const cx = W / 2;
  const cy = 300;
  const r = 165;
  const frame = profile.frame ? FRAME_MAP[profile.frame] : undefined;
  if (frame) {
    ctx.fillStyle = gradient(ctx, cx - r, cy - r, cx + r, cy + r, frame.stops);
    ctx.beginPath();
    ctx.arc(cx, cy, r + 18, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const av = profile.avatar ? AVATAR_MAP[profile.avatar] : undefined;
  let drawn = false;
  if (av) {
    try {
      const img = await loadImage(av.url);
      ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
      drawn = true;
    } catch {
      /* obrázek se nenačetl – iniciály */
    }
  }
  if (!drawn) {
    ctx.fillStyle = INITIAL_COLORS[hash(name) % INITIAL_COLORS.length];
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.fillStyle = '#fff';
    ctx.font = `700 130px ${DISPLAY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials(name), cx, cy + 6);
  }
  ctx.restore();
  if (frame?.emblem) {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx + r * 0.72, cy + r * 0.72, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = `44px ${SANS}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(frame.emblem, cx + r * 0.72, cy + r * 0.72 + 2);
  }

  // jméno, titul, motto, úroveň
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#fff';
  ctx.font = `700 84px ${DISPLAY}`;
  const status = profile.status ? STATUS_MAP[profile.status]?.emoji : '';
  ctx.fillText(fitText(ctx, `${name}${status ? ` ${status}` : ''}`, W - 160), cx, 570);
  ctx.font = `600 42px ${SANS}`;
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.fillText(TITLE_MAP[profile.title]?.label ?? '', cx, 630);
  const lvl = levelFromXp(stats.xp);
  ctx.font = `500 34px ${SANS}`;
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillText(`Úroveň ${lvl.level} · ${levelName(lvl.level)} · ${stats.xp} XP`, cx, 685);
  if (profile.motto) {
    ctx.font = `italic 500 32px ${SANS}`;
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.fillText(fitText(ctx, `„${profile.motto}“`, W - 200), cx, 732);
  }

  // čísla
  const fav = favoriteSubject(stats.subjects);
  const boxes: [string, string][] = [
    [`${stats.streak}`, 'série dní'],
    [`${stats.total}`, 'otázek'],
    [`${stats.longest ?? stats.streak}`, 'nejdelší série'],
    [fav ? SUBJECTS[fav].short : '–', 'nejsilnější'],
  ];
  const bw = (W - 120 - 60) / 4;
  boxes.forEach(([v, l], i) => {
    const x = 90 + i * (bw + 0) + bw / 2;
    ctx.fillStyle = '#fff';
    ctx.font = `700 56px ${DISPLAY}`;
    ctx.fillText(fitText(ctx, v, bw - 20), x, 860);
    ctx.font = `500 26px ${SANS}`;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(l, x, 900);
  });

  // předměty
  const subjects: SubjectId[] = ['cjl', 'site', 'hw', 'cloud'];
  subjects.forEach((s, i) => {
    const y = 970 + i * 58;
    const v = Math.max(0, Math.min(1, stats.subjects?.[s] ?? 0));
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.font = `600 30px ${SANS}`;
    ctx.fillText(SUBJECTS[s].short, 110, y + 10);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    roundRect(ctx, 330, y - 10, 540, 22, 11);
    ctx.fill();
    if (v > 0) {
      ctx.fillStyle = SUBJECT_COLORS[s];
      roundRect(ctx, 330, y - 10, Math.max(22, 540 * v), 22, 11);
      ctx.fill();
    }
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fff';
    ctx.font = `700 30px ${SANS}`;
    ctx.fillText(`${Math.round(v * 100)} %`, 970, y + 10);
  });

  // vitrína
  if (profile.showcase.length) {
    ctx.textAlign = 'center';
    ctx.font = `64px ${SANS}`;
    const emojis = profile.showcase.map((id) => BADGE_MAP[id]?.emoji ?? '').join('   ');
    ctx.fillText(emojis, cx, 1290);
  } else {
    ctx.textAlign = 'center';
    ctx.font = `600 30px ${SANS}`;
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillText('Maturitní trenér', cx, 1290);
  }

  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Obrázek se nepodařilo vytvořit.'))), 'image/png'));
}

/** Sdílí kartu (telefon) nebo ji uloží (PC, Android aplikace). Vrátí popis, co se stalo. */
export async function shareProfileCard(name: string, profile: Profile, stats: GroupStats): Promise<string> {
  const blob = await renderProfileCard(name, profile, stats);
  const fileName = `profil-${name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-') || 'karta'}.png`;
  const file = new File([blob], fileName, { type: 'image/png' });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: 'Můj profil – Maturitní trenér' });
      return 'shared';
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancelled';
    }
  }
  const b64 = await new Promise<string>((res) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result).split(',')[1] ?? '');
    fr.readAsDataURL(blob);
  });
  const where = saveImageNative(fileName, b64);
  if (where) return `Obrázek uložen: ${where}`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return 'Obrázek profilové karty se stáhl.';
}
