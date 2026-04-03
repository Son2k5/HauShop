using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class RenameProductVariantTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_productvariants_Products_ProductId",
                table: "productvariants");

            migrationBuilder.DropPrimaryKey(
                name: "PK_productvariants",
                table: "productvariants");

            migrationBuilder.RenameTable(
                name: "productvariants",
                newName: "productvariant");

            migrationBuilder.RenameIndex(
                name: "IX_productvariants_Sku",
                table: "productvariant",
                newName: "IX_productvariant_Sku");

            migrationBuilder.RenameIndex(
                name: "IX_productvariants_ProductId",
                table: "productvariant",
                newName: "IX_productvariant_ProductId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_productvariant",
                table: "productvariant",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_productvariant_Products_ProductId",
                table: "productvariant",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_productvariant_Products_ProductId",
                table: "productvariant");

            migrationBuilder.DropPrimaryKey(
                name: "PK_productvariant",
                table: "productvariant");

            migrationBuilder.RenameTable(
                name: "productvariant",
                newName: "productvariants");

            migrationBuilder.RenameIndex(
                name: "IX_productvariant_Sku",
                table: "productvariants",
                newName: "IX_productvariants_Sku");

            migrationBuilder.RenameIndex(
                name: "IX_productvariant_ProductId",
                table: "productvariants",
                newName: "IX_productvariants_ProductId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_productvariants",
                table: "productvariants",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_productvariants_Products_ProductId",
                table: "productvariants",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
