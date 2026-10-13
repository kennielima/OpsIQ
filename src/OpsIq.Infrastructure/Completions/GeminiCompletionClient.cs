using System.Net.Http.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using OpsIq.Core.Completions;

namespace OpsIq.Infrastructure.Completions;

public class GeminiCompletionClient : ICompletionClient
{
    private readonly HttpClient _httpClient;
    private readonly string _geminiApiKey;

    public GeminiCompletionClient(IConfiguration configuration, HttpClient httpClient)
    {
        _httpClient = httpClient;
        _geminiApiKey = configuration["Gemini:ApiKey"]!;
    }
    public async Task<string> CompleteAsync(string prompt, CancellationToken ct = default)
    {
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key={_geminiApiKey}";

        var body = new
        {
            contents = new[]
            {
                new {
                    parts = new[] { new { text = prompt } }
                }
            }
        };

        var response = await _httpClient.PostAsJsonAsync(url, body, ct);
        response.EnsureSuccessStatusCode();
        var parsed = await response.Content.ReadFromJsonAsync<GeminiCompletionResponse>(cancellationToken: ct);

        return parsed!.Candidates[0].Content.Parts[0].Text;
    }
    private sealed record GeminiCompletionResponse(GeminiCandidate[] Candidates);
    private sealed record GeminiCandidate(GeminiContent Content);
    private sealed record GeminiContent(GeminiPart[] Parts);
    private sealed record GeminiPart(string Text);
}