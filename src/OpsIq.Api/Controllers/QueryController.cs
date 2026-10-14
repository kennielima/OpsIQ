using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using OpsIq.Core.Retrieval;
using OpsIq.Models;

namespace OpsIq.Controllers;

[ApiController]
[Route("api/[controller]")]
public class QueryController : ControllerBase
{
    private readonly RagService _ragService;
    public QueryController(RagService ragService)
    {
        _ragService = ragService;
    }

    [HttpGet("protected")]
    [Authorize(AuthenticationSchemes = "ApiKey")]
    public IActionResult Protected()
    {
        return Ok("You have a valid API key.");
    }
    [HttpPost("ask")]
    [Route("query/ask")]
    // [Authorize(AuthenticationSchemes = "ApiKey")]
    [Authorize]
    public async Task<ActionResult> QueryAsync([FromBody] RequestDto request)
    {
        var tenantId = User.FindFirst("TenantId")?.Value;
        if (string.IsNullOrEmpty(tenantId)) return Ok("No tenant");
        var answer = await _ragService.AnswerQuestionAsync(request.Question, Guid.Parse(tenantId));
        return Ok(answer);
    }
}
