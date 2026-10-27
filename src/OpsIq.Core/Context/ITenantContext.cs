namespace OpsIq.Core.Abstractions;

public interface ITenantContext
{
    Guid? TenantId { get; }
}