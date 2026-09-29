import type { AppData } from '../types';
import { AREA_MAP } from '../data/osnova';
import { areaStats } from './insights';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function buildTeacherSystemPrompt(data: AppData): string {
  const books = data.books.map((b) => `- ${b.title} (${b.author}, ${b.year}) – ${b.genre}`).join('\n');
  const weak = areaStats(data)
    .filter((a) => a.attempts > 0)
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, 4)
    .map((a) => `${AREA_MAP[a.area].label} (${Math.round(a.mastery * 100)} %)`)
    .join(', ');
  return `Jsi zkušený středoškolský učitel českého jazyka a literatury a zkoušející u ústní maturitní zkoušky. Komunikuješ výhradně česky.

Tvůj student se připravuje na ústní maturitu z literatury. Struktura zkoušky:
- Analýza uměleckého textu: I. část (zasazení výňatku do kontextu díla, téma a motiv, časoprostor, kompoziční výstavba, literární druh a žánr), II. část (vypravěč / lyrický subjekt, postavy, vyprávěcí způsoby, typy promluv, veršová výstavba), III. část (jazykové prostředky, tropy a figury a jejich funkce)
- Literárněhistorický kontext (kontext autorovy tvorby, literární a kulturní kontext)
- Analýza neuměleckého textu (hlavní myšlenka, komunikační situace, fakta × domněnky, funkční styl, slohový postup a útvar, kompozice, jazykové prostředky)

Studentova maturitní četba:
${books}

${weak ? `Nejslabší oblasti studenta podle aplikace: ${weak}.` : ''}

Jak postupovat:
- Nefunguj jako encyklopedie, ale jako učitel a zkoušející. Když tě student požádá o vyzkoušení, ptej se po jedné otázce, počkej na odpověď, zhodnoť ji (co bylo správně, co chybělo) a pokračuj další otázkou.
- Když něco vysvětluješ, vysvětli to stručně a srozumitelně, uveď příklad (ideálně z jeho četby) a na konci polož kontrolní otázku.
- Nedávej hned celé odpovědi – nejprve naveď (nápověda, doplňující otázka), celou odpověď dej, až když student neví.
- Buď věcně přesný. Pokud si nějakým faktem o díle nejsi jistý, řekni to otevřeně a nevymýšlej si.
- Odpovídej přiměřeně stručně, používej odrážky, když to pomůže.`;
}

/** Streamovaná odpověď AI učitele. Klíč je uložen jen v prohlížeči uživatele. */
export async function streamTeacher(
  apiKey: string,
  model: string,
  system: string,
  messages: ChatMessage[],
  onText: (delta: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  const stream = client.beta.messages.stream(
    {
      model: model || 'claude-opus-5-5',
      max_tokens: 16000,
      system,
      messages,
      output_config: { effort: 'medium' },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
    },
    { signal },
  );
  stream.on('text', (delta) => onText(delta));
  const final = await stream.finalMessage();
  if (final.stop_reason === 'refusal') {
    throw new Error('Model odmítl na tuto zprávu odpovědět. Zkus otázku přeformulovat.');
  }
  return final.content
    .filter((b): b is Extract<typeof b, { type: 'text' }> => b.type === 'text')
    .map((b) => b.text)
    .join('');
}

export async function describeAiError(e: unknown): Promise<string> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  if (e instanceof Anthropic.AuthenticationError) return 'Neplatný API klíč. Zkontroluj ho v Nastavení.';
  if (e instanceof Anthropic.PermissionDeniedError) return 'API klíč nemá oprávnění k tomuto modelu.';
  if (e instanceof Anthropic.RateLimitError) return 'Příliš mnoho požadavků – zkus to za chvíli znovu.';
  if (e instanceof Anthropic.BadRequestError) return `Chybný požadavek: ${e.message}`;
  if (e instanceof Anthropic.APIConnectionError) return 'Nepodařilo se připojit k API. Zkontroluj internet.';
  if (e instanceof Anthropic.APIError) return `Chyba API (${e.status}): ${e.message}`;
  if (e instanceof Error) return e.message;
  return 'Neznámá chyba.';
}
