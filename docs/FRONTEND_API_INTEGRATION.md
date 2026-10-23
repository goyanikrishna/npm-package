# Frontend API Integration Guide

> **Authoritative Integration Handbook for Frontend Engineers**  
> Complete guide for integrating with the `node-backend-toolkit` REST API.

---

## 1. Quick Overview

- **Protocol**: HTTPS / REST
- **Base URL**: `https://api.yourdomain.com/api/:project_slug`
- **Data Format**: `application/json`
- **Authentication**: Bearer JWT (Access Token in header) + Refresh Token rotation
- **Date Format**: ISO 8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`)

---

## 2. Authentication & Session Management

### 2.1 Token Pair Flow
```
User Login / Register
         │
         ▼
Receive { access_token (15m), refresh_token (7d) }
         │
         ├───> Store access_token in Memory or Secure Cookie
         └───> Store refresh_token in httpOnly Cookie or Secure Storage
```

### 2.2 Header Format
Include the access token in every authenticated request:
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 2.3 Automatic Token Refresh (Axios Interceptor Example)
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.yourdomain.com/api/my-project',
});

// Attach access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle expired tokens with automatic refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        // Redirect to login
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(
          'https://api.yourdomain.com/api/my-project/auth/refresh-token',
          { refreshToken },
        );

        localStorage.setItem('access_token', data.data.access_token);
        localStorage.setItem('refresh_token', data.data.refresh_token);

        originalRequest.headers.Authorization = `Bearer ${data.data.access_token}`;
        return api(originalRequest);
      } catch (refreshErr) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(error);
  },
);

export default api;
```

---

## 3. Standard Response & Error Envelopes

### 3.1 Success Envelope
```typescript
interface IApiResponse<T> {
  success: true;
  status: number;
  message: string;
  data: T;
}
```

### 3.2 Error Envelope
```typescript
interface IApiError {
  success: false;
  status: number;
  message: string;
  error_code?: string;
  errors?: string[] | Record<string, string>;
  data: null;
}
```

### 3.3 UI Error Mapping Helper
```typescript
export function getErrorMessage(error: any): string {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  return 'An unexpected error occurred. Please try again.';
}
```

---

## 4. Complete Endpoint Catalog

| Module | Method | Route | Auth | Permission | Description |
|---|---|---|---|---|---|
| **Auth** | `POST` | `/auth/register` | No | — | Create account |
| **Auth** | `POST` | `/auth/login` | No | — | Authenticate & get token pair |
| **Auth** | `POST` | `/auth/refresh-token` | No | — | Rotate refresh token |
| **Auth** | `POST` | `/auth/forgot-password` | No | — | Request reset email |
| **Auth** | `POST` | `/auth/reset-password` | No | — | Reset password via token |
| **Auth** | `GET` | `/auth/profile` | Yes | — | Get logged-in user profile |
| **Auth** | `PATCH` | `/auth/profile` | Yes | — | Update own profile |
| **Auth** | `POST` | `/auth/change-password` | Yes | — | Change own password |
| **Auth** | `POST` | `/auth/logout` | Yes | — | Invalidate session |
| **Auth** | `DELETE`| `/auth/account` | Yes | — | Delete own account |
| **Users** | `GET` | `/users` | Yes | `users:list` | Paginated user list |
| **Users** | `POST` | `/users` | Yes | `users:create`| Admin create user |
| **Users** | `GET` | `/users/:id` | Yes | `users:view` | View user by ID |
| **Users** | `PATCH`| `/users/:id` | Yes | `users:update`| Update user |
| **Users** | `DELETE`| `/users/:id` | Yes | `users:delete`| Delete user |

---

## 5. Pagination & Filtering

When calling `GET /users`:
- `page`: 1-based page index (e.g. `?page=1`)
- `limit`: items per page (e.g. `?limit=20`, max: 100)
- `search`: search by name or email (e.g. `?search=john`)
- `role`: filter by role (e.g. `?role=manager`)
- `status`: filter by status (e.g. `?status=active`)

Pagination response format:
```json
{
  "items": [ ... ],
  "meta": {
    "total": 120,
    "page": 1,
    "limit": 20,
    "totalPages": 6,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## 6. Important User Flow Examples

### 6.1 Registration & First Login
1. Frontend calls `POST /api/:project_slug/auth/register` with `firstName`, `lastName`, `email`, `password`.
2. Response contains user object and tokens.
3. Store tokens and navigate to dashboard.

### 6.2 Forgot Password Flow
1. User enters email -> `POST /api/:project_slug/auth/forgot-password`.
2. User receives email with link containing `?token=XYZ`.
3. User navigates to `/reset-password?token=XYZ`.
4. User submits new password -> `POST /api/:project_slug/auth/reset-password` with `{ token, newPassword }`.
5. Frontend redirects to login on success.
