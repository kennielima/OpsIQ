using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using OpsIq.Core.Abstractions;
using OpsIq.Core.Entities;
namespace OpsIq.Infrastructure.Data;

public class AppDbContext : IdentityDbContext<AppUser, IdentityRole<Guid>, Guid>
{
    private readonly ITenantContext _tenantContext;

    public AppDbContext(
        DbContextOptions<AppDbContext> options,
        ITenantContext tenantContext
        ) : base(options)
    {
        _tenantContext = tenantContext;
    }
    public DbSet<Tenant> Tenants { get; set; }
    public DbSet<Document> Documents { get; set; }
    public DbSet<Chunk> Chunks { get; set; }
    public DbSet<Conversation> Conversations { get; set; }
    public DbSet<Message> Messages { get; set; }
    public DbSet<Citation> Citations { get; set; }
    public DbSet<ApiKey> ApiKeys { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.HasPostgresExtension("vector");
        modelBuilder.Entity<Chunk>()
            .Property(c => c.Embedding)
            .HasColumnType("vector(768)");
        modelBuilder.Entity<Document>().HasQueryFilter(d => d.TenantId == _tenantContext.TenantId && !d.IsDeleted);
        modelBuilder.Entity<Chunk>().HasQueryFilter(c => c.TenantId == _tenantContext.TenantId);
        modelBuilder.Entity<Conversation>().HasQueryFilter(c => c.TenantId == _tenantContext.TenantId);
        modelBuilder.Entity<Message>().HasQueryFilter(m => m.TenantId == _tenantContext.TenantId);
        modelBuilder.Entity<Citation>().HasQueryFilter(c => c.TenantId == _tenantContext.TenantId);
        modelBuilder.Entity<ApiKey>().HasQueryFilter(k => k.TenantId == _tenantContext.TenantId);
    }
}