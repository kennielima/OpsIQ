using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OpsIq.Api.Authentication;
using OpsIq.Core.Entities;
using OpsIq.Infrastructure.Data;
using Scalar.AspNetCore;
using opsiq.Services;
using OpsIq.Core.Embeddings;
using OpsIq.Infrastructure.Embeddings;
using OpsIq.Infrastructure.Ingestion;
using OpsIq.Infrastructure.Chunking;
using OpsIq.Core.Chunking;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddScoped<QueryService>();
builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddDbContext<AppDbContext>(options =>
options.UseNpgsql(
    builder.Configuration.GetConnectionString("DefaultConnection"),
    npgsql => npgsql.UseVector()
));

builder.Services.AddIdentity<AppUser, IdentityRole<Guid>>()
    .AddEntityFrameworkStores<AppDbContext>();

builder.Services.AddAuthentication()
    .AddScheme<AuthenticationSchemeOptions, ApiKeyAuthenticationHandler>("ApiKey", null);

builder.Services.AddScoped<IUserClaimsPrincipalFactory<AppUser>, AppUserClaimsFactory>();

builder.Services.AddHttpClient<IEmbeddingClient, GeminiEmbeddingClient>();
builder.Services.AddScoped<IChunker, FixedSizeChunker>();

builder.Services.AddHostedService<DocumentIngestionWorker>();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
    var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();

    var email = config["SUPERADMIN_EMAIL"];
    var password = config["SUPERADMIN_PASSWORD"];

    if (!string.IsNullOrEmpty(email) && !string.IsNullOrEmpty(password))
    {
        var superAdminExists = await userManager.Users.AnyAsync(u => u.Role == UserRole.SuperAdmin);
        if (!superAdminExists)
        {
            var superAdmin = new AppUser
            {
                Email = email,
                UserName = email,
                DisplayName = "Super Admin",
                Role = UserRole.SuperAdmin

            };
            var result = await userManager.CreateAsync(superAdmin, password);
            if (!result.Succeeded)
            {
                throw new Exception("Failed to create super admin user: " + string.Join(", ", result.Errors.Select(e => e.Description)));
            }
        }
    }
}
// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
