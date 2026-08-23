import {
  getOnboardingActivationPort,
  registerOnboardingActivationPort,
} from '../onboardingCoordinationPorts';

describe('OnboardingActivationPort', () => {
  it('returns the registered port implementation', async () => {
    const mockPort = {
      createPetFromDraft: jest.fn().mockResolvedValue({ ok: true, petId: 'p1' }),
      createReminderFromDraft: jest.fn().mockResolvedValue({ ok: true }),
    };

    registerOnboardingActivationPort(mockPort);
    const port = getOnboardingActivationPort();

    await port.createPetFromDraft({
      userId: 'u1',
      pet: { species: 'dog', ageBand: 'adult', nickname: 'Milo' },
    });

    expect(mockPort.createPetFromDraft).toHaveBeenCalledWith({
      userId: 'u1',
      pet: { species: 'dog', ageBand: 'adult', nickname: 'Milo' },
    });
  });
});
