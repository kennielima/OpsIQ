using System.Security.Cryptography;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpsIq.Api.Authentication;
using OpsIq.Api.Models;
using OpsIq.Core.Entities;
using OpsIq.Infrastructure.Data;

namespace OpsIq.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TenantsController : ControllerBase
{
    private readonly UserManager<AppUser> _userManager;
    private readonly AppDbContext _context;
    public TenantsController(AppDbContext context, UserManager<AppUser> userManager)
    {
        _userManager = userManager;
        _context = context;
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> CreateTenant([FromBody] CreateTenantDto createTenantDto)
    {
        var tenant = new Tenant
        {
            Id = Guid.NewGuid(),
            Name = createTenantDto.TenantName,
            Slug = createTenantDto.TenantSlug,
            CreatedAt = DateTime.UtcNow
        };
        _context.Tenants.Add(tenant);

        var admin = new AppUser
        {
            Email = createTenantDto.AdminEmail,
            UserName = createTenantDto.AdminEmail,
            DisplayName = createTenantDto.AdminDisplayName,
            TenantId = tenant.Id,
            Role = UserRole.TenantAdmin
        };
        var adminResult = await _userManager.CreateAsync(admin, createTenantDto.AdminPassword);
        if (!adminResult.Succeeded)
        {
            return BadRequest(adminResult.Errors.Select(e => e.Description));
        }
        await _context.SaveChangesAsync();
        return Ok(new CreateTenantResponseDto
        {
            TenantId = tenant.Id,
            Name = tenant.Name,
            Slug = tenant.Slug,
            AdminId = admin.Id,
            AdminEmail = admin.Email!,
            DisplayName = admin.DisplayName,
            Role = admin.Role.ToString()
        });
    }


    [HttpPost]
    [Route("{tenantId}/users")]
    [Authorize(Roles = "TenantAdmin")]
    public async Task<IActionResult> CreateUser(Guid tenantId, [FromBody] CreateUserDto createUserDto)
    {
        var claimTenantId = User.FindFirst("TenantId")?.Value;
        if (claimTenantId != tenantId.ToString()) return StatusCode(403, "Tenant ID mismatch.");

        var user = new AppUser
        {
            Email = createUserDto.Email,
            UserName = createUserDto.Email,
            DisplayName = createUserDto.DisplayName,
            TenantId = tenantId
        };

        var result = await _userManager.CreateAsync(user, createUserDto.Password);
        if (!result.Succeeded) return BadRequest(result.Errors.Select(e => e.Description));
        return Ok(new { user.Id, user.Email, user.DisplayName, user.TenantId });
    }

    [HttpGet]
    [Route("{tenantId}/keys")]
    [Authorize(Roles = "TenantAdmin")]
    public async Task<IActionResult> ListKeys(Guid tenantId)
    {
        var claimTenantId = User.FindFirst("TenantId")?.Value;
        if (claimTenantId != tenantId.ToString()) return StatusCode(403, "Tenant ID mismatch.");

        var keys = await _context.ApiKeys
            .Where(k => k.TenantId == tenantId && k.Type == ApiKeyType.PublicKey)
            .OrderByDescending(k => k.CreatedAt)
            .Select(k => new { k.Id, k.TenantId, k.Prefix, k.CreatedAt, k.LastUsedAt, k.RevokedAt, Status = k.RevokedAt == null ? "Active" : "Revoked" })
            .ToListAsync();

        return Ok(keys);
    }

    [HttpPost]
    [Route("{tenantId}/keys")]
    [Authorize(Roles = "TenantAdmin")]
    public async Task<IActionResult> MintKey(Guid tenantId)
    {
        var claimTenantId = User.FindFirst("TenantId")?.Value;
        if (claimTenantId != tenantId.ToString()) return StatusCode(403, "Tenant ID mismatch.");

        var randomBytes = RandomNumberGenerator.GetBytes(32);
        var rawKey = "pk_" + Convert.ToBase64String(randomBytes)
            .Replace("+", "-").Replace("/", "_").TrimEnd('=');
        var hashed = PublicKeyAuthenticationHandler.HashApiKey(rawKey);

        var apiKey = new ApiKey
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            HashedKey = hashed,
            Prefix = rawKey[..12],
            Type = ApiKeyType.PublicKey,
            CreatedAt = DateTime.UtcNow
        };
        _context.ApiKeys.Add(apiKey);
        await _context.SaveChangesAsync();
        return Ok(new { apiKey.Id, RawKey = rawKey });
    }

    [HttpDelete]
    [Route("{tenantId}/keys/{keyId}")]
    [Authorize(Roles = "TenantAdmin")]
    public async Task<IActionResult> RevokeKey(Guid tenantId, Guid keyId)
    {
        var claimTenantId = User.FindFirst("TenantId")?.Value;
        if (claimTenantId != tenantId.ToString()) return StatusCode(403, "Tenant ID mismatch.");
        var key = await _context.ApiKeys.FirstOrDefaultAsync(key => keyId == key.Id);
        if (key == null) return NotFound();
        if (key.Type != ApiKeyType.PublicKey) return BadRequest("Cannot revoke a secret key.");

        key.RevokedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("{tenantId}/origins")]
    [Authorize(Roles = "TenantAdmin")]
    public async Task<IActionResult> GetOrigins(Guid tenantId)
    {
        var claimTenantId = User.FindFirst("TenantId")?.Value;
        if (claimTenantId != tenantId.ToString()) return StatusCode(403, "Tenant ID mismatch.");

        var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId);
        if (tenant == null) return NotFound();

        return Ok(tenant.AllowedOrigins ?? []);
    }

    [HttpPut("{tenantId}/origins")]
    [Authorize(Roles = "TenantAdmin")]
    public async Task<IActionResult> AddOrigins(Guid tenantId, [FromBody] string[] origins)
    {
        var claimTenantId = User.FindFirst("TenantId")?.Value;
        if (claimTenantId != tenantId.ToString()) return StatusCode(403, "Tenant ID mismatch.");

        var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId);
        if (tenant == null) return NotFound();
        tenant.AllowedOrigins = origins.ToList();
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("{tenantId}/users")]
    [Authorize(Roles = "TenantAdmin")]
    public async Task<IActionResult> GetUsers(Guid tenantId)
    {
        var claimTenantId = User.FindFirst("TenantId")?.Value;
        if (claimTenantId != tenantId.ToString()) return StatusCode(403, "Tenant ID mismatch.");

        var users = await _userManager.Users
            .Where(u => u.TenantId == tenantId)
            .Select(u => new { u.Id, u.Email, u.DisplayName, u.Role })
            .ToListAsync();

        return Ok(users);
    }

    [HttpDelete("{tenantId}/users/{userId}")]
    [Authorize(Roles = "TenantAdmin")]
    public async Task<IActionResult> RemoveUser(Guid tenantId, Guid userId)
    {
        var claimTenantId = User.FindFirst("TenantId")?.Value;
        if (claimTenantId != tenantId.ToString()) return StatusCode(403, "Tenant ID mismatch.");

        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null || user.TenantId != tenantId) return NotFound();

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded) return BadRequest(result.Errors.Select(e => e.Description));

        return NoContent();
    }
}
