using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OpsIq.Api.Authentication;
using OpsIq.Core.Entities;
using OpsIq.Infrastructure.Data;
using Scalar.AspNetCore;
using OpsIq.Services;
using OpsIq.Core.Embeddings;
using OpsIq.Infrastructure.Embeddings;
using OpsIq.Infrastructure.Ingestion;
using OpsIq.Infrastructure.Chunking;
using OpsIq.Core.Chunking;
using OpsIq.Core.Completions;
using OpsIq.Infrastructure.Completions;
using OpsIq.Core.Retrieval;
using OpsIq.Infrastructure.Retrieval;
using OpsIq.Api.Exceptions;
using OpsIq.Api.Endpoints;
using System.Threading.RateLimiting;

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
    .AddScheme<AuthenticationSchemeOptions, ApiKeyAuthenticationHandler>("ApiKey", null)
    .AddScheme<AuthenticationSchemeOptions, PublicKeyAuthenticationHandler>("PublicKey", null);

builder.Services.AddScoped<IUserClaimsPrincipalFactory<AppUser>, AppUserClaimsFactory>();
builder.Services.AddHttpClient<IEmbeddingClient, GeminiEmbeddingClient>();
builder.Services.AddScoped<IChunker, FixedSizeChunker>();
builder.Services.AddHostedService<DocumentIngestionWorker>();
builder.Services.AddHttpClient<ICompletionClient, GeminiCompletionClient>();
builder.Services.AddScoped<IVectorSearchStore, PgVectorSearchStore>();
builder.Services.AddScoped<RagService>();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();
// builder.Services.ConfigureApplicationCookie(opts =>
//   {
//       opts.ExpireTimeSpan = TimeSpan.FromHours(8);
//       opts.SlidingExpiration = true;
//   });

builder.Services.AddRateLimiter(options =>

    {
        options.AddPolicy("widget", httpContext =>
            RateLimitPartition.GetFixedWindowLimiter(
        partitionKey: httpContext.Request.Headers["Authorization"].ToString() + httpContext.Connection.RemoteIpAddress,
        factory: _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 5,
            Window = TimeSpan.FromMinutes(1)
        }
    ));
        options.OnRejected = async (context, ct) =>
        {
            context.HttpContext.Response.StatusCode = 429;
            await context.HttpContext.Response.WriteAsync("Rate limit exceeded.", ct);
        };
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy("widget", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
        {
            return true;
        })
        .AllowAnyHeader()
        .AllowAnyMethod();
    });
});

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
app.UseExceptionHandler();
app.UseRateLimiter();
app.UseCors("widget");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapMeEndpoints();
app.Run();
