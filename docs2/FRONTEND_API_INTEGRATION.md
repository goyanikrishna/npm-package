# ONYX Frontend API Integration Guide

> **Authoritative Frontend Integration Manual**  
> *Target audience: Frontend Developers integrating with ONYX Backend*

---

## 1. Environment & Base URL Configuration

The backend REST API is hosted with the standard `/api` route prefix:

| Environment | Base URL |
| :--- | :--- |
| **Local Development** | `http://localhost:8000/api` |
| **Staging** | `https://staging-api.onyx.com/api` |
| **Production** | `https://api.onyx.com/api` |

---

## 2. Authentication Mechanism

### 2.1 Request Headers
Every authenticated HTTP request must include the JWT bearer token in the `Authorization` header:

```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
```

### 2.2 Token Lifecycle & Session Handling
- Tokens are issued upon successful `POST /api/auth/login` or account verification.
- When a token expires, the API returns HTTP `401 Unauthorized` with:
  ```json
  {
    "success": false,
    "status": 401,
    "message": "Your session has expired. Please log in again."
  }
  ```
- **Action for Frontend**: On receiving status `401`, intercept the response, clear the cached session/token in browser storage, and redirect the user to `/login`.

---

## 3. Multi-Language & Internationalization (i18n)

The backend natively supports 5 languages:
- `en` — English (Default)
- `nl` — Dutch
- `fr` — French
- `de` — German
- `ar` — Arabic (Right-to-Left)

### Setting Client Language
Send the standard `Accept-Language` header with every request:

```http
Accept-Language: nl
```

The backend dynamically translates all error messages, validation messages, and response text into the requested language.

---

## 4. Common Response & Error Envelopes

### 4.1 Success Format

```typescript
interface IApiResponse<T> {
  success: boolean;       // Always true for 2xx responses
  status: number;        // HTTP status code (e.g. 200, 201)
  message: string;       // User-facing localized message
  data: T;               // Response payload
}
```

### 4.2 Error Format & Form Validation Mapping

```typescript
interface IApiErrorResponse {
  success: boolean;       // Always false for errors
  status: number;        // HTTP error code (e.g. 400, 401, 403, 404, 409, 422, 500)
  message: string;       // Primary user-facing error message
  error_code?: string;   // Machine-readable error code (e.g. "ACCOUNT_DELETED")
  errors?: Array<{       // Field-level validation errors
    field: string;       // Name of input field (e.g. "first_name", "email")
    message: string;     // Localized field validation error
  }>;
  data: null;
}
```

#### Mapping Validation Errors in Forms
When the frontend receives HTTP 400 with an `errors` array, map them directly to form fields:

```typescript
if (response.status === 400 && response.data.errors) {
  response.data.errors.forEach(({ field, message }) => {
    form.setFieldError(field, message);
  });
} else {
  toast.error(response.data.message);
}
```

---

## 5. Pagination Standard

All list endpoints (`/api/user/list`, `/api/project/list`, `/api/company/list`, `/api/audit-log`) return a standard pagination metadata object:

```typescript
interface IPaginatedData<T> {
  meta: {
    total: number;             // Total number of matching records
    per_page: number;          // Items per page
    current_page: number;      // Current active page (1-based)
    last_page: number;         // Total available pages
    has_next_page: boolean;    // True if more pages exist
    has_previous_page: boolean;// True if current_page > 1
  };
  data: T[];                   // Array of records for current page
}
```

### Querying Paginated Endpoints
```http
GET /api/project/list?page=1&per_page=10&search=Commercial&status=active
```

---

## 6. Chunked Multipart File Upload Flow

ONYX supports large file uploads (up to 200MB) via Cloudflare R2 / S3 using a resilient, chunked multipart upload session.

```
Frontend                           Backend                            R2 Object Storage
   │                                  │                                      │
   ├────── 1. POST /api/media/uploads ───────► (Validates mime, creates session)
   │       { files: [...] }           │                                      │
   │◄───── Session ID & Presigned URLs ────────┤                                      │
   │                                  │                                      │
   ├────── 2. Direct PUT Part 1 ────────────────────────────────────────────►│ (Direct S3 upload)
   ├──────    Direct PUT Part 2 ────────────────────────────────────────────►│ (Direct S3 upload)
   │◄─────    Returns ETag for each part ────────────────────────────────────┤
   │                                  │                                      │
   ├────── 3. POST /uploads/:id/complete ────► (Validates ETags, completes)  │
   │       { parts: [{ PartNumber, ETag }] }   ├──── S3 CompleteMultipart ──►│
   │◄───── Ready Media Record ────────┤                                      │
   │                                  │                                      │
   ├────── 4. POST /api/media/link ──────────► (Links media to project/user) │
```

### Step 1: Initiate Upload Session
`POST /api/media/uploads`
```json
{
  "files": [
    {
      "filename": "facade-epd.xlsx",
      "file_size": 25000000,
      "mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "entity_type": "project"
    }
  ]
}
```
**Response**: Contains `session_id`, `chunk_size` (typically 10MB), and presigned `parts` URLs with `part_number` and `upload_url`.

### Step 2: Upload Chunks Directly to Storage
For each part, issue a `PUT` request directly to `part.upload_url` with the sliced file `Blob`:
```typescript
const response = await fetch(part.upload_url, {
  method: 'PUT',
  body: fileChunkBlob,
});
const etag = response.headers.get('ETag');
```

### Step 3: Complete Session
`POST /api/media/uploads/:sessionId/complete`
```json
{
  "parts": [
    { "part_number": 1, "etag": "\"etag-1\"" },
    { "part_number": 2, "etag": "\"etag-2\"" }
  ]
}
```

### Step 4: Link Media to Entity
`POST /api/media/link`
```json
{
  "media_ids": ["uuid-of-media"],
  "entity_type": "project",
  "entity_id": "uuid-of-project"
}
```

---

## 7. Date and Number Formatting

- **Dates**: The API accepts and returns ISO 8601 strings (e.g. `2026-10-28T10:00:00.000Z`).
- **Numbers & Decimals**: Monetary amounts and GWP carbon calculations are returned as clean numbers or formatted strings (`formatCleanNumber`).

