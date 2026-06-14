import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { provideRouter, Router } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { HomeComponent } from './home.component';
import { DIFFICULTY_LABELS } from '../../shared/models/game.model';

describe('HomeComponent', () => {
  it('should render all four difficulty cards', async () => {
    await render(HomeComponent, {
      providers: [provideRouter([]), provideAnimationsAsync()],
    });

    expect(screen.getByText(DIFFICULTY_LABELS['easy'])).toBeTruthy();
    expect(screen.getByText(DIFFICULTY_LABELS['medium'])).toBeTruthy();
    expect(screen.getByText(DIFFICULTY_LABELS['hard'])).toBeTruthy();
    expect(screen.getByText(DIFFICULTY_LABELS['extreme'])).toBeTruthy();
  });

  it('should navigate to /game on card click', async () => {
    const navigateSpy = vi.fn();
    const { fixture } = await render(HomeComponent, {
      providers: [provideRouter([]), provideAnimationsAsync()],
    });

    const router = fixture.debugElement.injector.get(Router);
    vi.spyOn(router, 'navigate').mockImplementation(navigateSpy);

    await userEvent.click(screen.getByText(DIFFICULTY_LABELS['easy']));
    expect(navigateSpy).toHaveBeenCalledWith(['/game'], { queryParams: { difficulty: 'easy' } });
  });
});
