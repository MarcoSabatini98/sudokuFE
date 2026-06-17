import { render } from '@testing-library/angular';

import { AmbientDotsComponent } from './ambient-dots.component';

describe('AmbientDotsComponent', () => {
  it('updates the spotlight CSS vars on mouse move', async () => {
    const { fixture } = await render(AmbientDotsComponent);
    const host = fixture.nativeElement as HTMLElement;

    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 120, clientY: 80 }));

    expect(host.style.getPropertyValue('--mx')).toBe('120px');
    expect(host.style.getPropertyValue('--my')).toBe('80px');
  });
});
