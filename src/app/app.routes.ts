import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'sudoku',
    loadComponent: () =>
      import('./features/sudoku-home/sudoku-home.component').then((m) => m.SudokuHomeComponent),
  },
  {
    path: 'machiavelli',
    loadComponent: () =>
      import('./features/machiavelli-home/machiavelli-home.component').then(
        (m) => m.MachiavelliHomeComponent
      ),
  },
  {
    path: 'machiavelli/game',
    loadComponent: () =>
      import('./features/machiavelli/machiavelli.component').then((m) => m.MachiavelliComponent),
  },
  {
    path: 'machiavelli/stats',
    loadComponent: () =>
      import('./features/machiavelli-stats/machiavelli-stats.component').then(
        (m) => m.MachiavelliStatsComponent
      ),
  },
  {
    path: 'crossword',
    loadComponent: () =>
      import('./features/crossword-home/crossword-home.component').then(
        (m) => m.CrosswordHomeComponent
      ),
  },
  {
    path: 'crossword/game',
    loadComponent: () =>
      import('./features/crossword/crossword.component').then((m) => m.CrosswordComponent),
  },
  {
    path: 'crossword/stats',
    loadComponent: () =>
      import('./features/crossword-stats/crossword-stats.component').then(
        (m) => m.CrosswordStatsComponent
      ),
  },
  {
    path: 'game',
    loadComponent: () =>
      import('./features/game/game.component').then((m) => m.GameComponent),
  },
  {
    path: 'sudoku/stats',
    loadComponent: () =>
      import('./features/sudoku-stats/sudoku-stats.component').then((m) => m.SudokuStatsComponent),
  },
  {
    path: 'history-and-records',
    loadComponent: () =>
      import('./features/history-and-records/history-and-records.component').then(
        (m) => m.HistoryAndRecordsComponent
      ),
  },
  { path: '**', redirectTo: '' },
];
