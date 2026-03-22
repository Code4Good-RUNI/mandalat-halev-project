import { api } from './client';

describe('API client', () => {
  it('should expose auth endpoints', () => {
    expect(api.auth).toBeDefined();
    expect(typeof api.auth.login).toBe('function');
  });

  it('should expose user endpoints', () => {
    expect(api.user).toBeDefined();
    expect(typeof api.user.profile).toBe('function');
  });

  it('should expose campaign endpoints', () => {
    expect(api.campaigns).toBeDefined();
    expect(typeof api.campaigns.future).toBe('function');
    expect(typeof api.campaigns.past).toBe('function');
    expect(typeof api.campaigns.register).toBe('function');
    expect(typeof api.campaigns.unregister).toBe('function');
    expect(typeof api.campaigns.registrationStatus).toBe('function');
  });
});
