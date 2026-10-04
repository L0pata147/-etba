import { describe, expect, it } from 'vitest';
import type { FillQuestion, Question } from '../types';
import { SITE_TOPICS } from '../data/site';
import { ALL_TOPICS } from '../data/subjects';
import { COMMANDS } from '../data/site/commands';
import { PROCEDURES } from '../data/site/procedures';
import {
  GENERATORS,
  broadcastOf,
  generateCalcQuestions,
  generateScenario,
  hostsFor,
  intToIp,
  ipToInt,
  ipv6Compress,
  ipv6Expand,
  maskToPrefix,
  networkOf,
  parseIpv6,
  prefixForHosts,
  prefixToMask,
  vlsmAllocate,
  wildcard,
} from './netgen';
import { checkFillAnswer, normalizeCommand } from './answers';
import { buildSitePool, generateCommandQuestions, generateProcedureQuestions, generateTopicQuestions, itemLabel, topicExamQuestion } from './topicgen';
import { buildSession } from './session';
import { defaultData } from './storage';
import { generatePlan } from './insights';

function validate(q: Question) {
  expect(q.id).toBeTruthy();
  expect(q.prompt.trim().length).toBeGreaterThan(0);
  switch (q.type) {
    case 'abc':
      expect(q.options.length).toBeGreaterThanOrEqual(3);
      expect(new Set(q.options).size).toBe(q.options.length);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      break;
    case 'order':
      expect(q.items.length).toBeGreaterThanOrEqual(3);
      expect(new Set(q.items).size).toBe(q.items.length);
      break;
    case 'open':
      expect(q.points.length).toBeGreaterThan(0);
      for (const p of q.points) expect(p.keywords.length).toBeGreaterThan(0);
      break;
    case 'fill':
    case 'identifyTerm':
      expect(q.accepted.length).toBeGreaterThan(0);
      expect(checkFillAnswer(q as FillQuestion, q.answer)).toBe(true);
      break;
  }
}

describe('IPv4 výpočty', () => {
  it('převody a masky', () => {
    expect(intToIp(ipToInt('192.168.10.77'))).toBe('192.168.10.77');
    expect(prefixToMask(26)).toBe('255.255.255.192');
    expect(prefixToMask(0)).toBe('0.0.0.0');
    expect(wildcard(26)).toBe('0.0.0.63');
    expect(maskToPrefix('255.255.240.0')).toBe(20);
  });
  it('síť, broadcast, hosté', () => {
    const ip = ipToInt('172.16.45.130');
    expect(intToIp(networkOf(ip, 20))).toBe('172.16.32.0');
    expect(intToIp(broadcastOf(ip, 20))).toBe('172.16.47.255');
    expect(hostsFor(24)).toBe(254);
    expect(hostsFor(30)).toBe(2);
    expect(prefixForHosts(50)).toBe(26);
    expect(prefixForHosts(62)).toBe(26);
    expect(prefixForHosts(63)).toBe(25);
    expect(prefixForHosts(2)).toBe(30);
  });
  it('VLSM přiděluje od největší podsítě bez překryvu', () => {
    const subs = vlsmAllocate(ipToInt('192.168.1.0'), [
      { vlan: 10, name: 'A', hosts: 100 },
      { vlan: 20, name: 'B', hosts: 20 },
      { vlan: 99, name: 'C', hosts: 5 },
    ]);
    expect(subs.map((s) => `${s.net}/${s.prefix}`)).toEqual(['192.168.1.0/25', '192.168.1.128/27', '192.168.1.160/29']);
    expect(subs[0].broadcast).toBe('192.168.1.127');
    expect(subs[2].last).toBe('192.168.1.166');
  });
});

describe('IPv6', () => {
  it('zkrácení podle RFC 5952', () => {
    expect(ipv6Compress([0x2001, 0xdb8, 0, 0, 0, 0, 0, 1])).toBe('2001:db8::1');
    expect(ipv6Compress([0x2001, 0xdb8, 0, 1, 0, 0, 0, 1])).toBe('2001:db8:0:1::1');
    expect(ipv6Compress([0x2001, 0xdb8, 0, 0, 1, 0, 0, 1])).toBe('2001:db8::1:0:0:1');
    expect(ipv6Compress([0x2001, 0xdb8, 0, 1, 1, 1, 1, 1])).toBe('2001:db8:0:1:1:1:1:1');
    expect(ipv6Compress([0, 0, 0, 0, 0, 0, 0, 0])).toBe('::');
  });
  it('rozvinutí a parsování', () => {
    expect(ipv6Expand([0x2001, 0xdb8, 0, 0, 0, 0, 0, 1])).toBe('2001:0db8:0000:0000:0000:0000:0000:0001');
    expect(parseIpv6('2001:db8::1')).toEqual([0x2001, 0xdb8, 0, 0, 0, 0, 0, 1]);
    expect(parseIpv6('::')).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    expect(parseIpv6('2001:db8::1::2')).toBeNull();
    expect(parseIpv6('2001:db8:1')).toBeNull();
    expect(parseIpv6('fe80::g')).toBeNull();
  });
});

describe('Generátory výpočtů', () => {
  it('každý typ generuje platné otázky s unikátním id', () => {
    for (let round = 0; round < 30; round++) {
      const qs = generateCalcQuestions(3);
      expect(qs.length).toBe(Object.keys(GENERATORS).length * 3);
      expect(new Set(qs.map((q) => q.id)).size).toBe(qs.length);
      qs.forEach(validate);
    }
  });
});

describe('Kontrola odpovědí', () => {
  it('příkazy – zkratky, sudo, mezery', () => {
    expect(normalizeCommand('  sudo   systemctl restart  ssh ')).toBe('systemctl restart ssh');
    const q = generateCommandQuestions(['cisco']).find((x): x is FillQuestion => x.type === 'fill' && x.answer === 'show ip interface brief');
    expect(q).toBeTruthy();
    expect(checkFillAnswer(q!, 'SHOW IP INTERFACE BRIEF')).toBe(true);
    expect(checkFillAnswer(q!, 'show ip route')).toBe(false);
    expect(checkFillAnswer(q!, '')).toBe(false);
  });
  it('všechny přijatelné zápisy příkazů projdou', () => {
    for (const q of generateCommandQuestions()) {
      validate(q);
      if (q.type === 'fill') for (const a of q.accepted) expect(checkFillAnswer(q, a)).toBe(true);
    }
  });
  it('přesné odpovědi (adresy)', () => {
    const q: FillQuestion = { id: 'x', bookId: 'site-vypocty', area: 'it-vypocty', factKey: 'x', difficulty: 'medium', prompt: 'p', explanation: '', type: 'fill', answer: '10.0.0.0', accepted: ['10.0.0.0', '10.0.0.0/8'], exact: true };
    expect(checkFillAnswer(q, ' 10.0.0.0 ')).toBe(true);
    expect(checkFillAnswer(q, '10.0.0.1')).toBe(false);
    expect(checkFillAnswer(q, '10.0.0')).toBe(false);
  });
});

describe('Témata a otázky ze sítí', () => {
  it('20 témat s unikátními id a čísly 1–20', () => {
    expect(SITE_TOPICS.length).toBe(20);
    expect(new Set(SITE_TOPICS.map((t) => t.id)).size).toBe(20);
    expect(SITE_TOPICS.map((t) => t.number)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
    for (const t of SITE_TOPICS) {
      expect(t.outline.length).toBeGreaterThanOrEqual(3);
      expect(t.terms.length).toBeGreaterThanOrEqual(3);
      expect(t.quiz.length).toBeGreaterThanOrEqual(2);
      for (const q of t.quiz) expect(q.wrong).not.toContain(q.a);
    }
  });
  it('generované otázky jsou platné a id unikátní', () => {
    for (const t of SITE_TOPICS) {
      const qs = generateTopicQuestions(t);
      expect(new Set(qs.map((q) => q.id)).size).toBe(qs.length);
      qs.forEach(validate);
      expect(topicExamQuestion(t).points.length).toBe(t.outline.length);
      expect(itemLabel(t.id)).toContain(t.title);
    }
  });
  it('postupy, příkazy a scénáře', () => {
    expect(new Set(COMMANDS.map((c) => c.id)).size).toBe(COMMANDS.length);
    expect(new Set(PROCEDURES.map((p) => p.id)).size).toBe(PROCEDURES.length);
    generateProcedureQuestions().forEach(validate);
    for (const os of ['linux', 'windows'] as const) {
      const s = generateScenario(os);
      expect(s.os).toBe(os);
      expect(s.ptTasks.length).toBeGreaterThan(5);
      expect(s.osTasks.length).toBeGreaterThan(4);
      for (const t of [...s.ptTasks, ...s.osTasks]) {
        expect(t.solution).not.toMatch(/undefined|NaN/);
        expect(t.detail).not.toMatch(/undefined|NaN/);
      }
    }
  });
  it('sestavení tréninku ze sítí', () => {
    const data = defaultData();
    const all = buildSitePool({ commands: ['cisco', 'linux', 'windows'], procedures: true, calc: true });
    expect(all.length).toBeGreaterThan(500);
    const session = buildSession(data, { title: 't', mode: 'm', difficulty: 'medium', bookIds: [], areas: [], types: [], count: 20, subject: 'site', site: { topicIds: [SITE_TOPICS[0].id] } });
    expect(session.length).toBeGreaterThan(5);
    expect(session.every((q) => q.bookId === SITE_TOPICS[0].id)).toBe(true);
    const mixed = buildSession(data, { title: 't', mode: 'm', difficulty: 'medium', bookIds: [], areas: [], types: [], count: 30, subject: 'all', site: { calc: true } });
    expect(mixed.some((q) => q.bookId.startsWith('site-'))).toBe(true);
    expect(mixed.some((q) => !q.bookId.startsWith('site-'))).toBe(true);
    const cjl = buildSession(data, { title: 't', mode: 'm', difficulty: 'medium', bookIds: [], areas: [], types: [], count: 30 });
    expect(cjl.some((q) => q.bookId.startsWith('site-'))).toBe(false);
  });
  it('studijní plán rozdělí všechna témata IT předmětů', () => {
    const data = defaultData();
    const d = new Date();
    d.setDate(d.getDate() + 60);
    const plan = generatePlan(data, d.toISOString().slice(0, 10));
    const ids = plan.weeks.flatMap((w) => w.topicIds ?? []);
    expect(new Set(ids).size).toBe(ALL_TOPICS.length);
    for (const t of SITE_TOPICS) expect(ids).toContain(t.id);
  });
});
