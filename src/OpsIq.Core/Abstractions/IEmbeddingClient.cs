namespace OpsIq.Core.Abstractions;

public interface IEmbeddingClient
{
    Task<IReadOnlyList<float[]>> EmbedAsync(
        IEnumerable<string> texts,
         CancellationToken ct = default
    );
}