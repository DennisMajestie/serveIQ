import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { NxWelcome } from './nx-welcome';
import { AuthService, ENVIRONMENT_CONFIG } from '@serveiq/shared/data-access';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App, NxWelcome],
      providers: [
        { provide: AuthService, useValue: { isAuthenticated: false, token$: null as any } },
        { provide: ENVIRONMENT_CONFIG, useValue: { apiUrl: 'http://test' } },
      ],
    }).compileComponents();
  });

  it('should create the app', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
