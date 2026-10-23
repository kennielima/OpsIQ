using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpsIq.Infrastructure.Data;
using OpsIq.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
namespace OpsIq.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DocumentsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly UserManager<AppUser> _userManager;

    public DocumentsController(AppDbContext context, UserManager<AppUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }
    [HttpPost]
    [Authorize(AuthenticationSchemes = "ApiKey")]
    public async Task<ActionResult<Document>> Upload(IFormFile file, [FromForm] DocumentVisibility visibility)
    {
        var tenantId = User.FindFirst("TenantId")?.Value;
        if (string.IsNullOrEmpty(tenantId)) return BadRequest("No tenant");
        if (file == null || file.Length == 0) return BadRequest("No file");

        var allowedExtensions = new[] { ".pdf", ".md", ".txt" };
        var extension = Path.GetExtension(file.FileName)?.ToLowerInvariant();
        if (!allowedExtensions.Contains(extension)) return BadRequest("Unsupported file type");

        var documentId = Guid.NewGuid();
        var path = Path.Combine("uploads", $"{documentId}{Path.GetExtension(file.FileName)}");
        Directory.CreateDirectory("uploads");

        using var stream = System.IO.File.Create(path);
        await file.CopyToAsync(stream);
        var doc = new Document
        {
            Id = documentId,
            TenantId = Guid.Parse(tenantId),
            FileName = file.FileName,
            StoragePath = path,
            Status = DocumentStatus.Processing,
            UploadedAt = DateTime.UtcNow,
            ContentType = file.ContentType,
            Visibility = visibility
        };
        _context.Documents.Add(doc);
        await _context.SaveChangesAsync();
        return Ok(doc);
    }

    [HttpPatch("{id}")]
    [Authorize(AuthenticationSchemes = "ApiKey")]
    public async Task<ActionResult> UpdateDocument(Guid id, [FromForm] DocumentVisibility visibility)
    {
        var tenantId = User.FindFirst("TenantId")?.Value;
        if (string.IsNullOrEmpty(tenantId)) return BadRequest("No tenant");
        var document = await _context.Documents.FirstOrDefaultAsync(d => d.Id == id && Guid.Parse(tenantId) == d.TenantId && !d.IsDeleted);
        if (document == null) return BadRequest("No document");
        document.Visibility = visibility;
        await _context.SaveChangesAsync();
        return Ok(document);
    }

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<List<Document>>> ListDocuments()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return BadRequest("No user found.");
        var documents = await _context.Documents.Where(d => d.TenantId == user.TenantId && !d.IsDeleted).ToListAsync();
        return Ok(documents);
    }

    [HttpGet]
    [Route("{id}")]
    [Authorize]
    public async Task<ActionResult<Document>> GetDocument(Guid id)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return BadRequest("No user found.");
        var document = await _context.Documents.Where(d => d.TenantId == user.TenantId && d.Id == id && !d.IsDeleted).FirstOrDefaultAsync();
        if (document == null) return NotFound("Document not found.");
        return Ok(document);
    }

    [HttpDelete]
    [Route("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteDocument(Guid id)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return BadRequest("No user found.");
        var document = await _context.Documents.Where(d => d.TenantId == user.TenantId && d.Id == id && !d.IsDeleted).FirstOrDefaultAsync();
        if (document == null) return NotFound("Document not found.");
        document.IsDeleted = true;
        await _context.SaveChangesAsync();
        return NoContent();
    }
}