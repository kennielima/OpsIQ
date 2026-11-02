# OpsIq — Multi-tenant RAG API for grounded policy retrieval

A backend-for-AI platform serving two modes on a single retrieval core: internal ops/compliance staff querying policy documents, and end-customers through an embeddable chat widget. Every answer is **grounded with source citations** — not a chatbot that hallucinates confidently.

Built with ASP.NET Core 10 / .NET 10, PostgreSQL + pgvector, and Gemini (embedding + completion).

## Why

Internal teams at regulated businesses (fintech, healthtech) waste time hunting across scattered PDFs and wikis for policy answers — and get it wrong when they guess. OpsIq surfaces the exact source chunks behind every answer, so staff can verify before acting. The same retrieval core powers a customer-facing widget, scoped to documents the tenant has marked public.

## Status

**v1.1 — backend complete. Frontend in progress.**

Built:

- Multi-tenant data model with per-tenant isolation enforced by EF Core global query filters
- Document upload + background ingestion (extract → chunk → embed → status transitions)
- Document visibility controls (`Internal` / `Public`) — widget retrieves public documents only
- pgvector similarity search with score-threshold filtering (off-topic questions short-circuit before the LLM)
- Grounded generation with first-class `Citation` rows linking `Message → Chunk` by rank + score
- Three auth paths: ASP.NET Core Identity for staff, hashed `sk_` keys for admin ops, publishable `pk_` keys for the widget
- Role-based authorization (SuperAdmin / Admin / User)
- Widget endpoint with ASP.NET Core rate limiting (per key+IP and per-tenant daily cap), per-tenant CORS origin allowlisting, and server-side origin enforcement
- Anonymous widget sessions (`SessionId`) persisted without user identity
- Mini-eval harness: hand-authored Q&A pairs run in staff and public-only modes, reporting retrieval hit rate and refusal accuracy
- Global exception handler with structured upstream error logging

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
    Controllers/           Documents, Query, Tenants, Users, Auth, Widget
    Authentication/        ApiKeyAuthenticationHandler, PublishableKeyAuthenticationHandler, AppUserClaimsFactory
    Exceptions/            GlobalExceptionHandler (IExceptionHandler)
    Program.cs             Only place Core abstractions are bound to Infra impls

  evals/                   Mini-eval harness (console project, no HTTP)
    questions.json         Hand-authored Q&A pairs with expected document + visibility tags
```

## Key design decisions

**Multi-tenancy enforced in the ORM, not the application layer.** Every entity carries `TenantId`; `AppDbContext.OnModelCreating` applies a global query filter per entity. A query that forgets to scope by tenant is filtered automatically — stronger than remembering a `WHERE` clause in every repository call.

**Citations are rows, not strings.** The `Citation` table links `Message → Chunk` with rank and cosine-distance score. Clients get traceable provenance; internal eval can compute precision over them later.

**Score-threshold short-circuit.** Before calling the LLM, `RagService` checks if the top vector-search score exceeds a threshold (0.5). Off-topic questions ("Who is Elon Musk?" against policy docs) never hit the completion API — saving tokens and avoiding hallucinated grounding.

**Three auth schemes, one identity model.** Staff hit `/api/query`, `/api/documents` with cookie auth; privileged ops accept `sk_` API keys; the widget uses `pk_` publishable keys — hashed at rest, revocable, scoped to one tenant. All three schemes resolve to the same `TenantId` claim, so every controller reads tenant identity the same way regardless of how the request arrived.

**Widget is a pure edge adapter.** `RagService.AnswerQuestionAsync` has no knowledge of widgets, keys, or origins. The one permitted core change is a `publicOnly` flag on vector search — everything else (rate limiting, CORS, origin enforcement, session persistence, response projection) lives at the edge in `WidgetController`. This is the concrete proof that identity resolution was decoupled from retrieval in v1.

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
| `/api/auth/login`                        | POST                | Anonymous                |
| `/api/auth/logout`                       | POST                | Cookie                   |
| `/api/tenants`                           | POST                | `sk_` (SuperAdmin)       |
| `/api/tenants/{id}/users`                | POST                | `sk_` or Cookie (Admin)  |
| `/api/tenants/{id}/keys`                 | POST / GET          | `sk_`                    |
| `/api/tenants/{id}/keys/{keyId}`         | DELETE              | `sk_`                    |
| `/api/tenants/{id}/origins`              | PUT                 | `sk_`                    |
| `/api/documents`                         | GET / POST / DELETE | Cookie                   |
| `/api/documents/{id}`                    | PATCH               | `sk_`                    |
| `/api/query/ask`                         | POST                | Cookie                   |
| `/api/widget/query`                      | POST                | `pk_`                    |
| `/api/me`                                | GET                 | Cookie                   |
| `/api/me/resetpassword`                  | GET                 | Cookie                   |
