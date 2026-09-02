# Phase 2 — Frontend Architecture Design

> Designed to integrate exactly with the existing FastAPI backend.
> No backend APIs invented. Future endpoints (GET /api/jobs, GET /api/me) are stubbed but not called until the backend adds them.

---

## 1. Technology Stack

| Concern | Library | Why |
|---------|---------|-----|
| Framework | React 18 + Vite + TypeScript | As specified |
| Styling | TailwindCSS v3 | As specified |
| Routing | React Router v6 | As specified |
| HTTP client | Axios | As specified; interceptors handle auth headers + 401 |
| Server state | TanStack Query v5 | Caching, background refetch, mutation lifecycle |
| Form state | React Hook Form + Zod | As specified; matches backend validation constraints |
| SSE | @microsoft/fetch-event-source | Required — backend SSE demands Bearer header |
| Auth state | Context API | As specified; lightweight, no Redux needed |

---

## 2. Folder Structure

```
FRONTEND/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
│
└── src/
    ├── main.tsx                    # ReactDOM.createRoot, QueryClientProvider, Router, AuthProvider
    ├── App.tsx                     # Route declarations
    ├── index.css                   # Tailwind directives + global tokens
    │
    ├── types/
    │   └── api.ts                  # All TypeScript types mirroring backend schemas exactly
    │
    ├── lib/
    │   ├── token.ts                # localStorage read/write/clear for JWT
    │   └── utils.ts                # cn() class merger, date formatter, style label map
    │
    ├── api/
    │   ├── client.ts               # Axios instance, request interceptor (inject token),
    │   │                           # response interceptor (catch 401 → logout)
    │   ├── auth.api.ts             # signup(), login()
    │   ├── jobs.api.ts             # uploadHeadshot(), createJob(), getJob()
    │   └── me.api.ts               # getMe()  ← stubbed, called only when backend adds /api/me
    │
    ├── context/
    │   └── AuthContext.tsx         # token + user state, login(), logout(), isAuthenticated
    │
    ├── hooks/
    │   ├── useAuth.ts              # useMutation wrappers: useLogin, useSignup
    │   ├── useJob.ts               # useQuery for GET /api/job/:id
    │   ├── useJobs.ts              # useQuery for GET /api/jobs  ← stubbed, enabled=false until backend ready
    │   ├── useCreateJob.ts         # useMutation for POST /api/job
    │   ├── useUploadHeadshot.ts    # useMutation for POST /api/upload_headshot
    │   ├── useMe.ts                # useQuery for GET /api/me  ← stubbed
    │   └── useJobStream.ts         # SSE hook using @microsoft/fetch-event-source
    │
    ├── components/
    │   ├── layout/
    │   │   ├── AppLayout.tsx       # Navbar + main content area, wraps protected pages
    │   │   └── AuthLayout.tsx      # Centered card layout for login/signup
    │   │
    │   ├── ui/                     # Reusable design-system primitives
    │   │   ├── Button.tsx
    │   │   ├── Input.tsx
    │   │   ├── Card.tsx
    │   │   ├── Badge.tsx
    │   │   ├── Spinner.tsx
    │   │   └── ProgressBar.tsx
    │   │
    │   ├── auth/
    │   │   ├── LoginForm.tsx
    │   │   └── SignupForm.tsx
    │   │
    │   ├── headshot/
    │   │   └── HeadshotUploader.tsx   # Drag-drop upload → preview → POST /api/upload_headshot
    │   │
    │   ├── job/
    │   │   ├── CreateJobForm.tsx      # prompt field + num_thumbnails selector + submit
    │   │   ├── JobStatusBadge.tsx     # pending | processing | completed | failed
    │   │   └── JobCard.tsx            # Summary card for dashboard list
    │   │
    │   └── thumbnail/
    │       ├── ThumbnailCard.tsx      # Image + style name + variant tabs + download button
    │       ├── ThumbnailGrid.tsx      # Responsive grid of ThumbnailCards
    │       ├── StyleBadge.tsx         # Colour-coded label for each style_name
    │       ├── VariantSelector.tsx    # YouTube / Shorts / Square tab switcher
    │       └── ThumbnailSkeleton.tsx  # Animated placeholder while generating
    │
    ├── pages/
    │   ├── LoginPage.tsx
    │   ├── SignupPage.tsx
    │   ├── DashboardPage.tsx          # Job history (future: GET /api/jobs)
    │   ├── CreatePage.tsx             # Two-step: headshot upload → job config
    │   └── JobPage.tsx                # SSE stream → live thumbnail results
    │
    └── router/
        ├── index.tsx                  # createBrowserRouter config
        └── ProtectedRoute.tsx         # Redirects to /login if no valid token
```

---

## 3. Routing

```
/                  → redirect: authenticated → /dashboard, else → /login
/login             → LoginPage        (public)
/signup            → SignupPage       (public)
/dashboard         → DashboardPage    (protected)
/create            → CreatePage       (protected)
/job/:jobId        → JobPage          (protected)
*                  → redirect to /dashboard
```

All routes under the protected group are wrapped in `ProtectedRoute`, which checks `AuthContext.isAuthenticated`. If false, it redirects to `/login` with a `?next=` param so the user is returned to their intended page after login.

---

## 4. Authentication Flow (Frontend)

```
App mounts
    │
    ▼
AuthContext.tsx
    ├─ Read token from localStorage ("thumbnail_token")
    ├─ Set token in state
    ├─ axios.defaults.headers injected via request interceptor in client.ts
    └─ isAuthenticated = token !== null

User logs in
    │ POST /auth/login
    ▼
useLogin mutation (TanStack Query)
    ├─ On success: token.save(access_token)
    │              setToken(access_token) in context
    │              queryClient.invalidateQueries()
    │              navigate("/dashboard")
    └─ On error: display field-level error from API

Axios request interceptor (api/client.ts)
    └─ Every request: config.headers.Authorization = `Bearer ${token.get()}`

Axios response interceptor (api/client.ts)
    └─ On 401: token.clear()
               window.location.href = "/login"
               (clears stale token, forces re-login)

User logs out
    └─ token.clear()
       setToken(null) in context
       queryClient.clear()
       navigate("/login")
```

**Token storage:** `localStorage` key `thumbnail_token`.
**No refresh token** — on expiry (30 min), the 401 interceptor catches it and redirects to login.

---

## 5. TypeScript Type Definitions (types/api.ts)

Exactly mirrors the backend Pydantic schemas — no invented fields.

```typescript
// Auth
export interface UserResponse     { id: string; email: string }
export interface TokenResponse    { access_token: string; token_type: string }
export interface UserSignup       { email: string; password: string }
export interface UserLogin        { email: string; password: string }

// Thumbnails
export type ThumbnailStatus = 'pending' | 'generating' | 'uploaded' | 'failed'
export type JobStatus       = 'pending' | 'processing' | 'completed' | 'failed'
export type StyleName       = 'bold_dramatic' | 'clean_minimal' | 'vibrant_energetic'

export interface ThumbnailVariants {
  youtube: string   // ?tr=w-1280,h-720,fo-auto,c-maintain_ratio
  shorts:  string   // ?tr=w-1080,h-1920,fo-auto,c-maintain_ratio
  square:  string   // ?tr=w-1080,h-1080,fo-auto,c-maintain_ratio
}

export interface ThumbnailResponse {
  id:            string
  style_name:    StyleName
  status:        ThumbnailStatus
  imagekit_url:  string | null
  error_message: string | null
  variants:      ThumbnailVariants | null
}

export interface JobResponse {
  id:             string
  prompt:         string
  num_thumbnails: number
  headshot_url:   string
  status:         JobStatus
  thumbnails:     ThumbnailResponse[]
}

// Requests
export interface CreateJobRequest  { prompt: string; num_thumbnails: number; headshot_url: string }
export interface CreateJobResponse { job_id: string }
export interface UploadResponse    { url: string }

// SSE event data payloads (from /api/job/:id/stream)
export interface ThumbnailReadyEvent {
  thumbnail_id: string
  style_name:   StyleName
  imagekit_url: string
  variants:     ThumbnailVariants
}
export interface ThumbnailFailedEvent {
  thumbnail_id: string
  style_name:   StyleName
  error:        string
}
export interface JobCompletedEvent {
  job_id: string
  status: JobStatus
}
```

---

## 6. API Layer (api/)

### api/client.ts
- Single Axios instance with `baseURL: http://localhost:8000`
- **Request interceptor:** reads token from `lib/token.ts`, injects `Authorization: Bearer`
- **Response interceptor:** catches `401` → clears token → redirects to `/login`

### api/auth.api.ts
```typescript
signup(data: UserSignup)  → POST /auth/signup  → UserResponse
login(data: UserLogin)    → POST /auth/login   → TokenResponse
```

### api/jobs.api.ts
```typescript
uploadHeadshot(file: File)        → POST /api/upload_headshot  → UploadResponse
createJob(data: CreateJobRequest) → POST /api/job              → CreateJobResponse
getJob(jobId: string)             → GET  /api/job/:id          → JobResponse
listJobs()                        → GET  /api/jobs             → JobResponse[]  (future — returns [] until endpoint exists)
```

### api/me.api.ts
```typescript
getMe()  → GET /api/me  → UserResponse  (future — stubbed)
```

---

## 7. State Management Strategy

| State Type | Managed By | Rationale |
|------------|-----------|-----------|
| Auth token + user | Context API (AuthContext) | App-wide, simple, no server re-fetch needed |
| Server data (jobs, thumbnails) | TanStack Query | Caching, stale-while-revalidate, background refresh |
| Form data | React Hook Form + Zod | Controlled inputs, validation, submit state |
| SSE live events | useJobStream hook (local state) | Accumulates events into a thumbnail map |
| Headshot upload preview | Local useState in HeadshotUploader | Component-scoped |
| Active variant tab | Local useState in VariantSelector | Component-scoped |

---

## 8. SSE Hook Design (hooks/useJobStream.ts)

This is the most critical hook. It consumes the `/api/job/:id/stream` endpoint using `@microsoft/fetch-event-source` with a Bearer token.

```typescript
interface UseJobStreamResult {
  streamedThumbnails: Map<string, ThumbnailReadyEvent | ThumbnailFailedEvent>
  jobStatus: JobStatus | null
  isComplete: boolean
  streamError: string | null
}

function useJobStream(jobId: string, enabled: boolean): UseJobStreamResult
```

**Lifecycle:**
1. Opens SSE connection to `GET /api/job/:id/stream` with `Authorization: Bearer`
2. On `thumbnail_ready` → merges event data into the `streamedThumbnails` Map
3. On `thumbnail_failed` → merges failure event into the Map
4. On `job_completed` → sets `isComplete = true`, closes the connection, invalidates TanStack Query cache for `['job', jobId]` so `GET /api/job/:id` is refetched with final state
5. On `error` event → sets `streamError`, closes connection
6. On component unmount → calls `controller.abort()` to close the SSE connection cleanly
7. `enabled=false` until `jobId` is available (prevents premature connection)

---

## 9. Page Structure & Component Hierarchy

### LoginPage / SignupPage
```
AuthLayout
  └─ Card
       ├─ Logo + Title
       ├─ LoginForm / SignupForm
       │     ├─ Input (email) + Zod validation
       │     ├─ Input (password) + Zod validation
       │     └─ Button (submit) + loading state from useMutation
       └─ Link to other auth page
```

### DashboardPage
```
AppLayout (Navbar)
  └─ Page container
       ├─ Header: "My Thumbnails" + "Create New" button
       ├─ [Loading] Spinner
       ├─ [Empty] Empty state with CTA
       └─ Job grid
            └─ JobCard (per job)
                  ├─ Prompt text (truncated)
                  ├─ JobStatusBadge
                  ├─ Thumbnail count
                  └─ Link → /job/:jobId
```

### CreatePage (two steps, no separate routes — local state machine)
```
AppLayout
  └─ Page container
       ├─ Step indicator (1: Upload Photo → 2: Configure)
       │
       ├─ [Step 1] HeadshotUploader
       │     ├─ Drag-drop zone (or click to browse)
       │     ├─ Preview of selected image
       │     ├─ Upload button → useUploadHeadshot mutation
       │     └─ On success: save URL → advance to step 2
       │
       └─ [Step 2] CreateJobForm
             ├─ Textarea (prompt, 5–500 chars, Zod)
             ├─ NumThumbnails selector (1 | 2 | 3 buttons)
             ├─ Headshot preview (from step 1)
             └─ Submit → useCreateJob mutation
                   └─ On success: navigate("/job/:jobId")
```

### JobPage
```
AppLayout
  └─ Page container
       ├─ Back to Dashboard link
       ├─ Job header: prompt text + JobStatusBadge
       │
       ├─ [while processing] ProgressBar + status message
       │
       └─ ThumbnailGrid
             └─ ThumbnailCard (per thumbnail — 1, 2, or 3)
                   ├─ [pending/generating] ThumbnailSkeleton (animated)
                   ├─ [uploaded] Image + StyleBadge
                   │     └─ VariantSelector tabs (YouTube | Shorts | Square)
                   │           └─ Preview of selected variant URL
                   │     └─ Download button (opens variant URL)
                   └─ [failed] Error state with error_message
```

---

## 10. Form Validation Schemas (Zod)

```typescript
// Login / Signup
const authSchema = z.object({
  email:    z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

// Create Job
const createJobSchema = z.object({
  prompt:         z.string().min(5, "Prompt is too short").max(500, "Prompt is too long"),
  num_thumbnails: z.number().int().min(1).max(3),
  headshot_url:   z.string().url("A headshot is required"),
})
```

---

## 11. Query Key Convention

```typescript
['job',  jobId]     → GET /api/job/:id
['jobs']            → GET /api/jobs   (future)
['me']              → GET /api/me     (future)
```

---

## 12. Environment Configuration

```
.env
VITE_API_BASE_URL=http://localhost:8000
```

`api/client.ts` reads `import.meta.env.VITE_API_BASE_URL`.

---

## 13. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    React Application (Vite + TS)                    │
│                                                                     │
│  ┌─────────────────┐   ┌──────────────────────────────────────────┐│
│  │  AuthContext     │   │  React Router v6                         ││
│  │  token (JWT)     │   │  / → redirect                            ││
│  │  isAuthenticated │   │  /login      → LoginPage                 ││
│  │  login()         │   │  /signup     → SignupPage                ││
│  │  logout()        │   │  /dashboard  → DashboardPage (protected) ││
│  └─────────────────┘   │  /create     → CreatePage    (protected) ││
│                         │  /job/:id    → JobPage        (protected) ││
│                         └──────────────────────────────────────────┘│
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  TanStack Query (server state)                               │  │
│  │  useJob()     ← GET /api/job/:id                             │  │
│  │  useJobs()    ← GET /api/jobs    (future, disabled for now)  │  │
│  │  useMe()      ← GET /api/me      (future, disabled for now)  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  SSE Layer (hooks/useJobStream.ts)                           │  │
│  │  @microsoft/fetch-event-source                               │  │
│  │  Authorization: Bearer <token>                               │  │
│  │  Events: thumbnail_ready | thumbnail_failed | job_completed  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  API Layer (Axios)                                           │  │
│  │  client.ts  ← baseURL + request interceptor + 401 handler   │  │
│  │  auth.api.ts     signup() login()                           │  │
│  │  jobs.api.ts     uploadHeadshot() createJob() getJob()      │  │
│  │  me.api.ts       getMe()  (future)                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                         │                                           │
└─────────────────────────┼───────────────────────────────────────────┘
                          │ HTTP  /  SSE
                          ▼
              FastAPI Backend (localhost:8000)
```

---

## Open Questions for User

> None — the backend analysis provided all required information. The two future endpoints (GET /api/jobs, GET /api/me) are stubbed in the API layer and hooks layer but have `enabled: false` guards so they are never called until the backend implements them.

---

## Verification Plan

After each phase of generation:
- Phase 3 (scaffold): `npm run dev` boots without errors
- Phase 4 (auth): Login and signup work end-to-end with real backend
- Phase 5 (API services): Headshot upload and job creation return correct data
- Phase 6 (dashboard): Dashboard renders (empty state until backend adds GET /api/jobs)
- Phase 7 (thumbnail workflow): Full create → stream → display flow verified
- Phase 8 (SSE): SSE events arrive and thumbnails appear in real time
- Phase 9 (polish): Visual review of all pages
