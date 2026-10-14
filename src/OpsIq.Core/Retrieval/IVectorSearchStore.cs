using OpsIq.Core.Entities;

namespace OpsIq.Core.Retrieval;

public interface IVectorSearchStore
{
    Task<Chunk[]> VectorSearch(
        string questionEmbedding,
        Guid tenantId
    );
}