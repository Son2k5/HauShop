using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class CleanSchemaUpdate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProductVariant_Products_ProductId",
                table: "ProductVariant");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ProductVariant",
                table: "ProductVariant");

            migrationBuilder.RenameTable(
                name: "ProductVariant",
                newName: "productvariants");

            migrationBuilder.RenameColumn(
                name: "CreateAt",
                table: "productvariants",
                newName: "createat");

            migrationBuilder.RenameIndex(
                name: "IX_ProductVariant_ProductId",
                table: "productvariants",
                newName: "IX_productvariants_ProductId");

            migrationBuilder.AlterColumn<int>(
                name: "Stock",
                table: "productvariants",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<string>(
                name: "Sku",
                table: "productvariants",
                type: "varchar(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "Size",
                table: "productvariants",
                type: "varchar(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<decimal>(
                name: "Price",
                table: "productvariants",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(65,30)");

            migrationBuilder.AlterColumn<bool>(
                name: "IsActive",
                table: "productvariants",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: true,
                oldClrType: typeof(bool),
                oldType: "tinyint(1)");

            migrationBuilder.AlterColumn<DateTime>(
                name: "createat",
                table: "productvariants",
                type: "datetime",
                nullable: true,
                defaultValueSql: "CURRENT_TIMESTAMP",
                oldClrType: typeof(DateTime),
                oldType: "datetime",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Color",
                table: "productvariants",
                type: "varchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "Id",
                table: "productvariants",
                type: "varchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(255)")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddPrimaryKey(
                name: "PK_productvariants",
                table: "productvariants",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_productvariants_Sku",
                table: "productvariants",
                column: "Sku",
                unique: true);

            migrationBuilder.AddCheckConstraint(
                name: "CK_Variant_Price",
                table: "productvariants",
                sql: "`Price` >= 0");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Variant_Stock",
                table: "productvariants",
                sql: "`Stock` >= 0");

            migrationBuilder.AddForeignKey(
                name: "FK_productvariants_Products_ProductId",
                table: "productvariants",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_productvariants_Products_ProductId",
                table: "productvariants");

            migrationBuilder.DropPrimaryKey(
                name: "PK_productvariants",
                table: "productvariants");

            migrationBuilder.DropIndex(
                name: "IX_productvariants_Sku",
                table: "productvariants");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Variant_Price",
                table: "productvariants");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Variant_Stock",
                table: "productvariants");

            migrationBuilder.RenameTable(
                name: "productvariants",
                newName: "ProductVariant");

            migrationBuilder.RenameColumn(
                name: "createat",
                table: "ProductVariant",
                newName: "CreateAt");

            migrationBuilder.RenameIndex(
                name: "IX_productvariants_ProductId",
                table: "ProductVariant",
                newName: "IX_ProductVariant_ProductId");

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreateAt",
                table: "ProductVariant",
                type: "datetime",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime",
                oldNullable: true,
                oldDefaultValueSql: "CURRENT_TIMESTAMP");

            migrationBuilder.AlterColumn<int>(
                name: "Stock",
                table: "ProductVariant",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldDefaultValue: 0);

            migrationBuilder.AlterColumn<string>(
                name: "Sku",
                table: "ProductVariant",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(100)",
                oldMaxLength: 100)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "Size",
                table: "ProductVariant",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(20)",
                oldMaxLength: 20)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<decimal>(
                name: "Price",
                table: "ProductVariant",
                type: "decimal(65,30)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldPrecision: 18,
                oldScale: 2);

            migrationBuilder.AlterColumn<bool>(
                name: "IsActive",
                table: "ProductVariant",
                type: "tinyint(1)",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "tinyint(1)",
                oldDefaultValue: true);

            migrationBuilder.AlterColumn<string>(
                name: "Color",
                table: "ProductVariant",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(50)",
                oldMaxLength: 50)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "Id",
                table: "ProductVariant",
                type: "varchar(255)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(50)",
                oldMaxLength: 50)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ProductVariant",
                table: "ProductVariant",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ProductVariant_Products_ProductId",
                table: "ProductVariant",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
