import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  OnDestroy,
  output,
  signal,
} from '@angular/core';

@Component({
  selector: 'app-timer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="timer">{{ formatted() }}</span>`,
  styles: [`.timer { font-size: 1.5rem; font-weight: 600; font-variant-numeric: tabular-nums; }`],
})
export class TimerComponent implements OnDestroy {
  running = input<boolean>(false);
  tick = output<number>();

  readonly seconds = signal(0);

  readonly formatted = () => {
    const s = this.seconds();
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    effect(() => {
      if (this.running()) {
        this.intervalId = setInterval(() => {
          this.seconds.update((s) => s + 1);
          this.tick.emit(this.seconds());
        }, 1000);
      } else {
        this.stop();
      }
    });
  }

  reset(): void {
    this.stop();
    this.seconds.set(0);
  }

  private stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  ngOnDestroy(): void {
    this.stop();
  }
}
