import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { test, expect, beforeEach, vi } from 'vitest';
import { VoicePage } from './VoicePage';
import { renderAppRoutes, resetStores } from '../../test/utils';

vi.mock('../hooks/useVoiceRecord', () => ({
  VoicePermissionError: class VoicePermissionError extends Error {
    constructor() {
      super('PERMISSION_DENIED');
      this.name = 'VoicePermissionError';
    }
  },
  useVoiceRecord: () => {
    const [isRecording, setIsRecording] = React.useState(false);
    return {
      isRecording,
      start: async () => setIsRecording(true),
      stop: async () => {
        setIsRecording(false);
        return new Blob(['audio'], { type: 'audio/webm' });
      },
    };
  },
}));

beforeEach(() => {
  resetStores();
});

function renderVoice() {
  return renderAppRoutes(
    <>
      <Route path="/voice" element={<VoicePage />} />
      <Route path="/sessions/new" element={<div data-testid="session-form">Session Form</div>} />
    </>,
    { route: '/voice' },
  );
}

test('VoicePage renders recording UI', async () => {
  renderVoice();

  expect(await screen.findByText('Sesja głosowa')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'ROZPOCZNIJ NAGRYWANIE' })).toBeInTheDocument();
});

test('VoicePage record flow transcribes and navigates to session form', async () => {
  const user = userEvent.setup();
  renderVoice();

  await screen.findByText('Sesja głosowa');
  await user.click(screen.getByRole('button', { name: 'ROZPOCZNIJ NAGRYWANIE' }));
  await user.click(screen.getByRole('button', { name: 'ZAKOŃCZ I PRZETWÓRZ' }));

  expect(await screen.findByTestId('session-form')).toBeInTheDocument();
  await waitFor(() => expect(screen.getByTestId('session-form')).toBeInTheDocument());
});