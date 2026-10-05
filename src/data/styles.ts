/** Funkční styly – podle školní tabulky k analýze neuměleckého textu */

export interface FunctionalStyle {
  id: string;
  name: string;
  features: string[];
  procedures: string[];
  forms: string[];
}

export const FUNCTIONAL_STYLES: FunctionalStyle[] = [
  {
    id: 'prostesdelovaci',
    name: 'prostě sdělovací',
    features: ['hovorová čeština', 'uvolněná větná stavba', 'běžná komunikace mezi lidmi', 'hodnoticí výrazy', 'spontánnost', 'parazitní výrazy', 'odchylky od normy (spisovnost, pravopis)'],
    procedures: ['informační'],
    forms: ['zpráva', 'oznámení', 'dopis', 'SMS', 'chat', 'běžný hovor'],
  },
  {
    id: 'odborny',
    name: 'odborný',
    features: ['odborné názvy (terminologie)', 'cizí slova', 'neutrální výrazy', 'věcná správnost', 'objektivnost', 'přesnost', 'přehlednost', 'jednoznačnost', 'fakta', 'citace', 'typické předložky (v důsledku…, bez ohledu na…, za účelem…)', 'slovesná sousloví (podat oznámení)'],
    procedures: ['popisný', 'výkladový'],
    forms: ['popis', 'výklad', 'referát', 'esej', 'recenze', 'kritika', 'přednáška'],
  },
  {
    id: 'umelecky',
    name: 'umělecký',
    features: ['široká a pestrá slovní zásoba', 'knižní výrazy', 'básnické prostředky (neologismy, metafory, metonymie, personifikace ad.)'],
    procedures: ['vyprávěcí', 'popisný', 'úvahový'],
    forms: ['anekdota', 'pohádka', 'povídka', 'novela', 'román', 'báseň', 'poema', 'pásmo'],
  },
  {
    id: 'publicisticky',
    name: 'publicistický',
    features: ['fráze – ustálená spojení', 'expresivní a emocionální výrazy', 'srozumitelnost', 'aktuálnost', 'poutavost', 'zajímavost'],
    procedures: ['informační', 'úvahový', 'popisný', 'výkladový'],
    forms: ['zpravodajství (tisk, rozhlas, televize, internet)', 'inzerát (profesionální)', 'reklama', 'recenze', 'kritika', 'reportáž', 'úvodník', 'komentář', 'fejeton'],
  },
  {
    id: 'administrativni',
    name: 'administrativní',
    features: ['jednoznačné pojmy', 'formuláře', 'zkratky a zkratková slova', 'neutrální výrazy', 'ustálená forma', 'spisovný jazyk'],
    procedures: ['informační'],
    forms: ['úřední oznámení', 'úřední dopis', 'životopis', 'motivační dopis', 'formulář', 'dotazník', 'inzerát (laický)'],
  },
];
