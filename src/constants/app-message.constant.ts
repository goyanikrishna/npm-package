// ─────────────────────────────────────────────────────────────────────────────
// Success Messages
// ─────────────────────────────────────────────────────────────────────────────
export const SuccessMessages = {
  // Auth
  REGISTER: 'Registration successful',
  REGISTER_SUCCESS: 'Registration successful',
  LOGIN: 'Login successful',
  LOGIN_SUCCESS: 'Login successful',
  TOKEN_REFRESH: 'Token refreshed successfully',
  TOKEN_REFRESH_SUCCESS: 'Token refreshed successfully',
  FORGOT_PASSWORD_SENT:
    'If an account exists with this email, a password reset link has been sent.',
  PASSWORD_RESET: 'Password has been reset successfully',
  PASSWORD_RESET_SUCCESS: 'Password has been reset successfully',
  PROFILE_RETRIEVED: 'Profile retrieved successfully',
  PROFILE_RETRIEVED_SUCCESS: 'Profile retrieved successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  PROFILE_UPDATED_SUCCESS: 'Profile updated successfully',
  PASSWORD_CHANGED: 'Password changed successfully',
  PASSWORD_CHANGED_SUCCESS: 'Password changed successfully',
  LOGOUT: 'Logged out successfully',
  LOGOUT_SUCCESS: 'Logged out successfully',
  ACCOUNT_DELETED: 'Account deleted successfully',
  ACCOUNT_DELETED_SUCCESS: 'Account deleted successfully',

  // User Management
  USER_CREATED: 'User created successfully',
  USER_CREATED_SUCCESS: 'User created successfully',
  USERS_RETRIEVED: 'Users retrieved successfully',
  USERS_RETRIEVED_SUCCESS: 'Users retrieved successfully',
  USER_RETRIEVED: 'User retrieved successfully',
  USER_RETRIEVED_SUCCESS: 'User retrieved successfully',
  USER_UPDATED: 'User updated successfully',
  USER_UPDATED_SUCCESS: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',
  USER_DELETED_SUCCESS: 'User deleted successfully',

  // Common
  OPERATION_SUCCESS: 'Operation completed successfully',
  SUCCESS: 'Operation completed successfully',
};

// ─────────────────────────────────────────────────────────────────────────────
// Error Messages
// ─────────────────────────────────────────────────────────────────────────────
export const ErrMessages = {
  // Auth Custom
  NOT_AUTHORIZED: 'Authentication required to access this resource',
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_INACTIVE: 'Account is inactive. Please contact administrator.',
  TOKEN_EXPIRED: 'Token has expired',
  INVALID_TOKEN: 'Invalid authentication token',
  NOT_MATCH_PASSWORD: 'Current password does not match',
  RESET_TOKEN_INVALID: 'Invalid or already used password reset token',
  RESET_TOKEN_EXPIRED: 'Password reset token has expired',

  // Permissions & Roles
  PERMISSION_DENIED: 'Permission denied',
  SUPER_ADMIN_PROTECTED: 'Super Admin accounts cannot be deleted or modified',
  SELF_DEMOTION_FORBIDDEN: 'Super Admin cannot self-demote',

  // Project
  PROJECT_NOT_FOUND: 'Project not found',
  PROJECT_MISMATCH: 'Project mismatch: token does not belong to active project',

  // User
  USER_NOT_FOUND: 'User not found',
  DUPLICATE_EMAIL: 'User with this email already exists in this project',

  // Common & Server
  INTERNAL_SERVER_ERROR: 'Internal server error',
  VALIDATION_FAILED: 'Validation failed',
  PARAMS_VALIDATION_FAILED: 'URL parameters validation failed',
  QUERY_VALIDATION_FAILED: 'Query parameters validation failed',
  INVALID_UUID: 'User ID must be a valid UUID',
};

// Aliases for unified consumption
export const appMessage = {
  ...SuccessMessages,
  ...ErrMessages,
};

export const APP_MESSAGE = appMessage;
export default { SuccessMessages, ErrMessages, appMessage };
