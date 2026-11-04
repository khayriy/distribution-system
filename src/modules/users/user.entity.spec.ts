import { instanceToPlain } from 'class-transformer';
import { User } from './user.entity';

describe('User persistence entity', () => {
  it('normalizes email before persistence', () => {
    const user = new User();
    user.email = '  Admin@Example.COM ';

    user.normalizeEmail();

    expect(user.email).toBe('admin@example.com');
  });

  it('excludes password hashes from serialized responses', () => {
    const user = new User();
    user.id = 'user-id';
    user.email = 'admin@example.com';
    user.passwordHash = 'argon2id$test-hash';

    expect(instanceToPlain(user)).not.toHaveProperty('passwordHash');
  });
});
