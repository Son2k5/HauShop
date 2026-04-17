using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class updateOrderdto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "createat",
                table: "productvariants",
                newName: "Created");

            migrationBuilder.RenameColumn(
                name: "UpdateAt",
                table: "productvariants",
                newName: "Updated");

            migrationBuilder.AlterColumn<DateTime>(
                name: "Created",
                table: "ShippingDetails",
                type: "datetime",
                nullable: false,
                defaultValueSql: "CURRENT_TIMESTAMP",
                oldClrType: typeof(DateTime),
                oldType: "DATETIME(6)",
                oldDefaultValueSql: "CURRENT_TIMESTAMP(6)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Updated",
                table: "productvariants",
                newName: "UpdateAt");

            migrationBuilder.RenameColumn(
                name: "Created",
                table: "productvariants",
                newName: "createat");

            migrationBuilder.AlterColumn<DateTime>(
                name: "Created",
                table: "ShippingDetails",
                type: "DATETIME(6)",
                nullable: false,
                defaultValueSql: "CURRENT_TIMESTAMP(6)",
                oldClrType: typeof(DateTime),
                oldType: "datetime",
                oldDefaultValueSql: "CURRENT_TIMESTAMP");
        }
    }
}
