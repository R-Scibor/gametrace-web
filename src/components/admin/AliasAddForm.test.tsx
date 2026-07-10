import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect, beforeEach } from 'vitest';
import { AliasAddForm } from './AliasAddForm';
import { renderPage, resetStores } from '../../../test/utils';

beforeEach(() => resetStores());

test('AliasAddForm submits discord process name', async () => {
  const user = userEvent.setup();
  renderPage(<AliasAddForm gameId={45} />);

  await user.type(screen.getByLabelText('Nazwa procesu Discord'), 'NewAlias.exe');
  await user.click(screen.getByRole('button', { name: /Dodaj alias/i }));

  await waitFor(() =>
    expect(screen.getByLabelText('Nazwa procesu Discord')).toHaveValue(''),
  );
});