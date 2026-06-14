import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  const toggleSpy = vi.fn();
  const setItemSpy = vi.fn();

  const createService = (storedTheme: string | null = null): ThemeService => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(storedTheme);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(setItemSpy);

    TestBed.configureTestingModule({
      providers: [
        ThemeService,
        { provide: DOCUMENT, useValue: { body: { classList: { toggle: toggleSpy } } } },
      ],
    });

    return TestBed.inject(ThemeService);
  };

  afterEach(() => {
    vi.restoreAllMocks();
    toggleSpy.mockClear();
    setItemSpy.mockClear();
    TestBed.resetTestingModule();
  });

  it('darkMode is false when no stored theme', () => {
    const svc = createService(null);
    expect(svc.darkMode()).toBe(false);
  });

  it('darkMode is true when stored theme is "dark"', () => {
    const svc = createService('dark');
    expect(svc.darkMode()).toBe(true);
  });

  it('applies dark-theme class to body on init when dark', () => {
    createService('dark');
    expect(toggleSpy).toHaveBeenCalledWith('dark-theme', true);
  });

  it('does not apply dark-theme class on init when light', () => {
    createService(null);
    expect(toggleSpy).toHaveBeenCalledWith('dark-theme', false);
  });

  it('toggle() switches darkMode from false to true', () => {
    const svc = createService(null);
    svc.toggle();
    expect(svc.darkMode()).toBe(true);
  });

  it('toggle() switches darkMode from true to false', () => {
    const svc = createService('dark');
    svc.toggle();
    expect(svc.darkMode()).toBe(false);
  });

  it('toggle() called twice returns to original value', () => {
    const svc = createService(null);
    svc.toggle();
    svc.toggle();
    expect(svc.darkMode()).toBe(false);
  });
});
