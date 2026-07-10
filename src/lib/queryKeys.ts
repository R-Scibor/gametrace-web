export const qk = {
  dashboard: ['dashboard'] as const,
  health: ['health'] as const,
  profile: ['profile'] as const,
  sessions: (filter?: object) => ['sessions', filter ?? {}] as const,
  session: (id: number) => ['session', id] as const,
  trash: ['trash'] as const,
  games: (filter?: object) => ['games', filter ?? {}] as const,
  game: (id: number) => ['game', id] as const,
  gameStats: (id: number) => ['game', id, 'stats'] as const,
  gameSessions: (id: number) => ['game', id, 'sessions'] as const,
  stats: (kind: string, params?: object) => ['stats', kind, params ?? {}] as const,
  adminGames: (filter?: object) => ['admin', 'games', filter ?? {}] as const,
};