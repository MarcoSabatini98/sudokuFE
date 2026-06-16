import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';

interface GameTile {
  key: 'sudoku' | 'machiavelli' | 'crossword';
  title: string;
  description: string;
  route: string;
  badge?: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule],
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
    },
    {
      key: 'machiavelli',
      title: 'Macchiavelli',
      description: 'Gioco di carte: tu contro 3 bot.',
      route: '/machiavelli',
    },
    {
      key: 'crossword',
      title: 'Cruciverba',
      description: 'Schemi a parole incrociate con definizioni.',
      route: '/crossword',
    },
  ];

  open(game: GameTile): void {
    this.router.navigate([game.route]);
  }
}
