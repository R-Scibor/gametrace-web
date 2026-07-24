import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { waitFor } from '@testing-library/react';
import { server } from '../../test/server';
import { renderHookWithProviders } from '../../test/utils';
import { useLanguage } from './useLanguage';
import { useLanguageSync } from './useLanguageSync';
import i18n from '../i18n';

describe('useLanguage', () => {
  beforeEach(() => {
    void i18n.changeLanguage('pl');
  });

  it('optimistically switches language and persists it', async () => {
    const { result } = renderHookWithProviders(() => useLanguage());
    result.current.select('en');
    expect(i18n.language).toBe('en');
    expect(localStorage.getItem('gt.lang')).toBe('en');
    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(i18n.language).toBe('en');
  });

  it('reverts to the previous language when the backend rejects', async () => {
    server.use(
      http.put('/api/v1/profile/settings', () => new HttpResponse(null, { status: 500 })),
    );
    const { result } = renderHookWithProviders(() => useLanguage());
    result.current.select('en');
    expect(i18n.language).toBe('en');
    await waitFor(() => expect(i18n.language).toBe('pl'));
    expect(localStorage.getItem('gt.lang')).toBe('pl');
  });
});

describe('useLanguageSync', () => {
  beforeEach(() => {
    void i18n.changeLanguage('pl');
  });

  it('adopts the profile language once it loads', async () => {
    server.use(
      http.get('/api/v1/profile/me', () =>
        HttpResponse.json({
          discord_id: '123',
          username: 'testuser',
          timezone: 'Europe/Warsaw',
          weekly_report_enabled: true,
          push_enabled: false,
          is_admin: true,
          language: 'en',
        }),
      ),
    );
    renderHookWithProviders(() => useLanguageSync());
    await waitFor(() => expect(i18n.language).toBe('en'));
    expect(document.documentElement.lang).toBe('en');
  });
});
