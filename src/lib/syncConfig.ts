/**
 * Připojení k databázi Supabase pro synchronizaci mezi zařízeními.
 * Klíč „anon“ je veřejný – data chrání tajný kód zařízení (viz supabase/sync.sql).
 */
export const SYNC_URL: string = import.meta.env.VITE_SYNC_URL ?? '';
export const SYNC_KEY: string = import.meta.env.VITE_SYNC_KEY ?? '';
