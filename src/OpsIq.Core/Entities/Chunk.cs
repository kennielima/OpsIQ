using Pgvector;
namespace OpsIq.Core.Entities;


public class Chunk
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid DocumentId { get; set; }
    public string Content { get; set; } = string.Empty;
    public int TokenCount { get; set; } = 0;
    public int ChunkIndex { get; set; } = 0;
    public Vector? Embedding { get; set; }
}