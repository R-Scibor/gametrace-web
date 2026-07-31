import { test, expect } from 'vitest';
import {
  SAMPLE_GAMES,
  SAMPLE_SESSIONS,
  SAMPLE_STATS_SUMMARY,
  SAMPLE_COMPANIES_DEVELOPER,
  SAMPLE_COMPANIES_PUBLISHER,
  SAMPLE_GAME_STATS,
  SAMPLE_LAST_SESSION,
} from './sampleData';

test('all sample game ids are negative and carry hardcoded IGDB covers', () => {
  for (const game of SAMPLE_GAMES) {
    expect(game.id).toBeLessThan(0);
    expect(game.cover_image_url).toMatch(
      /^https:\/\/images\.igdb\.com\/igdb\/image\/upload\/t_cover_big\/.+\.jpg$/,
    );
  }
});

test('sample session briefs reuse the same cover urls as SAMPLE_GAMES', () => {
  const covers = new Map(SAMPLE_GAMES.map((g) => [g.id, g.cover_image_url]));
  for (const session of SAMPLE_SESSIONS) {
    expect(session.game.cover_image_url).toBe(covers.get(session.game_id));
  }
});

test('all sample session ids and game_ids are negative and reference a real sample game', () => {
  const gameIds = new Set(SAMPLE_GAMES.map((g) => g.id));
  for (const session of SAMPLE_SESSIONS) {
    expect(session.id).toBeLessThan(0);
    expect(gameIds.has(session.game_id)).toBe(true);
    expect(session.status).toBe('COMPLETED');
  }
});

test('per_game totals sum to the same total as StatsSummary.total_seconds', () => {
  const sum = SAMPLE_STATS_SUMMARY.per_game.reduce((acc, g) => acc + g.total_seconds, 0);
  expect(sum).toBe(SAMPLE_STATS_SUMMARY.total_seconds);
});

test('both company role breakdowns are non-empty', () => {
  expect(SAMPLE_COMPANIES_DEVELOPER.items.length).toBeGreaterThan(0);
  expect(SAMPLE_COMPANIES_PUBLISHER.items.length).toBeGreaterThan(0);
});

test('SAMPLE_GAME_STATS returns stats for every sample game and undefined for an unknown id', () => {
  for (const game of SAMPLE_GAMES) {
    expect(SAMPLE_GAME_STATS(game.id)).toBeDefined();
  }
  expect(SAMPLE_GAME_STATS(999)).toBeUndefined();
});

test('SAMPLE_LAST_SESSION is the most recent session by start_time', () => {
  const maxStart = Math.max(...SAMPLE_SESSIONS.map((s) => Date.parse(s.start_time)));
  expect(Date.parse(SAMPLE_LAST_SESSION.start_time)).toBe(maxStart);
});
