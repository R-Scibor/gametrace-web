import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { test, expect, beforeEach } from 'vitest';
import { AdminGlobalCoverUpload } from './AdminGlobalCoverUpload';
import { useToastStore } from '../../store/toastStore';
import { renderPage, resetStores } from '../../../test/utils';
import { server } from '../../../test/server';
import { fixtures } from '../../../test/fixtures';

beforeEach(() => {
  resetStores();
});

test('AdminGlobalCoverUpload uploads cover via admin API', async () => {
  let coverCalled = false;
  server.use(
    http.put('/api/v1/admin/games/:id/cover', async () => {
      coverCalled = true;
      return HttpResponse.json({
        ...fixtures.game,
        cover_image_url: '/covers/1.png',
        cover_source: 'CUSTOM',
      });
    }),
  );

  const user = userEvent.setup();
  renderPage(
    <AdminGlobalCoverUpload
      gameId={1}
      gameName="Wiedźmin 3"
      coverUrl={null}
      coverSource="EXTERNAL"
    />,
  );

  const file = new File(['cover'], 'cover.png', { type: 'image/png' });
  await user.click(screen.getByRole('button', { name: /Wybierz globalną okładkę/i }));
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  await user.upload(input, file);

  await waitFor(() => expect(coverCalled).toBe(true));
  await waitFor(() => {
    expect(
      useToastStore.getState().toasts.some((t) => t.message === 'Globalna okładka zapisana.'),
    ).toBe(true);
  });
});