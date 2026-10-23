namespace OpsIq.Core.Entities;


public class ApiKey
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string HashedKey { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? LastUsedAt { get; set; }
    public ApiKeyType Type { get; set; } = ApiKeyType.SecretKey;
    public DateTime? RevokedAt { get; set; }
}

