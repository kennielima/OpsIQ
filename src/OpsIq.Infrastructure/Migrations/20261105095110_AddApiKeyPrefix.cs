using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpsIq.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddApiKeyPrefix : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Prefix",
                table: "ApiKeys",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Prefix",
                table: "ApiKeys");
        }
    }
}
