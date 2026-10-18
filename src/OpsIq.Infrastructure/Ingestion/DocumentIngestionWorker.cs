using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using OpsIq.Core.Embeddings;
using OpsIq.Core.Chunking;
using OpsIq.Core.Entities;
using OpsIq.Infrastructure.Data;
using Pgvector;
using UglyToad.PdfPig;
using System.Text;

namespace OpsIq.Infrastructure.Ingestion;

public class DocumentIngestionWorker : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<DocumentIngestionWorker> _logger;
    private static readonly TimeSpan PollInterval = TimeSpan.FromSeconds(5);
    public DocumentIngestionWorker(IServiceProvider services, ILogger<DocumentIngestionWorker> logger)
    {
        _services = services;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessPendingDocumentsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ingestion loop iteration failed");
            }

            await Task.Delay(PollInterval, stoppingToken);
        }
    }

    private async Task ProcessPendingDocumentsAsync(CancellationToken ct)
    {
        using var scope = _services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var chunker = scope.ServiceProvider.GetRequiredService<IChunker>();
        var embeddings = scope.ServiceProvider.GetRequiredService<IEmbeddingClient>();
        var pending = await db.Documents
            .Where(d => d.Status == DocumentStatus.Processing && !d.IsDeleted)
            .ToListAsync(ct);

        foreach (var doc in pending)
        {
            try
            {
                var ext = Path.GetExtension(doc.StoragePath)?.ToLowerInvariant();
                string text;
                if (ext == ".pdf")
                {
                    using var pdf = PdfDocument.Open(doc.StoragePath);
                    var sb = new StringBuilder();
                    foreach (var page in pdf.GetPages())
                        sb.AppendLine(page.Text);
                    text = sb.ToString();
                }
                else
                {
                    text = await File.ReadAllTextAsync(doc.StoragePath, ct);
                }

                var chunks = chunker.Chunk(text);
                if (chunks.Count == 0)
                {
                    doc.Status = DocumentStatus.Failed;
                    await db.SaveChangesAsync(ct);
                    continue;
                }

                var vectors = await embeddings.EmbedAsync(chunks, ct);

                for (int i = 0; i < chunks.Count; i++)
                {
                    db.Chunks.Add(new Chunk
                    {
                        Id = Guid.NewGuid(),
                        TenantId = doc.TenantId,
                        DocumentId = doc.Id,
                        Content = chunks[i],
                        ChunkIndex = i,
                        Embedding = new Vector(vectors[i])
                    });
                }

                doc.Status = DocumentStatus.Ready;
                doc.ProcessedAt = DateTime.UtcNow;
                await db.SaveChangesAsync(ct);

                _logger.LogInformation("Ingested doc {DocId}: {Count} chunks", doc.Id, chunks.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to ingest doc {DocId}", doc.Id);
                doc.Status = DocumentStatus.Failed;
                await db.SaveChangesAsync(ct);
            }
        }
    }
}