namespace OpsIq.Core.Completions;

public interface ICompletionClient
{
    Task<string> CompleteAsync(
        string prompt,
        CancellationToken ct = default
    );
}