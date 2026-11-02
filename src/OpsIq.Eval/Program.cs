using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using OpsIq.Core.Abstractions;
using OpsIq.Core.Chunking;
using OpsIq.Core.Completions;
using OpsIq.Core.Embeddings;
using OpsIq.Core.Retrieval;
using OpsIq.Infrastructure.Chunking;
using OpsIq.Infrastructure.Completions;
using OpsIq.Infrastructure.Data;
using OpsIq.Infrastructure.Embeddings;
using OpsIq.Infrastructure.Retrieval;

// var builder = WebApplication.CreateBuilder(args);

var config = new ConfigurationBuilder()
      .AddJsonFile("/Users/kennielima/OpsIq/src/OpsIq.Api/appsettings.Development.json")
      .AddJsonFile("/Users/kennielima/OpsIq/src/OpsIq.Api/appsettings.json")
      .Build();

var services = new ServiceCollection();

services.AddDbContext<AppDbContext>(options =>
options.UseNpgsql(
    config.GetConnectionString("DefaultConnection"),
    npgsql => npgsql.UseVector()
));

services.AddScoped<IEmbeddingClient, OpenAiEmbeddingClient>();
services.AddScoped<ICompletionClient, OpenAiCompletionClient>();
services.AddScoped<IChunker, FixedSizeChunker>();
services.AddScoped<IVectorSearchStore, PgVectorSearchStore>();
services.AddScoped<RagService>();
services.AddSingleton<StaticTenantContext>();
services.AddSingleton<ITenantContext>(sp => sp.GetRequiredService<StaticTenantContext>());
services.AddSingleton<IConfiguration>(config);

services.AddLogging(b =>
  b.AddConsole());

var provider = services.BuildServiceProvider();
var tenantContext = provider.GetRequiredService<StaticTenantContext>();

var json = File.ReadAllText("/Users/kennielima/OpsIq/src/OpsIq.Eval/questions.json");
var questions = JsonSerializer.Deserialize<EvalQuestions>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
// var questions = JsonSerializer.Deserialize<EvalQuestions>(json);
var answerable = questions?.Answerable;
var unanswerable = questions?.Unanswerable;

tenantContext.TenantId = Guid.Parse("ae03e1cc-4ff6-4ada-ae19-36dd5f23471b");

using var scope = provider.CreateScope();
var ragService = scope.ServiceProvider.GetRequiredService<RagService>();

int hits = 0;
foreach (var q in answerable!)
{
    var result = await ragService.AnswerQuestionAsync(q.Question, tenantContext.TenantId!.Value, false);
    var score = result.chunks.Length > 0 ? result.chunks[0].Score : 1f;
    var hit = result.chunks.Length > 0 && score <= 0.7f;
    if (hit) hits++;
    Console.WriteLine($"[{(hit ? "HIT" : "MISS")}] {q.Question}");
    Console.WriteLine($"  Score: {score:F4} | {result.answer[..Math.Min(80, result.answer.Length)]}");
}
Console.WriteLine($"\nAnswerable hit rate: {hits}/{answerable.Count}");


int refused = 0;
foreach (var q in unanswerable!)
{
    var result = await ragService.AnswerQuestionAsync(q.Question, tenantContext.TenantId!.Value, false);
    var score = result.chunks.Length > 0 ? result.chunks[0].Score : 1f;
    var correctlyRefused = result.chunks.Length == 0 || score > 0.7f;
    if (correctlyRefused) refused++;
    Console.WriteLine($"[{(correctlyRefused ? "REFUSED" : "LEAKED")}] {q.Question}");
    Console.WriteLine($"  Score: {score:F4} | {result.answer[..Math.Min(80, result.answer.Length)]}");
}
Console.WriteLine($"\nRefusal accuracy: {refused}/{unanswerable.Count}");