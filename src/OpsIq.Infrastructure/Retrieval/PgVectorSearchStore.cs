using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using OpsIq.Core.Embeddings;
using OpsIq.Core.Entities;
using OpsIq.Core.Retrieval;
using OpsIq.Infrastructure.Data;
using Pgvector;
using Pgvector.EntityFrameworkCore;

namespace OpsIq.Infrastructure.Retrieval;

public class PgVectorSearchStore : IVectorSearchStore
{
    private readonly IEmbeddingClient _embeddings;
    private readonly AppDbContext _context;
    public PgVectorSearchStore(IEmbeddingClient embeddings, AppDbContext context)
    {
        _embeddings = embeddings;
        _context = context;
    }
    public async Task<ScoredChunk[]> VectorSearch(string question, Guid tenantId, bool publicOnly)
    {
        var vectors = await _embeddings.EmbedAsync([question]);
        var queryEmbedding = vectors[0];

        var query = _context.Chunks
            .Where(c => c.TenantId == tenantId && c.Embedding != null)
            .Join(_context.Documents, c => c.DocumentId, d => d.Id, (c, d) => new { Chunk = c, Doc = d });

        if (publicOnly)
            query = query.Where(x => x.Doc.Visibility == DocumentVisibility.Public);

        var raw = await query
        .Select(c => new
        {
            Chunk = c.Chunk,
            Score = c.Chunk.Embedding!.CosineDistance(new Vector(queryEmbedding))
        })
        .OrderBy(x => x.Score)
        .Take(5)
        .ToArrayAsync();

        var result = raw.Select(x => new ScoredChunk(x.Chunk, (float)x.Score)).ToArray();

        return result;
    }
}