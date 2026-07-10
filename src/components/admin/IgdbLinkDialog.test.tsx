import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect, beforeEach } from 'vitest';
import { IgdbLinkDialog } from './IgdbLinkDialog';
import { renderPage, resetStores } from '../../../test/utils';
import { useToastStore } from '../../store/toastStore';

beforeEach(() => resetStores());

test('IgdbLinkDialog searches and links candidate', async () => {
  const user = userEvent.setup();
  renderPage(
    <IgdbLinkDialog gameId={45} initialQuery="Kingdom Hearts" onClose={() => {}} />,
  );

  const candidate = await screen.findByRole('button', { name: /Kingdom Hearts HD/i });
  await user.click(candidate);
  await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^POWIĄŻ$/i }));
  const confirm = await screen.findByRole('alertdialog');
  await user.click(within(confirm).getByRole('button', { name: /^POWIĄŻ$/i }));

  await waitFor(() =>
    expect(useToastStore.getState().toasts[0]?.message).toBe('Gra powiązana z IGDB.'),
  );
});