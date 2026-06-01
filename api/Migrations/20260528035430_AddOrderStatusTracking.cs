using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderStatusTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CarrierCode",
                table: "ShippingDetails",
                type: "varchar(50)",
                maxLength: 50,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "CurrentLocation",
                table: "ShippingDetails",
                type: "varchar(300)",
                maxLength: 300,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "DeliveredAt",
                table: "ShippingDetails",
                type: "datetime",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TrackingUrl",
                table: "ShippingDetails",
                type: "varchar(500)",
                maxLength: 500,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "OrderStatusHistories",
                columns: table => new
                {
                    Id = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    OrderId = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Location = table.Column<string>(type: "varchar(300)", maxLength: 300, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Note = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ActorUserId = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ActorRole = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Created = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderStatusHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrderStatusHistories_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "ShippingTrackingEvents",
                columns: table => new
                {
                    Id = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ShippingDetailId = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    OrderId = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Location = table.Column<string>(type: "varchar(300)", maxLength: 300, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TrackingNumber = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CarrierName = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    OccurredAt = table.Column<DateTime>(type: "datetime", nullable: false),
                    Created = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShippingTrackingEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ShippingTrackingEvents_ShippingDetails_ShippingDetailId",
                        column: x => x.ShippingDetailId,
                        principalTable: "ShippingDetails",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_OrderStatusHistories_Order_Created",
                table: "OrderStatusHistories",
                columns: new[] { "OrderId", "Created" });

            migrationBuilder.CreateIndex(
                name: "IX_OrderStatusHistories_Order_Status",
                table: "OrderStatusHistories",
                columns: new[] { "OrderId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_ShippingTrackingEvents_Detail_OccurredAt",
                table: "ShippingTrackingEvents",
                columns: new[] { "ShippingDetailId", "OccurredAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ShippingTrackingEvents_Order_OccurredAt",
                table: "ShippingTrackingEvents",
                columns: new[] { "OrderId", "OccurredAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ShippingTrackingEvents_Tracking_OccurredAt",
                table: "ShippingTrackingEvents",
                columns: new[] { "TrackingNumber", "OccurredAt" });

            migrationBuilder.Sql("""
                INSERT INTO `OrderStatusHistories`
                    (`Id`, `OrderId`, `Status`, `Title`, `Description`, `Location`, `Note`, `ActorUserId`, `ActorRole`, `Created`)
                SELECT
                    UUID(),
                    `Id`,
                    `Status`,
                    CASE `Status`
                        WHEN 0 THEN 'Cho thanh toan'
                        WHEN 1 THEN 'Dang xu ly'
                        WHEN 2 THEN 'Dang giao'
                        WHEN 3 THEN 'Hoan tat'
                        WHEN 4 THEN 'Da huy don'
                        WHEN 5 THEN 'Yeu cau hoan tra'
                        WHEN 6 THEN 'Da duyet hoan tra'
                        WHEN 7 THEN 'Da nhan hang hoan tra'
                        WHEN 8 THEN 'Da hoan tien'
                        ELSE 'Cap nhat don hang'
                    END,
                    'Lich su trang thai duoc khoi tao tu du lieu don hang hien co.',
                    NULL,
                    NULL,
                    NULL,
                    'System',
                    COALESCE(`Updated`, `Created`, UTC_TIMESTAMP())
                FROM `Orders`;
            """);

            migrationBuilder.Sql("""
                INSERT INTO `ShippingTrackingEvents`
                    (`Id`, `ShippingDetailId`, `OrderId`, `Status`, `Title`, `Description`, `Location`, `TrackingNumber`, `CarrierName`, `OccurredAt`, `Created`)
                SELECT
                    UUID(),
                    sd.`Id`,
                    sd.`OrderId`,
                    o.`Status`,
                    'Thong tin van chuyen hien co',
                    'Du lieu van chuyen duoc khoi tao tu ShippingDetail hien co.',
                    NULL,
                    sd.`TrackingNumber`,
                    sd.`Carrier`,
                    COALESCE(sd.`Updated`, sd.`Created`, UTC_TIMESTAMP()),
                    COALESCE(sd.`Updated`, sd.`Created`, UTC_TIMESTAMP())
                FROM `ShippingDetails` sd
                INNER JOIN `Orders` o ON o.`Id` = sd.`OrderId`
                WHERE sd.`TrackingNumber` IS NOT NULL OR sd.`Carrier` IS NOT NULL;
            """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OrderStatusHistories");

            migrationBuilder.DropTable(
                name: "ShippingTrackingEvents");

            migrationBuilder.DropColumn(
                name: "CarrierCode",
                table: "ShippingDetails");

            migrationBuilder.DropColumn(
                name: "CurrentLocation",
                table: "ShippingDetails");

            migrationBuilder.DropColumn(
                name: "DeliveredAt",
                table: "ShippingDetails");

            migrationBuilder.DropColumn(
                name: "TrackingUrl",
                table: "ShippingDetails");
        }
    }
}
