import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

import { RecordService } from '../../core/services/record/record.service';
import { DIFFICULTIES, DIFFICULTY_LABELS } from '../../shared/models/game.model';
import { formatTime } from '../../core/utils/time';
import { type Record } from '../../shared/models/record.model';

@Component({
  selector: 'app-records',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatButtonModule, MatCardModule, DatePipe],
  templateUrl: './records.component.html',
  styleUrl: './records.component.css',
})
export class RecordsComponent implements OnInit {
  private readonly recordService = inject(RecordService);

  readonly difficulties = DIFFICULTIES;
  readonly labels = DIFFICULTY_LABELS;
  readonly recordMap = signal<Map<string, Record>>(new Map());
  readonly loading = signal(false);

  ngOnInit(): void {
    this.loading.set(true);
    this.recordService.getAll().subscribe({
      next: (records) => {
        const map = new Map(records.map((r) => [r.difficulty, r]));
        this.recordMap.set(map);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  readonly formatTime = formatTime;
}
