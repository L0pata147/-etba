/** Předpřipravené profilovky – každý obrázek v této složce se načte sám (id = název souboru bez přípony) */
const files = import.meta.glob('./*.{png,jpg,jpeg,webp}', { eager: true, import: 'default' }) as Record<string, string>;

export interface AvatarDef {
  id: string;
  url: string;
}

export const AVATARS: AvatarDef[] = Object.entries(files)
  .map(([path, url]) => ({ id: path.replace(/^\.\//, '').replace(/\.[^.]+$/, ''), url }))
  .sort((a, b) => a.id.localeCompare(b.id, 'cs'));

export const AVATAR_MAP: Record<string, AvatarDef> = Object.fromEntries(AVATARS.map((a) => [a.id, a]));
