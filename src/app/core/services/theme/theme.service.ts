import { effect, inject, Injectable, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  readonly darkMode = signal(localStorage.getItem('theme') === 'dark');

  constructor() {
    this.doc.body.classList.toggle('dark-theme', this.darkMode());
    effect(() => {
      const dark = this.darkMode();
      this.doc.body.classList.toggle('dark-theme', dark);
      localStorage.setItem('theme', dark ? 'dark' : 'light');
    });
  }

  toggle(): void {
    this.darkMode.update(v => !v);
  }
}
