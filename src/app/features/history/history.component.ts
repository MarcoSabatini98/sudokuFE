import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { GameService } from '../../core/services/game/game.service';
import { type Difficulty, DIFFICULTIES, DIFFICULTY_LABELS, type Game } from '../../shared/models/game.model';
import { type PaginatedData } from '../../shared/models/api-response.model';
import { formatTime } from '../../core/utils/time';

@Component({
  selector: 'app-history',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './history.component.html',
  styleUrl: './history.component.css',
})
export class HistoryComponent implements OnInit {
  private readonly gameService = inject(GameService);

  readonly difficulties = DIFFICULTIES;
  readonly labels = DIFFICULTY_LABELS;
  readonly accents: Record<string, string> = {
    easy: '#10b981',
    medium: '#3b82f6',
    hard: '#f59e0b',
    extreme: '#ef4444',
  };

  getLabel(d: string): string {
    return this.labels[d as Difficulty] ?? d;
  }

  readonly result = signal<PaginatedData<Game> | null>(null);
  readonly loading = signal(false);
  readonly selectedDifficulty = signal<Difficulty | ''>('');

  ngOnInit(): void {
    this.load();
  }

  load(page = 1): void {
    this.loading.set(true);
    const diff = this.selectedDifficulty();
    this.gameService
      .getAll({ ...(diff ? { difficulty: diff } : {}), page, limit: 15 })
      .subscribe({
        next: (data) => {
          this.result.set(data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onDifficultyChange(diff: Difficulty | ''): void {
    this.selectedDifficulty.set(diff);
    this.load();
  }

  readonly formatTime = formatTime;

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('it-IT');
  }
}
