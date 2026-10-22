import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CrosswordService } from '../../core/services/crossword/crossword.service';
import {
  CROSSWORD_DIFFICULTIES,
  CROSSWORD_DIFFICULTY_LABELS,
  type CrosswordDifficulty,
  type CrosswordGame,
} from '../../shared/models/crossword.model';
import { type PaginatedData } from '../../shared/models/api-response.model';
import { formatTime } from '../../core/utils/time';
import { AmbientMeshComponent } from '../../shared/components/ambient-mesh/ambient-mesh.component';

@Component({
  selector: 'app-crossword-stats',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AmbientMeshComponent],
  templateUrl: './crossword-stats.component.html',
  styleUrl: './crossword-stats.component.css',
})
export class CrosswordStatsComponent implements OnInit {
  private readonly service = inject(CrosswordService);

  readonly difficulties = CROSSWORD_DIFFICULTIES;
  readonly labels = CROSSWORD_DIFFICULTY_LABELS;
  readonly accents: Record<CrosswordDifficulty, string> = {
    easy: '#10b981',
    medium: '#3b82f6',
    hard: '#f59e0b',
  };

  readonly recordMap = signal<Map<string, number>>(new Map());
  readonly result = signal<PaginatedData<CrosswordGame> | null>(null);
  readonly loading = signal(false);
  readonly selectedDifficulty = signal<CrosswordDifficulty | ''>('');

  ngOnInit(): void {
    this.loadRecords();
    this.loadHistory();
  }

  private loadRecords(): void {
    this.service.getRecords().subscribe({
      next: (records) => this.recordMap.set(new Map(records.map((r) => [r.difficulty, r.best_time_seconds]))),
      error: () => undefined,
    });
  }

  loadHistory(page = 1): void {
    this.loading.set(true);
    const diff = this.selectedDifficulty();
    this.service
      .getHistory({ ...(diff ? { difficulty: diff } : {}), page, limit: 15 })
      .subscribe({
        next: (data) => {
          this.result.set(data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onDifficultyChange(diff: CrosswordDifficulty | ''): void {
    this.selectedDifficulty.set(diff);
    this.loadHistory();
  }

  getLabel(d: string): string {
    return this.labels[d as CrosswordDifficulty] ?? d;
  }

  readonly formatTime = formatTime;

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('it-IT');
  }
}
