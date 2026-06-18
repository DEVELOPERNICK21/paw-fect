import { BuildUserProfileLabels } from '../BuildUserProfileLabels';
import type { User } from '../../models/User';

describe('BuildUserProfileLabels', () => {
  const usecase = new BuildUserProfileLabels();
  const mockDate = '2025-01-01T12:00:00Z';

  const mockUser: User = {
    id: 'user-123',
    email: 'john.doe@example.com',
    displayName: 'John Doe',
    photoURL: 'https://example.com/photo.jpg',
    phoneNumber: '+1234567890',
    createdAt: mockDate,
    lastLoginAt: mockDate,
    onboardingCompleted: true,
  };

  it('returns generic greeting and initials when displayName is null', () => {
    const user = { ...mockUser, displayName: null };
    const result = usecase.execute(user, 'authenticated');

    expect(result.greetingName).toBe('there');
    expect(result.initials).toBe('?');
    expect(result.primaryDisplayName).toBe('there');
  });

  it('returns generic greeting and initials when displayName is an empty string', () => {
    const user = { ...mockUser, displayName: '' };
    const result = usecase.execute(user, 'authenticated');

    expect(result.greetingName).toBe('there');
    expect(result.initials).toBe('?');
    expect(result.primaryDisplayName).toBe('there');
  });

  it('returns generic greeting and initials when displayName is only whitespace', () => {
    const user = { ...mockUser, displayName: '   ' };
    const result = usecase.execute(user, 'authenticated');

    expect(result.greetingName).toBe('there');
    expect(result.initials).toBe('?');
    expect(result.primaryDisplayName).toBe('there');
  });

  it('uses displayName for greeting and initials when present', () => {
    const result = usecase.execute(mockUser, 'authenticated');

    expect(result.greetingName).toBe('John');
    expect(result.initials).toBe('JD');
    expect(result.primaryDisplayName).toBe('John Doe');
  });

  it('handles single word displayName', () => {
    const user = { ...mockUser, displayName: 'jules' };
    const result = usecase.execute(user, 'authenticated');

    expect(result.greetingName).toBe('jules');
    expect(result.initials).toBe('JU');
    expect(result.primaryDisplayName).toBe('jules');
  });

  it('masks the email correctly', () => {
    const result = usecase.execute(mockUser, 'authenticated');
    expect(result.maskedEmail).toBe('j******@example.com');
  });

  it('returns guest labels when user is null', () => {
    const result = usecase.execute(null, 'unauthenticated');

    expect(result.greetingName).toBe('there');
    expect(result.primaryDisplayName).toBe('Guest');
    expect(result.initials).toBe('?');
    expect(result.maskedEmail).toBe('');
  });

  it('indicates profile loading when session is restoring and user is null', () => {
    const result = usecase.execute(null, 'restoring');
    expect(result.isProfileLoading).toBe(true);
  });
});
