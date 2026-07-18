/** Discord invite URLs — set at build time via VITE_* (not secrets; still config). */

export function getDiscordBotInviteUrl(): string {
  return String(import.meta.env.VITE_DISCORD_BOT_INVITE_URL ?? '').trim();
}

export function getDiscordServerJoinUrl(): string {
  return String(import.meta.env.VITE_DISCORD_SERVER_INVITE_URL ?? '').trim();
}
