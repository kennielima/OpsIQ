using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpsIq.Core.Entities;
using OpsIq.Core.Retrieval;
using OpsIq.Infrastructure.Data;
using OpsIq.Models;

namespace OpsIq.Controllers;

[ApiController]
[Route("/api/[controller]")]
public class WidgetController : ControllerBase
{
    private readonly AppDbContext _appDbContext;
    private readonly RagService _ragService;


    public WidgetController(AppDbContext appDbContext, RagService ragService)
    {
        _appDbContext = appDbContext;
        _ragService = ragService;
    }

    [HttpPost("query")]
    [Authorize(AuthenticationSchemes = "PublicKey")]
    public async Task<IActionResult> WidgetQueryAsync([FromBody] RequestDto dto)
    {
        var tenantId = User.FindFirst("TenantId")?.Value;
        if (string.IsNullOrEmpty(tenantId)) return Unauthorized("No tenant");

        if (dto.Question.Length > 500) return
            BadRequest("Question too long.");

        var rag = await _ragService.AnswerQuestionAsync(dto.Question, Guid.Parse(tenantId), true);

        var conversation = new Conversation
        {
            Id = Guid.NewGuid(),
            TenantId = Guid.Parse(tenantId),
            SessionId = dto.SessionId,
            StartedAt = DateTime.UtcNow
        };
        _appDbContext.Conversations.Add(conversation);

        var question = new Message
        {
            Id = Guid.NewGuid(),
            TenantId = Guid.Parse(tenantId),
            ConversationId = conversation.Id,
            Role = MessageRole.User,
            Content = dto.Question,
            CreatedAt = DateTime.UtcNow
        };
        _appDbContext.Messages.Add(question);

        var answer = new Message
        {
            Id = Guid.NewGuid(),
            TenantId = Guid.Parse(tenantId),
            ConversationId = conversation.Id,
            Role = MessageRole.Assistant,
            Content = rag.answer,
            CreatedAt = DateTime.UtcNow
        };
        _appDbContext.Messages.Add(answer);

        var chunks = rag.chunks;
        for (int i = 0; i < chunks.Length; i++)
        {
            var citation = new Citation
            {
                Id = Guid.NewGuid(),
                TenantId = Guid.Parse(tenantId),
                MessageId = answer.Id,
                ChunkId = chunks[i].Chunk.Id,
                Rank = i,
                Score = chunks[i].Score
            };
            _appDbContext.Citations.Add(citation);
        }

        await _appDbContext.SaveChangesAsync();

        var documents = new List<Document>();
        foreach (var c in rag.chunks)
        {
            var doc = await _appDbContext.Documents.FirstOrDefaultAsync(d => d.Id == c.Chunk.DocumentId && !d.IsDeleted);
            if (doc != null) documents.Add(doc);
        }

        return Ok(new
        {
            answer = rag.answer,
            citations = rag.chunks.Select((c) => new
            {
                title = documents.FirstOrDefault(d => d.Id == c.Chunk.DocumentId)?.FileName
            }).DistinctBy(s => s.title)
        });
    }
}