using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class UpdateRatingAndStock : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "AverageRating",
                table: "Products",
                type: "decimal(3,2)",
                precision: 3,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "ReviewCount",
                table: "Products",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Stock",
                table: "Products",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Products_AverageRating",
                table: "Products",
                column: "AverageRating");

            migrationBuilder.CreateIndex(
                name: "IX_Products_Stock",
                table: "Products",
                column: "Stock");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Product_AverageRating",
                table: "Products",
                sql: "`AverageRating` >= 0 AND `AverageRating` <= 5");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Product_Stock",
                table: "Products",
                sql: "`Stock` >= 0");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Products_AverageRating",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Products_Stock",
                table: "Products");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Product_AverageRating",
                table: "Products");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Product_Stock",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "AverageRating",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ReviewCount",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "Stock",
                table: "Products");
        }
    }
}
