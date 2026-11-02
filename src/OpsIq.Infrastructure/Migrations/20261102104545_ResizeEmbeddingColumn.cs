using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpsIq.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ResizeEmbeddingColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE \"Chunks\" ALTER COLUMN \"Embedding\" TYPE vector(1536)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE \"Chunks\" ALTER COLUMN \"Embedding\" TYPE vector(768)");
        }
    }
}
