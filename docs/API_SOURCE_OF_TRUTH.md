# `node-backend-toolkit` — API Source of Truth

> **Authoritative API Contract for Frontend Integration**  
> All endpoints are scoped by project slug: `/api/:project_slug/...`

---

## 1. Global Conventions

### 1.1 Base URL
```
/api/:project_slug
```
Example: `/api/acme-health/auth/login`

### 1.2 Common Response Format
All successful responses return HTTP 200, 201, or 204 with the standard envelope:
```json
{
  "success": true,
  "status": 200,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### 1.3 Common Error Response Format
All errors return the standard error envelope:
```json
{
  "success": false,
  "status": 400,
  "message": "Validation failed",
  "error_code": "VALIDATION_ERROR",
  "errors": ["Password must be at least 8 characters"],
  "data": null
}
```

### 1.4 Standard Error Codes
| Status Code | Error Code | Description |
|---|---|---|
| `400` | `BAD_REQUEST` / `VALIDATION_ERROR` | Payload or query parameter failed validation |
| `401` | `UNAUTHORIZED` / `INVALID_TOKEN` / `TOKEN_EXPIRED` | Missing, invalid, or expired JWT |
| `403` | `PERMISSION_DENIED` / `USER_INACTIVE` / `PROJECT_MISMATCH` | Insufficient permissions or wrong project |
| `404` | `NOT_FOUND` / `USER_NOT_FOUND` / `PROJECT_NOT_FOUND` | Requested entity not found |
| `409` | `DUPLICATE_EMAIL` / `DUPLICATE_PROJECT` / `DUPLICATE_ROLE` | Conflict / unique violation |
| `422` | `NOT_MATCH` / `FOREIGN_KEY_VIOLATION` | Unprocessable entity |
| `429` | `RATE_LIMIT_EXCEEDED` | Too many requests |
| `500` | `INTERNAL_SERVER_ERROR` | Unhandled server error |

---

## 2. Authentication Module

### 2.1 Self-Registration
- **HTTP Method**: `POST`
- **Endpoint**: `/api/:project_slug/auth/register`
- **Purpose**: Allows new users to self-register into the specified project
- **Authentication**: None
- **Permission**: None
- **Path Parameters**:
  - `project_slug` (string, required): Slug of the project
- **Request Body**:
  | Field | Type | Required | Description |
  |---|---|---|---|
  | `email` | string (email) | Yes | Valid email address |
  | `password` | string | Yes | Min 8 chars (configurable policy) |
  | `firstName` | string | Yes | User first name (1-100 chars) |
  | `lastName` | string | Yes | User last name (1-100 chars) |
  | `phone` | string | No | User phone number |
  | `language` | string | No | Preferred language code (default: 'en') |
  | `profile` | object | No | Key-value pairs for configured dynamic fields |

- **Request Example**:
  ```json
  {
    "email": "doctor.smith@example.com",
    "password": "SecurePassword123!",
    "firstName": "John",
    "lastName": "Smith",
    "phone": "+1-555-0199",
    "profile": {
      "department": "Cardiology",
      "years_experience": 12
    }
  }
  ```

- **Success Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "status": 201,
    "message": "Registration successful",
    "data": {
      "user": {
        "id": "7f8b9e6a-1234-4567-89ab-cdef01234567",
        "project_id": "3a1c2e4f-5678-90ab-cdef-1234567890ab",
        "first_name": "John",
        "last_name": "Smith",
        "email": "doctor.smith@example.com",
        "phone": "+1-555-0199",
        "role": "user",
        "status": "active",
        "language": "en",
        "created_at": "2026-10-16T10:00:00.000Z",
        "profile": {
          "department": "Cardiology",
          "years_experience": 12
        }
      },
      "tokens": {
        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refresh_token": "9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b...",
        "token_type": "Bearer",
        "expires_in": "15m"
      }
    }
  }
  ```

---

### 2.2 Login
- **HTTP Method**: `POST`
- **Endpoint**: `/api/:project_slug/auth/login`
- **Purpose**: Authenticates credentials and returns an access token and refresh token pair
- **Authentication**: None
- **Permission**: None
- **Request Body**:
  | Field | Type | Required | Description |
  |---|---|---|---|
  | `email` | string (email) | Yes | User email |
  | `password` | string | Yes | Plaintext password |

- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "status": 200,
    "message": "Login successful",
    "data": {
      "user": {
        "id": "7f8b9e6a-1234-4567-89ab-cdef01234567",
        "first_name": "John",
        "last_name": "Smith",
        "email": "doctor.smith@example.com",
        "role": "user",
        "status": "active"
      },
      "tokens": {
        "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
        "refresh_token": "9a8b7c6d5e4f3a2b1c...",
        "token_type": "Bearer",
        "expires_in": "15m"
      }
    }
  }
  ```

- **Error Responses**:
  - `401 Unauthorized` (`INVALID_CREDENTIALS`): Incorrect email or password.
  - `403 Forbidden` (`USER_INACTIVE`): Account is inactive or suspended.

---

### 2.3 Refresh Token Rotation
- **HTTP Method**: `POST`
- **Endpoint**: `/api/:project_slug/auth/refresh-token`
- **Purpose**: Exchanges a valid refresh token for a newly issued access token and rotated refresh token
- **Authentication**: None (refresh token in payload)
- **Request Body**:
  | Field | Type | Required | Description |
  |---|---|---|---|
  | `refreshToken` | string | Yes | Current refresh token |

- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "status": 200,
    "message": "Token refreshed successfully",
    "data": {
      "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
      "refresh_token": "new-rotated-refresh-token...",
      "token_type": "Bearer",
      "expires_in": "15m"
    }
  }
  ```

---

### 2.4 Forgot Password
- **HTTP Method**: `POST`
- **Endpoint**: `/api/:project_slug/auth/forgot-password`
- **Purpose**: Triggers password reset email with secure 60-minute token
- **Authentication**: None
- **Request Body**:
  | Field | Type | Required | Description |
  |---|---|---|---|
  | `email` | string (email) | Yes | Account email |

- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "status": 200,
    "message": "If an account exists with this email, a password reset link has been sent.",
    "data": null
  }
  ```

---

### 2.5 Reset Password
- **HTTP Method**: `POST`
- **Endpoint**: `/api/:project_slug/auth/reset-password`
- **Purpose**: Consumes reset token and sets new password
- **Authentication**: None
- **Request Body**:
  | Field | Type | Required | Description |
  |---|---|---|---|
  | `token` | string | Yes | Token received via email |
  | `newPassword` | string | Yes | New password satisfying policy |

- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "status": 200,
    "message": "Password has been reset successfully",
    "data": null
  }
  ```

---

### 2.6 Get Profile
- **HTTP Method**: `GET`
- **Endpoint**: `/api/:project_slug/auth/profile`
- **Purpose**: Retrieves authenticated user's profile and custom fields
- **Authentication**: Bearer JWT
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "status": 200,
    "message": "Profile retrieved successfully",
    "data": {
      "id": "7f8b9e6a-1234-4567-89ab-cdef01234567",
      "first_name": "John",
      "last_name": "Smith",
      "email": "doctor.smith@example.com",
      "role": "user",
      "status": "active",
      "profile": {
        "department": "Cardiology",
        "years_experience": 12
      }
    }
  }
  ```

---

### 2.7 Update Profile
- **HTTP Method**: `PATCH`
- **Endpoint**: `/api/:project_slug/auth/profile`
- **Purpose**: Updates own user details and custom fields
- **Authentication**: Bearer JWT
- **Request Body**:
  | Field | Type | Required | Description |
  |---|---|---|---|
  | `firstName` | string | No | Updated first name |
  | `lastName` | string | No | Updated last name |
  | `phone` | string | No | Updated phone |
  | `avatar` | string | No | Avatar URL |
  | `language` | string | No | Language code |
  | `profile` | object | No | Updated dynamic fields |

---

### 2.8 Change Password
- **HTTP Method**: `POST`
- **Endpoint**: `/api/:project_slug/auth/change-password`
- **Purpose**: Changes password while authenticated, revokes all other sessions
- **Authentication**: Bearer JWT
- **Request Body**:
  | Field | Type | Required | Description |
  |---|---|---|---|
  | `currentPassword` | string | Yes | Existing password |
  | `newPassword` | string | Yes | New password |

---

### 2.9 Logout
- **HTTP Method**: `POST`
- **Endpoint**: `/api/:project_slug/auth/logout`
- **Purpose**: Revokes refresh token in `sessions` table
- **Authentication**: Bearer JWT
- **Request Body**:
  | Field | Type | Required | Description |
  |---|---|---|---|
  | `refreshToken` | string | No | Specific refresh token to invalidate |

---

### 2.10 Delete Account
- **HTTP Method**: `DELETE`
- **Endpoint**: `/api/:project_slug/auth/account`
- **Purpose**: Self-delete user account (Super Admin protected)
- **Authentication**: Bearer JWT
- **Request Body**:
  | Field | Type | Required | Description |
  |---|---|---|---|
  | `password` | string | Yes | Password confirmation |

---

## 3. User Management Module (Admin / RBAC)

### 3.1 List Users
- **HTTP Method**: `GET`
- **Endpoint**: `/api/:project_slug/users`
- **Authentication**: Bearer JWT
- **Required Permission**: `users:list`
- **Query Parameters**:
  | Param | Type | Default | Description |
  |---|---|---|---|
  | `page` | integer | `1` | Page number |
  | `limit` | integer | `20` | Max results (max: 100) |
  | `search` | string | — | Search across first_name, last_name, email |
  | `role` | string | — | Filter by role name |
  | `status` | string | — | Filter by status |
- **Rules**:
  - The system `super_admin` account is automatically excluded from general user listings.

- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "status": 200,
    "message": "Users retrieved successfully",
    "data": {
      "items": [
        {
          "id": "...",
          "first_name": "...",
          "last_name": "...",
          "email": "...",
          "role": "user",
          "status": "active"
        }
      ],
      "meta": {
        "total": 142,
        "page": 1,
        "limit": 20,
        "totalPages": 8,
        "hasNext": true,
        "hasPrev": false
      }
    }
  }
  ```

---

### 3.2 Create User (Admin)
- **HTTP Method**: `POST`
- **Endpoint**: `/api/:project_slug/users`
- **Authentication**: Bearer JWT
- **Required Permission**: `users:create`
- **Request Body**: Same as register + `role` and `status` fields.

---

### 3.3 Get User by ID
- **HTTP Method**: `GET`
- **Endpoint**: `/api/:project_slug/users/:id`
- **Authentication**: Bearer JWT
- **Required Permission**: `users:view`

---

### 3.4 Update User
- **HTTP Method**: `PATCH`
- **Endpoint**: `/api/:project_slug/users/:id`
- **Authentication**: Bearer JWT
- **Required Permission**: `users:update`
- **Rules**:
  - Super Admin cannot self-demote.
  - Non-Super Admin cannot modify a Super Admin account.

---

### 3.5 Delete User
- **HTTP Method**: `DELETE`
- **Endpoint**: `/api/:project_slug/users/:id`
- **Authentication**: Bearer JWT
- **Required Permission**: `users:delete`
- **Rules**:
  - Super Admin accounts CANNOT be deleted (`403 SUPER_ADMIN_PROTECTED`).
