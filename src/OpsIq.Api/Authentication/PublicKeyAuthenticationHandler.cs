using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using OpsIq.Core.Entities;
using OpsIq.Infrastructure.Data;

namespace OpsIq.Api.Authentication;

public class PublicKeyAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    private readonly AppDbContext _context;
    public PublicKeyAuthenticationHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder,
        AppDbContext context
    ) : base(options: options, logger, encoder)
    {
        _context = context;
    }

    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var authHeader = Request.Headers["Authorization"].ToString();
        if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("pk_"))
            return AuthenticateResult.Fail("Authorization header is missing.");

        var hashedKey = HashApiKey(authHeader);
        var pkKey = await _context.ApiKeys.FirstOrDefaultAsync(k => k.HashedKey == hashedKey);
        if (pkKey == null)
            return AuthenticateResult.Fail("Invalid API key.");
        if (pkKey.Type != ApiKeyType.PublicKey || pkKey.RevokedAt != null)
            return AuthenticateResult.Fail("Invalid or Revoked Key");

        var claims = new[]
        {
            new Claim("TenantId", pkKey.TenantId.ToString())
            };
        var identity = new ClaimsIdentity(claims, Scheme.Name);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, Scheme.Name);
        return AuthenticateResult.Success(ticket);
    }
    public static string HashApiKey(string pkKey)
    {
        {
            var encoded = Encoding.UTF8.GetBytes(pkKey);
            var hash = SHA256.HashData(encoded);
            return Convert.ToHexString(hash).ToLower();
        }
    }
}