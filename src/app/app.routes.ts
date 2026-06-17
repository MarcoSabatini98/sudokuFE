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
    path: 'game',
    loadComponent: () =>
      import('./features/game/game.component').then((m) => m.GameComponent),
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./features/history/history.component').then((m) => m.HistoryComponent),
  },
  {
    path: 'records',
    loadComponent: () =>
      import('./features/records/records.component').then((m) => m.RecordsComponent),
  },
  { path: '**', redirectTo: '' },
];
