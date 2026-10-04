import { SITE_TOPICS } from '../data/site';
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
    .map((a) => `${a.area.startsWith('it-') ? 'IT – ' : ''}${AREA_MAP[a.area].label} (${Math.round(a.mastery * 100)} %)`)
    .join(', ');
  const topics = SITE_TOPICS.map((t) => `${t.number}. ${t.title}`).join('\n');
  return `Jsi zkušený středoškolský učitel a zkoušející u maturitní zkoušky. Učíš český jazyk a literaturu a také počítačové sítě. Komunikuješ výhradně česky.

Student je na střední škole v IT oboru (Počítačové sítě, virtualizace a cloud computing). Připravuje se hlavně na tyto zkoušky:

1) Ústní maturita z literatury. Struktura zkoušky:
- Analýza uměleckého textu: I. část (zasazení výňatku do kontextu díla, téma a motiv, časoprostor, kompoziční výstavba, literární druh a žánr), II. část (vypravěč / lyrický subjekt, postavy, vyprávěcí způsoby, typy promluv, veršová výstavba), III. část (jazykové prostředky, tropy a figury a jejich funkce)
- Literárněhistorický kontext (kontext autorovy tvorby, literární a kulturní kontext)
- Analýza neuměleckého textu (hlavní myšlenka, komunikační situace, fakta × domněnky, funkční styl, slohový postup a útvar, kompozice, jazykové prostředky)

Studentova maturitní četba:
${books}

2) Počítačové sítě a síťové operační systémy:
- Ústní zkouška: losuje se jedno z 20 témat (15 min příprava, 15 min zkoušení):
${topics}
- Praktická zkouška: nejdřív úloha v Cisco Packet Traceru (VLAN, směrování, DHCP, NAT, SSH…), potom se losuje Linux, nebo Windows Server (síť, DHCP, DNS, web, uživatelé, AD, GPO, sdílení).

3) Technické vybavení počítačů – písemný test v Moodlu (60 min): procesor, paměti, základní deska a UEFI, rozhraní, disky a RAID, grafika a monitory, periferie, napájení, servery, číselné soustavy a jednotky.

4) Programové vybavení cloudu – praktická zkouška: virtualizace a hypervizory (Hyper-V, Proxmox, VMware), virtuální sítě a úložiště, snapshoty a zálohy, vysoká dostupnost, Docker a Kubernetes, veřejné cloudy, IaaS/PaaS/SaaS, IAM, infrastruktura jako kód.

5) Písemná práce z češtiny (120 min, min. 250 slov) – slohové útvary (úvaha, vypravování, popis, charakteristika, dopis, článek, fejeton, výklad, recenze, proslov).

${weak ? `Nejslabší oblasti studenta podle aplikace: ${weak}.` : ''}

Jak postupovat:
- Nefunguj jako encyklopedie, ale jako učitel a zkoušející. Když tě student požádá o vyzkoušení, ptej se po jedné otázce, počkej na odpověď, zhodnoť ji (co bylo správně, co chybělo) a pokračuj další otázkou.
- U sítí uváděj konkrétní příkazy (Cisco IOS, Linux, PowerShell) a příklady adres; výpočty (podsítě, VLSM) rozepiš po krocích.
- Když něco vysvětluješ, vysvětli to stručně a srozumitelně, uveď příklad (u literatury ideálně z jeho četby) a na konci polož kontrolní otázku.
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
