using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using OpsIq.Infrastructure.Data;

namespace OpsIq.Api.Authentication;

public class ApiKeyAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    private readonly AppDbContext _context;

    public ApiKeyAuthenticationHandler(
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
        if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("sk_"))
            return AuthenticateResult.Fail("Authorization header is missing.");

        var hashedKey = HashApiKey(authHeader);

        var apiKey = await _context.ApiKeys.IgnoreQueryFilters().FirstOrDefaultAsync(key => key.HashedKey == hashedKey);
        if (apiKey == null)
            return AuthenticateResult.Fail("Invalid API key.");

        var claims = new[]
        {
            new Claim("TenantId", apiKey.TenantId.ToString()),
        };
        var identity = new ClaimsIdentity(claims, Scheme.Name);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, Scheme.Name);

        return AuthenticateResult.Success(ticket);
    }

    public static string HashApiKey(string apiKey)
    {
        {
            var encoded = Encoding.UTF8.GetBytes(apiKey); //convert key to byte
            var hash = SHA256.HashData(encoded);
            return Convert.ToHexString(hash).ToLower();
        }
    }
}
