import { describe, expect, it } from 'vitest';
import { CLICK_GROUPS, CLICK_TASKS, SHOT_URL } from '../data/site/clicks';
import { SHOT_H, SHOT_W, answerLabel, checkChecks, checkChoice, checkInput, checkShot, clickScore } from './clicks';

describe('Klikací trénink Windows Serveru', () => {
  it('data úloh jsou konzistentní', () => {
    expect(new Set(CLICK_TASKS.map((t) => t.id)).size).toBe(CLICK_TASKS.length);
    expect(CLICK_TASKS.length).toBeGreaterThanOrEqual(20);
    expect(CLICK_GROUPS.length).toBeGreaterThanOrEqual(5);
    for (const t of CLICK_TASKS) {
      expect(t.steps.length, t.id).toBeGreaterThanOrEqual(2);
      for (const [k, s] of t.steps.entries()) {
        const where = `${t.id}#${k + 1}`;
        expect(s.ask.trim(), where).not.toBe('');
        expect(answerLabel(s).trim(), where).not.toBe('');
        if (s.kind === 'shot') {
          expect(SHOT_URL[s.shot!], where).toBeTruthy();
          expect(s.spots?.length, where).toBeGreaterThan(0);
          for (const [x, y, w, h] of s.spots!) {
            expect(x >= 0 && y >= 0 && w > 0 && h > 0 && x + w <= SHOT_W && y + h <= SHOT_H, where).toBe(true);
            expect(checkShot(s, x + w / 2, y + h / 2), where).toBe(true);
          }
          expect(checkShot(s, 2, SHOT_H - 2), where).toBe(false);
        } else if (s.kind === 'input') {
          expect(s.label, where).toBeTruthy();
          expect(s.accept?.length, where).toBeGreaterThan(0);
          expect(checkInput(s, String(s.answer)), where).toBe(true);
          expect(checkInput(s, ''), where).toBe(false);
        } else if (s.kind === 'check') {
          const ans = s.answer as string[];
          expect(Array.isArray(ans), where).toBe(true);
          for (const a of ans) expect(s.options, where).toContain(a);
          expect(checkChecks(s, [...ans].reverse()), where).toBe(true);
          expect(checkChecks(s, s.options!), where).toBe(s.options!.length === ans.length);
        } else {
          expect(s.options, where).toContain(s.answer);
          expect(new Set(s.options).size, where).toBe(s.options!.length);
          expect(checkChoice(s, s.answer as string), where).toBe(true);
        }
      }
    }
  });

  it('kontrola odpovědí a skóre', () => {
    const profil = CLICK_TASKS.find((t) => t.id === 'k-profil')!.steps[1];
    expect(checkInput(profil, '\\\\server\\profily\\%username%')).toBe(true);
    expect(checkInput(profil, '\\\\SERVER\\profily%USERNAME%')).toBe(false);
    const ip = CLICK_TASKS.find((t) => t.id === 'k-ip-nazev')!.steps.find((s) => s.label === 'IP adresa:')!;
    expect(checkInput(ip, ' 192.168.0.1 ')).toBe(true);
    expect(checkInput(ip, '192.168.0.2')).toBe(false);
    const named = CLICK_TASKS.find((t) => t.id === 'k-gpo-panely')!.steps.find((s) => s.accept?.includes('*'))!;
    expect(checkInput(named, 'Cokoli')).toBe(true);
    expect(clickScore([0, 1, 0, 2])).toBe(0.5);
    // DHCP je v Nástrojích jen tam, kde už je role nainstalovaná
    const toolLists = CLICK_TASKS.flatMap((t) => t.steps.filter((s) => s.window === 'Správce serveru – Nástroje').map((s) => [t.id, s] as const));
    for (const [id, s] of toolLists) expect(s.options!.includes('DHCP'), id).toBe(id === 'k-dhcp');
  });

  it('bez PowerShellu a s menu Správa (ne „Spravovat“)', () => {
    const text = JSON.stringify(CLICK_TASKS);
    expect(text).not.toMatch(/\b(New|Set|Get|Add|Install)-[A-Z][A-Za-z]+|PowerShell/);
    expect(text).not.toMatch(/Spravovat/);
    expect(CLICK_TASKS.find((t) => t.id === 'k-role')!.steps[0].options).toEqual(['Správa', 'Nástroje', 'Zobrazení', 'Nápověda']);
  });
});
