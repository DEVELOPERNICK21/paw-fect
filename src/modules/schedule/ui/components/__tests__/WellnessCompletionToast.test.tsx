import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import { WellnessCompletionToast } from '../WellnessCompletionToast';

let mockMascotProps: Record<string, unknown> = {};

jest.mock('../../../../../shared/components/Mascot', () => ({
  Mascot: (props: Record<string, unknown>) => {
    mockMascotProps = props;
    return null;
  },
}));

const render = async (kind: 'task' | 'day'): Promise<string> => {
  let renderer: ReactTestRenderer | undefined;
  await act(async () => {
    renderer = create(
      <WellnessCompletionToast
        visible
        petName="Milo"
        onDismiss={() => undefined}
        rewardKind={kind}
        taskLabel="Walk"
        species="cat"
      />,
    );
  });
  return (renderer as ReactTestRenderer).root
    .findAll(() => true)
    .flatMap(n => n.children.filter((c): c is string => typeof c === 'string'))
    .join(' | ');
};

describe('WellnessCompletionToast', () => {
  it('has the character celebrate a finished task, in its voice', async () => {
    const json = await render('task');
    expect(mockMascotProps).toMatchObject({
      species: 'cat',
      reactionRequest: { reaction: 'success' },
    });
    expect(json).toContain('Nice one! Milo is in good hands.');
    expect(json).toContain('Walk');
  });

  it('celebrates harder when the whole day is done', async () => {
    const json = await render('day');
    expect(mockMascotProps).toMatchObject({ reactionRequest: { reaction: 'celebrate' } });
    expect(json).toContain("That's a wrap! Milo's whole day is done.");
  });
});
