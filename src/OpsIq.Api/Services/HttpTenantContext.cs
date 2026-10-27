using OpsIq.Core.Abstractions;

public class HttpTenantContext : ITenantContext
{
    private readonly IHttpContextAccessor _accessor;

    public HttpTenantContext(IHttpContextAccessor accessor)
    {
        _accessor = accessor;
    }

    public Guid? TenantId =>
        _accessor.HttpContext?.User.FindFirst("TenantId") is { } claim
            ? Guid.Parse(claim.Value)
            : null;
}