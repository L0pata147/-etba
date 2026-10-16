import type { EduLink } from './ctedu';

/**
 * Videa z jiných zdrojů než ČT edu (YouTube). Každé bylo dohledáno a název odpovídá videu.
 * Přednost mají Mluvící hlavy FF UK (profesoři Filozofické fakulty UK), pak kanály s ucelenými rozbory k maturitě.
 */
const yt = (id: string, title: string, source: string): EduLink => ({ title, url: `https://www.youtube.com/watch?v=${id}`, source: `YouTube – ${source}` });

const FF = 'Mluvící hlavy FF UK';
const OU = 'Online Učitel';
const SS = 'Studijní svět';
const AP = 'Ambryho Projekt';

/** Klíč = název díla (bez diakritiky, malými písmeny – stejně jako eduKey) */
export const OTHER_BOOKS: Record<string, EduLink[]> = {
  krysar: [yt('_THY9i9sB0k', 'Krysař – rozbor díla k maturitě', SS), yt('83hH4bZuwPw', 'Rozbor díla: Krysař – Viktor Dyk', OU)],
  'smrt krasnych srncu': [yt('bI_KSoYkw3k', 'Rozbor díla: Smrt krásných srnců – Ota Pavel', OU), yt('StyK3R3XJ9A', 'Smrt krásných srnců (Ota Pavel) – rozbor knihy k maturitě', AP)],
  'bylo nas pet': [yt('uCxDYroEf7g', 'Rozbor díla: Bylo nás pět – Karel Poláček', OU), yt('mVMPLV7Tdk4', 'Bylo nás pět – Karel Poláček – rozbor díla', 'Lenka Jedličková')],
  'spalovac mrtvol': [yt('F-76Lfw6GN8', 'Spalovač mrtvol (Ladislav Fuks) – děj, postavy, rozbor díla', AP)],
  rur: [yt('gt8vit38KBM', 'Rozbor díla: R.U.R. – Karel Čapek', OU), yt('x1hUYPwobxc', 'R.U.R. – rozbor díla k maturitě', SS)],
  'valka s mloky': [yt('j7Ln6kqtKFM', 'Rozbor díla: Válka s Mloky – Karel Čapek', OU), yt('k3OcEPsIPcE', 'Válka s mloky – rozbor díla k maturitě', SS)],
  'podkoni a zak': [yt('weRGFONreAY', 'Česká literatura do konce 18. století (přehled, zmínka o Podkoním a žákovi)', 'kurz k maturitě')],
  'gulliverovy cesty': [yt('13BWRcZj34g', 'Jonathan Swift – Gulliverovy cesty (ukázka audioknihy)', 'Tympanum')],
  lakomec: [yt('Y3CEDUmXVn4', 'Rozbor díla: Lakomec – Molière', OU), yt('Fn3ItnucLFI', 'Lakomec – rozbor díla k maturitě', SS)],
  'evzen onegin': [yt('D90f3g5LwHs', 'Rozbor díla: Evžen Oněgin (A. S. Puškin)', FF)],
  kytice: [yt('dr1Ek1LHWAQ', 'Rozbor díla: Kytice (K. J. Erben)', FF)],
  maj: [yt('cyybmNWOrfY', 'Rozbor díla: Máj – Karel Hynek Mácha', OU)],
  'farma zvirat': [yt('R5oywK2tmW0', 'Rozbor díla: Farma zvířat – George Orwell', OU), yt('OGKtDcgQN5c', 'Farma zvířat (George Orwell) – rozbor knihy k maturitě', AP)],
  'maly princ': [yt('RujJXonrp_o', 'Rozbor díla: Malý princ – Antoine de Saint-Exupéry', OU), yt('KQEd0zwINWs', 'Malý princ – rozbor díla k maturitě', SS)],
  'starec a more': [yt('qcEq4ayu37M', 'Rozbor díla: Stařec a moře – Ernest Hemingway', OU), yt('e8rE_kxZmc4', 'Stařec a moře – rozbor díla k maturitě', SS)],
  'o mysich a lidech': [yt('WJzDQ-cINlo', 'Rozbor díla: O myších a lidech – John Steinbeck', OU), yt('cCKpXD4-D9A', 'O myších a lidech – rozbor díla k maturitě', SS)],
  'na zapadni fronte klid': [yt('8a_FSi5UNRE', 'Rozbor díla: Na západní frontě klid (E. M. Remarque)', FF), yt('DZtdXIXu4F4', 'Rozbor díla: Na západní frontě klid – Erich Maria Remarque', OU)],
  'mechanicky pomeranc': [yt('uVwurFXW4nY', 'Anthony Burgess – Mechanický pomeranč, maturita z literatury', 'Knihy trochu jinak')],
  'sbohem armado': [yt('Yxxfc9yRdJI', 'Ernest Hemingway – Sbohem, armádo! (ukázka audioknihy)', 'Tympanum')],
  promena: [yt('KdroGM_bCPA', 'Rozbor díla: Proměna (F. Kafka)', FF), yt('rk0EG_BaOm8', 'Rozbor díla: Proměna – Franz Kafka', OU)],
};

/** Klíč = jméno autora */
export const OTHER_AUTHORS: Record<string, EduLink[]> = {};
