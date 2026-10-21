using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using OpsIq.Core.Retrieval;
using OpsIq.Models;
using OpsIq.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using OpsIq.Core.Entities;

namespace OpsIq.Controllers;

[ApiController]
[Route("api/[controller]")]
public class QueryController : ControllerBase
{
    private readonly RagService _ragService;
    private readonly AppDbContext _context;
    private readonly UserManager<AppUser> _userManager;

    public QueryController(RagService ragService, AppDbContext context, UserManager<AppUser> userManager)
    {
        _ragService = ragService;
        _context = context;
        _userManager = userManager;
    }

    [HttpGet("protected")]
    [Authorize(AuthenticationSchemes = "ApiKey")]
    public IActionResult Protected()
    {
        return Ok("You have a valid API key.");
    }
    [HttpPost]
    [Route("ask")]
    [Authorize]
    public async Task<ActionResult> QueryAsync([FromBody] RequestDto request)
    {
        var tenantId = User.FindFirst("TenantId")?.Value;
        // var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = _userManager.GetUserId(User);
        if (string.IsNullOrEmpty(tenantId)) return Unauthorized("No tenant");

        var ragResult = await _ragService.AnswerQuestionAsync(request.Question, Guid.Parse(tenantId), false);

        var conversation = new Conversation
        {
            Id = Guid.NewGuid(),
            TenantId = Guid.Parse(tenantId),
            UserId = Guid.Parse(userId!),
        };
        _context.Conversations.Add(conversation);

        var question = new Message
        {
            Id = Guid.NewGuid(),
            TenantId = Guid.Parse(tenantId),
            ConversationId = conversation.Id,
            Role = MessageRole.User,
            Content = request.Question
        };
        _context.Messages.Add(question);

        var answer = new Message
        {
            Id = Guid.NewGuid(),
            TenantId = Guid.Parse(tenantId),
            ConversationId = conversation.Id,
            Role = MessageRole.Assistant,
            Content = ragResult.answer
        };
        _context.Messages.Add(answer);

        var chunks = ragResult.chunks;
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
            _context.Citations.Add(citation);
        }

        await _context.SaveChangesAsync();
        return Ok(new
        {
            answer = ragResult.answer,
            citations = ragResult.chunks.Select((c, i) => new
            {
                chunkId = c.Chunk.Id,
                documentId = c.Chunk.DocumentId,
                content = c.Chunk.Content,
                rank = i,
                Score = c.Score
            })
        });
    }
}
