import { describe, expect, it } from 'vitest';
import { releaseVersion } from './version';

describe('releaseVersion', () => {
  it('strips optional leading v from standard semver', () => {
    expect(releaseVersion('1.2.3')).toBe('1.2.3');
    expect(releaseVersion('v1.2.3')).toBe('1.2.3');
    expect(releaseVersion('V1.2.3')).toBe('1.2.3');
  });

  it('accepts two-part versions', () => {
    expect(releaseVersion('1.2')).toBe('1.2');
    expect(releaseVersion('v1.2')).toBe('1.2');
  });

  it('preserves prerelease and build suffixes', () => {
    expect(releaseVersion('1.2.3-rc.1')).toBe('1.2.3-rc.1');
    expect(releaseVersion('v1.2.3-rc.1')).toBe('1.2.3-rc.1');
    expect(releaseVersion('1.0.0-test')).toBe('1.0.0-test');
    expect(releaseVersion('v0.9.0-alpha.2')).toBe('0.9.0-alpha.2');
    expect(releaseVersion('1.0.0+build123')).toBe('1.0.0+build123');
    expect(releaseVersion('v1.0.0-beta.1+exp.sha.5114f85')).toBe('1.0.0-beta.1+exp.sha.5114f85');
  });

  it('trims leading and trailing whitespace', () => {
    expect(releaseVersion('  v1.2.3  ')).toBe('1.2.3');
    expect(releaseVersion('\n1.0.0\t')).toBe('1.0.0');
  });

  it('returns null for non-release strings', () => {
    expect(releaseVersion('main')).toBeNull();
    expect(releaseVersion('vmain')).toBeNull();
    expect(releaseVersion('dev')).toBeNull();
    expect(releaseVersion('master')).toBeNull();
    expect(releaseVersion('latest')).toBeNull();
    expect(releaseVersion('abc1234')).toBeNull();
    expect(releaseVersion('1')).toBeNull();
    expect(releaseVersion('v1')).toBeNull();
    expect(releaseVersion('...')).toBeNull();
    expect(releaseVersion('…')).toBeNull();
  });

  it('returns null for falsy, empty, or whitespace inputs', () => {
    expect(releaseVersion(null)).toBeNull();
    expect(releaseVersion(undefined)).toBeNull();
    expect(releaseVersion('')).toBeNull();
    expect(releaseVersion('   ')).toBeNull();
  });
});
