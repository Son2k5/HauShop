namespace api.models.entities
{
    public class AdminSetting
    {
        public string Id { get; set; } = "default";
        public string StoreName { get; set; } = "HauShop";
        public string SupportEmail { get; set; } = "admin@haushop.vn";
        public string SupportPhone { get; set; } = "1900 1234";
        public int LowStockThreshold { get; set; } = 5;
        public int RecentOrdersLimit { get; set; } = 6;
        public bool EnableOrderNotifications { get; set; } = true;
        public bool EnableInventoryAlerts { get; set; } = true;
        public bool EnableWeeklySummary { get; set; } = false;
        public DateTime Created { get; set; } = DateTime.UtcNow;
        public DateTime? Updated { get; set; }
    }
}
