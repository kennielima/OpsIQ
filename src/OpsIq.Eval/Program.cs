using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
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
      .Build();

var services = new ServiceCollection();

services.AddDbContext<AppDbContext>(options =>
options.UseNpgsql(
    config.GetConnectionString("DefaultConnection"),
    npgsql => npgsql.UseVector()
));

services.AddHttpClient<IEmbeddingClient, GeminiEmbeddingClient>();
services.AddHttpClient<ICompletionClient, GeminiCompletionClient>();
services.AddScoped<IChunker, FixedSizeChunker>();
services.AddScoped<IVectorSearchStore, PgVectorSearchStore>();
services.AddScoped<RagService>();
services.AddSingleton<StaticTenantContext>();
services.AddSingleton<ITenantContext>(sp => sp.GetRequiredService<StaticTenantContext>());
services.AddSingleton<IConfiguration>(config);

var provider = services.BuildServiceProvider();
var tenantContext = provider.GetRequiredService<StaticTenantContext>();

var json = File.ReadAllText("/Users/kennielima/OpsIq/src/OpsIq.Eval/questions.json");
var questions = JsonSerializer.Deserialize<EvalQuestions>(json);
var answerable = questions?.Answerable;
var unanswerable = questions?.Unanswerable;

if (answerable != null)
{
    foreach (var q in answerable)
    {
        Console.WriteLine($"Q: {q.Question}");
    }
}

tenantContext.TenantId = Guid.Parse("ae03e1cc-4ff6-4ada-ae19-36dd5f23471b");
