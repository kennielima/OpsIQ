using opsiq.Models;
using opsiq.Services;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using OpsIq.Core.Completions;

namespace opsiq.Controllers;

[ApiController]
[Route("api/[controller]")]
public class QueryController : ControllerBase
{
    private readonly QueryService _queryService;
    private readonly ICompletionClient _completionClient;
    public QueryController(QueryService queryService, ICompletionClient completionClient)
    {
        _queryService = queryService;
        _completionClient = completionClient;
    }

    [HttpGet("protected")]
    [Authorize(AuthenticationSchemes = "ApiKey")]
    public IActionResult Protected()
    {
        return Ok("You have a valid API key.");
    }
    [HttpPost]
    // [Route("ask")]
    public async Task<ActionResult> GetTaskAsync([FromBody] RequestDto request)
    {
        var prompt = request.Question ?? string.Empty;
        var answer = await _queryService.GetQuestionAsync(prompt);
        return Ok(answer);
    }
    [HttpPost]
    [Route("query/ask")]
    public async Task<ActionResult> QueryAsync([FromBody] RequestDto request)
    {
        var prompt = request.Question ?? string.Empty;
        // var prompt = "what is a dependency injection";
        var answer = await _completionClient.CompleteAsync(prompt);
        return Ok(answer);
    }
}
