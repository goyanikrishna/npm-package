# ONYX Backend — API Source of Truth

> **Authoritative Endpoint Contract & Specification**  
> *Base URL: `/api` | Format: JSON | Protocol: HTTPS | Auth: Bearer JWT*

---

## 1. Global API Standards

### 1.1 Common Headers
- `Authorization: Bearer <JWT_TOKEN>` (Required for all protected endpoints)
- `Accept-Language: <lang>` (Optional; supports `en`, `nl`, `fr`, `de`, `ar`; defaults to `en`)
- `Content-Type: application/json`

### 1.2 Common Response Envelope
```json
{
  "success": true,
  "status": 200,
  "message": "Translated message text",
  "data": { ... }
}
```

### 1.3 Common Error Envelope
```json
{
  "success": false,
  "status": 400,
  "message": "Translated error message",
  "error_code": "OPTIONAL_ERROR_CODE",
  "errors": [
    {
      "field": "email",
      "message": "A valid email address is required."
    }
  ],
  "data": null
}
```

### 1.4 Common Pagination Envelope
```json
{
  "success": true,
  "status": 200,
  "message": "List retrieved successfully.",
  "data": {
    "meta": {
      "total": 100,
      "per_page": 10,
      "current_page": 1,
      "last_page": 10,
      "has_next_page": true,
      "has_previous_page": false
    },
    "data": [ ... ]
  }
}
```

---

## 2. Module Endpoints Catalog

### 2.1 Authentication (`/api/auth`)

Mounted at `/api/auth` (Public endpoints).

| Method | Endpoint | Purpose | Auth / Permission | Request Body | Success Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Register new user & company | Public | `IUserSignupPayload` | 200 |
| `POST` | `/api/auth/login` | Authenticate & obtain JWT | Public | `{ email, password, language }` | 200 |
| `POST` | `/api/auth/forgot-password` | Request password reset email | Public | `{ email, language }` | 200 |
| `POST` | `/api/auth/reset-password` | Reset password using token | Public | `{ token, password, language }` | 200 |

---

### 2.2 Users & Profile (`/api/user`)

Mounted at `/api/user` (Protected by `authorize`).

| Method | Endpoint | Purpose | Required Permission | Query / Body Params | Success Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/user/list` | List users with pagination | `list_users` | Query: `page`, `per_page`, `search`, `role`, `status`, `fetch_all` | 200 |
| `GET` | `/api/user/get/:id?` | Get user details (or self if omitted) | `get_user` | Path param: `:id` (UUID, optional) | 200 |
| `PUT` | `/api/user/update` | Update user / profile & company | `update_user` | Body: `IUserUpdatePayload` (`id` optional if self) | 200 |
| `DELETE` | `/api/user/delete/:id?` | Soft delete user | `delete_user` | Path param: `:id` (UUID, optional) | 200 |
| `PUT` | `/api/user/change-password` | Change current user password | `change_password` | Body: `{ old_password, new_password }` | 200 |

---

### 2.3 Companies (`/api/company`)

Mounted at `/api/company`. Creation and listing are public; details/updates are protected.

| Method | Endpoint | Purpose | Auth / Permission | Parameters | Success Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/company/create` | Create new company | Public | Body: `ICompanyPayload` | 200 |
| `GET` | `/api/company/list` | List companies | Public | Query: `page`, `per_page`, `search`, `company_size`, `country` | 200 |
| `GET` | `/api/company/countries` | List distinct countries in use | 🔒 `list_company_countries` | None | 200 |
| `GET` | `/api/company/get/:id` | Get single company details | 🔒 `get_company` | Path param: `:id` (UUID) | 200 |
| `PUT` | `/api/company/update` | Update company | 🔒 `update_company` | Body: `ICompanyUpdatePayload` (`id` required in body) | 200 |
| `DELETE` | `/api/company/delete/:id` | Soft delete company | 🔒 `delete_company` | Path param: `:id` (UUID) | 200 |

---

### 2.4 Projects (`/api/project`)

Mounted at `/api/project` (Protected by `authorize`).

| Method | Endpoint | Purpose | Required Permission | Parameters | Success Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/project/create` | Create project | `create_project` | Body: `IProjectPayload` | 200 |
| `GET` | `/api/project/list` | List projects (paginated) | `list_projects` | Query: `page`, `per_page`, `search`, `status`, `project_type` | 200 |
| `GET` | `/api/project/:id` | Get project details | `get_project` | Path param: `:id` (UUID) | 200 |
| `PUT` | `/api/project/update` | Update project | `update_project` | Body: `IProjectUpdatePayload` (`id` required in body) | 200 |
| `DELETE` | `/api/project/delete/:id` | Soft delete project | `delete_project` | Path param: `:id` (UUID) | 200 |

---

### 2.5 Media & File Uploads (`/api/media`)

Mounted at `/api/media` (Protected by `authorize`).

| Method | Endpoint | Purpose | Parameters | Success Status |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/media/uploads` | Initiate multipart upload session | Body: `IInitUploadsPayload` (`files: [...]`) | 200 |
| `GET` | `/api/media/uploads/:sessionId` | Get session progress & remaining parts | Path param: `:sessionId` (UUID) | 200 |
| `DELETE` | `/api/media/uploads/:sessionId` | Abort upload session | Path param: `:sessionId` (UUID) | 200 |
| `PUT` | `/api/media/uploads/:sessionId/pause` | Pause upload session | Path param: `:sessionId` (UUID) | 200 |
| `POST` | `/api/media/uploads/:sessionId/complete`| Complete multipart upload | Path param: `:sessionId`, Body: `{ parts: [...] }` | 200 |
| `POST` | `/api/media/link` | Link media to domain entity | Body: `{ media_ids, entity_type, entity_id }` | 200 |
| `GET` | `/api/media` | List media files | Query: `page`, `limit`, `entity_type`, `entity_id` | 200 |
| `DELETE` | `/api/media` | Bulk soft-delete media | Body: `{ media_ids: string[] }` | 200 |
| `GET` | `/api/media/:id` | Get media metadata | Path param: `:id` (UUID) | 200 |
| `GET` | `/api/media/:id/url` | Get presigned download URL | Path param: `:id` (UUID) | 200 |

---

### 2.6 Environmental Product Declaration — EPD (`/api/epd`)

Mounted at `/api/epd` (Protected by `authorize`).

| Method | Endpoint | Purpose | Required Permission |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/epd/upload` | Upload EPD Excel file & parse data | `upload_epd` |
| `GET` | `/api/epd/kpi` | Get EPD KPI metrics | `get_epd_kpi` |
| `GET` | `/api/epd/whole-life-carbon` | Get Whole Life Carbon analysis | `get_epd_whole_life_carbon` |
| `GET` | `/api/epd/gwp-contribution` | Get GWP contribution chart data | `get_epd_gwp_contribution` |
| `GET` | `/api/epd/product-information`| Get product metadata | `get_epd_product_information` |
| `GET` | `/api/epd/module-results` | Get life cycle module results | `get_epd_module_result` |
| `PUT` | `/api/epd/verification-status`| Update verification checklist status | `get_epd_verification_status` *(See INC-04)* |
| `GET` | `/api/epd/download` | Download EPD Excel report | `download_epd_excel` |
| `POST` | `/api/epd/generate-pdf` | Generate EPD PDF report | `generate_epd_pdf` |

---

### 2.7 Life Cycle Assessment — LCA (`/api/lca`)

Mounted at `/api/lca` (Protected by `authorize`).

| Method | Endpoint | Purpose | Required Permission |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/lca/upload` | Upload LCA Excel spreadsheet | `upload_lca` |
| `GET` | `/api/lca/benchmark` | Get LCA Benchmark comparison | `get_lca_benchmark` |
| `GET` | `/api/lca/kpi` | Get LCA KPIs | `get_lca_kpi` |
| `GET` | `/api/lca/whole-life-carbon` | Get LCA Whole Life Carbon breakdown | `get_lca_whole_life_carbon` |
| `GET` | `/api/lca/gwp-contribution` | Get LCA GWP contribution | `get_lca_gwp_contribution` |
| `GET` | `/api/lca/project-information`| Get LCA project information | `get_lca_project_information` |
| `GET` | `/api/lca/top-materials` | Get highest carbon materials | `get_lca_top_materials` |
| `GET` | `/api/lca/alternatives` | Get AI/Database alternative materials | `get_lca_alternatives` |
| `POST` | `/api/lca/regenerate-alternatives`| Force regenerate AI alternatives | `regenerate_lca_alternatives` |
| `PUT` | `/api/lca/alternative-material` | Update selected alternative material | `update_lca_alternative_material` |
| `GET` | `/api/lca/download` | Download LCA Excel report | `download_lca_excel` |
| `POST` | `/api/lca/generate-pdf` | Generate LCA PDF report | `generate_lca_pdf` |

---

### 2.8 Admin Dashboard (`/api/admin`)

Mounted at `/api/admin` (Protected by `authorize` + Admin permissions).

| Method | Endpoint | Purpose | Required Permission |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/kpi` | User KPIs for Admin Users view | `get_admin_kpi` |
| `GET` | `/api/admin/dashboard/kpi` | Platform 6-metric KPI block | `get_admin_kpi` |
| `GET` | `/api/admin/dashboard/companies-by-type` | Company role distribution | `get_admin_kpi` |
| `GET` | `/api/admin/dashboard/companies-by-country`| Company country distribution | `get_admin_kpi` |
| `GET` | `/api/admin/dashboard/projects-by-type` | Project service type distribution | `get_admin_kpi` |
| `GET` | `/api/admin/dashboard/project-pipeline` | 11-stage project pipeline counts | `get_admin_kpi` |
| `GET` | `/api/admin/dashboard/recent-projects` | Top 5 recently updated projects | `get_admin_kpi` |
| `GET` | `/api/admin/dashboard/recent-companies` | Top 5 recently registered companies | `get_admin_kpi` |
| `GET` | `/api/admin/dashboard/recent-activities` | Top 5 recent platform audit logs | `get_admin_kpi` |
| `GET` | `/api/admin/dashboard` | Consolidated dashboard overview | `get_admin_kpi` |
| `GET` | `/api/admin/dashboard/download` | Download dashboard analytics in Excel | `get_admin_kpi` |

---

### 2.9 Chat, Notifications & Audit Logs

| Module | Mount Path | Methods & Endpoints | Required Permission |
| :--- | :--- | :--- | :--- |
| **Chat** | `/api/chat` | `POST /` (Send message), `GET /:entityType/:entityId` (List messages) | `send_message`, `list_messages` |
| **Notifications** | `/api/notification` | `GET /` (List notifications), `PUT /read` (Mark read) | `list_notifications`, `update_notification` |
| **Audit Logs** | `/api/audit-log` | `GET /` (List paginated audit logs) | `list_audit_logs` |
| **Contact Submissions**| `/api/contact-submission` | `POST /create` (Public), `GET /list` (Admin), `GET /:id` (Admin) | `list_contact_submissions`, `get_contact_submission` |
| **Project Options** | `/api/project-option` | `GET /` (List category and building type options) | `list_project_options` |

