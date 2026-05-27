using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class CleanApplicationDbContextIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                SET @fk_exists := (
                    SELECT COUNT(*)
                    FROM information_schema.TABLE_CONSTRAINTS
                    WHERE CONSTRAINT_SCHEMA = DATABASE()
                      AND TABLE_NAME = 'CartItems'
                      AND CONSTRAINT_NAME = 'FK_CartItems_productvariants_ProductVariantId'
                      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
                );
                SET @sql := IF(
                    @fk_exists > 0,
                    'ALTER TABLE `CartItems` DROP FOREIGN KEY `FK_CartItems_productvariants_ProductVariantId`',
                    'SELECT 1'
                );
                PREPARE stmt FROM @sql;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
            ");

            migrationBuilder.Sql(@"
                SET @fk_exists := (
                    SELECT COUNT(*)
                    FROM information_schema.TABLE_CONSTRAINTS
                    WHERE CONSTRAINT_SCHEMA = DATABASE()
                      AND TABLE_NAME = 'SupportTickets'
                      AND CONSTRAINT_NAME = 'FK_SupportTickets_ChatRooms_ChatRoomId1'
                      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
                );
                SET @sql := IF(
                    @fk_exists > 0,
                    'ALTER TABLE `SupportTickets` DROP FOREIGN KEY `FK_SupportTickets_ChatRooms_ChatRoomId1`',
                    'SELECT 1'
                );
                PREPARE stmt FROM @sql;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
            ");

            migrationBuilder.Sql(@"
                SET @idx_exists := (
                    SELECT COUNT(*)
                    FROM information_schema.STATISTICS
                    WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_NAME = 'SupportTickets'
                      AND INDEX_NAME = 'IX_SupportTickets_ChatRoomId1'
                );
                SET @sql := IF(
                    @idx_exists > 0,
                    'ALTER TABLE `SupportTickets` DROP INDEX `IX_SupportTickets_ChatRoomId1`',
                    'SELECT 1'
                );
                PREPARE stmt FROM @sql;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
            ");

            migrationBuilder.DropIndex(
                name: "IX_ProductCategories_ProductId",
                table: "ProductCategories");

            migrationBuilder.DropColumn(
                name: "ChatRoomId1",
                table: "SupportTickets");

            migrationBuilder.AlterColumn<string>(
                name: "AvatarPublicId",
                table: "Users",
                type: "varchar(200)",
                maxLength: 200,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "longtext",
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<int>(
                name: "Priority",
                table: "SupportTickets",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldDefaultValue: 1);

            migrationBuilder.AlterColumn<DateTime>(
                name: "Created",
                table: "RefreshTokens",
                type: "datetime",
                nullable: false,
                defaultValueSql: "CURRENT_TIMESTAMP",
                oldClrType: typeof(DateTime),
                oldType: "datetime");

            migrationBuilder.AlterColumn<string>(
                name: "ResponseCode",
                table: "Payments",
                type: "varchar(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "longtext",
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "ProviderTransactionId",
                table: "Payments",
                type: "varchar(200)",
                maxLength: 200,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "longtext",
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "Provider",
                table: "Payments",
                type: "varchar(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "longtext",
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "OrderInfo",
                table: "Payments",
                type: "varchar(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "longtext",
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "BankCode",
                table: "Payments",
                type: "varchar(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "longtext",
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<decimal>(
                name: "Subtotal",
                table: "Orders",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(65,30)");

            migrationBuilder.AlterColumn<decimal>(
                name: "ShippingFee",
                table: "Orders",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m,
                oldClrType: typeof(decimal),
                oldType: "decimal(65,30)");

            migrationBuilder.AlterColumn<string>(
                name: "ReceiverPhone",
                table: "Orders",
                type: "varchar(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "ReceiverName",
                table: "Orders",
                type: "varchar(200)",
                maxLength: 200,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "AddressLine",
                table: "Orders",
                type: "varchar(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_Users_PhoneNumber",
                table: "Users",
                column: "PhoneNumber");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Role_IsOnline",
                table: "Users",
                columns: new[] { "Role", "IsOnline" });

            migrationBuilder.CreateIndex(
                name: "IX_UserConnections_UserId_LastActivity",
                table: "UserConnections",
                columns: new[] { "UserId", "LastActivity" });

            migrationBuilder.CreateIndex(
                name: "IX_SupportTickets_AssignedToId_Status",
                table: "SupportTickets",
                columns: new[] { "AssignedToId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_SupportTickets_CustomerId_Status",
                table: "SupportTickets",
                columns: new[] { "CustomerId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_ShippingDetails_Carrier_Created",
                table: "ShippingDetails",
                columns: new[] { "Carrier", "Created" });

            migrationBuilder.CreateIndex(
                name: "IX_ShippingDetails_TrackingNumber",
                table: "ShippingDetails",
                column: "TrackingNumber");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_ProductId_Status_Created",
                table: "Reviews",
                columns: new[] { "ProductId", "Status", "Created" });

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_ProductId_Status_Rating",
                table: "Reviews",
                columns: new[] { "ProductId", "Status", "Rating" });

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_Status_Created",
                table: "Reviews",
                columns: new[] { "Status", "Created" });

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_UserId_Created",
                table: "Reviews",
                columns: new[] { "UserId", "Created" });

            migrationBuilder.CreateIndex(
                name: "IX_productvariants_ProductId_Color",
                table: "productvariants",
                columns: new[] { "ProductId", "Color" });

            migrationBuilder.CreateIndex(
                name: "IX_productvariants_ProductId_Size",
                table: "productvariants",
                columns: new[] { "ProductId", "Size" });

            migrationBuilder.CreateIndex(
                name: "IX_productvariants_ProductId_Stock",
                table: "productvariants",
                columns: new[] { "ProductId", "Stock" });

            migrationBuilder.CreateIndex(
                name: "IX_Products_BrandId_IsActive",
                table: "Products",
                columns: new[] { "BrandId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_Products_BrandId_IsActive_Created",
                table: "Products",
                columns: new[] { "BrandId", "IsActive", "Created" });

            migrationBuilder.CreateIndex(
                name: "IX_Products_IsActive_Created",
                table: "Products",
                columns: new[] { "IsActive", "Created" });

            migrationBuilder.CreateIndex(
                name: "IX_Products_IsActive_Name",
                table: "Products",
                columns: new[] { "IsActive", "Name" });

            migrationBuilder.CreateIndex(
                name: "IX_Products_IsActive_Price",
                table: "Products",
                columns: new[] { "IsActive", "Price" });

            migrationBuilder.CreateIndex(
                name: "IX_Products_IsActive_Stock",
                table: "Products",
                columns: new[] { "IsActive", "Stock" });

            migrationBuilder.Sql(
                "CREATE FULLTEXT INDEX `IX_Products_Name_Sku_Description` ON `Products` (`Name`, `Sku`, `Description`);");

            migrationBuilder.CreateIndex(
                name: "IX_ProductCategories_CategoryId_ProductId",
                table: "ProductCategories",
                columns: new[] { "CategoryId", "ProductId" });

            migrationBuilder.CreateIndex(
                name: "IX_Payments_Created",
                table: "Payments",
                column: "Created");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_Method_Status",
                table: "Payments",
                columns: new[] { "Method", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_Payments_OrderId_Status",
                table: "Payments",
                columns: new[] { "OrderId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_Payments_ProviderTransactionId",
                table: "Payments",
                column: "ProviderTransactionId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_Status_Created",
                table: "Payments",
                columns: new[] { "Status", "Created" });

            migrationBuilder.CreateIndex(
                name: "IX_PasswordResetOtps_UserId_Purpose_IsUsed_ExpiredAt",
                table: "PasswordResetOtps",
                columns: new[] { "UserId", "Purpose", "IsUsed", "ExpiredAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Orders_Status_Created",
                table: "Orders",
                columns: new[] { "Status", "Created" });

            migrationBuilder.CreateIndex(
                name: "IX_Orders_UserId_Created",
                table: "Orders",
                columns: new[] { "UserId", "Created" });

            migrationBuilder.CreateIndex(
                name: "IX_Orders_UserId_Status",
                table: "Orders",
                columns: new[] { "UserId", "Status" });

            migrationBuilder.AddCheckConstraint(
                name: "CK_Order_ShippingFee",
                table: "Orders",
                sql: "`ShippingFee` >= 0");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Order_Subtotal",
                table: "Orders",
                sql: "`Subtotal` >= 0");

            migrationBuilder.CreateIndex(
                name: "IX_OrderItems_ProductId_OrderId",
                table: "OrderItems",
                columns: new[] { "ProductId", "OrderId" });

            migrationBuilder.CreateIndex(
                name: "IX_Merchants_BrandName",
                table: "Merchants",
                column: "BrandName");

            migrationBuilder.CreateIndex(
                name: "IX_Merchants_Status_IsActive",
                table: "Merchants",
                columns: new[] { "Status", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_ChatRooms_Type_IsPrivate",
                table: "ChatRooms",
                columns: new[] { "Type", "IsPrivate" });

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_ChatRoomId_Created",
                table: "ChatMessages",
                columns: new[] { "ChatRoomId", "Created" });

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_SenderId_Created",
                table: "ChatMessages",
                columns: new[] { "SenderId", "Created" });

            migrationBuilder.CreateIndex(
                name: "IX_Categories_ParentId_IsActive",
                table: "Categories",
                columns: new[] { "ParentId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_CartItems_CartId_ProductVariantId",
                table: "CartItems",
                columns: new[] { "CartId", "ProductVariantId" });

            migrationBuilder.CreateIndex(
                name: "IX_Brands_MerchantId_IsActive",
                table: "Brands",
                columns: new[] { "MerchantId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_Addresses_City",
                table: "Addresses",
                column: "City");

            migrationBuilder.CreateIndex(
                name: "IX_Addresses_Country",
                table: "Addresses",
                column: "Country");

            migrationBuilder.AddForeignKey(
                name: "FK_CartItems_productvariants_ProductVariantId",
                table: "CartItems",
                column: "ProductVariantId",
                principalTable: "productvariants",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CartItems_productvariants_ProductVariantId",
                table: "CartItems");

            migrationBuilder.DropIndex(
                name: "IX_Users_PhoneNumber",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_Role_IsOnline",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_UserConnections_UserId_LastActivity",
                table: "UserConnections");

            migrationBuilder.DropIndex(
                name: "IX_SupportTickets_AssignedToId_Status",
                table: "SupportTickets");

            migrationBuilder.DropIndex(
                name: "IX_SupportTickets_CustomerId_Status",
                table: "SupportTickets");

            migrationBuilder.DropIndex(
                name: "IX_ShippingDetails_Carrier_Created",
                table: "ShippingDetails");

            migrationBuilder.DropIndex(
                name: "IX_ShippingDetails_TrackingNumber",
                table: "ShippingDetails");

            migrationBuilder.DropIndex(
                name: "IX_Reviews_ProductId_Status_Created",
                table: "Reviews");

            migrationBuilder.DropIndex(
                name: "IX_Reviews_ProductId_Status_Rating",
                table: "Reviews");

            migrationBuilder.DropIndex(
                name: "IX_Reviews_Status_Created",
                table: "Reviews");

            migrationBuilder.DropIndex(
                name: "IX_Reviews_UserId_Created",
                table: "Reviews");

            migrationBuilder.DropIndex(
                name: "IX_productvariants_ProductId_Color",
                table: "productvariants");

            migrationBuilder.DropIndex(
                name: "IX_productvariants_ProductId_Size",
                table: "productvariants");

            migrationBuilder.DropIndex(
                name: "IX_productvariants_ProductId_Stock",
                table: "productvariants");

            migrationBuilder.DropIndex(
                name: "IX_Products_BrandId_IsActive",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Products_BrandId_IsActive_Created",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Products_IsActive_Created",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Products_IsActive_Name",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Products_IsActive_Price",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Products_IsActive_Stock",
                table: "Products");

            migrationBuilder.Sql(
                "ALTER TABLE `Products` DROP INDEX `IX_Products_Name_Sku_Description`;");

            migrationBuilder.DropIndex(
                name: "IX_ProductCategories_CategoryId_ProductId",
                table: "ProductCategories");

            migrationBuilder.DropIndex(
                name: "IX_Payments_Created",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Payments_Method_Status",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Payments_OrderId_Status",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Payments_ProviderTransactionId",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Payments_Status_Created",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_PasswordResetOtps_UserId_Purpose_IsUsed_ExpiredAt",
                table: "PasswordResetOtps");

            migrationBuilder.DropIndex(
                name: "IX_Orders_Status_Created",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_UserId_Created",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_UserId_Status",
                table: "Orders");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Order_ShippingFee",
                table: "Orders");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Order_Subtotal",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_OrderItems_ProductId_OrderId",
                table: "OrderItems");

            migrationBuilder.DropIndex(
                name: "IX_Merchants_BrandName",
                table: "Merchants");

            migrationBuilder.DropIndex(
                name: "IX_Merchants_Status_IsActive",
                table: "Merchants");

            migrationBuilder.DropIndex(
                name: "IX_ChatRooms_Type_IsPrivate",
                table: "ChatRooms");

            migrationBuilder.DropIndex(
                name: "IX_ChatMessages_ChatRoomId_Created",
                table: "ChatMessages");

            migrationBuilder.DropIndex(
                name: "IX_ChatMessages_SenderId_Created",
                table: "ChatMessages");

            migrationBuilder.DropIndex(
                name: "IX_Categories_ParentId_IsActive",
                table: "Categories");

            migrationBuilder.DropIndex(
                name: "IX_CartItems_CartId_ProductVariantId",
                table: "CartItems");

            migrationBuilder.DropIndex(
                name: "IX_Brands_MerchantId_IsActive",
                table: "Brands");

            migrationBuilder.DropIndex(
                name: "IX_Addresses_City",
                table: "Addresses");

            migrationBuilder.DropIndex(
                name: "IX_Addresses_Country",
                table: "Addresses");

            migrationBuilder.AlterColumn<string>(
                name: "AvatarPublicId",
                table: "Users",
                type: "longtext",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(200)",
                oldMaxLength: 200,
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<int>(
                name: "Priority",
                table: "SupportTickets",
                type: "int",
                nullable: false,
                defaultValue: 1,
                oldClrType: typeof(int),
                oldType: "int",
                oldDefaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "ChatRoomId1",
                table: "SupportTickets",
                type: "varchar(50)",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<DateTime>(
                name: "Created",
                table: "RefreshTokens",
                type: "datetime",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "datetime",
                oldDefaultValueSql: "CURRENT_TIMESTAMP");

            migrationBuilder.AlterColumn<string>(
                name: "ResponseCode",
                table: "Payments",
                type: "longtext",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(50)",
                oldMaxLength: 50,
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "ProviderTransactionId",
                table: "Payments",
                type: "longtext",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(200)",
                oldMaxLength: 200,
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "Provider",
                table: "Payments",
                type: "longtext",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(50)",
                oldMaxLength: 50,
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "OrderInfo",
                table: "Payments",
                type: "longtext",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(500)",
                oldMaxLength: 500,
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "BankCode",
                table: "Payments",
                type: "longtext",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(50)",
                oldMaxLength: 50,
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<decimal>(
                name: "Subtotal",
                table: "Orders",
                type: "decimal(65,30)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldPrecision: 18,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "ShippingFee",
                table: "Orders",
                type: "decimal(65,30)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldPrecision: 18,
                oldScale: 2,
                oldDefaultValue: 0m);

            migrationBuilder.AlterColumn<string>(
                name: "ReceiverPhone",
                table: "Orders",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(20)",
                oldMaxLength: 20)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "ReceiverName",
                table: "Orders",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(200)",
                oldMaxLength: 200)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "AddressLine",
                table: "Orders",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(500)",
                oldMaxLength: 500)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_SupportTickets_ChatRoomId1",
                table: "SupportTickets",
                column: "ChatRoomId1",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductCategories_ProductId",
                table: "ProductCategories",
                column: "ProductId");

            migrationBuilder.AddForeignKey(
                name: "FK_CartItems_productvariants_ProductVariantId",
                table: "CartItems",
                column: "ProductVariantId",
                principalTable: "productvariants",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_SupportTickets_ChatRooms_ChatRoomId1",
                table: "SupportTickets",
                column: "ChatRoomId1",
                principalTable: "ChatRooms",
                principalColumn: "Id");
        }
    }
}
