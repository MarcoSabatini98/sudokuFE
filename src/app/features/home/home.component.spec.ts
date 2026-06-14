import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { provideRouter, Router } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { HomeComponent } from './home.component';
import { DIFFICULTY_LABELS } from '../../shared/models/game.model';

const defaultProviders = () => [provideRouter([]), provideAnimationsAsync()];

describe('HomeComponent', () => {
  it('should render all four difficulty cards', async () => {
    await render(HomeComponent, { providers: defaultProviders() });

    expect(screen.getByText(DIFFICULTY_LABELS['easy'])).toBeTruthy();
    expect(screen.getByText(DIFFICULTY_LABELS['medium'])).toBeTruthy();
    expect(screen.getByText(DIFFICULTY_LABELS['hard'])).toBeTruthy();
    expect(screen.getByText(DIFFICULTY_LABELS['extreme'])).toBeTruthy();
  });

  it('should navigate to /game on card click', async () => {
    const navigateSpy = vi.fn();
    const { fixture } = await render(HomeComponent, { providers: defaultProviders() });

    const router = fixture.debugElement.injector.get(Router);
    vi.spyOn(router, 'navigate').mockImplementation(navigateSpy);

    await userEvent.click(screen.getByText(DIFFICULTY_LABELS['easy']));
    expect(navigateSpy).toHaveBeenCalledWith(['/game'], { queryParams: { difficulty: 'easy' } });
  });

  it('should show notes directly for easy and medium', async () => {
    await render(HomeComponent, { providers: defaultProviders() });

    expect(screen.getByText(/45 celle visibili/)).toBeTruthy();
    expect(screen.getByText(/35 celle visibili/)).toBeTruthy();
  });

  it('should show reveal buttons for hard and extreme initially', async () => {
    await render(HomeComponent, { providers: defaultProviders() });

    const revealBtns = screen.getAllByText(/Mostra consiglio/);
    expect(revealBtns.length).toBe(2);
  });

  it('should reveal hard note after 3 clicks', async () => {
    const { fixture } = await render(HomeComponent, { providers: defaultProviders() });
    const comp = fixture.componentInstance;

    comp.revealNote('hard', new MouseEvent('click'));
    comp.revealNote('hard', new MouseEvent('click'));
    comp.revealNote('hard', new MouseEvent('click'));

    expect(comp.isRevealed('hard')).toBe(true);
    expect(comp.revealClicks()['hard']).toBe(3);
  });

  it('should update button label with each click', async () => {
    const { fixture } = await render(HomeComponent, { providers: defaultProviders() });
    const comp = fixture.componentInstance;

    expect(comp.revealButtonLabel('extreme')).toBe('👁 Mostra consiglio');
    comp.revealNote('extreme', new MouseEvent('click'));
    expect(comp.revealButtonLabel('extreme')).toBe('👁 Sei sicuro?');
    comp.revealNote('extreme', new MouseEvent('click'));
    expect(comp.revealButtonLabel('extreme')).toBe('👁 Ultima chance');
  });

  it('should show cronologia and record nav links', async () => {
    await render(HomeComponent, { providers: defaultProviders() });

    expect(screen.getByText('Cronologia')).toBeTruthy();
    expect(screen.getByText('Record')).toBeTruthy();
  });
});
