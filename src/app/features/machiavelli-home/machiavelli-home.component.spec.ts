import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { provideRouter, Router } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { MachiavelliHomeComponent } from './machiavelli-home.component';
import { BOT_DIFFICULTY_LABELS } from '../../core/constants/machiavelli.constants';

describe('MachiavelliHomeComponent', () => {
  it('should render the three bot difficulty cards', async () => {
    await render(MachiavelliHomeComponent, {
      providers: [provideRouter([]), provideAnimationsAsync()],
    });

    expect(screen.getByText(BOT_DIFFICULTY_LABELS['easy'])).toBeTruthy();
    expect(screen.getByText(BOT_DIFFICULTY_LABELS['medium'])).toBeTruthy();
    expect(screen.getByText(BOT_DIFFICULTY_LABELS['hard'])).toBeTruthy();
  });

  it('should navigate to the game with the chosen bot difficulty', async () => {
    const navigateSpy = vi.fn();
    const { fixture } = await render(MachiavelliHomeComponent, {
      providers: [provideRouter([]), provideAnimationsAsync()],
    });

    const router = fixture.debugElement.injector.get(Router);
    vi.spyOn(router, 'navigate').mockImplementation(navigateSpy);

    await userEvent.click(screen.getByText(BOT_DIFFICULTY_LABELS['hard']));
    expect(navigateSpy).toHaveBeenCalledWith(['/machiavelli/game'], {
      queryParams: { difficulty: 'hard' },
    });
  });
});
