/** Discord invite URLs — injected via runtime config or Vite VITE_* env (not secrets). */
import { getRuntimeEnv } from './runtimeConfig';

export function getDiscordBotInviteUrl(): string {
  return getRuntimeEnv('VITE_DISCORD_BOT_INVITE_URL').trim();
}

export function getDiscordServerJoinUrl(): string {
  return getRuntimeEnv('VITE_DISCORD_SERVER_INVITE_URL').trim();
}
