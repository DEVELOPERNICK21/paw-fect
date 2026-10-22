import React from 'react';
import { act, create } from 'react-test-renderer';

import { HealthMascot } from '../HealthMascot';
import type { HealthSummary } from '../../../domain/utils/healthSummary';

const summary: HealthSummary = {
  total: 4,
  done: 1,
  overdue: 0,
  progress: 0.25,
  next: null,
  daysToNext: null,
  tone: 'ontrack',
};

const mockFocus = { value: true };
let mockMascotProps: Record<string, unknown> = {};

jest.mock('@react-navigation/native', () => ({ useIsFocused: () => mockFocus.value }));
jest.mock('../../../../../shared/components/Mascot', () => ({
  Mascot: (props: Record<string, unknown>) => {
    mockMascotProps = props;
    return null;
  },
}));

beforeEach(() => {
  mockFocus.value = true;
  mockMascotProps = {};
});

describe('HealthMascot', () => {
  it('hands the mascot a curious request when the record opens', () => {
    act(() => {
      create(<HealthMascot petId="p1" petName="Milo" species="dog" summary={summary} />);
    });
    expect(mockMascotProps.species).toBe('dog');
    expect(mockMascotProps.reactionRequest).toEqual({ reaction: 'curious', id: 'health-record-open:p1:1' });
    expect(mockMascotProps.paused).toBe(false);
  });

  it('is paused, and requests nothing, while the screen is not focused', () => {
    mockFocus.value = false;
    act(() => {
      create(<HealthMascot petId="p1" petName="Luna" species="cat" summary={summary} />);
    });
    expect(mockMascotProps.paused).toBe(true);
    expect(mockMascotProps.reactionRequest).toBeNull();
  });
});
