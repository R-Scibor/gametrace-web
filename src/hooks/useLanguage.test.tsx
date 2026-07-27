import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { waitFor } from '@testing-library/react';
import { server } from '../../test/server';
import { renderHookWithProviders } from '../../test/utils';
import * as fixtures from '../../test/fixtures';
import { useLanguage } from './useLanguage';
import { useLanguageSync } from './useLanguageSync';
import i18n from '../i18n';

// `test/setup.ts` resets the active language to `pl` before every test.
describe('useLanguage', () => {
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
  it('adopts the profile language once it loads', async () => {
    server.use(
      http.get('/api/v1/profile/me', () =>
        HttpResponse.json({ ...fixtures.profileMe, language: 'en' }),
      ),
    );
    renderHookWithProviders(() => useLanguageSync());
    await waitFor(() => expect(i18n.language).toBe('en'));
    expect(document.documentElement.lang).toBe('en');
  });
});
