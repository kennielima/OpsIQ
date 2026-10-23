using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpsIq.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPubliKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "RevokedAt",
                table: "ApiKeys",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Type",
                table: "ApiKeys",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RevokedAt",
                table: "ApiKeys");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "ApiKeys");
        }
    }
}
