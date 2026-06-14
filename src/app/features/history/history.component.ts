import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';

import { GameService } from '../../core/services/game/game.service';
import { type Difficulty, DIFFICULTIES, DIFFICULTY_LABELS, type Game } from '../../shared/models/game.model';
import { type PaginatedData } from '../../shared/models/api-response.model';

@Component({
  selector: 'app-history',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatButtonModule, MatCardModule, MatSelectModule, MatTableModule, MatChipsModule],
  templateUrl: './history.component.html',
  styleUrl: './history.component.css',
})
export class HistoryComponent implements OnInit {
  private readonly gameService = inject(GameService);

  readonly difficulties = DIFFICULTIES;
  readonly labels = DIFFICULTY_LABELS;

  getLabel(d: string): string {
    return this.labels[d as Difficulty] ?? d;
  }
  readonly displayedColumns = ['played_at', 'difficulty', 'time_seconds', 'completed'];

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

  formatTime(s: number): string {
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('it-IT');
  }
}
