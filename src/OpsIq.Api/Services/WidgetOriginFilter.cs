using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using OpsIq.Infrastructure.Data;

namespace OpsIq.Api.Filters;

public class WidgetOriginFilter : IAsyncActionFilter
{
    private readonly AppDbContext _context;

    public WidgetOriginFilter(AppDbContext context)
    {
        _context = context;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var tenantId = context.HttpContext.User.FindFirst("TenantId")?.Value;
        if (string.IsNullOrEmpty(tenantId))
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        var origin = context.HttpContext.Request.Headers["Origin"].ToString();
        var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Id == Guid.Parse(tenantId));

        if (tenant?.AllowedOrigins != null && !tenant.AllowedOrigins.Contains(origin))
        {
            context.Result = new StatusCodeResult(403);
            return;
        }
        await next();
    }
}
