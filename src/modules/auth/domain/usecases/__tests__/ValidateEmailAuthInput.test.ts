import { ValidateEmailAuthInput } from '../ValidateEmailAuthInput';

describe('ValidateEmailAuthInput', () => {
  const validator = new ValidateEmailAuthInput();

  it('should accept valid email and password combination', () => {
    const result = validator.execute('test@example.com', 'securepass123');
    expect(result).toEqual({ ok: true, normalizedEmail: 'test@example.com' });
  });

  it('should normalize email casing and whitespace', () => {
    const result = validator.execute('  MyEmail@EXAMPLE.com  ', 'securepass123');
    expect(result).toEqual({ ok: true, normalizedEmail: 'myemail@example.com' });
  });

  it('should reject empty email or password', () => {
    expect(validator.execute('', 'securepass123')).toEqual({
      ok: false,
      errorMessage: 'Email and password are required.',
    });
    expect(validator.execute('test@example.com', '')).toEqual({
      ok: false,
      errorMessage: 'Email and password are required.',
    });
    expect(validator.execute('   ', 'securepass123')).toEqual({
      ok: false,
      errorMessage: 'Email and password are required.',
    });
  });

  it('should reject email addresses that are too long to prevent ReDoS and memory issues', () => {
    const hugeEmail = 'a'.repeat(250) + '@example.com'; // 262 characters
    const result = validator.execute(hugeEmail, 'securepass123');
    expect(result).toEqual({
      ok: false,
      errorMessage: 'Email address is too long.',
    });
  });

  it('should reject passwords that are too long to prevent CPU-intensive hashing DoS', () => {
    const hugePassword = 'p'.repeat(129);
    const result = validator.execute('test@example.com', hugePassword);
    expect(result).toEqual({
      ok: false,
      errorMessage: 'Password must be no more than 128 characters.',
    });
  });

  it('should reject passwords that are too short', () => {
    const result = validator.execute('test@example.com', '12345');
    expect(result).toEqual({
      ok: false,
      errorMessage: 'Password must be at least 6 characters.',
    });
  });

  it('should reject malformed email formats', () => {
    expect(validator.execute('invalid-email', 'securepass123')).toEqual({
      ok: false,
      errorMessage: 'Enter a valid email address.',
    });
    expect(validator.execute('invalid@com', 'securepass123')).toEqual({
      ok: false,
      errorMessage: 'Enter a valid email address.',
    });
  });
});
