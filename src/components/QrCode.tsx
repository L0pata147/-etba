import { useMemo } from 'react';
import qrcode from 'qrcode-generator';

/** QR kód jako SVG (bez obrázků z internetu) */
export function QrCode({ text, size = 220, className }: { text: string; size?: number; className?: string }) {
  const { n, path } = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    const count = qr.getModuleCount();
    let d = '';
    for (let r = 0; r < count; r++) for (let c = 0; c < count; c++) if (qr.isDark(r, c)) d += `M${c + 2},${r + 2}h1v1h-1z`;
    return { n: count + 4, path: d };
  }, [text]);
  return (
    <svg viewBox={`0 0 ${n} ${n}`} width={size} height={size} className={className} role="img" aria-label="QR kód">
      <rect width={n} height={n} fill="#fff" rx="1.5" />
      <path d={path} fill="#070d17" />
    </svg>
  );
}
