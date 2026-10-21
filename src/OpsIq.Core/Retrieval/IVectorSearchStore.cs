using OpsIq.Core.Entities;

namespace OpsIq.Core.Retrieval;

public interface IVectorSearchStore
{
    Task<ScoredChunk[]> VectorSearch(
        string question,
        Guid tenantId,
        bool publicOnly = false
    );
}