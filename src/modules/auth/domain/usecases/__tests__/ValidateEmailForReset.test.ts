import { ValidateEmailForReset } from '../ValidateEmailForReset';

describe('ValidateEmailForReset', () => {
  const validator = new ValidateEmailForReset();

  it('should accept valid email address', () => {
    const result = validator.execute('test@example.com');
    expect(result).toEqual({ ok: true, normalizedEmail: 'test@example.com' });
  });

  it('should normalize email casing and whitespace', () => {
    const result = validator.execute('  MyEmail@EXAMPLE.com  ');
    expect(result).toEqual({ ok: true, normalizedEmail: 'myemail@example.com' });
  });

  it('should reject empty email address', () => {
    expect(validator.execute('')).toEqual({
      ok: false,
      errorMessage: 'Enter the email for your account.',
    });
    expect(validator.execute('   ')).toEqual({
      ok: false,
      errorMessage: 'Enter the email for your account.',
    });
  });

  it('should reject email addresses that are too long to prevent ReDoS and memory issues', () => {
    const hugeEmail = 'a'.repeat(250) + '@example.com'; // 262 characters
    const result = validator.execute(hugeEmail);
    expect(result).toEqual({
      ok: false,
      errorMessage: 'Email address is too long.',
    });
  });

  it('should reject malformed email formats', () => {
    expect(validator.execute('invalid-email')).toEqual({
      ok: false,
      errorMessage: 'Enter a valid email address.',
    });
    expect(validator.execute('invalid@com')).toEqual({
      ok: false,
      errorMessage: 'Enter a valid email address.',
    });
  });
});
