import { BuildUserProfileLabels } from '../BuildUserProfileLabels';
import type { User } from '../../models/User';

describe('BuildUserProfileLabels', () => {
  const useCase = new BuildUserProfileLabels();

  const mockUser: User = {
    id: 'user-1',
    email: 'john.doe@example.com',
    displayName: null,
    photoURL: null,
    phoneNumber: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    lastLoginAt: '2024-01-01T00:00:00.000Z',
    onboardingCompleted: true,
  };

  it('should NOT reveal email prefix as fallback (Fixed Behavior)', () => {
    const labels = useCase.execute(mockUser, 'authenticated');

    // FIXED BEHAVIOR: uses generic fallbacks
    expect(labels.greetingName).toBe('there');
    expect(labels.initials).toBe('?');
  });

  it('should use display name when available', () => {
    const userWithNames: User = {
      ...mockUser,
      displayName: 'Jane Smith',
    };
    const labels = useCase.execute(userWithNames, 'authenticated');

    expect(labels.greetingName).toBe('Jane');
    expect(labels.initials).toBe('JS');
    expect(labels.primaryDisplayName).toBe('Jane Smith');
  });

  it('should mask email correctly', () => {
    const labels = useCase.execute(mockUser, 'authenticated');
    expect(labels.maskedEmail).toBe('j******@example.com');
  });
});
