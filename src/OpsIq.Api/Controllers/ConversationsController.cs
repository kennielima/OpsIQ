using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpsIq.Core.Entities;
using OpsIq.Infrastructure.Data;

namespace OpsIq.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ConversationsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ConversationsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult> ListAsync()
    {
        var tenantId = User.FindFirst("TenantId")?.Value;
        if (string.IsNullOrEmpty(tenantId)) return Unauthorized();
        var tenantGuid = Guid.Parse(tenantId);

        var conversations = await _context.Conversations
            .Where(c => c.TenantId == tenantGuid)
            .OrderByDescending(c => c.StartedAt)
            .ToListAsync();

        var convIds = conversations.Select(c => c.Id).ToList();

        var allMessages = await _context.Messages
            .Where(m => convIds.Contains(m.ConversationId))
            .ToListAsync();

        var assistantMsgIds = allMessages
            .Where(m => m.Role == MessageRole.Assistant)
            .Select(m => m.Id)
            .ToList();

        var citationCounts = await _context.Citations
            .Where(c => assistantMsgIds.Contains(c.MessageId))
            .GroupBy(c => c.MessageId)
            .Select(g => new { MessageId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.MessageId, x => x.Count);

        var results = conversations.Select(conv =>
        {
            var userMsg = allMessages.FirstOrDefault(m => m.ConversationId == conv.Id && m.Role == MessageRole.User);
            var assistantMsg = allMessages.FirstOrDefault(m => m.ConversationId == conv.Id && m.Role == MessageRole.Assistant);
            var count = assistantMsg != null && citationCounts.TryGetValue(assistantMsg.Id, out var n) ? n : 0;

            return new
            {
                id = conv.Id,
                question = userMsg?.Content ?? "",
                answerFound = count > 0,
                citationCount = count,
                createdAt = conv.StartedAt,
            };
        });

        return Ok(results);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult> GetAsync(Guid id)
    {
        var tenantId = User.FindFirst("TenantId")?.Value;
        if (string.IsNullOrEmpty(tenantId)) return Unauthorized();
        var tenantGuid = Guid.Parse(tenantId);

        var conv = await _context.Conversations
            .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantGuid);
        if (conv == null) return NotFound();

        var messages = await _context.Messages
            .Where(m => m.ConversationId == id)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();

        var userMsg = messages.FirstOrDefault(m => m.Role == MessageRole.User);
        var assistantMsg = messages.FirstOrDefault(m => m.Role == MessageRole.Assistant);

        var citations = new List<object>();
        if (assistantMsg != null)
        {
            var rawCitations = await _context.Citations
                .Where(c => c.MessageId == assistantMsg.Id)
                .OrderBy(c => c.Rank)
                .ToListAsync();

            var chunkIds = rawCitations.Select(c => c.ChunkId).ToList();

            var chunks = await _context.Chunks
                .IgnoreQueryFilters()
                .Where(ch => chunkIds.Contains(ch.Id))
                .ToListAsync();

            var docIds = chunks.Select(ch => ch.DocumentId).Distinct().ToList();

            var docs = await _context.Documents
                .IgnoreQueryFilters()
                .Where(d => docIds.Contains(d.Id))
                .ToListAsync();

            citations = rawCitations.Select(cit =>
            {
                var chunk = chunks.FirstOrDefault(ch => ch.Id == cit.ChunkId);
                var doc = chunk != null ? docs.FirstOrDefault(d => d.Id == chunk.DocumentId) : null;

                return (object)new
                {
                    rank = cit.Rank,
                    chunkId = cit.ChunkId,
                    documentId = doc?.Id,
                    documentTitle = doc?.FileName,
                    content = chunk?.Content ?? "",
                    score = cit.Score,
                    visibility = doc?.Visibility.ToString(),
                    uploadedAt = doc?.UploadedAt,
                };
            }).ToList();
        }

        return Ok(new
        {
            id = conv.Id,
            question = userMsg?.Content ?? "",
            answer = assistantMsg?.Content ?? "",
            answerFound = citations.Count > 0,
            citationCount = citations.Count,
            createdAt = conv.StartedAt,
            citations,
        });
    }
}
