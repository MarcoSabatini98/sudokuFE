import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import {
  type BotDifficulty,
  BOT_DIFFICULTIES,
  BOT_DIFFICULTY_LABELS,
} from '../../core/constants/machiavelli.constants';

interface DiffMeta {
  accent: string;
  level: number;
  desc: string;
}

@Component({
  selector: 'app-machiavelli-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './machiavelli-home.component.html',
  styleUrl: './machiavelli-home.component.css',
})
export class MachiavelliHomeComponent {
  readonly difficulties = BOT_DIFFICULTIES;
  readonly labels = BOT_DIFFICULTY_LABELS;
  readonly levels = [1, 2, 3];

  readonly meta: Record<BotDifficulty, DiffMeta> = {
    easy: { accent: '#10b981', level: 1, desc: 'Mosse rapide, gioco semplice.' },
    medium: { accent: '#3b82f6', level: 2, desc: 'Avversari equilibrati.' },
    hard: { accent: '#ef4444', level: 3, desc: 'Esperti: riusano i jolly e spezzano le scale.' },
  };

  private readonly router = inject(Router);

  start(difficulty: BotDifficulty): void {
    this.router.navigate(['/machiavelli/game'], { queryParams: { difficulty } });
  }
}
