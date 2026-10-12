using Microsoft.AspNetCore.Identity;

namespace OpsIq.Core.Entities;

public class AppUser : IdentityUser<Guid>
{
    public Guid? TenantId { get; set; }
    public UserRole Role { get; set; }  // 0 = SuperAdmin, 1 = TenantAdmin, 2 = TenantUser.
    public string DisplayName { get; set; } = String.Empty;
}