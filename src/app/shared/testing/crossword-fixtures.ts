import { Crossword } from '../models/crossword.model';

/**
 * Mini cruciverba per i test: CANE (orizzontale) e CASA (verticale) che si
 * incrociano sulla C in (0,0).
 */
export function mockCrossword(): Crossword {
  return {
    rows: 4,
    cols: 4,
    cells: [
      [
        { solution: 'C', number: 1 },
        { solution: 'A', number: null },
        { solution: 'N', number: null },
        { solution: 'E', number: null },
      ],
      [{ solution: 'A', number: null }, null, null, null],
      [{ solution: 'S', number: null }, null, null, null],
      [{ solution: 'A', number: null }, null, null, null],
    ],
    entries: [
      { number: 1, direction: 'across', row: 0, col: 0, length: 4, clue: 'Animale che abbaia', answer: 'CANE' },
      { number: 1, direction: 'down', row: 0, col: 0, length: 4, clue: 'Dove si abita', answer: 'CASA' },
    ],
  };
}
