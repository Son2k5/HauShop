using Microsoft.EntityFrameworkCore;
using api.Models.Entities;
using api.Models.Enum;

namespace api.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<Address> Addresses { get; set; }
        public DbSet<Brand> Brands { get; set; }
        public DbSet<Cart> Carts { get; set; }
        public DbSet<CartItem> CartItems { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<ChatMessage> ChatMessages { get; set; }
        public DbSet<ChatRoom> ChatRooms { get; set; }
        public DbSet<Merchant> Merchants { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<ProductCategory> ProductCategories { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<SupportTicket> SupportTickets { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<UserConnection> UserConnections { get; set; }
        public DbSet<Wishlist> Wishlists { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; } = null!;
        public DbSet<ShippingDetail> ShippingDetails { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                foreach (var property in entityType.GetProperties())
                {
                    if (property.ClrType == typeof(DateTime) || property.ClrType == typeof(DateTime?))
                    {
                        property.SetColumnType("datetime");
                    }
                }
            }

            // ============ ADDRESS ============
            modelBuilder.Entity<Address>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasMaxLength(50);
                entity.Property(e => e.UserId).IsRequired().HasMaxLength(50);
                entity.Property(e => e.AddressLine).IsRequired().HasMaxLength(500);
                entity.Property(e => e.City).IsRequired().HasMaxLength(100);
                entity.Property(e => e.State).HasMaxLength(100);
                entity.Property(e => e.Country).IsRequired().HasMaxLength(100);
                entity.Property(e => e.ZipCode).IsRequired().HasMaxLength(20);
                entity.Property(e => e.IsDefault).HasDefaultValue(false);
                entity.Property(e => e.Created).HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(e => e.User)
                    .WithMany(u => u.Addresses)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => new { e.UserId, e.IsDefault });
            });

            // ============ BRAND ============
            modelBuilder.Entity<Brand>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasMaxLength(50);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Slug).IsRequired().HasMaxLength(200);
                entity.Property(e => e.ImageContentType).HasMaxLength(100);
                entity.Property(e => e.Description).HasMaxLength(2000);
                entity.Property(e => e.IsActive).HasDefaultValue(true);
                entity.Property(e => e.MerchantId).HasMaxLength(50);
                entity.Property(e => e.Created).HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(e => e.Merchant)
                    .WithOne(m => m.Brand)
                    .HasForeignKey<Brand>(e => e.MerchantId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasIndex(e => e.Slug).IsUnique();
                entity.HasIndex(e => e.Name);
                entity.HasIndex(e => e.IsActive);
            });

            // ============ CART ============
            modelBuilder.Entity<Cart>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasMaxLength(50);
                entity.Property(e => e.UserId).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Created).HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(e => e.User)
                    .WithOne(u => u.Cart)
                    .HasForeignKey<Cart>(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => e.UserId).IsUnique();
            });

            // ============ CART ITEM ============
            modelBuilder.Entity<CartItem>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasMaxLength(50);
                entity.Property(e => e.CartId).IsRequired().HasMaxLength(50);
                entity.Property(e => e.ProductId).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Quantity).IsRequired();
                entity.Property(e => e.Price).HasPrecision(18, 2).IsRequired();
                entity.Property(e => e.Created).HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(e => e.Cart)
                    .WithMany(c => c.Items)
                    .HasForeignKey(e => e.CartId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Product)
                    .WithMany(p => p.CartItems)
                    .HasForeignKey(e => e.ProductId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => new { e.CartId, e.ProductId });

                // MySQL constraint syntax
                entity.ToTable(t => t.HasCheckConstraint("CK_CartItem_Quantity", "`Quantity` > 0"));
            });

            // ============ CATEGORY ============
            modelBuilder.Entity<Category>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasMaxLength(50);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Slug).IsRequired().HasMaxLength(200);
                entity.Property(e => e.ParentId).HasMaxLength(50);
                entity.Property(e => e.IsActive).HasDefaultValue(true);

                entity.HasOne(e => e.Parent)
                    .WithMany(c => c.Children)
                    .HasForeignKey(e => e.ParentId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => e.Slug).IsUnique();
                entity.HasIndex(e => e.ParentId);
                entity.HasIndex(e => e.IsActive);
            });

            // ============ CHAT MESSAGE ============
            modelBuilder.Entity<ChatMessage>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasMaxLength(50);
                entity.Property(e => e.ChatRoomId).IsRequired().HasMaxLength(50);
                entity.Property(e => e.SenderId).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Message).IsRequired().HasMaxLength(5000);
                entity.Property(e => e.MessageType).IsRequired().HasDefaultValue(ChatMessageType.Text);
                entity.Property(e => e.IsRead).HasDefaultValue(false);
                entity.Property(e => e.Created).HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(e => e.ChatRoom)
                    .WithMany(cr => cr.Messages)
                    .HasForeignKey(e => e.ChatRoomId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Sender)
                    .WithMany()
                    .HasForeignKey(e => e.SenderId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => e.ChatRoomId);
                entity.HasIndex(e => e.SenderId);
                entity.HasIndex(e => e.Created);
                entity.HasIndex(e => new { e.ChatRoomId, e.IsRead });
            });

            // ============ CHAT ROOM ============
            modelBuilder.Entity<ChatRoom>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasMaxLength(50);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.IsPrivate).HasDefaultValue(true);
                entity.Property(e => e.Type).IsRequired().HasDefaultValue(ChatRoomType.Support);
                entity.Property(e => e.Created).HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasIndex(e => e.Type);
                entity.HasIndex(e => e.Created);
            });

            // ============ MERCHANT ============
            modelBuilder.Entity<Merchant>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasMaxLength(50);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.PhoneNumber).HasMaxLength(20);
                entity.Property(e => e.BrandName).HasMaxLength(200);
                entity.Property(e => e.Business).HasMaxLength(200);
                entity.Property(e => e.IsActive).HasDefaultValue(true);
                entity.Property(e => e.Status).IsRequired().HasDefaultValue(MerchantStatus.WaitingApproval);
                entity.Property(e => e.Created).HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasIndex(e => e.Name);
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => e.IsActive);
            });

            // ============ ORDER ============
            modelBuilder.Entity<Order>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasMaxLength(50);
                entity.Property(e => e.UserId).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Total).HasPrecision(18, 2).IsRequired();
                entity.Property(e => e.Status).IsRequired().HasDefaultValue(OrderStatus.Pending);
                entity.Property(e => e.ShippingAddressId).HasMaxLength(50);
                entity.Property(e => e.Created).HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(e => e.User)
                    .WithMany(u => u.Orders)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.ShippingAddress)
                    .WithMany()
                    .HasForeignKey(e => e.ShippingAddressId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => e.Created);

                entity.ToTable(t => t.HasCheckConstraint("CK_Order_Total", "`Total` >= 0"));
            });

            // ============ ORDER ITEM ============
            modelBuilder.Entity<OrderItem>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasMaxLength(50);
                entity.Property(e => e.OrderId).IsRequired().HasMaxLength(50);
                entity.Property(e => e.ProductId).IsRequired().HasMaxLength(50);
                entity.Property(e => e.ProductName).IsRequired().HasMaxLength(300);
                entity.Property(e => e.Quantity).IsRequired();
                entity.Property(e => e.Price).HasPrecision(18, 2).IsRequired();
                entity.Property(e => e.Total).HasPrecision(18, 2).IsRequired();
                entity.Property(e => e.Created).HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(e => e.Order)
                    .WithMany(o => o.OrderItems)
                    .HasForeignKey(e => e.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Product)
                    .WithMany(p => p.OrderItems)
                    .HasForeignKey(e => e.ProductId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => e.OrderId);
                entity.HasIndex(e => e.ProductId);

                entity.ToTable(t =>
                {
                    t.HasCheckConstraint("CK_OrderItem_Quantity", "`Quantity` > 0");
                    t.HasCheckConstraint("CK_OrderItem_Price", "`Price` >= 0");
                    t.HasCheckConstraint("CK_OrderItem_Total", "`Total` >= 0");
                });
            });

            // ============ PAYMENT ============
            modelBuilder.Entity<Payment>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasMaxLength(50);
                entity.Property(e => e.OrderId).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Method).IsRequired().HasDefaultValue(PaymentMethod.COD);
                entity.Property(e => e.TransactionNo).HasMaxLength(200);
                entity.Property(e => e.VnpTransactionId).HasMaxLength(200);
                entity.Property(e => e.VnpResponseCode).HasMaxLength(50);
                entity.Property(e => e.VnpBankCode).HasMaxLength(50);
                entity.Property(e => e.VnpOrderInfo).HasMaxLength(500);
                entity.Property(e => e.Amount).HasPrecision(18, 2).IsRequired();
                entity.Property(e => e.Status).IsRequired().HasDefaultValue(PaymentStatus.Pending);
                entity.Property(e => e.Created).HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(e => e.Order)
                    .WithMany(o => o.Payments)
                    .HasForeignKey(e => e.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => e.OrderId);
                entity.HasIndex(e => e.TransactionNo);
                entity.HasIndex(e => e.VnpTransactionId);
                entity.HasIndex(e => e.Status);

                entity.ToTable(t => t.HasCheckConstraint("CK_Payment_Amount", "`Amount` > 0"));
            });

            // ============ PRODUCT ============
            modelBuilder.Entity<Product>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasMaxLength(50);
                entity.Property(e => e.Sku).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(300);
                entity.Property(e => e.Slug).IsRequired().HasMaxLength(300);
                entity.Property(e => e.ImageUrl).HasMaxLength(500);
                entity.Property(e => e.ImageKey).HasMaxLength(200);
                entity.Property(e => e.Description).HasMaxLength(5000);
                entity.Property(e => e.Price).HasPrecision(18, 2).IsRequired();
                entity.Property(e => e.Taxable).HasDefaultValue(true);
                entity.Property(e => e.IsActive).HasDefaultValue(true);
                entity.Property(e => e.BrandId).HasMaxLength(50);
                entity.Property(e => e.Created).HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(e => e.Brand)
                    .WithMany(b => b.Products)
                    .HasForeignKey(e => e.BrandId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasIndex(e => e.Sku).IsUnique();
                entity.HasIndex(e => e.Slug).IsUnique();
                entity.HasIndex(e => e.Name);
                entity.HasIndex(e => e.BrandId);
                entity.HasIndex(e => e.IsActive);

                entity.ToTable(t => t.HasCheckConstraint("CK_Product_Price", "`Price` >= 0"));
            });

            // ============ PRODUCT CATEGORY ============
            modelBuilder.Entity<ProductCategory>(entity =>
            {
                entity.HasKey(e => new { e.ProductId, e.CategoryId });
                entity.Property(e => e.ProductId).HasMaxLength(50);
                entity.Property(e => e.CategoryId).HasMaxLength(50);

                entity.HasOne(e => e.Product)
                    .WithMany(p => p.ProductCategories)
                    .HasForeignKey(e => e.ProductId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Category)
                    .WithMany(c => c.ProductCategories)
                    .HasForeignKey(e => e.CategoryId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ============ REVIEW ============
            modelBuilder.Entity<Review>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasMaxLength(50);
                entity.Property(e => e.ProductId).IsRequired().HasMaxLength(50);
                entity.Property(e => e.UserId).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Rating).IsRequired();
                entity.Property(e => e.Content).HasMaxLength(2000);
                entity.Property(e => e.Status).IsRequired().HasDefaultValue(ReviewStatus.WaitingApproval);
                entity.Property(e => e.Created).HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(e => e.Product)
                    .WithMany(p => p.Reviews)
                    .HasForeignKey(e => e.ProductId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.User)
                    .WithMany(u => u.Reviews)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => e.ProductId);
                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => new { e.ProductId, e.UserId });

                entity.ToTable(t => t.HasCheckConstraint("CK_Review_Rating", "`Rating` >= 1 AND `Rating` <= 5"));
            });

            // ============ SUPPORT TICKET ============
            modelBuilder.Entity<SupportTicket>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasMaxLength(50);
                entity.Property(e => e.CustomerId).IsRequired().HasMaxLength(50);
                entity.Property(e => e.AssignedToId).HasMaxLength(50);
                entity.Property(e => e.ChatRoomId).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Subject).IsRequired().HasMaxLength(500);
                entity.Property(e => e.Status).IsRequired().HasDefaultValue(SupportTicketStatus.Open);
                entity.Property(e => e.Priority).IsRequired().HasDefaultValue(SupportTicketPriority.Medium);
                entity.Property(e => e.Created).HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(st => st.Customer)
                    .WithMany(u => u.SupportTicketsAsCustomer)
                    .HasForeignKey(st => st.CustomerId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(st => st.AssignedTo)
                    .WithMany(u => u.SupportTicketsAssigned)
                    .HasForeignKey(st => st.AssignedToId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(st => st.ChatRoom)
                    .WithOne()
                    .HasForeignKey<SupportTicket>(st => st.ChatRoomId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => e.CustomerId);
                entity.HasIndex(e => e.AssignedToId);
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => e.Priority);
                entity.HasIndex(e => e.Created);
                entity.HasIndex(e => new { e.Status, e.Priority });
            });

            // ============ USER ============
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasMaxLength(50);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(200);
                entity.Property(e => e.PhoneNumber).HasMaxLength(20);
                entity.Property(e => e.FirstName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.LastName).HasMaxLength(100);
                entity.Property(e => e.PasswordHash).HasMaxLength(500);
                entity.Property(e => e.MerchantId).HasMaxLength(50);
                entity.Property(e => e.Provider).IsRequired().HasDefaultValue(Provider.Local);
                entity.Property(e => e.GoogleId).HasMaxLength(100);
                entity.Property(e => e.FacebookId).HasMaxLength(100);
                entity.Property(e => e.Avatar).HasMaxLength(500);
                entity.Property(e => e.Role).IsRequired().HasDefaultValue(Role.Member).HasConversion<int>();
                entity.Property(e => e.ResetPasswordToken).HasMaxLength(500);
                entity.Property(e => e.IsOnline).HasDefaultValue(false);
                entity.Property(e => e.Created).HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(e => e.Merchant)
                    .WithMany()
                    .HasForeignKey(e => e.MerchantId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasMany(e => e.RefreshTokens)
                    .WithOne(rt => rt.User)
                    .HasForeignKey(rt => rt.UserId)
                    .OnDelete(DeleteBehavior.Cascade) // Xóa user → xóa hết refresh token
                    .IsRequired();

                entity.HasIndex(e => e.Email).IsUnique();
                entity.HasIndex(e => e.GoogleId).IsUnique();
                entity.HasIndex(e => e.FacebookId).IsUnique();
                entity.HasIndex(e => e.Role);
                entity.HasIndex(e => e.IsOnline);
            });

            // ============ USER CONNECTION ============
            modelBuilder.Entity<UserConnection>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasMaxLength(50);
                entity.Property(e => e.UserId).IsRequired().HasMaxLength(50);
                entity.Property(e => e.ConnectionId).IsRequired().HasMaxLength(200);
                entity.Property(e => e.ConnectedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(e => e.User)
                    .WithMany(u => u.Connections)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.ConnectionId).IsUnique();
                entity.HasIndex(e => e.LastActivity);
            });

            // ============ WISHLIST ============
            modelBuilder.Entity<Wishlist>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasMaxLength(50);
                entity.Property(e => e.UserId).IsRequired().HasMaxLength(50);
                entity.Property(e => e.ProductId).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Created).HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(e => e.User)
                    .WithMany(u => u.Wishlists)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Product)
                    .WithMany(p => p.Wishlists)
                    .HasForeignKey(e => e.ProductId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => new { e.UserId, e.ProductId }).IsUnique();
            });
            modelBuilder.Entity<RefreshToken>(entity =>
            {
                entity.HasKey(rt => rt.Id);

                entity.Property(rt => rt.Id)
                    .HasMaxLength(50)
                    .ValueGeneratedNever();

                entity.Property(rt => rt.Token)
                    .IsRequired()
                    .HasMaxLength(450);

                entity.Property(rt => rt.UserId)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(rt => rt.Expires)
                    .IsRequired();

                entity.HasIndex(rt => rt.Token)
                    .IsUnique();

                entity.HasIndex(rt => rt.Expires);

                entity.HasIndex(rt => new { rt.UserId, rt.IsRevoked, rt.Expires });
            });
            modelBuilder.Entity<ShippingDetail>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasMaxLength(50);
                entity.Property(e => e.OrderId).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Fee).HasPrecision(18, 2);
                entity.Property(e => e.TrackingNumber).HasMaxLength(100);
                entity.Property(e => e.Carrier).HasMaxLength(100);
                entity.Property(e => e.Created).HasColumnType("DATETIME(6)").HasDefaultValueSql("CURRENT_TIMESTAMP(6)").ValueGeneratedOnAdd();

                entity.HasOne(e => e.Order)
                    .WithOne(o => o.ShippingDetail) // Thêm navigation ngược trong Order
                    .HasForeignKey<ShippingDetail>(e => e.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => e.OrderId).IsUnique();
            });

        }
    }
}