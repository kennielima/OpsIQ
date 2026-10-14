using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
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
            var json = JsonSerializer.Serialize(body);
            var request = new HttpRequestMessage(HttpMethod.Post, url)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            };

            var response = await _httpClient.SendAsync(request, ct);
            var responseBody = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode) throw new HttpRequestException($"Gemini embed failed: {response.StatusCode} - {responseBody}");
            var parsed = JsonSerializer.Deserialize<GeminiEmbedResponse>(responseBody);
            results.Add(parsed!.Embedding.Values);
        }
        return results;
    }
    private sealed record GeminiEmbedResponse(
        [property: JsonPropertyName("embedding")] GeminiEmbedding Embedding
    );
    private sealed record GeminiEmbedding(
        [property: JsonPropertyName("values")] float[] Values
    );
    // private sealed class GeminiEmbedResponse
    // {
    //     [JsonPropertyName("embedding")]
    //     public GeminiEmbedding Embedding { get; init; }
    //     public GeminiEmbedResponse(GeminiEmbedding embedding) { Embedding = embedding; }
    // }
}

