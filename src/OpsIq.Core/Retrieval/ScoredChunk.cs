using OpsIq.Core.Entities;

namespace OpsIq.Core.Retrieval;

public record ScoredChunk(Chunk Chunk, float Score);