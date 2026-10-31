using OpsIq.Core.Abstractions;

public class StaticTenantContext : ITenantContext
{
    public Guid? TenantId { get; set; }
}
