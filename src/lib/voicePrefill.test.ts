import { test, expect, beforeEach } from 'vitest';
import { consumeVoiceTranscriptPrefill, setVoiceTranscriptPrefill } from './voicePrefill';

beforeEach(() => {
  sessionStorage.clear();
});

test('setVoiceTranscriptPrefill stores transcript in sessionStorage', () => {
  setVoiceTranscriptPrefill('grałem w wiedźmina');
  expect(sessionStorage.getItem('voice-transcript-prefill')).toBe('grałem w wiedźmina');
});

test('consumeVoiceTranscriptPrefill reads once and clears', () => {
  setVoiceTranscriptPrefill('test transcript');
  expect(consumeVoiceTranscriptPrefill()).toBe('test transcript');
  expect(consumeVoiceTranscriptPrefill()).toBeNull();
});