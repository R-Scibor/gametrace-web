import { describe, expect, it } from 'vitest';
import { composeMergeCandidateMessage, REPORT_MESSAGE_MAX } from './mergeCandidateReport';

describe('composeMergeCandidateMessage', () => {
  it('matches the mobile format with machine-readable footer', () => {
    const msg = composeMergeCandidateMessage({
      source: { id: 1, name: '  Hollow   Knight ' },
      target: { id: 2, name: 'Hollow Knight (2017)' },
      note: ' same cover ',
    });
    expect(msg).toBe(
      'Zgłoszenie duplikatu gry\n\nŹródło: Hollow Knight\nKandydat: Hollow Knight (2017)\n\nsame cover\n\n' +
        '---\nsource_id: 1\ntarget_id: 2\nsource_name: Hollow Knight\ntarget_name: Hollow Knight (2017)\nkind: merge_candidate',
    );
  });

  it('omits an empty note and truncates long ones to the backend limit', () => {
    const noNote = composeMergeCandidateMessage({ source: { id: 1, name: 'A' }, target: { id: 2, name: 'B' } });
    expect(noNote).not.toContain('\n\n\n');
    const long = composeMergeCandidateMessage({
      source: { id: 1, name: 'A' },
      target: { id: 2, name: 'B' },
      note: 'x'.repeat(5000),
    });
    expect(long.length).toBeLessThanOrEqual(REPORT_MESSAGE_MAX);
    expect(long.endsWith('kind: merge_candidate')).toBe(true);
  });
});
