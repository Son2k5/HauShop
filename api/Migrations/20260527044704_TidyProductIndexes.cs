using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class TidyProductIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Products_AverageRating",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Products_BrandId",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Products_BrandId_IsActive",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Products_IsActive_Name",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Products_IsActive_Stock",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Products_Name",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Products_Stock",
                table: "Products");

            migrationBuilder.RenameIndex(
                name: "IX_Products_BrandId_IsActive_Created",
                table: "Products",
                newName: "IX_Products_Brand_Active_Created");

            migrationBuilder.RenameIndex(
                name: "IX_Products_IsActive_Created",
                table: "Products",
                newName: "IX_Products_Active_Created");

            migrationBuilder.RenameIndex(
                name: "IX_Products_IsActive_Price",
                table: "Products",
                newName: "IX_Products_Active_Price");

            migrationBuilder.RenameIndex(
                name: "IX_Products_Name_Sku_Description",
                table: "Products",
                newName: "FT_Products_Name_Sku_Description");

            migrationBuilder.RenameIndex(
                name: "IX_Products_Sku",
                table: "Products",
                newName: "UX_Products_Sku");

            migrationBuilder.RenameIndex(
                name: "IX_Products_Slug",
                table: "Products",
                newName: "UX_Products_Slug");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameIndex(
                name: "FT_Products_Name_Sku_Description",
                table: "Products",
                newName: "IX_Products_Name_Sku_Description");

            migrationBuilder.RenameIndex(
                name: "IX_Products_Active_Created",
                table: "Products",
                newName: "IX_Products_IsActive_Created");

            migrationBuilder.RenameIndex(
                name: "IX_Products_Active_Price",
                table: "Products",
                newName: "IX_Products_IsActive_Price");

            migrationBuilder.RenameIndex(
                name: "IX_Products_Brand_Active_Created",
                table: "Products",
                newName: "IX_Products_BrandId_IsActive_Created");

            migrationBuilder.RenameIndex(
                name: "UX_Products_Sku",
                table: "Products",
                newName: "IX_Products_Sku");

            migrationBuilder.RenameIndex(
                name: "UX_Products_Slug",
                table: "Products",
                newName: "IX_Products_Slug");

            migrationBuilder.CreateIndex(
                name: "IX_Products_AverageRating",
                table: "Products",
                column: "AverageRating");

            migrationBuilder.CreateIndex(
                name: "IX_Products_BrandId",
                table: "Products",
                column: "BrandId");

            migrationBuilder.CreateIndex(
                name: "IX_Products_BrandId_IsActive",
                table: "Products",
                columns: new[] { "BrandId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_Products_IsActive_Name",
                table: "Products",
                columns: new[] { "IsActive", "Name" });

            migrationBuilder.CreateIndex(
                name: "IX_Products_IsActive_Stock",
                table: "Products",
                columns: new[] { "IsActive", "Stock" });

            migrationBuilder.CreateIndex(
                name: "IX_Products_Name",
                table: "Products",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_Products_Stock",
                table: "Products",
                column: "Stock");
        }
    }
}
