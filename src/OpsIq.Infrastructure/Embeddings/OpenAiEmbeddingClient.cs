using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using OpsIq.Core.Embeddings;
using OpenAI.Embeddings;
using Microsoft.Extensions.Logging;
using System.Text.Json.Serialization;
namespace OpsIq.Infrastructure.Embeddings;

public class OpenAiEmbeddingClient : IEmbeddingClient
{
    private readonly HttpClient _httpClient;
    private readonly string _openAiApiKey;
    private readonly ILogger<OpenAiEmbeddingClient> _logger;

    public OpenAiEmbeddingClient(HttpClient httpClient, IConfiguration configuration, ILogger<OpenAiEmbeddingClient> logger)
    {
        _httpClient = httpClient;
        _openAiApiKey = configuration["OpenAi:ApiKey"]!;
        _httpClient.DefaultRequestHeaders.Authorization = new("Bearer", _openAiApiKey);
        _logger = logger;
    }
    public async Task<IReadOnlyList<float[]>> EmbedAsync(IEnumerable<string> texts, CancellationToken ct = default)
    {
        // var client = new EmbeddingClient("text-embedding-3-small", _openAiApiKey);
        // var response = await client.GenerateEmbeddingsAsync(texts.ToList());
        // return response.Value.Select(e => e.ToFloats().ToArray()).ToList();

        var url = "https://api.openai.com/v1/embeddings";

        var body = new
        {
            input = texts,
            model = "text-embedding-3-small",
            encoding_format = "float",
            dimensions = 768
        };
        var json = JsonSerializer.Serialize(body);
        var request = new HttpRequestMessage(HttpMethod.Post, url)
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json"),
        };
        var response = await _httpClient.SendAsync(request, ct);
        var responseBody = await response.Content.ReadAsStringAsync();
        _logger.LogInformation("OpenAI response: {Body}", responseBody);
        if (!response.IsSuccessStatusCode) throw new HttpRequestException($"OpenAi embed failed: {response.StatusCode} - {responseBody}");

        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var parsed = JsonSerializer.Deserialize<OpenAiEmbedResponse>(responseBody, options);
        _logger.LogInformation("Parsed data count: {Count}", parsed?.Data?.Length ?? -1);
        return parsed!.Data.Select(d => d.Embedding).ToList();
    }
    private sealed record OpenAiEmbedResponse([property: JsonPropertyName("data")] OpenAiData[] Data);
    private sealed record OpenAiData([property: JsonPropertyName("embedding")] float[] Embedding);
}
