import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import {
  type CrosswordDifficulty,
  CROSSWORD_DIFFICULTIES,
  CROSSWORD_DIFFICULTY_LABELS,
} from '../../shared/models/crossword.model';

interface DiffMeta {
  accent: string;
  level: number;
  desc: string;
}

@Component({
  selector: 'app-crossword-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './crossword-home.component.html',
  styleUrl: './crossword-home.component.css',
})
export class CrosswordHomeComponent {
  readonly difficulties = CROSSWORD_DIFFICULTIES;
  readonly labels = CROSSWORD_DIFFICULTY_LABELS;
  readonly levels = [1, 2, 3];

  readonly meta: Record<CrosswordDifficulty, DiffMeta> = {
    easy: { accent: '#10b981', level: 1, desc: 'Griglia piccola, parole comuni.' },
    medium: { accent: '#3b82f6', level: 2, desc: 'Griglia media, mix di parole.' },
    hard: { accent: '#ef4444', level: 3, desc: 'Griglia grande, anche parole rare.' },
  };

  private readonly router = inject(Router);

  start(difficulty: CrosswordDifficulty): void {
    this.router.navigate(['/crossword/game'], { queryParams: { difficulty } });
  }
}
