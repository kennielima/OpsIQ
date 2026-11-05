using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using OpsIq.Api.Models;
using OpsIq.Core.Entities;
using OpsIq.Infrastructure.Data;

namespace OpsIq.Api.Endpoints;

public static class MeEndpoints
{
    public static void MapMeEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("api/me").RequireAuthorization().WithTags("Me");

        group.MapPost("/resetpassword", async (ClaimsPrincipal user, ChangePasswordDto dto, UserManager<AppUser> userManager) =>
        {
            var appUser = await userManager.GetUserAsync(user);
            if (appUser == null) return Results.BadRequest("No user found");

            var result = await userManager.ChangePasswordAsync(appUser, dto.CurrentPassword, dto.NewPassword);
            if (!result.Succeeded) return Results.BadRequest(result.Errors);
            return Results.NoContent();
        });

        group.MapGet("", async (ClaimsPrincipal user, UserManager<AppUser> userManager, AppDbContext context) =>
        {
            var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var tenantId = user.FindFirst("TenantId")?.Value;
            if (string.IsNullOrEmpty(tenantId) || string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var tenant = await context.Tenants.FindAsync(Guid.Parse(tenantId));

            var email = user.FindFirst(ClaimTypes.Email)?.Value;
            var role = user.FindFirst(ClaimTypes.Role)?.Value;
            var appUser = await userManager.GetUserAsync(user);
            var displayName = appUser?.DisplayName;
            return Results.Ok(new { userId, displayName, email, tenant, role });
        });
    }
}