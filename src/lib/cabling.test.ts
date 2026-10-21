import { describe, expect, it } from 'vitest';
import { CABLING_TASKS } from '../data/site/cabling';
import { MODEL_INFO, checkCabling, dceEnd, ethernetCable, expectedCable, portFits, portKind, type CableType, type CablingTask, type Link } from './cabling';

/** Správné zapojení úlohy podle pravidel (pro test dat) */
function solve(task: CablingTask): Link[] {
  const used = new Map<string, Set<string>>();
  const free = (id: string, want: (p: string) => boolean) => {
    const d = task.devices.find((x) => x.id === id)!;
    const u = used.get(id) ?? new Set();
    used.set(id, u);
    const p = MODEL_INFO[d.model].ports.find((x) => !u.has(x) && want(x))!;
    u.add(p);
    return p;
  };
  // nejdřív porty určené zadáním
  for (const r of task.links) {
    if (r.aPort) (used.get(r.a) ?? used.set(r.a, new Set()).get(r.a)!).add(r.aPort);
    if (r.bPort) (used.get(r.b) ?? used.set(r.b, new Set()).get(r.b)!).add(r.bPort);
  }
  return task.links.map((r, i) => {
    const model = (id: string) => task.devices.find((x) => x.id === id)!.model;
    const aPort = r.aPort ?? free(r.a, (p) => portKind(p) === 'ethernet');
    const bPort = r.bPort ?? free(r.b, (p) => portKind(p) === 'ethernet');
    const need = expectedCable(model(r.a), aPort, model(r.b), bPort);
    const cable: CableType = need === 'serial' ? (r.dce === r.b ? 'serial-dte' : 'serial-dce') : need!;
    return { id: `l${i}`, cable, a: r.a, aPort, b: r.b, bPort };
  });
}

describe('Stavebnice topologie', () => {
  it('pravidla kabelů', () => {
    expect(ethernetCable('pc', 'switch')).toBe('rovny');
    expect(ethernetCable('router', 'switch')).toBe('rovny');
    expect(ethernetCable('pc', 'pc')).toBe('krizeny');
    expect(ethernetCable('switch', 'switch')).toBe('krizeny');
    expect(ethernetCable('router', 'router-serial')).toBe('krizeny');
    expect(ethernetCable('pc', 'router')).toBe('krizeny');
    expect(expectedCable('pc', 'RS 232', 'router', 'Console')).toBe('konzolovy');
    expect(expectedCable('router-serial', 'Serial0/0/0', 'router-serial', 'Serial0/0/1')).toBe('serial');
    expect(portFits('konzolovy', 'FastEthernet0')).toBe(false);
    expect(portFits('rovny', 'Console')).toBe(false);
    expect(portFits('serial-dce', 'Serial0/0/0')).toBe(true);
    expect(MODEL_INFO.router.ports.some((p) => p.startsWith('Serial'))).toBe(false);
    expect(dceEnd({ id: 'x', cable: 'serial-dte', a: 'R1', aPort: 'Serial0/0/0', b: 'R2', bPort: 'Serial0/0/0' })).toBe('R2');
  });

  it('data úloh jsou konzistentní a řešitelná', () => {
    expect(new Set(CABLING_TASKS.map((t) => t.id)).size).toBe(CABLING_TASKS.length);
    for (const t of CABLING_TASKS) {
      const ids = new Set(t.devices.map((d) => d.id));
      for (const r of t.links) {
        expect(ids.has(r.a) && ids.has(r.b), t.id).toBe(true);
        for (const [d, p] of [
          [r.a, r.aPort],
          [r.b, r.bPort],
        ] as const)
          if (p) expect(MODEL_INFO[t.devices.find((x) => x.id === d)!.model].ports, `${t.id} ${d}`).toContain(p);
      }
      const res = checkCabling(t, solve(t));
      expect(res.issues, t.id).toEqual([]);
      expect(res.ok && res.correct === t.links.length, t.id).toBe(true);
    }
  });

  it('kontrola najde špatný kabel, port, DCE, chybějící i navíc', () => {
    const t = CABLING_TASKS.find((x) => x.id === 'seriova-linka')!;
    const good = solve(t);
    const wrongCable = good.map((l) => (l.a === 'PC1' ? { ...l, cable: 'krizeny' as CableType } : l));
    expect(checkCabling(t, wrongCable).issues.map((i) => i.kind)).toEqual(['cable']);
    const wrongDce = good.map((l) => (l.a === 'R1' && l.b === 'R2' ? { ...l, cable: 'serial-dte' as CableType } : l));
    expect(checkCabling(t, wrongDce).issues.map((i) => i.kind)).toEqual(['dce']);
    const wrongPort = good.map((l) => (l.a === 'R1' && l.b === 'SW1' ? { ...l, aPort: 'GigabitEthernet0/2' } : l));
    expect(checkCabling(t, wrongPort).issues.map((i) => i.kind)).toEqual(['port']);
    const missing = checkCabling(t, good.slice(1));
    expect(missing.issues.map((i) => i.kind)).toEqual(['missing']);
    expect(missing.correct).toBe(t.links.length - 1);
    const extra = checkCabling(t, [...good, { id: 'x', cable: 'krizeny', a: 'SW1', aPort: 'GigabitEthernet0/1', b: 'SW2', bPort: 'GigabitEthernet0/1' }]);
    expect(extra.issues.map((i) => i.kind)).toEqual(['extra']);
    // obrácené pořadí konců u ethernetu nevadí
    const flipped = good.map((l) => (l.cable === 'rovny' ? { ...l, a: l.b, aPort: l.bPort, b: l.a, bPort: l.aPort } : l));
    expect(checkCabling(t, flipped).ok).toBe(true);
  });
});
