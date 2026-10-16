using Microsoft.AspNetCore.Diagnostics;
using System.Net;
namespace OpsIq.Api.Exceptions;

public class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;
    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
        => _logger = logger;

    public async ValueTask<bool> TryHandleAsync(
     HttpContext ctx, Exception ex, CancellationToken ct)
    {
        var (status, message) = ex switch
        {
            HttpRequestException { StatusCode: HttpStatusCode.TooManyRequests } => (429, "Too many requests, try later."),
            HttpRequestException => (503, "AI service unavailable, try again."),
            _ => (500, "Something went wrong."),
        };

        if (ex is HttpRequestException)
            _logger.LogWarning(ex, "Downstream service unavailable");
        else
            _logger.LogError(ex, "Unhandled exception");

        ctx.Response.StatusCode = status;
        await ctx.Response.WriteAsJsonAsync(new { error = message }, ct);
        return true;
    }
}