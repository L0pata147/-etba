import { HW_TOPICS_1 } from './topics1';
import { HW_TOPICS_2 } from './topics2';
import { HW_TOPICS_3 } from './topics3';

/**
 * Okruhy z Technického vybavení počítačů.
 * Rozdělení podle maturitního zadání (historie, jednotky a soustavy, vstupní a výstupní zařízení,
 * polohovací zařízení, základní deska, zdroj, CPU, paměť, komunikační rozhraní),
 * obsah podle učitelova textu „Architektura a hardware osobních počítačů“.
 */
export const HW_TOPICS = [...HW_TOPICS_1, ...HW_TOPICS_2, ...HW_TOPICS_3];

/** Od tohoto čísla jsou okruhy z učitelova textu, které maturitní zadání výslovně nejmenuje */
export const HW_EXTRA_FROM = 20;
