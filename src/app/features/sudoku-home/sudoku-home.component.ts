import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { DIFFICULTIES, DIFFICULTY_LABELS, type Difficulty } from '../../shared/models/game.model';
import { AmbientMeshComponent } from '../../shared/components/ambient-mesh/ambient-mesh.component';

interface DiffMeta {
  accent: string;
  level: number;
  desc: string;
}

@Component({
  selector: 'app-sudoku-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AmbientMeshComponent],
  templateUrl: './sudoku-home.component.html',
  styleUrl: './sudoku-home.component.css',
})
export class SudokuHomeComponent {
  readonly difficulties = DIFFICULTIES;
  readonly labels = DIFFICULTY_LABELS;
  readonly levels = [1, 2, 3, 4];

  readonly meta: Record<Difficulty, DiffMeta> = {
    easy: { accent: '#10b981', level: 1, desc: 'Tante caselle date, note disponibili.' },
    medium: { accent: '#3b82f6', level: 2, desc: 'Meno aiuti, note ancora disponibili.' },
    hard: { accent: '#f59e0b', level: 3, desc: 'Poche caselle date, niente note.' },
    extreme: { accent: '#ef4444', level: 4, desc: 'La sfida massima, per esperti.' },
  };

  private readonly router = inject(Router);

  startGame(difficulty: Difficulty): void {
    this.router.navigate(['/game'], { queryParams: { difficulty } });
  }
}
