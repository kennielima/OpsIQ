using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpsIq.Core.Embeddings;

namespace OpsIq.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmbedTestController : ControllerBase
{
    private readonly IEmbeddingClient _embeddings;
    public EmbedTestController(IEmbeddingClient embeddings)
    {
        _embeddings = embeddings;
    }
    [HttpGet("test")]
    public async Task<IActionResult> Embed()
    {
        var result = await _embeddings.EmbedAsync(new[] { "hello world" });
        return Ok(new { count = result[0].Length, first5 = result[0].Take(5) });
    }
}
