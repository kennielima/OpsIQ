namespace OpsIq.Models;

using System.ComponentModel.DataAnnotations;
public class RequestDto
{
    [Required]
    [MinLength(10)]
    public string Question { get; set; } = string.Empty;
    public string? SessionId { get; set; } = string.Empty;
}