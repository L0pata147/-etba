import type { FillQuestion, Question } from '../types';
import { pick } from './random';

const rnd = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

function fill(kind: string, i: number, prompt: string, answer: string, accepted: string[], explanation: string, inputLabel = 'Výsledek'): FillQuestion {
  return {
    id: `hwgen|${kind}|${i}`,
    bookId: 'hw-vypocty',
    area: 'it-vypocty',
    factKey: `${kind}-${i}`,
    difficulty: 'medium',
    prompt,
    explanation,
    type: 'fill',
    answer,
    accepted: [answer, ...accepted],
    exact: true,
    inputLabel,
  };
}

/** Rozpis převodu desítkového čísla do dvojkové soustavy dělením dvěma */
function divisionSteps(n: number, base: number): string {
  const steps: string[] = [];
  let x = n;
  while (x > 0) {
    const r = x % base;
    steps.push(`${x} : ${base} = ${Math.floor(x / base)} zbytek ${base === 16 ? r.toString(16).toUpperCase() : r}`);
    x = Math.floor(x / base);
  }
  return steps.join('\n');
}

const binWeights = (bin: string) =>
  bin
    .split('')
    .map((b, i) => (b === '1' ? 2 ** (bin.length - 1 - i) : 0))
    .filter(Boolean)
    .join(' + ');

/** Formát čísla s desetinnou čárkou (česky) */
const cz = (x: number) => String(Math.round(x * 100) / 100).replace('.', ',');
const variants = (x: number) => [...new Set([cz(x), String(Math.round(x * 100) / 100)])];

type Gen = (i: number) => Question;

export const HW_GENERATORS: Record<string, { label: string; gen: Gen }> = {
  'dec-bin': {
    label: 'Desítková → dvojková',
    gen: (i) => {
      const n = rnd(5, 255);
      const bin = n.toString(2);
      return fill('dec-bin', i, `Převeď číslo ${n} do dvojkové soustavy.`, bin, [bin.padStart(8, '0'), `${bin}b`, `0b${bin}`], `${divisionSteps(n, 2)}\nZbytky odzadu: ${bin}`);
    },
  },
  'bin-dec': {
    label: 'Dvojková → desítková',
    gen: (i) => {
      const n = rnd(5, 255);
      const bin = n.toString(2).padStart(8, '0');
      return fill('bin-dec', i, `Převeď dvojkové číslo ${bin} do desítkové soustavy.`, String(n), [], `${bin} = ${binWeights(bin)} = ${n}`);
    },
  },
  'dec-hex': {
    label: 'Desítková → šestnáctková',
    gen: (i) => {
      const n = rnd(16, 4095);
      const hex = n.toString(16).toUpperCase();
      return fill('dec-hex', i, `Převeď číslo ${n} do šestnáctkové soustavy.`, hex, [`0x${hex}`, `${hex}h`, hex.toLowerCase(), `0x${hex.toLowerCase()}`], `${divisionSteps(n, 16)}\nZbytky odzadu: ${hex}`);
    },
  },
  'hex-dec': {
    label: 'Šestnáctková → desítková',
    gen: (i) => {
      const n = rnd(16, 4095);
      const hex = n.toString(16).toUpperCase();
      const parts = hex
        .split('')
        .map((d, k) => `${parseInt(d, 16)}·16^${hex.length - 1 - k}`)
        .join(' + ');
      return fill('hex-dec', i, `Převeď šestnáctkové číslo ${hex} do desítkové soustavy.`, String(n), [], `${hex} = ${parts} = ${n}`);
    },
  },
  'bin-hex': {
    label: 'Dvojková → šestnáctková',
    gen: (i) => {
      const n = rnd(16, 255);
      const bin = n.toString(2).padStart(8, '0');
      const hex = n.toString(16).toUpperCase().padStart(2, '0');
      return fill('bin-hex', i, `Převeď dvojkové číslo ${bin} do šestnáctkové soustavy.`, hex, [`0x${hex}`, hex.toLowerCase(), hex.replace(/^0/, ''), `${hex}h`], `Rozděl na čtveřice bitů: ${bin.slice(0, 4)} = ${parseInt(bin.slice(0, 4), 2).toString(16).toUpperCase()}, ${bin.slice(4)} = ${parseInt(bin.slice(4), 2).toString(16).toUpperCase()} → ${hex}`);
    },
  },
  'units-iec': {
    label: 'Jednotky KiB / MiB / GiB',
    gen: (i) => {
      const v = pick([
        () => {
          const m = rnd(2, 64);
          return { q: `Kolik KiB je ${m} MiB?`, a: m * 1024, e: `1 MiB = 1024 KiB → ${m} · 1024 = ${m * 1024} KiB` };
        },
        () => {
          const g = rnd(2, 32);
          return { q: `Kolik MiB je ${g} GiB?`, a: g * 1024, e: `1 GiB = 1024 MiB → ${g} · 1024 = ${g * 1024} MiB` };
        },
        () => {
          const k = rnd(2, 16);
          return { q: `Kolik bajtů je ${k} KiB?`, a: k * 1024, e: `1 KiB = 1024 B → ${k} · 1024 = ${k * 1024} B` };
        },
        () => {
          const k = rnd(2, 16) * 1024;
          return { q: `Kolik MiB je ${k} KiB?`, a: k / 1024, e: `${k} : 1024 = ${k / 1024} MiB` };
        },
      ])();
      return fill('units-iec', i, v.q, String(v.a), [], v.e);
    },
  },
  'units-si': {
    label: 'Jednotky SI a bity',
    gen: (i) => {
      const v = pick([
        () => {
          const m = rnd(2, 500);
          return { q: `Kolik kB je ${m} MB (předpony SI)?`, a: String(m * 1000), e: `1 MB = 1000 kB → ${m * 1000} kB` };
        },
        () => {
          const b = rnd(2, 128);
          return { q: `Kolik bitů je ${b} bajtů?`, a: String(b * 8), e: `1 B = 8 b → ${b} · 8 = ${b * 8} b` };
        },
        () => {
          const mbit = pick([8, 16, 40, 80, 100, 200, 400, 800, 1000]);
          return { q: `Kolik MB/s odpovídá rychlosti ${mbit} Mb/s?`, a: cz(mbit / 8), e: `Bajt má 8 bitů → ${mbit} : 8 = ${cz(mbit / 8)} MB/s`, alt: variants(mbit / 8) };
        },
      ])() as { q: string; a: string; e: string; alt?: string[] };
      return fill('units-si', i, v.q, v.a, v.alt ?? [], v.e);
    },
  },
  'disk-gib': {
    label: 'Kapacita disku (TB → GiB)',
    gen: (i) => {
      const tb = pick([0.25, 0.5, 1, 2, 4, 8]);
      const gib = Math.floor((tb * 1e12) / 2 ** 30);
      return fill(
        'disk-gib',
        i,
        `Disk se prodává jako ${cz(tb)} TB (předpony SI). Kolik celých GiB ukáže operační systém? (zaokrouhli dolů)`,
        String(gib),
        [],
        `${cz(tb)} TB = ${tb * 1e12} B; 1 GiB = 2^30 = 1 073 741 824 B → ${tb * 1e12} : 1 073 741 824 ≈ ${gib} GiB`,
      );
    },
  },
  transfer: {
    label: 'Doba přenosu dat',
    gen: (i) => {
      const speed = pick([8, 16, 40, 80, 100, 400, 800]);
      const size = (speed / 8) * rnd(2, 30);
      const t = (size * 8) / speed;
      return fill('transfer', i, `Za kolik sekund se přenese soubor ${cz(size)} MB rychlostí ${speed} Mb/s? (počítej SI jednotky, bez režie)`, String(t), [], `${cz(size)} MB = ${cz(size * 8)} Mb → ${cz(size * 8)} : ${speed} = ${t} s`, 'Sekundy');
    },
  },
  raid: {
    label: 'Kapacita RAID',
    gen: (i) => {
      const level = pick(['0', '1', '5', '6', '10']);
      const size = pick([1, 2, 4, 8]);
      const n = level === '1' ? 2 : level === '10' ? pick([4, 6]) : level === '6' ? rnd(4, 6) : rnd(3, 6);
      const cap = level === '0' ? n * size : level === '1' ? size : level === '5' ? (n - 1) * size : level === '6' ? (n - 2) * size : (n / 2) * size;
      const rule = { '0': 'RAID 0 = součet všech disků', '1': 'RAID 1 = kapacita jednoho disku (zrcadlo)', '5': 'RAID 5 = (n − 1) disků', '6': 'RAID 6 = (n − 2) disků', '10': 'RAID 10 = polovina disků' }[level];
      return fill('raid', i, `Kolik TB je využitelných v poli RAID ${level} z ${n} disků po ${size} TB?`, String(cap), [`${cap} tb`, `${cap}tb`], `${rule} → ${cap} TB`, 'TB');
    },
  },
  colors: {
    label: 'Barevná hloubka',
    gen: (i) => {
      const bits = pick([1, 2, 4, 8, 15, 16]);
      return fill('colors', i, `Kolik barev lze zobrazit při barevné hloubce ${bits} bitů?`, String(2 ** bits), [(2 ** bits).toLocaleString('cs-CZ')], `2^${bits} = ${2 ** bits}`);
    },
  },
  framebuffer: {
    label: 'Velikost snímku v paměti',
    gen: (i) => {
      const [w, h] = pick([
        [640, 480],
        [800, 600],
        [1024, 768],
        [1280, 1024],
      ]);
      const bpp = pick([1, 2, 3, 4]);
      const bytes = w * h * bpp;
      const kib = bytes / 1024;
      return fill('framebuffer', i, `Kolik KiB zabere jeden snímek ${w} × ${h} bodů při ${bpp * 8} bitech na pixel (bez komprese)?`, cz(kib), variants(kib), `${w} · ${h} · ${bpp} B = ${bytes} B; ${bytes} : 1024 = ${cz(kib)} KiB`, 'KiB');
    },
  },
};

export function generateHwCalcQuestions(perKind = 3, kinds: string[] = Object.keys(HW_GENERATORS)): Question[] {
  const out: Question[] = [];
  for (const k of kinds) for (let i = 0; i < perKind; i++) out.push(HW_GENERATORS[k].gen(i));
  return out;
}
