# OpsIq — Multi-tenant RAG API for grounded policy retrieval

A backend-for-AI platform where operational staff (ops, compliance, support) query their own internal policy docs and get **grounded answers with citations** — not a chatbot that hallucinates confidently.

Built with ASP.NET Core 10 / .NET 10, PostgreSQL + pgvector, and Gemini (embedding + completion).

## Why

Internal teams at regulated businesses (fintech, healthtech) waste time hunting across scattered PDFs and wikis for policy answers — and get it wrong when they guess. OpsIq surfaces the exact source chunks behind every answer, so staff can verify before acting.

## Status

**v1 — API complete, in active development.**

Built:

- Multi-tenant data model with per-tenant isolation enforced by EF Core global query filters
- Document upload + background ingestion (extract → chunk → embed → status transitions)
- pgvector similarity search with score-threshold filtering (off-topic questions short-circuit before the LLM)
- Grounded generation with first-class `Citation` rows linking `Message → Chunk` by rank + score
- Dual auth: ASP.NET Core Identity cookies for staff, custom `sk_` API key handler (hashed at rest) for privileged ops
- Role-based authorization (SuperAdmin / Admin / User)
- Global exception handler with structured upstream error logging

Planned next:

- PDF ingestion (clean text, no OCR)
- Customer-facing widget (v1.1): `pk_` keys, CORS, rate limiting, anonymous sessions
- Admin frontend (login, docs upload, conversations)
- AWS deployment (ECS Fargate, RDS Postgres + pgvector, S3, Secrets Manager)

## Architecture

Three-project solution with a strict reference graph — `Core` has zero infrastructure dependencies, enforced by the project graph itself, not convention.

```
src/
  OpsIq.Core/              Business logic, abstractions, entities — no EF, no HTTP clients
    Entities/              Tenant, AppUser, Document, Chunk, Conversation, Message, Citation, ApiKey
    Embeddings/            IEmbeddingClient
    Completions/           ICompletionClient
    Retrieval/             RagService, IVectorSearchStore, ScoredChunk
    Chunking/              IChunker

  OpsIq.Infrastructure/    Data access + external integrations
    Data/                  AppDbContext, IEntityTypeConfiguration<T> per entity, migrations
    Embeddings/            GeminiEmbeddingClient (HttpClient)
    Completions/           GeminiCompletionClient
    Retrieval/             PgVectorSearchStore (cosine distance via pgvector)
    Ingestion/             DocumentIngestionWorker (BackgroundService)
    Chunking/              FixedSizeChunker

  OpsIq.Api/               HTTP edge — controllers, auth, DI composition root
    Controllers/           Documents, Query, Tenants, Users, Auth
    Authentication/        ApiKeyAuthenticationHandler, AppUserClaimsFactory
    Exceptions/            GlobalExceptionHandler (IExceptionHandler)
    Program.cs             Only place Core abstractions are bound to Infra impls
```

## Key design decisions

**Multi-tenancy enforced in the ORM, not the application layer.** Every entity carries `TenantId`; `AppDbContext.OnModelCreating` applies a global query filter per entity. A query that forgets to scope by tenant is filtered automatically — stronger than remembering a `WHERE` clause in every repository call.

**Citations are rows, not strings.** The `Citation` table links `Message → Chunk` with rank and cosine-distance score. Clients get traceable provenance; internal eval can compute precision over them later.

**Score-threshold short-circuit.** Before calling the LLM, `RagService` checks if the top vector-search score exceeds a threshold (0.5). Off-topic questions ("Who is Elon Musk?" against policy docs) never hit the completion API — saving tokens and avoiding hallucinated grounding.

**Two auth schemes, one identity model.** Staff hit `/api/query`, `/api/documents` with cookie auth; privileged ops (`POST /api/documents`, tenant/user provisioning) accept `sk_` API keys. Widget-facing `pk_` keys are deliberately deferred to v1.1 — the architecture already decouples identity resolution from retrieval, so adding them is an edge-adapter change, not a rewrite.

**In-process ingestion.** `DocumentIngestionWorker` is a `BackgroundService` polling `Document.Status = Processing`. No message broker — at this scale, that's the right call. The design keeps the chunker and embedding client behind interfaces so swapping to a queue later is contained.

## Tech stack

- **Runtime**: .NET 10 / ASP.NET Core 10
- **Database**: PostgreSQL + pgvector (`vector(768)` embedding column)
- **ORM**: EF Core with Npgsql + Pgvector.EntityFrameworkCore
- **Auth**: ASP.NET Core Identity (cookie) + custom `AuthenticationHandler` for API keys
- **AI**: Google Gemini — `gemini-embedding-001` (768-dim) + `gemini-3.8-flash`
- **API docs**: OpenAPI via `Microsoft.AspNetCore.OpenApi` + Scalar UI

## Running locally

```bash
# Prerequisites: .NET 10 SDK, PostgreSQL 15+ with pgvector extension installed

# 1. Create the vector extension in your database
psql -c "CREATE EXTENSION IF NOT EXISTS vector;"

# 2. Configure appsettings.Development.json
# {
#   "ConnectionStrings": { "DefaultConnection": "Host=localhost;Database=opsiq;Username=...;Password=..." },
#   "Gemini": { "ApiKey": "..." },
#   "SUPERADMIN_EMAIL": "admin@example.com",
#   "SUPERADMIN_PASSWORD": "..."
# }

# 3. Apply migrations
dotnet ef database update --project src/OpsIq.Infrastructure --startup-project src/OpsIq.Api

# 4. Run
dotnet run --project src/OpsIq.Api

# Scalar UI at http://localhost:5160/scalar/v1
```

A super-admin user is auto-provisioned on first run from the env config.

## API surface

| Endpoint                  | Method              | Auth                     |
| ------------------------- | ------------------- | ------------------------ |
| `/api/auth/login`         | POST                | Anonymous                |
| `/api/auth/logout`        | POST                | Cookie                   |
| `/api/tenants`            | POST                | ApiKey (SuperAdmin)      |
| `/api/tenants/{id}/users` | POST                | ApiKey or Cookie (Admin) |
| `/api/documents`          | GET / POST / DELETE | Cookie                   |
| `/api/query/ask`          | POST                | Cookie                   |
