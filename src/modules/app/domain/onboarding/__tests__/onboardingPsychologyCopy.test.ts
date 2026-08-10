import {
  validationCopyForCareInterests,
  validationCopyForProblems,
} from '../onboardingValidationCopy';
import { buildOnboardingLossLine } from '../onboardingPaywallCopy';
import { buildProcessingLines } from '../buildProcessingLines';

describe('onboardingValidationCopy', () => {
  it('returns null when nothing selected', () => {
    expect(validationCopyForProblems([])).toBeNull();
    expect(validationCopyForCareInterests([])).toBeNull();
  });

  it('returns copy for latest problem selection', () => {
    const copy = validationCopyForProblems(['no_records', 'missed_vaccines']);
    expect(copy).toMatch(/common challenges/i);
  });
});

describe('onboardingPaywallCopy', () => {
  it('uses qualitative default without fabricated stats', () => {
    const line = buildOnboardingLossLine(null);
    expect(line.toLowerCase()).not.toMatch(/\d+x/);
    expect(line.length).toBeGreaterThan(10);
  });

  it('ties loss line to missed vaccines', () => {
    const line = buildOnboardingLossLine({
      problems: ['missed_vaccines'],
      goal: null,
      pet: { species: 'dog', ageBand: 'adult', nickname: 'Milo' },
    });
    expect(line).toMatch(/vaccine/i);
  });
});

describe('buildProcessingLines', () => {
  it('falls back to species when nickname empty', () => {
    const lines = buildProcessingLines('', 'cat');
    expect(lines[0]).toMatch(/cat/i);
  });

  it('uses nickname when present', () => {
    const lines = buildProcessingLines('Luna', 'dog');
    expect(lines[0]).toMatch(/Luna/);
  });
});
