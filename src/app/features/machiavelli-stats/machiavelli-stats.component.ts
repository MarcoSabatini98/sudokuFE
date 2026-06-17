import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MachiavelliApiService } from '../../core/services/machiavelli/machiavelli-api.service';
import {
  BOT_DIFFICULTIES,
  BOT_DIFFICULTY_LABELS,
  type BotDifficulty,
} from '../../core/constants/machiavelli.constants';
import { type MachiavelliGame } from '../../shared/models/machiavelli-game.model';
import { type PaginatedData } from '../../shared/models/api-response.model';
import { formatTime } from '../../core/utils/time';
import { AmbientMeshComponent } from '../../shared/components/ambient-mesh/ambient-mesh.component';

@Component({
  selector: 'app-machiavelli-stats',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AmbientMeshComponent],
  templateUrl: './machiavelli-stats.component.html',
  styleUrl: './machiavelli-stats.component.css',
})
export class MachiavelliStatsComponent implements OnInit {
  private readonly api = inject(MachiavelliApiService);

  readonly difficulties = BOT_DIFFICULTIES;
  readonly labels = BOT_DIFFICULTY_LABELS;
  readonly accents: Record<BotDifficulty, string> = {
    easy: '#10b981',
    medium: '#3b82f6',
    hard: '#f59e0b',
  };

  readonly recordMap = signal<Map<string, number>>(new Map());
  readonly result = signal<PaginatedData<MachiavelliGame> | null>(null);
  readonly loading = signal(false);
  readonly selectedDifficulty = signal<BotDifficulty | ''>('');

  ngOnInit(): void {
    this.loadRecords();
    this.loadHistory();
  }

  private loadRecords(): void {
    this.api.getRecords().subscribe({
      next: (records) => this.recordMap.set(new Map(records.map((r) => [r.bot_difficulty, r.best_time_seconds]))),
      error: () => undefined,
    });
  }

  loadHistory(page = 1): void {
    this.loading.set(true);
    const diff = this.selectedDifficulty();
    this.api
      .getHistory({ ...(diff ? { bot_difficulty: diff } : {}), page, limit: 15 })
      .subscribe({
        next: (data) => {
          this.result.set(data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onDifficultyChange(diff: BotDifficulty | ''): void {
    this.selectedDifficulty.set(diff);
    this.loadHistory();
  }

  getLabel(d: string): string {
    return this.labels[d as BotDifficulty] ?? d;
  }

  readonly formatTime = formatTime;

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('it-IT');
  }
}
