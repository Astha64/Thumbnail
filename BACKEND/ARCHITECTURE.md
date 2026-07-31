# ARCHITECTURE.md — YouTube Thumbnail Generator API

> **Version:** 1.0  
> **Stack:** FastAPI 0.115 · SQLModel 0.0.24 · SQLite · Python 3.11+  
> **Last updated:** 2026-08-01

---

## Table of Contents

1. [Folder Responsibilities](#1-folder-responsibilities)
2. [Request Lifecycle](#2-request-lifecycle)
3. [Authentication Flow](#3-authentication-flow)
4. [Database ERD](#4-database-erd)
5. [API Documentation](#5-api-documentation)
6. [Image Provider Architecture](#6-image-provider-architecture)
7. [Background Job Flow](#7-background-job-flow)
8. [ImageKit Integration](#8-imagekit-integration)
9. [Server-Sent Events Protocol](#9-server-sent-events-protocol)
10. [Environment Variables](#10-environment-variables)
11. [Error Catalogue](#11-error-catalogue)
12. [Suggested Improvements](#12-suggested-improvements)

---

## 1. Folder Responsibilities

```
BACKEND/
│
├── main.py              Entry point. Creates the FastAPI app, registers CORS
│                        middleware, mounts both routers, and calls
│                        create_tables() on startup via the lifespan hook.
│
├── config.py            Single source of truth for all configuration.
│                        Reads every setting from environment variables (via
│                        python-dotenv) with safe defaults for local dev.
│
├── database.py          SQLModel engine factory and session dependency.
│                        Provides get_session() for route-level DI and
│                        exposes the raw engine for background workers.
│
├── models.py            All ORM table definitions (User, Job, Thumbnail).
│                        Defines relationships, field constraints, UUID
│                        primary keys, and UTC timestamps.
│
├── routes.py            Core business API under the /api prefix.
│                        Contains request/response Pydantic schemas and
│                        all four endpoint handlers.
│
├── requirements.txt     Pinned Python dependencies.
│
├── .env                 Secret values — never committed to source control.
│
├── thumbnailbuilder.db  Auto-created SQLite database file.
│
├── auth/
│   ├── __init__.py      Package marker.
│   ├── router.py        /auth endpoints: POST /signup, POST /login.
│   ├── schemas.py       Pydantic models: UserSignup, UserLogin,
│   │                    UserResponse, TokenResponse.
│   ├── security.py      bcrypt password hashing and JWT mint/decode
│   │                    utilities (python-jose, HS256).
│   ├── service.py       create_user() and authenticate_user() — pure
│   │                    DB-layer logic with no HTTP knowledge.
│   └── dependencies.py  get_current_user() FastAPI dependency.
│                        Extracts Bearer token → decodes JWT → loads User.
│
└── services/
    ├── generator.py         Orchestrates background thumbnail generation.
    │                        process_job() marks the job, fans out
    │                        concurrent async tasks, then finalises status.
    │
    ├── imagekit_service.py  Thin wrapper around imagekitio SDK.
    │                        upload_file() and get_variants() helpers.
    │
    └── image_provider/
        ├── __init__.py      Package marker.
        ├── base.py          Abstract ImageProvider interface —
        │                    single async generate_image() contract.
        ├── factory.py       Provider registry dict + generate_with_fallback()
        │                    function that tries the primary provider and
        │                    falls back on any exception.
        ├── huggingface.py   HuggingFaceProvider — uses huggingface_hub
        │                    InferenceClient with FLUX.1-schnell via nscale.
        │                    Wraps the sync SDK call in run_in_executor.
        ├── pollinations.py  PollinationsProvider — free public API, no auth.
        │                    Used as the default fallback.
        └── openai_provider.py  OpenAIProvider — gpt-4.1-mini image tool.
                             Only instantiated when IMAGE_PROVIDER=openai.
```

---

## 2. Request Lifecycle

### Standard authenticated request

```
Client
  │
  │  HTTP Request
  │  Authorization: Bearer <JWT>
  │
  ▼
FastAPI ASGI App  (main.py)
  │
  ├─► CORSMiddleware
  │     Allows: http://localhost:5173
  │     allow_credentials: true
  │
  ├─► Router matched  (/auth/* or /api/*)
  │
  │   [/api/* routes only]
  ├─► Dependency: get_current_user()  (auth/dependencies.py)
  │     │
  │     ├─ HTTPBearer extracts token from Authorization header
  │     ├─ decode_access_token(token)  →  user_id (or None)
  │     ├─ If None → HTTP 401 "Invalid or expired token"
  │     ├─ session.get(User, user_id)
  │     └─ If not found → HTTP 401 "User not found"
  │         Otherwise → injects User object into handler
  │
  ├─► Dependency: get_session()  (database.py)
  │     Opens a SQLModel Session, yields it, closes on response end
  │
  ├─► Route Handler executes
  │     Business logic runs, DB queries executed
  │
  └─► Response serialised via Pydantic response_model and returned
```

### Fire-and-forget thumbnail job request

```
POST /api/job
  │
  ├─► Auth + session dependencies resolve (as above)
  │
  ├─► Validate num_thumbnails in [1, 3]
  │
  ├─► Create Job row  (status: "pending")
  ├─► Create N Thumbnail rows  (status: "pending", style assigned)
  ├─► session.commit()
  │
  ├─► asyncio.create_task(process_job(job_id))
  │     └─ Runs concurrently — does NOT block the HTTP response
  │
  └─► Return HTTP 200  { "job_id": "..." }   ← immediate

[Meanwhile, in the background task — see Section 7]
```

---

## 3. Authentication Flow

```
┌──────────────────────────────────────────────────────────┐
│  SIGNUP                                                  │
│                                                          │
│  Client ──POST /auth/signup──► auth/router.py            │
│           { email, password }                            │
│                  │                                       │
│                  ▼                                       │
│         auth/service.py: create_user()                   │
│           ├─ Query: does email exist?                    │
│           │   └─ Yes → raise ValueError (HTTP 400)       │
│           ├─ hash_password(password)  ← bcrypt           │
│           ├─ INSERT User row                             │
│           └─ Return User                                 │
│                  │                                       │
│  Response ◄──────┘  { id, email }   HTTP 201            │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  LOGIN                                                   │
│                                                          │
│  Client ──POST /auth/login──► auth/router.py             │
│           { email, password }                            │
│                  │                                       │
│                  ▼                                       │
│         auth/service.py: authenticate_user()             │
│           ├─ Query User by email                         │
│           ├─ user not found OR wrong password            │
│           │   └─ raise ValueError (HTTP 401)             │
│           │       (same message — prevents enumeration)  │
│           └─ verify_password()  ← bcrypt.verify()        │
│                  │                                       │
│         auth/security.py: create_access_token(user.id)  │
│           ├─ payload = { sub: user_id, exp: now+30min }  │
│           └─ jwt.encode(payload, SECRET, "HS256")        │
│                  │                                       │
│  Response ◄──────┘  { access_token, token_type }        │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  AUTHENTICATED REQUEST                                   │
│                                                          │
│  Client ──GET /api/job/{id}──►                           │
│           Authorization: Bearer eyJ...                   │
│                  │                                       │
│                  ▼                                       │
│         auth/dependencies.py: get_current_user()         │
│           ├─ HTTPBearer() extracts token                 │
│           ├─ decode_access_token(token)                  │
│           │   ├─ jwt.decode() with SECRET + HS256        │
│           │   └─ returns payload["sub"] = user_id        │
│           ├─ session.get(User, user_id)                  │
│           └─ Returns User object to handler              │
└──────────────────────────────────────────────────────────┘
```

**JWT Payload Structure:**
```json
{
  "sub": "<user-uuid-string>",
  "exp": 1753999999
}
```

**Token Properties:**

| Property | Value |
|----------|-------|
| Algorithm | HS256 |
| Expiry | 30 minutes |
| Transport | `Authorization: Bearer` header |
| Revocation | None (stateless) |
| Refresh | Not implemented |

---

## 4. Database ERD

```
┌─────────────────────────────┐
│           user              │
├─────────────────────────────┤
│ id            VARCHAR PK    │  ← UUID string (uuid4)
│ email         VARCHAR UNIQUE│  ← indexed
│ hashed_password  VARCHAR    │  ← bcrypt hash
│ created_at    DATETIME      │  ← UTC
└──────────────┬──────────────┘
               │ 1
               │
               │ N
┌──────────────▼──────────────┐
│             job             │
├─────────────────────────────┤
│ id            VARCHAR PK    │  ← UUID string
│ user_id       VARCHAR FK ───┼──► user.id
│ prompt        VARCHAR       │  ← user-supplied text
│ num_thumbnails  INTEGER     │  ← 1, 2, or 3
│ headshot_url  VARCHAR       │  ← ImageKit CDN URL
│ status        VARCHAR       │  ← pending | processing |
│                             │     completed | failed
│ created_at    DATETIME      │  ← UTC
└──────────────┬──────────────┘
               │ 1
               │
               │ N
┌──────────────▼──────────────┐
│          thumbnail          │
├─────────────────────────────┤
│ id            VARCHAR PK    │  ← UUID string
│ job_id        VARCHAR FK ───┼──► job.id
│ style_name    VARCHAR       │  ← bold_dramatic |
│                             │     clean_minimal |
│                             │     vibrant_energetic
│ status        VARCHAR       │  ← pending | generating |
│                             │     uploaded | failed
│ imagekit_url  VARCHAR NULL  │  ← CDN URL (set after upload)
│ error_message VARCHAR NULL  │  ← truncated to 500 chars
│ created_at    DATETIME      │  ← UTC
└─────────────────────────────┘
```

**Status State Machines:**

```
Job:
  pending ──► processing ──► completed
                         └──► failed  (only if ALL thumbnails failed)

Thumbnail:
  pending ──► generating ──► uploaded
                         └──► failed
```

**Style to Thumbnail Index Mapping (STYLE_ORDER):**

| Index | style_name |
|-------|-----------|
| 0 | `bold_dramatic` |
| 1 | `clean_minimal` |
| 2 | `vibrant_energetic` |

If `num_thumbnails=2`, only thumbnails 0 and 1 are created.

---

## 5. API Documentation

### Base URLs

| Environment | URL |
|-------------|-----|
| Local dev | `http://localhost:8000` |
| CORS allowed origin | `http://localhost:5173` |

### Authentication

All `/api/*` endpoints require:
```
Authorization: Bearer <access_token>
```

---

### Auth Endpoints

#### `POST /auth/signup`

Creates a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "strongpassword"
}
```

**Response `201 Created`:**
```json
{
  "id": "3f7b1c2e-...",
  "email": "user@example.com"
}
```

**Error Responses:**

| Status | Condition | Detail |
|--------|-----------|--------|
| 400 | Email already registered | `"Email already registered"` |
| 422 | Invalid email format | Pydantic validation error |

---

#### `POST /auth/login`

Authenticates a user and returns a JWT.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "strongpassword"
}
```

**Response `200 OK`:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Error Responses:**

| Status | Condition | Detail |
|--------|-----------|--------|
| 401 | Invalid credentials | `"Invalid email or password"` |

---

### Core API Endpoints

#### `POST /api/upload_headshot`

Uploads a headshot image to ImageKit CDN.
Must be called **before** creating a job. The returned URL is passed as `headshot_url` in `POST /api/job`.

**Request:** `multipart/form-data`
```
file: <image binary>   (field name must be "file")
```

**Response `200 OK`:**
```json
{
  "url": "https://ik.imagekit.io/<account>/headshots/<filename>.jpg"
}
```

**Notes:**
- Uploaded to the `headshots/` folder in ImageKit
- `use_unique_file_name=True` — ImageKit appends a unique suffix
- Accepted content type is passed through as-is

---

#### `POST /api/job`

Creates a thumbnail generation job. Returns immediately; processing happens in the background.

**Request Body:**
```json
{
  "prompt": "Tech video about top 5 AI tools in 2025",
  "num_thumbnails": 3,
  "headshot_url": "https://ik.imagekit.io/<account>/headshots/photo.jpg"
}
```

| Field | Type | Constraints |
|-------|------|-------------|
| `prompt` | string | Required |
| `num_thumbnails` | integer | 1 ≤ n ≤ 3 |
| `headshot_url` | string | Required, no format validation |

**Response `200 OK`:**
```json
{
  "job_id": "a1b2c3d4-..."
}
```

**Error Responses:**

| Status | Condition | Detail |
|--------|-----------|--------|
| 400 | `num_thumbnails` out of range | `"num_thumbnails must be between 1 and 3"` |
| 401 | Missing or invalid JWT | `"Invalid or expired token"` |

---

#### `GET /api/job/{job_id}`

Returns the current snapshot of a job and all its thumbnails.
Use this for polling or to load a completed job.

**Path Parameter:** `job_id` — UUID string from `POST /api/job`

**Response `200 OK`:**
```json
{
  "id": "a1b2c3d4-...",
  "prompt": "Tech video about top 5 AI tools in 2025",
  "num_thumbnails": 3,
  "headshot_url": "https://ik.imagekit.io/...",
  "status": "completed",
  "thumbnails": [
    {
      "id": "t1-uuid",
      "style_name": "bold_dramatic",
      "status": "uploaded",
      "imagekit_url": "https://ik.imagekit.io/.../t1-uuid.png",
      "error_message": null,
      "variants": {
        "youtube": "https://ik.imagekit.io/.../t1-uuid.png?tr=w-1280,h-720,fo-auto,c-maintain_ratio",
        "shorts":  "https://ik.imagekit.io/.../t1-uuid.png?tr=w-1080,h-1920,fo-auto,c-maintain_ratio",
        "square":  "https://ik.imagekit.io/.../t1-uuid.png?tr=w-1080,h-1080,fo-auto,c-maintain_ratio"
      }
    },
    {
      "id": "t2-uuid",
      "style_name": "clean_minimal",
      "status": "failed",
      "imagekit_url": null,
      "error_message": "Connection timeout after 60s",
      "variants": null
    }
  ]
}
```

The `variants` field is only present when `status == "uploaded"`. These are ImageKit transform URLs — no extra upload is required; transforms are applied at the CDN edge.

**Error Responses:**

| Status | Condition | Detail |
|--------|-----------|--------|
| 404 | Job not found or belongs to another user | `"Job not found"` |
| 401 | Invalid JWT | `"Invalid or expired token"` |

---

#### `GET /api/job/{job_id}/stream`

SSE stream that pushes real-time thumbnail updates as they complete.
The connection closes automatically when the job is fully done.

> **Important:** This endpoint requires `Authorization: Bearer` header.
> The browser-native `EventSource` API cannot send custom headers.
> Use `fetch()` with `ReadableStream` decoding or the
> `@microsoft/fetch-event-source` library on the frontend.

**Response Headers:**
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
X-Accel-Buffering: no
```

**Event Types:**

| Event | Fired When | Data Payload |
|-------|------------|-------------|
| `thumbnail_ready` | A thumbnail finishes uploading | `{thumbnail_id, style_name, imagekit_url, variants}` |
| `thumbnail_failed` | A thumbnail generation fails | `{thumbnail_id, style_name, error}` |
| `job_completed` | All thumbnails settled | `{job_id, status}` |
| `error` | Job not found or wrong owner | `{error: "Job not found"}` |

**`thumbnail_ready` data example:**
```json
{
  "thumbnail_id": "t1-uuid",
  "style_name": "bold_dramatic",
  "imagekit_url": "https://ik.imagekit.io/.../t1.png",
  "variants": {
    "youtube": "https://ik.imagekit.io/.../t1.png?tr=w-1280,h-720,fo-auto,c-maintain_ratio",
    "shorts":  "https://ik.imagekit.io/.../t1.png?tr=w-1080,h-1920,fo-auto,c-maintain_ratio",
    "square":  "https://ik.imagekit.io/.../t1.png?tr=w-1080,h-1080,fo-auto,c-maintain_ratio"
  }
}
```

**`thumbnail_failed` data example:**
```json
{
  "thumbnail_id": "t2-uuid",
  "style_name": "clean_minimal",
  "error": "Connection timeout after 60s"
}
```

**`job_completed` data example:**
```json
{
  "job_id": "a1b2c3d4-...",
  "status": "completed"
}
```

**Internal polling interval:** 1.5 seconds
**Connection lifecycle:** Server closes the SSE stream on `job_completed` or `error`.

---

## 6. Image Provider Architecture

The image generation subsystem follows the **Strategy + Factory** pattern with automatic fallback.

```
services/image_provider/

  base.py
  ┌─────────────────────────────────────────┐
  │  ImageProvider  (ABC)                   │
  │                                         │
  │  + generate_image(                      │
  │        prompt: str,                     │
  │        width: int,                      │
  │        height: int                      │
  │    ) → bytes                            │
  └───────────────┬─────────────────────────┘
                  │ implements
       ┌──────────┼──────────────┐
       ▼          ▼              ▼
  HuggingFace  Pollinations   OpenAI
  Provider     Provider       Provider

  factory.py
  ┌─────────────────────────────────────────────────────┐
  │  _PROVIDERS = {                                     │
  │      "huggingface": HuggingFaceProvider,            │
  │      "pollinations": PollinationsProvider,          │
  │      "openai": OpenAIProvider,                      │
  │  }                                                  │
  │                                                     │
  │  generate_with_fallback(prompt, width, height)      │
  │    ├─ primary  = _build(IMAGE_PROVIDER)             │
  │    ├─ try: primary.generate_image(...)              │
  │    └─ except:                                       │
  │         fallback = _build(IMAGE_PROVIDER_FALLBACK)  │
  │         fallback.generate_image(...)                │
  └─────────────────────────────────────────────────────┘
```

### Provider Details

| Provider | Config Key | Auth | Model | Notes |
|----------|-----------|------|-------|-------|
| **HuggingFace** | `huggingface` | `HF_TOKEN` | `FLUX.1-schnell` via `nscale` | Default primary; sync SDK wrapped in `run_in_executor` |
| **Pollinations** | `pollinations` | None | `flux` | Free, no API key; default fallback |
| **OpenAI** | `openai` | `OPENAI_API_KEY` | `gpt-4.1-mini` | Optional; uses Responses API with image tool |

### Default configuration:

```
IMAGE_PROVIDER=huggingface
IMAGE_PROVIDER_FALLBACK=pollinations
HF_MODEL=black-forest-labs/FLUX.1-schnell
HF_PROVIDER=nscale
```

### Adding a new provider

1. Create `services/image_provider/myprovider.py` extending `ImageProvider`
2. Implement `async generate_image(prompt, width, height) -> bytes`
3. Register in `factory.py` `_PROVIDERS` dict with a string key
4. Set `IMAGE_PROVIDER=myprovider` in `.env`

---

## 7. Background Job Flow

Jobs are processed entirely in an `asyncio` background task, independent of the HTTP response.

```
asyncio.create_task(process_job(job_id))
         │
         │ [services/generator.py]
         ▼
┌─────────────────────────────────────────────────────────────┐
│  process_job(job_id)                                        │
│                                                             │
│  1. Open DB session                                         │
│     ├─ job.status = "processing"                            │
│     ├─ read prompt, headshot_url                            │
│     └─ collect thumbnail_ids list                           │
│                                                             │
│  2. asyncio.gather(*tasks, return_exceptions=True)          │
│     [all thumbnails run CONCURRENTLY]                       │
│     │                                                       │
│     └─► generate_single_thumbnail(thumbnail_id, ...)        │
│           │                                                 │
│           ├─ thumb.status = "generating"                    │
│           │                                                 │
│           ├─ Build full prompt:                             │
│           │    STYLES[style_name] + " " + user_prompt       │
│           │                                                 │
│           ├─ generate_with_fallback(full_prompt, 1280, 720) │
│           │   ├─ PRIMARY:  HuggingFaceProvider              │
│           │   └─ FALLBACK: PollinationsProvider             │
│           │       └─ Returns raw PNG bytes                  │
│           │                                                 │
│           ├─ upload_file(bytes, filename, folder)           │
│           │   └─ ImageKit CDN → returns URL string          │
│           │                                                 │
│           ├─ thumb.imagekit_url = url                       │
│           └─ thumb.status = "uploaded"                      │
│                                                             │
│           [on any exception]                                │
│           ├─ thumb.status = "failed"                        │
│           └─ thumb.error_message = str(e)[:500]             │
│                                                             │
│  3. After gather completes                                  │
│     ├─ Query all thumbnails for job                         │
│     ├─ all_failed = all statuses are "failed"               │
│     └─ job.status = "failed" if all_failed else "completed" │
└─────────────────────────────────────────────────────────────┘
```

**Style Prompts Injected Per Thumbnail:**

| style_name | Prepended style instruction |
|------------|----------------------------|
| `bold_dramatic` | Bold, dramatic YouTube thumbnail, high contrast, cinematic lighting, dark moody background, powerful composition, dramatic facial expression. |
| `clean_minimal` | Clean, minimal YouTube thumbnail, bright lighting, white background, modern professional aesthetic, sharp composition, approachable expression. |
| `vibrant_energetic` | Vibrant, energetic YouTube thumbnail, colorful gradients, dynamic angles, pop-art style colors, excited engaging expression. |

**Generated image dimensions:** 1280 x 720 px (16:9 YouTube thumbnail ratio)

---

## 8. ImageKit Integration

ImageKit serves as the persistent storage and real-time image CDN.

### Upload

```python
imagekit.files.upload(
    file=(file_name, file_bytes, content_type),
    file_name=file_name,
    folder=folder,              # "headshots/" or "thumbnails/{job_id}/"
    is_private_file=False,
    use_unique_file_name=True,  # ImageKit appends unique suffix
)
# Returns: result.url  (canonical CDN URL)
```

### URL Transform Variants

No separate uploads needed. Variants are generated by appending ImageKit transformation query parameters:

| Variant | Dimensions | Query String |
|---------|-----------|--------------|
| `youtube` | 1280 x 720 | `?tr=w-1280,h-720,fo-auto,c-maintain_ratio` |
| `shorts` | 1080 x 1920 | `?tr=w-1080,h-1920,fo-auto,c-maintain_ratio` |
| `square` | 1080 x 1080 | `?tr=w-1080,h-1080,fo-auto,c-maintain_ratio` |

- `fo-auto` — smart focal point (keeps faces centred)
- `c-maintain_ratio` — crop while preserving aspect ratio

### Folder Structure in ImageKit

```
headshots/
  └── headshot_<unique>.jpg

thumbnails/
  └── {job_id}/
        ├── {thumbnail_id_1}.png
        ├── {thumbnail_id_2}.png
        └── {thumbnail_id_3}.png
```

---

## 9. Server-Sent Events Protocol

### Connection

```javascript
// Wrong — EventSource cannot set Authorization header
const es = new EventSource(`/api/job/${jobId}/stream`);

// Correct — use fetch with ReadableStream
const response = await fetch(`/api/job/${jobId}/stream`, {
  headers: { Authorization: `Bearer ${token}` }
});
const reader = response.body.getReader();
// ... parse SSE lines manually
```

Or use `@microsoft/fetch-event-source`:

```javascript
import { fetchEventSource } from '@microsoft/fetch-event-source';

await fetchEventSource(`/api/job/${jobId}/stream`, {
  headers: { Authorization: `Bearer ${token}` },
  onmessage(event) { /* handle event.event and event.data */ },
  onerror(err)    { /* handle errors */ },
});
```

### SSE Wire Format

```
event: thumbnail_ready
data: {"thumbnail_id":"...","style_name":"bold_dramatic","imagekit_url":"...","variants":{...}}

event: thumbnail_failed
data: {"thumbnail_id":"...","style_name":"clean_minimal","error":"..."}

event: job_completed
data: {"job_id":"...","status":"completed"}
```

### Sequence Diagram

```
Client                          Server
  │                               │
  │── GET /api/job/{id}/stream ──►│
  │   Authorization: Bearer ...   │  ← opens SSE connection
  │                               │
  │                               │  [every 1.5s: poll DB]
  │◄── event: thumbnail_ready ────│  ← first thumbnail done
  │    data: { ... variants }     │
  │                               │
  │◄── event: thumbnail_ready ────│  ← second thumbnail done
  │    data: { ... }              │
  │                               │
  │◄── event: thumbnail_failed ───│  ← third thumbnail failed
  │    data: { ... error }        │
  │                               │
  │◄── event: job_completed ──────│  ← all settled → server closes
  │    data: { job_id, status }   │
  │                               X  ← connection closed by server
```

---

## 10. Environment Variables

| Variable | Default | Required | Used In | Purpose |
|----------|---------|----------|---------|---------|
| `JWT_SECRET_KEY` | `THIS_IS_ONLY_FOR_DEVELOPMENT_CHANGE_IT` | **Yes (prod)** | `auth/security.py` | JWT signing secret |
| `HF_TOKEN` | `""` | Yes (if HF primary) | `huggingface.py` | Hugging Face API token |
| `HF_MODEL` | `black-forest-labs/FLUX.1-schnell` | No | `huggingface.py` | HF model ID |
| `HF_PROVIDER` | `nscale` | No | `huggingface.py` | HF inference router |
| `IMAGE_PROVIDER` | `huggingface` | No | `config.py` | Primary: `huggingface` / `pollinations` / `openai` |
| `IMAGE_PROVIDER_FALLBACK` | `pollinations` | No | `config.py` | Fallback provider |
| `OPENAI_API_KEY` | `""` | Yes (if OpenAI) | `openai_provider.py` | OpenAI API key |
| `IMAGEKIT_PRIVATE_KEY` | `""` | **Yes** | `imagekit_service.py` | ImageKit server upload auth |
| `IMAGEKIT_PUBLIC_KEY` | `""` | No | `config.py` | Loaded, currently unused |
| `IMAGEKIT_URL_ENDPOINT` | `""` | No | `config.py` | Loaded, currently unused |

> `DATABASE_URL` is hardcoded to `sqlite:///./thumbnailbuilder.db` in `config.py`.
> CORS origin is hardcoded to `http://localhost:5173` in `main.py`.

---

## 11. Error Catalogue

| Source | HTTP Status | `detail` message | Trigger |
|--------|------------|-----------------|---------|
| `auth/service.py` | 400 | `"Email already registered"` | Duplicate signup |
| `auth/service.py` | 401 | `"Invalid email or password"` | Bad credentials |
| `auth/dependencies.py` | 401 | `"Invalid or expired token"` | JWT missing/expired/tampered |
| `auth/dependencies.py` | 401 | `"User not found"` | Token valid but user deleted |
| `routes.py` | 400 | `"num_thumbnails must be between 1 and 3"` | Out-of-range input |
| `routes.py` | 404 | `"Job not found"` | Unknown job_id or wrong user |
| FastAPI / Pydantic | 422 | Validation error body | Malformed request JSON |
| FastAPI | 403 | `"Not authenticated"` | No Authorization header |
| `generator.py` | — (stored) | `str(exception)[:500]` | AI generation failure stored in thumb.error_message |

---

## 12. Suggested Improvements

### Critical — Must fix before frontend integration

**1. SSE endpoint and browser EventSource are incompatible**

The `GET /api/job/{job_id}/stream` endpoint requires an `Authorization: Bearer` header.
The browser-native `EventSource` API does not support custom headers. The frontend
must use `fetch()` with `ReadableStream` or `@microsoft/fetch-event-source`.
No backend change is needed; this is a frontend integration constraint.

**2. No job history endpoint**

There is no `GET /api/jobs` endpoint. Without it, the frontend cannot show a
dashboard of past jobs. The user has no way to retrieve their job list after
navigating away.

Suggested addition to `routes.py`:

```python
@router.get("/jobs", response_model=list[JobSummaryResponse])
def list_jobs(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    jobs = session.exec(
        select(Job)
        .where(Job.user_id == current_user.id)
        .order_by(Job.created_at.desc())
    ).all()
    return jobs
```

**3. No /api/me endpoint**

The frontend cannot retrieve the authenticated user's profile without storing
the email at login time. A `/api/me` endpoint allows the UI to show user
details from just the stored token.

```python
@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(id=current_user.id, email=current_user.email)
```

---

### High — Should fix soon

**4. CORS origin is hardcoded**

`main.py` allows only `http://localhost:5173`. This breaks in any deployed environment.

```python
# config.py
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

# main.py
app.add_middleware(CORSMiddleware, allow_origins=ALLOWED_ORIGINS, ...)
```

**5. No token refresh mechanism**

Tokens expire after 30 minutes with no refresh endpoint. The frontend must handle
`401` responses by redirecting to login. Consider adding `POST /auth/refresh`.

**6. OpenAI provider uses wrong API surface**

`openai_provider.py` calls `client.responses.create(...)` with
`tools=[{"type": "image_generation"}]`. This is the ChatGPT Responses API.
The correct API for programmatic image generation in `openai==1.78.1` is
`client.images.generate(model="dall-e-3", ...)`.

---

### Low — Nice to have

**7. IMAGEKIT_PUBLIC_KEY and IMAGEKIT_URL_ENDPOINT are loaded but unused**

These would enable client-side direct uploads to ImageKit, bypassing the server
for the headshot upload step. Currently loaded in config but never referenced.

**8. No prompt length validation**

`CreateJobRequest.prompt` has no `max_length`. A large prompt is sent directly
to the AI provider without any guard.

```python
from pydantic import BaseModel, Field

class CreateJobRequest(BaseModel):
    prompt: str = Field(..., min_length=5, max_length=500)
    num_thumbnails: int
    headshot_url: str
```

**9. num_thumbnails validation is duplicated**

The constraint is declared at the SQLModel level (`ge=1, le=3`) and also checked
manually in the route handler. The route check can be replaced with a Pydantic
field validator on `CreateJobRequest`.

**10. No created_at in API responses**

`JobResponse` does not include `created_at`, making it impossible for the
frontend to sort or display job timestamps without additional logic.

**11. DATABASE_URL is hardcoded**

Should be an environment variable to allow switching to PostgreSQL in production.

```python
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./thumbnailbuilder.db")
```

---

*End of ARCHITECTURE.md*
