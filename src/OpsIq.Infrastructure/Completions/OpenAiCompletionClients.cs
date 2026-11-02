using System.Net.Http.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
// using OpenAI.Chat;
using OpsIq.Core.Completions;

namespace OpsIq.Infrastructure.Completions;

public class OpenAiCompletionClient : ICompletionClient
{
    private readonly ILogger<OpenAiCompletionClient> _logger;
    private readonly string _openaiApikey;
    private readonly HttpClient _httpClient;

    public OpenAiCompletionClient(ILogger<OpenAiCompletionClient> logger, IConfiguration configuration, HttpClient httpClient)
    {
        _logger = logger;
        _httpClient = httpClient;
        _openaiApikey = configuration["OpenAi:ApiKey"]!;
    }
    public async Task<string> CompleteAsync(string prompt, CancellationToken ct = default)
    {
        // var client = new ChatClient("gpt-4o-mini", _openaiApikey);
        // var response = await client.CompleteChatAsync(prompt);
        // return response.Value.Content[0].Text;
        var url = "https://api.openai.com/v1/chat/completions";
        var body = new
        {
            model = "gpt-4.1-mini",
            messages = new[]
        {
            new { role = "user", content = prompt }
        }
        };

        _httpClient.DefaultRequestHeaders.Authorization = new("Bearer", _openaiApikey);
        var response = await _httpClient.PostAsJsonAsync(url, body, ct);

        var raw = await response.Content.ReadAsStringAsync();
        if
        (!response.IsSuccessStatusCode)
            _logger.LogError("OpenAi {Status}: {Body}", response.StatusCode, raw);

        response.EnsureSuccessStatusCode();
        var parsed = await response.Content.ReadFromJsonAsync<OpenAiCompletionResponse>(cancellationToken: ct);

        return parsed!.Choices[0].Message.Content;
    }
    private sealed record OpenAiCompletionResponse(OpenAiChoices[] Choices);
    private sealed record OpenAiChoices(OpenAiMessage Message);
    private sealed record OpenAiMessage(string Content);
}