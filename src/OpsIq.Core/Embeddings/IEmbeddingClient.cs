namespace OpsIq.Core.Embeddings;

public interface IEmbeddingClient
{
    Task<IReadOnlyList<float[]>> EmbedAsync(
        IEnumerable<string> texts,
         CancellationToken ct = default
    );
}