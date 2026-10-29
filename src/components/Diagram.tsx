import type { Cell, Diagram } from '../data/site/diagrams';
import { cx } from './ui';

/** Barvy se zachovají i při tisku */
const EXACT = { printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' } as const;
const BORDER = 'border-slate-700';
const FILL = '#dcfce7';
const FILL_SOFT = '#f0fdf4';

const toBits = (addr: string) => addr.split('.').map((o) => Number(o).toString(2).padStart(8, '0'));

function CellView({ c }: { c: Cell }) {
  if (typeof c === 'string') return <>{c}</>;
  return (
    <span className={cx('inline-flex items-center gap-1', c.hl && 'font-semibold')}>
      {c.swatch && (
        <span
          className="inline-block h-[0.9em] w-[0.9em] shrink-0 rounded-sm border border-slate-500"
          style={{ background: c.stripe ? `repeating-linear-gradient(45deg, #fff 0 2px, ${c.swatch} 2px 4px)` : c.swatch, ...EXACT }}
        />
      )}
      {c.text}
    </span>
  );
}

/**
 * Schéma ze sítí: rámec / hlavička po polích, výměna zpráv, tabulka, řetězec, kroky, adresa po bitech.
 * Kreslí se světle (pro tisk); na tmavé obrazovce ho obal světlou kartou.
 */
export function DiagramView({ d }: { d: Diagram }) {
  return (
    <div className="mt-0.5 text-slate-900">
      <DiagramBody d={d} />
      {d.note && (
        <p className="mt-0.5 text-slate-600" style={{ fontSize: '0.92em' }}>
          {d.note}
        </p>
      )}
    </div>
  );
}

function DiagramBody({ d }: { d: Diagram }) {
  switch (d.kind) {
    case 'flow':
      return (
        <div style={{ fontSize: '0.92em' }}>
          <div className="flex justify-between font-semibold">
            <span>{d.left}</span>
            <span>{d.right}</span>
          </div>
          <div className={cx('border-x-2 px-1', BORDER)}>
            {d.steps.map((s, i) => (
              <div key={i} className="py-0.5">
                <div className={cx('flex items-center', s.dir === '<' && 'flex-row-reverse')}>
                  <div className="h-0 flex-1 border-t-2 border-emerald-600" style={EXACT} />
                  <span className="text-emerald-700" style={EXACT}>
                    {s.dir === '>' ? '▶' : '◀'}
                  </span>
                </div>
                <div className="-mt-0.5 text-center">
                  <b>{s.label}</b>
                  {s.note && <span className="text-slate-600"> – {s.note}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    case 'table':
      return (
        <table className={cx('w-full border-collapse border text-left', BORDER)} style={{ fontSize: '0.88em' }}>
          <thead>
            <tr>
              {d.headers.map((h, i) => (
                <th key={i} className={cx('border px-1 py-0.5 font-semibold', BORDER)} style={{ background: FILL, ...EXACT }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {d.rows.map((r, ri) => (
              <tr key={ri}>
                {r.map((c, ci) => (
                  <td
                    key={ci}
                    className={cx('border px-1 py-0.5 align-top leading-tight', BORDER, ci === 0 && 'font-semibold')}
                    style={typeof c !== 'string' && c.hl ? { background: FILL_SOFT, ...EXACT } : undefined}
                  >
                    <CellView c={c} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    case 'chain':
      return (
        <div style={{ fontSize: '0.9em' }}>
          <div className="flex items-stretch">
            {d.nodes.map((n, i) => (
              <div key={i} className="contents">
                {i > 0 && (
                  <div className="flex min-w-[2.6em] shrink-0 flex-col items-center justify-center px-0.5 text-center leading-tight">
                    <span className="text-slate-600" style={{ fontSize: '0.85em' }}>
                      {d.links?.[i - 1]}
                    </span>
                    <span className="text-emerald-700" style={EXACT}>
                      ▶
                    </span>
                  </div>
                )}
                <div
                  className={cx('flex min-w-0 flex-1 flex-col justify-center rounded border px-1 py-0.5 text-center leading-tight', BORDER)}
                  style={{ background: i % 2 ? FILL_SOFT : FILL, ...EXACT }}
                >
                  <b className="[overflow-wrap:anywhere]">{n.label}</b>
                  {n.sub && (
                    <span className="text-slate-600" style={{ fontSize: '0.88em' }}>
                      {n.sub}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {d.loop && (
            <div className="mt-0.5 border-x border-b border-dashed border-emerald-600 pb-0.5 text-center text-slate-600" style={{ fontSize: '0.85em', ...EXACT }}>
              ◀ {d.loop}
            </div>
          )}
        </div>
      );
    case 'steps':
      return (
        <ol className="space-y-0.5" style={{ fontSize: '0.92em' }}>
          {d.steps.map((s, i) => (
            <li key={i} className="flex gap-1.5">
              <span className="grid h-[1.4em] w-[1.4em] shrink-0 place-items-center rounded-full font-bold text-white" style={{ background: '#16a34a', fontSize: '0.85em', ...EXACT }}>
                {i + 1}
              </span>
              <span>
                <b>
                  {s.from} → {s.to}
                </b>
                : {s.label}
              </span>
            </li>
          ))}
        </ol>
      );
    case 'bits':
      return (
        <table className="w-full border-collapse font-mono" style={{ fontSize: '0.86em' }}>
          <tbody>
            {d.rows.map((r) => (
              <tr key={r.label}>
                <td className="whitespace-nowrap pr-2 font-sans font-semibold">{r.label}</td>
                <td className="whitespace-nowrap pr-2">{r.addr}</td>
                <td className="w-full">
                  <span className="inline-flex flex-wrap gap-x-1">
                    {toBits(r.addr).map((oct, oi) => (
                      <span key={oi} className={cx('border', BORDER)}>
                        {oct.split('').map((b, bi) => (
                          <span key={bi} className="inline-block w-[0.7em] text-center" style={oi * 8 + bi < d.prefix ? { background: FILL, ...EXACT } : undefined}>
                            {b}
                          </span>
                        ))}
                      </span>
                    ))}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    default: {
      const total = d.words ? 32 : 0;
      return (
        <div style={{ fontSize: '0.88em' }}>
          {d.words && (
            <div className="flex justify-between text-slate-500" style={{ fontSize: '0.85em' }}>
              <span>bit 0</span>
              <span>8</span>
              <span>16</span>
              <span>24</span>
              <span>31</span>
            </div>
          )}
          <div className={cx(d.words && `border-l border-t ${BORDER}`)}>
            {d.rows.map((row, ri) => {
              const sum = total || row.reduce((a, x) => a + x.span, 0);
              return (
                <div key={ri} className={cx('flex', !d.words && `border-l border-t ${BORDER}`, !d.words && ri > 0 && 'mt-1')}>
                  {row.map((x, i) => (
                    <div
                      key={i}
                      className={cx('flex min-w-0 flex-col items-center justify-center border-b border-r px-0.5 py-0.5 text-center leading-tight', BORDER)}
                      style={{ width: `${(x.span / sum) * 100}%`, background: x.data ? FILL : i % 2 ? FILL_SOFT : '#ffffff', ...EXACT }}
                    >
                      <span className="font-semibold [overflow-wrap:anywhere]">{x.label}</span>
                      {x.size && (
                        <span className="text-slate-600" style={{ fontSize: '0.88em' }}>
                          {x.size}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      );
    }
  }
}
