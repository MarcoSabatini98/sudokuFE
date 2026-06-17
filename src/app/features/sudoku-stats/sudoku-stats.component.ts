import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { GameService } from '../../core/services/game/game.service';
import { RecordService } from '../../core/services/record/record.service';
import {
  type Difficulty,
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  type Game,
} from '../../shared/models/game.model';
import { type Record as GameRecord } from '../../shared/models/record.model';
import { type PaginatedData } from '../../shared/models/api-response.model';
import { formatTime } from '../../core/utils/time';
import { AmbientMeshComponent } from '../../shared/components/ambient-mesh/ambient-mesh.component';

@Component({
  selector: 'app-sudoku-stats',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AmbientMeshComponent],
  templateUrl: './sudoku-stats.component.html',
  styleUrl: './sudoku-stats.component.css',
})
export class SudokuStatsComponent implements OnInit {
  private readonly gameService = inject(GameService);
  private readonly recordService = inject(RecordService);

  readonly difficulties = DIFFICULTIES;
  readonly labels = DIFFICULTY_LABELS;
  readonly accents: Record<Difficulty, string> = {
    easy: '#10b981',
    medium: '#3b82f6',
    hard: '#f59e0b',
    extreme: '#ef4444',
  };

  readonly recordMap = signal<Map<string, GameRecord>>(new Map());
  readonly result = signal<PaginatedData<Game> | null>(null);
  readonly loading = signal(false);
  readonly selectedDifficulty = signal<Difficulty | ''>('');

  ngOnInit(): void {
    this.loadRecords();
    this.loadHistory();
  }

  private loadRecords(): void {
    this.recordService.getAll().subscribe({
      next: (records) => this.recordMap.set(new Map(records.map((r) => [r.difficulty, r]))),
      error: () => undefined,
    });
  }

  loadHistory(page = 1): void {
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
    this.loadHistory();
  }

  getLabel(d: string): string {
    return this.labels[d as Difficulty] ?? d;
  }

  readonly formatTime = formatTime;

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('it-IT');
  }
}
