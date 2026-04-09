using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class AddProductIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_productvariants_IsActive",
                table: "productvariants",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_productvariants_ProductId_IsActive",
                table: "productvariants",
                columns: new[] { "ProductId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_ProductCategories_ProductId",
                table: "ProductCategories",
                column: "ProductId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_productvariants_IsActive",
                table: "productvariants");

            migrationBuilder.DropIndex(
                name: "IX_productvariants_ProductId_IsActive",
                table: "productvariants");

            migrationBuilder.DropIndex(
                name: "IX_ProductCategories_ProductId",
                table: "ProductCategories");
        }
    }
}
