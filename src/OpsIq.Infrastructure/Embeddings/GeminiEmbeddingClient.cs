using System.Net.Http.Json;
using Microsoft.Extensions.Configuration;
using OpsIq.Core.Embeddings;

namespace OpsIq.Infrastructure.Embeddings;

public class GeminiEmbeddingClient : IEmbeddingClient
{
    private readonly HttpClient _httpClient;
    private readonly string _geminiApiKey;

    public GeminiEmbeddingClient(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _geminiApiKey = configuration["Gemini:ApiKey"]!;
    }

    public async Task<IReadOnlyList<float[]>> EmbedAsync(IEnumerable<string> texts, CancellationToken ct = default)
    {
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key={_geminiApiKey}";
        var results = new List<float[]>();

        foreach (var t in texts)
        {
            var body = new
            {
                model = "models/gemini-embedding-001",
                content = new
                {
                    parts = new[] { new { text = t } }
                },
                outputDimensionality = 768
            };
            var response = await _httpClient.PostAsJsonAsync(url, body, ct);
            response.EnsureSuccessStatusCode();
            var parsed = await response.Content.ReadFromJsonAsync<GeminiEmbedResponse>(cancellationToken: ct);
            results.Add(parsed!.Embedding.Values);
        }
        return results;
    }
    private sealed record GeminiEmbedResponse(GeminiEmbedding Embedding);
    private sealed record GeminiEmbedding(float[] Values);
}

