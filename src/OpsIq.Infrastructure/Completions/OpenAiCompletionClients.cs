using System.ClientModel;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using OpenAI.Chat;
using OpsIq.Core.Completions;

namespace OpsIq.Infrastructure.Completions;

public class OpenAiCompletionClient : ICompletionClient
{
    private readonly ILogger<OpenAiCompletionClient> _logger;
    private readonly string _openaiApikey;

    public OpenAiCompletionClient(ILogger<OpenAiCompletionClient> logger, IConfiguration configuration)
    {
        _logger = logger;
        _openaiApikey = configuration["OpenAi:ApiKey"]!;
    }
    public async Task<string> CompleteAsync(string prompt, CancellationToken ct = default)
    {
        try
        {
            var client = new ChatClient("gpt-4.1-mini", _openaiApikey);
            var response = await client.CompleteChatAsync(prompt);
            return response.Value.Content[0].Text;
        }
        catch (ClientResultException ex)
        {
            _logger.LogError("OpenAI error: {Message}", ex.Message);
            throw;
        }
    }
}