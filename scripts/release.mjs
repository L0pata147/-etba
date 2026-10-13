// Zkopíruje sestavené APK a HTML do složek ke stažení a zapíše docs/version.json,
// podle kterého aplikace pozná, že je nová verze.
// Použití: node scripts/release.mjs "Novinka 1" "Novinka 2"
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
const apk = 'android/build-apk/maturitni-trener.apk';
const html = 'dist-single/index.html';
for (const dir of ['stahnout', 'ke-stazeni']) {
  copyFileSync(apk, `${dir}/maturitni-trener.apk`);
  copyFileSync(html, `${dir}/maturitni-trener.html`);
}
copyFileSync(apk, 'docs/maturitni-trener.apk');
copyFileSync(html, 'docs/index.html');
// ikony a manifest pro „Přidat na plochu“ (iPhone, Android)
for (const f of ['apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'manifest.webmanifest', 'favicon.svg']) copyFileSync(`public/${f}`, `docs/${f}`);
const notes = process.argv.slice(2);
writeFileSync('docs/version.json', JSON.stringify({ version, notes }, null, 2) + '\n');
console.log(`Verze ${version} připravená k vydání.`);
