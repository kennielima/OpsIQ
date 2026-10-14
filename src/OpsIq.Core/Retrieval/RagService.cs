using OpsIq.Core.Completions;
using OpsIq.Core.Entities;

namespace OpsIq.Core.Retrieval;

public class RagService
{
    private readonly ICompletionClient _completion;
    private readonly IVectorSearchStore _vectorSearch;
    public RagService(ICompletionClient completion, IVectorSearchStore vectorSearch)
    {
        _completion = completion;
        _vectorSearch = vectorSearch;
    }
    public async Task<string> AnswerQuestionAsync(string question, Guid tenantId)
    {
        var vectorResult = await _vectorSearch.VectorSearch(question, tenantId);
        var chunkText = string.Join("\n---\n", vectorResult.Select(c => c.Content));

        var prompt = $"""
        You are a policy assistant. Use ONLY the chunks below to answer.
        Here are policy chunks: {chunkText}
        Question: {question}
        Answer using only the chunks.
        """;

        var answer = await _completion.CompleteAsync(prompt);
        return answer;
    }
}