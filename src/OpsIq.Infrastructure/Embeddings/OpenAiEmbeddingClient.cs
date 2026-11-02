using Microsoft.Extensions.Configuration;
using OpsIq.Core.Embeddings;
using OpenAI.Embeddings;
using Microsoft.Extensions.Logging;
using System.Text.Json.Serialization;
using System.ClientModel;
namespace OpsIq.Infrastructure.Embeddings;

public class OpenAiEmbeddingClient : IEmbeddingClient
{
    private readonly string _openAiApiKey;
    private readonly ILogger<OpenAiEmbeddingClient> _logger;

    public OpenAiEmbeddingClient(IConfiguration configuration, ILogger<OpenAiEmbeddingClient> logger)
    {
        _openAiApiKey = configuration["OpenAi:ApiKey"]!;
        _logger = logger;
    }
    public async Task<IReadOnlyList<float[]>> EmbedAsync(IEnumerable<string> texts, CancellationToken ct = default)
    {
        try
        {
            var client = new EmbeddingClient("text-embedding-3-small", _openAiApiKey);
            var options = new EmbeddingGenerationOptions { Dimensions = 768 };
            var response = await client.GenerateEmbeddingsAsync(texts.ToList(), options, ct);
            return response.Value.Select(e => e.ToFloats().ToArray()).ToList();
        }
        catch (ClientResultException ex)
        {
            _logger.LogError("OpenAI error: {Message}", ex.Message);
            throw;
        }
    }
}
