using Microsoft.Extensions.Logging;
using OpsIq.Core.Completions;
using OpsIq.Core.Entities;

namespace OpsIq.Core.Retrieval;

public class RagService
{
    private readonly ICompletionClient _completion;
    private readonly IVectorSearchStore _vectorSearch;
    private readonly ILogger<RagService> _logger;

    public RagService(ICompletionClient completion, IVectorSearchStore vectorSearch, ILogger<RagService> logger)
    {
        _completion = completion;
        _vectorSearch = vectorSearch;
        _logger = logger;
    }
    public async Task<(string answer, ScoredChunk[] chunks)> AnswerQuestionAsync(string question, Guid tenantId, bool publicOnly)
    {
        var chunks = await _vectorSearch.VectorSearch(question, tenantId, publicOnly);
        _logger.LogInformation("Top score: {Score}", chunks[0].Score);
        if (chunks.Length == 0 || chunks[0].Score > 0.5f)
            return ("I don't have information on that in the documents.", []);

        var chunkText = string.Join("\n---\n", chunks.Select(c => c.Chunk.Content));

        var prompt = $"""
        You are a policy assistant. Use ONLY the chunks below to answer.
        Here are policy chunks: {chunkText}
        Question: {question}
        Answer using only the chunks.
        """;
        // If the chunks don't contain the answer, say 'I don't have information on that.
        var answer = await _completion.CompleteAsync(prompt);
        return (answer, chunks);
    }
}