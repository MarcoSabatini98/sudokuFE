import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Sfondo decorativo: blob di colore sfocati che driftano e mutano forma
 * lentamente (mesh gradient animato). Theme-aware, puramente CSS.
 */
@Component({
  selector: 'app-ambient-mesh',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    <span class="am-blob b1"></span>
    <span class="am-blob b2"></span>
    <span class="am-blob b3"></span>
    <span class="am-blob b4"></span>
  `,
  styleUrl: './ambient-mesh.component.css',
})
export class AmbientMeshComponent {}
