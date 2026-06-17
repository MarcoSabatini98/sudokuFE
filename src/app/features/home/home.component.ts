import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

interface GameTile {
  key: 'sudoku' | 'machiavelli' | 'crossword';
  title: string;
  description: string;
  route: string;
  /** Colore d'accento della card (usato come CSS var --accent). */
  accent: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  private readonly router = inject(Router);

  readonly games: GameTile[] = [
    {
      key: 'sudoku',
      title: 'Sudoku',
      description: 'Quattro difficoltà, timer, note e record.',
      route: '/sudoku',
      accent: '#3b82f6',
    },
    {
      key: 'machiavelli',
      title: 'Macchiavelli',
      description: 'Gioco di carte: tu contro 3 bot.',
      route: '/machiavelli',
      accent: '#10b981',
    },
    {
      key: 'crossword',
      title: 'Cruciverba',
      description: 'Schemi a parole incrociate con definizioni.',
      route: '/crossword',
      accent: '#8b5cf6',
    },
  ];

  open(game: GameTile): void {
    this.router.navigate([game.route]);
  }
}
