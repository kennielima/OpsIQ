namespace OpsIq.Core.Entities;


public class Document
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public DocumentStatus Status { get; set; } = DocumentStatus.Processing;
    public string StoragePath { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; }
    public DateTime? ProcessedAt { get; set; } = null;
    public bool IsDeleted { get; set; }
    public DocumentVisibility Visibility { get; set; } = DocumentVisibility.Internal;
}

