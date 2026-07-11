function selectInput(input: HTMLInputElement): void {
  input.focus();
  input.select();
  input.setSelectionRange(0, input.value.length);
}

/** Select input text and attempt copy — selection remains even if copy fails. */
export async function copyFromInput(input: HTMLInputElement): Promise<boolean> {
  const text = input.value;
  if (!text) return false;

  selectInput(input);

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through
    }
  }

  if (typeof document === 'undefined') return false;

  try {
    return document.execCommand('copy');
  } catch {
    return false;
  }
}

/** Copy arbitrary text (no visible field). Prefer copyFromInput when possible. */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof document === 'undefined') return false;

  const input = document.createElement('input');
  input.value = text;
  input.readOnly = true;
  input.style.position = 'fixed';
  input.style.left = '-9999px';
  input.style.opacity = '0';
  document.body.appendChild(input);

  try {
    return await copyFromInput(input);
  } finally {
    document.body.removeChild(input);
  }
}