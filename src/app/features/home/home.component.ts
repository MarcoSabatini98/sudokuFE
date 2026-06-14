import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { DIFFICULTIES, DIFFICULTY_LABELS, type Difficulty } from '../../shared/models/game.model';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  readonly difficulties = DIFFICULTIES;
  readonly labels = DIFFICULTY_LABELS;

  private readonly router = inject(Router);

  startGame(difficulty: Difficulty): void {
    this.router.navigate(['/game'], { queryParams: { difficulty } });
  }
}
