// Params Validation Unit Tests (Authoritative Joi Schemas)
import { authParams } from '../../src/validators/auth.validator';
import { userParams } from '../../src/validators/user.validator';

describe('Authoritative Params Validation (snake_case only)', () => {
  describe('authParams', () => {
    it('register should require email, password, first_name, and last_name in snake_case', () => {
      // Missing first_name & last_name
      const invalid = authParams.register.body.validate({
        email: 'user@example.com',
        password: 'Password123!',
      });
      expect(invalid.error).toBeDefined();
      expect(invalid.error?.message).toContain('"first_name" is required');

      // Valid snake_case payload
      const valid = authParams.register.body.validate({
        email: 'user@example.com',
        password: 'Password123!',
        first_name: 'John',
        last_name: 'Doe',
      });
      expect(valid.error).toBeUndefined();
      expect(valid.value.first_name).toBe('John');
      expect(valid.value.last_name).toBe('Doe');
    });

    it('refreshToken should require refresh_token in snake_case and reject empty body', () => {
      const empty = authParams.refreshToken.body.validate({});
      expect(empty.error).toBeDefined();
      expect(empty.error?.message).toContain('"refresh_token" is required');

      const valid = authParams.refreshToken.body.validate({
        refresh_token: 'valid-refresh-token-hex',
      });
      expect(valid.error).toBeUndefined();
      expect(valid.value.refresh_token).toBe('valid-refresh-token-hex');
    });

    it('resetPassword should require token and new_password with minimum length', () => {
      const missingPassword = authParams.resetPassword.body.validate({
        token: 'token-123',
      });
      expect(missingPassword.error).toBeDefined();
      expect(missingPassword.error?.message).toContain('"new_password" is required');

      const shortPassword = authParams.resetPassword.body.validate({
        token: 'token-123',
        new_password: '123',
      });
      expect(shortPassword.error).toBeDefined();
      expect(shortPassword.error?.message).toContain('"new_password" length must be at least 8 characters long');

      const valid = authParams.resetPassword.body.validate({
        token: 'token-123',
        new_password: 'SecurePassword123!',
      });
      expect(valid.error).toBeUndefined();
    });

    it('changePassword should require current_password and new_password in snake_case', () => {
      const missingFields = authParams.changePassword.body.validate({});
      expect(missingFields.error).toBeDefined();
      expect(missingFields.error?.message).toContain('"current_password" is required');

      const valid = authParams.changePassword.body.validate({
        current_password: 'OldPassword123!',
        new_password: 'NewPassword123!',
      });
      expect(valid.error).toBeUndefined();
    });

    it('logout should require refresh_token in snake_case', () => {
      const empty = authParams.logout.body.validate({});
      expect(empty.error).toBeDefined();
      expect(empty.error?.message).toContain('"refresh_token" is required');

      const valid = authParams.logout.body.validate({
        refresh_token: 'session-token-to-revoke',
      });
      expect(valid.error).toBeUndefined();
      expect(valid.value.refresh_token).toBe('session-token-to-revoke');
    });
  });

  describe('userParams', () => {
    it('create should require email, first_name, and last_name in snake_case', () => {
      const missingNames = userParams.create.body.validate({
        email: 'staff@example.com',
      });
      expect(missingNames.error).toBeDefined();
      expect(missingNames.error?.message).toContain('"first_name" is required');

      const valid = userParams.create.body.validate({
        email: 'staff@example.com',
        first_name: 'Elena',
        last_name: 'Rostova',
      });
      expect(valid.error).toBeUndefined();
    });

    it('getById should validate valid UUID and reject malformed IDs', () => {
      const invalid = userParams.getById.params.validate({ id: 'invalid-id' });
      expect(invalid.error).toBeDefined();

      const valid = userParams.getById.params.validate({
        id: '123e4567-e89b-12d3-a456-426614174000',
      });
      expect(valid.error).toBeUndefined();
    });

    it('list query should accept snake_case pagination and filter params', () => {
      const valid = userParams.list.query.validate({
        page: 2,
        limit: 15,
        page_size: 15,
        per_page: 15,
        search: 'Elena',
        role: 'member',
        status: 'active',
      });
      expect(valid.error).toBeUndefined();
      expect(valid.value.page_size).toBe(15);
      expect(valid.value.per_page).toBe(15);
    });
  });
});

