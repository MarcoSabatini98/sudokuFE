import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AmbientDotsComponent } from '../../shared/components/ambient-dots/ambient-dots.component';

interface StatsTile {
  key: 'sudoku' | 'machiavelli' | 'crossword';
  title: string;
  description: string;
  route: string;
  accent: string;
}

@Component({
  selector: 'app-history-and-records',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AmbientDotsComponent],
  templateUrl: './history-and-records.component.html',
  styleUrl: './history-and-records.component.css',
})
export class HistoryAndRecordsComponent {
  readonly games: StatsTile[] = [
    {
      key: 'sudoku',
      title: 'Sudoku',
      description: 'Record e cronologia delle tue partite.',
      route: '/sudoku/stats',
      accent: '#3b82f6',
    },
    {
      key: 'machiavelli',
      title: 'Macchiavelli',
      description: 'Miglior tempo di vittoria e partite giocate.',
      route: '/machiavelli/stats',
      accent: '#10b981',
    },
    {
      key: 'crossword',
      title: 'Cruciverba',
      description: 'Tempi migliori e schemi completati.',
      route: '/crossword/stats',
      accent: '#8b5cf6',
    },
  ];
}
