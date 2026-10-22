import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { Card } from '../../models/card.model';
import { RANK_LABEL, SUIT_COLOR, SUIT_SYMBOL } from '../../../core/constants/machiavelli.constants';

@Component({
  selector: 'app-playing-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './playing-card.component.html',
  styleUrl: './playing-card.component.css',
})
export class PlayingCardComponent {
  readonly card = input.required<Card>();
  readonly faceDown = input<boolean>(false);

  readonly isRed = computed(() => {
    const c = this.card();
    return !c.isJoker && c.suit !== null && SUIT_COLOR[c.suit] === 'red';
  });

  readonly rankLabel = computed(() => {
    const c = this.card();
    return c.rank !== null ? RANK_LABEL[c.rank] : '';
  });

  readonly suitSymbol = computed(() => {
    const c = this.card();
    return c.suit !== null ? SUIT_SYMBOL[c.suit] : '';
  });
}
