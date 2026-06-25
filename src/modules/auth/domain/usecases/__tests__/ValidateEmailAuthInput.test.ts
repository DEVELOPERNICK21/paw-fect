import { ValidateEmailAuthInput } from '../ValidateEmailAuthInput';

describe('ValidateEmailAuthInput', () => {
  const usecase = new ValidateEmailAuthInput();

  it('returns ok for valid email and password (>= 8 chars)', () => {
    const result = usecase.execute('test@example.com', 'password123');
    expect(result).toEqual({
      ok: true,
      normalizedEmail: 'test@example.com',
    });
  });

  it('normalizes email by trimming and lowering case', () => {
    const result = usecase.execute('  Test@Example.COM  ', 'password123');
    expect(result).toEqual({
      ok: true,
      normalizedEmail: 'test@example.com',
    });
  });

  it('returns error if email is missing', () => {
    const result = usecase.execute('', 'password123');
    expect(result).toEqual({
      ok: false,
      errorMessage: 'Email and password are required.',
    });
  });

  it('returns error if password is missing', () => {
    const result = usecase.execute('test@example.com', '');
    expect(result).toEqual({
      ok: false,
      errorMessage: 'Email and password are required.',
    });
  });

  it('returns error for invalid email format', () => {
    const result = usecase.execute('invalid-email', 'password123');
    expect(result).toEqual({
      ok: false,
      errorMessage: 'Enter a valid email address.',
    });
  });

  it('returns error for short password (< 8 chars)', () => {
    const result = usecase.execute('test@example.com', '1234567');
    expect(result).toEqual({
      ok: false,
      errorMessage: 'Password must be at least 8 characters.',
    });
  });
});
