import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';

/**
 * Sfondo decorativo: campo di puntini + riflettore che segue il cursore.
 * I puntini sotto il mouse si illuminano (mask radiale ancorata a --mx/--my).
 * Theme-aware. Il mousemove gira fuori da Angular per non innescare CD.
 */
@Component({
  selector: 'app-ambient-dots',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    <div class="ad-base"></div>
    <div class="ad-glow"></div>
    <div class="ad-vignette"></div>
  `,
  styleUrl: './ambient-dots.component.css',
})
export class AmbientDotsComponent implements OnInit, OnDestroy {
  private readonly zone = inject(NgZone);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private cleanup?: () => void;

  ngOnInit(): void {
    this.zone.runOutsideAngular(() => {
      const el = this.host.nativeElement;
      const handler = (e: MouseEvent): void => {
        el.style.setProperty('--mx', `${e.clientX}px`);
        el.style.setProperty('--my', `${e.clientY}px`);
      };
      document.addEventListener('mousemove', handler, { passive: true });
      this.cleanup = () => document.removeEventListener('mousemove', handler);
    });
  }

  ngOnDestroy(): void {
    this.cleanup?.();
  }
}
