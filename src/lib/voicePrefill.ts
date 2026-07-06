const VOICE_TRANSCRIPT_KEY = 'voice-transcript-prefill';

export function setVoiceTranscriptPrefill(text: string) {
  try {
    sessionStorage.setItem(VOICE_TRANSCRIPT_KEY, text);
  } catch {
    // sessionStorage unavailable
  }
}

/** Read once and clear — transcript is ephemeral reference only, not persisted on create. */
export function consumeVoiceTranscriptPrefill(): string | null {
  try {
    const value = sessionStorage.getItem(VOICE_TRANSCRIPT_KEY);
    if (value) sessionStorage.removeItem(VOICE_TRANSCRIPT_KEY);
    return value;
  } catch {
    return null;
  }
}