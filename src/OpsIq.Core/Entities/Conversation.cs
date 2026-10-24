namespace OpsIq.Core.Entities;


public class Conversation
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid? UserId { get; set; }
    public DateTime StartedAt { get; set; }
    public string? SessionId { get; set; }
}