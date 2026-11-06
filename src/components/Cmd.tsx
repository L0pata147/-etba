import { splitVars } from '../lib/vars';
import { cx } from './ui';

const TONE = {
  /** tmavý blok s kódem */
  dark: 'text-amber-300 decoration-amber-300/70',
  /** běžná karta (světlý i tmavý režim) */
  card: 'font-semibold text-amber-700 decoration-amber-600 dark:text-amber-300 dark:decoration-amber-300/70',
  /** papír taháku – vždy světlý */
  paper: 'font-semibold text-amber-700 decoration-amber-600',
};

/** Text příkazu se zvýrazněnými proměnnými (hodnoty podle zadání) */
export function Cmd({ text, tone = 'dark' }: { text: string; tone?: keyof typeof TONE }) {
  return (
    <>
      {splitVars(text).map((p, i) =>
        p.v ? (
          <span
            key={i}
            title="Proměnná – hodnota podle zadání"
            className={cx('underline decoration-dotted underline-offset-2', TONE[tone])}
            style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
          >
            {p.text}
          </span>
        ) : (
          p.text
        ),
      )}
    </>
  );
}

/** Vysvětlivka ke zvýraznění */
export function VarLegend({ className }: { className?: string }) {
  return (
    <p className={cx('text-xs text-slate-500 dark:text-slate-400', className)}>
      <span className="font-semibold text-amber-600 underline decoration-dotted underline-offset-2 dark:text-amber-300">Žlutě</span> = proměnná – jméno, adresa, cesta nebo heslo, které se mění podle
      zadání. Ostatní je pevná část příkazu.
    </p>
  );
}
