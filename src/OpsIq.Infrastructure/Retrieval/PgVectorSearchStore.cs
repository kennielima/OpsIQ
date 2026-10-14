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
    public async Task<Chunk[]> VectorSearch(string question, Guid tenantId)
    {
        var vectors = await _embeddings.EmbedAsync([question]);
        Console.WriteLine(vectors);
        var queryEmbedding = vectors[0];

        var result = await _context.Chunks
            .Where(c => c.TenantId == tenantId)
            .OrderBy(c => c.Embedding!.CosineDistance(new Vector(queryEmbedding))) // use pgvector's cosine distance
            .Take(5)
            .ToArrayAsync();
        return result;
    }
}
// vector search. When a question comes in, we embed it, 
// then find the top-K most similar chunks in the DB using pgvector's cosine distance. 