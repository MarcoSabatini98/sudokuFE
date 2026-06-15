import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

import { DIFFICULTIES, DIFFICULTY_LABELS, type Difficulty } from '../../shared/models/game.model';

@Component({
  selector: 'app-sudoku-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatButtonModule, MatCardModule],
  templateUrl: './sudoku-home.component.html',
  styleUrl: './sudoku-home.component.css',
})
export class SudokuHomeComponent {
  readonly difficulties = DIFFICULTIES;
  readonly labels = DIFFICULTY_LABELS;

  private readonly router = inject(Router);

  startGame(difficulty: Difficulty): void {
    this.router.navigate(['/game'], { queryParams: { difficulty } });
  }
}
