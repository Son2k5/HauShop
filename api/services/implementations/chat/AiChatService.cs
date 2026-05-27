using System.Globalization;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using api.data;
using api.DTOs.chat;
using api.models.enums;
using api.services.interfaces.chat;
using Microsoft.EntityFrameworkCore;

namespace api.services.implementations.chat
{
    public class AiChatService : IAiChatService
    {
        private readonly ApplicationDbContext _context;
        private readonly IChatService _chatService;
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;

        public AiChatService(
            ApplicationDbContext context,
            IChatService chatService,
            IConfiguration configuration,
            HttpClient httpClient)
        {
            _context = context;
            _chatService = chatService;
            _configuration = configuration;
            _httpClient = httpClient;
        }

        public async Task<AiChatResultDto> ReplyAsync(string roomId, string customerId, string message, CancellationToken ct = default)
        {
            var intent = DetectIntent(message);
            var requiresHuman = intent == AiChatIntent.HumanHandoff;
            var context = await BuildContextAsync(roomId, customerId, message, intent, ct);

            var answer = requiresHuman
                ? "Yeu cau nay can nhan vien HauShop xu ly truc tiep. Ban hay mo popup chat nhan vien ben duoi va gui lai ma don hang, san pham can doi tra hoac yeu cau cu the de duoc ho tro nhanh hon."
                : await GenerateAnswerAsync(message, intent, context, ct);

            if (ShouldEscalate(answer))
            {
                requiresHuman = true;
                answer += "\n\nBan hay mo popup chat nhan vien ben duoi de tiep tuc voi bo phan ho tro.";
            }

            if (requiresHuman)
            {
                await _chatService.EscalateToHumanAsync(roomId, ct);
            }

            var assistantMessage = await _chatService.SendAssistantMessageAsync(roomId, answer, ct);
            return new AiChatResultDto
            {
                AssistantMessage = assistantMessage,
                RequiresHuman = requiresHuman,
                Intent = intent.ToString()
            };
        }

        private async Task<string> BuildContextAsync(string roomId, string customerId, string message, AiChatIntent intent, CancellationToken ct)
        {
            var builder = new StringBuilder();
            builder.AppendLine("Thong tin cua HauShop:");
            builder.AppendLine("- Ho tro tu van san pham, loc theo gia/mau/size, kiem tra don hang, chinh sach, combo va doi tra.");
            builder.AppendLine("- Chinh sach doi tra mac dinh: ho tro trong 7 ngay neu san pham con tem/mac, chua qua su dung va co bang chung mua hang.");
            builder.AppendLine("- Phi van chuyen va thoi gian giao hang phu thuoc dia chi nhan hang va trang thai don.");

            var history = await _context.ChatMessages
                .AsNoTracking()
                .Include(m => m.Sender)
                .Where(m => m.ChatRoomId == roomId)
                .OrderByDescending(m => m.Created)
                .Take(8)
                .OrderBy(m => m.Created)
                .Select(m => $"{m.Sender.FirstName} {m.Sender.LastName}: {m.Message}")
                .ToListAsync(ct);

            if (history.Count > 0)
            {
                builder.AppendLine();
                builder.AppendLine("Lich su chat gan day:");
                foreach (var item in history)
                {
                    builder.AppendLine($"- {item}");
                }
            }

            if (intent is AiChatIntent.ProductAdvice or AiChatIntent.ProductFilter or AiChatIntent.Combo or AiChatIntent.General)
            {
                var products = await FindProductsAsync(message, ct);
                builder.AppendLine();
                builder.AppendLine("San pham lien quan trong database:");
                if (products.Count == 0)
                {
                    builder.AppendLine("- Chua tim thay san pham phu hop voi yeu cau hien tai.");
                }
                else
                {
                    foreach (var product in products)
                    {
                        builder.AppendLine($"- {product}");
                    }
                }
            }

            if (intent is AiChatIntent.OrderStatus or AiChatIntent.ReturnExchange)
            {
                var orders = await _context.Orders
                    .AsNoTracking()
                    .Include(o => o.OrderItems)
                    .Include(o => o.ShippingDetail)
                    .Where(o => o.UserId == customerId)
                    .OrderByDescending(o => o.Created)
                    .Take(5)
                    .Select(o => new
                    {
                        o.Id,
                        o.Status,
                        o.Total,
                        o.Created,
                        TrackingNumber = o.ShippingDetail == null ? null : o.ShippingDetail.TrackingNumber,
                        Items = o.OrderItems.Select(i => $"{i.ProductName} x{i.Quantity} ({i.VariantColor}/{i.VariantSize})").ToList()
                    })
                    .ToListAsync(ct);

                builder.AppendLine();
                builder.AppendLine("Don hang gan day cua khach:");
                if (orders.Count == 0)
                {
                    builder.AppendLine("- Khach chua co don hang trong he thong.");
                }
                else
                {
                    foreach (var order in orders)
                    {
                        builder.AppendLine($"- Don {order.Id}: {order.Status}, tong {FormatMoney(order.Total)}, ngay {order.Created:dd/MM/yyyy}, van don {order.TrackingNumber ?? "chua co"}, san pham: {string.Join("; ", order.Items)}");
                    }
                }
            }

            return builder.ToString();
        }

        private async Task<List<string>> FindProductsAsync(string message, CancellationToken ct)
        {
            var normalized = Normalize(message);
            var maxPrice = ExtractMaxPrice(normalized);
            var wantedSizes = ExtractValues(normalized, new[] { "xs", "s", "m", "l", "xl", "xxl", "2xl", "3xl", "39", "40", "41", "42", "43" });
            var wantedColors = ExtractValues(normalized, new[] { "den", "trang", "do", "xanh", "vang", "hong", "be", "nau", "xam", "ghi", "tim", "cam" });
            var keywords = normalized
                .Split(' ', StringSplitOptions.RemoveEmptyEntries)
                .Where(w => w.Length >= 3 && !StopWords.Contains(w) && !wantedColors.Contains(w) && !wantedSizes.Contains(w))
                .Take(6)
                .ToList();

            var query = _context.Products
                .AsNoTracking()
                .Where(p => p.IsActive && p.Stock > 0);

            if (maxPrice.HasValue)
            {
                query = query.Where(p => p.Price <= maxPrice.Value || p.ProductVariants.Any(v => v.IsActive && v.Price <= maxPrice.Value));
            }

            var products = await query
                .OrderByDescending(p => p.AverageRating)
                .ThenBy(p => p.Price)
                .Take(30)
                .Select(p => new
                {
                    p.Name,
                    p.Description,
                    p.Sku,
                    p.Price,
                    p.Stock,
                    p.AverageRating,
                    Variants = p.ProductVariants
                        .Where(v => v.IsActive && v.Stock > 0)
                        .OrderBy(v => v.Price)
                        .Select(v => new
                        {
                            v.Color,
                            v.Size,
                            v.Stock,
                            v.Price
                        })
                        .ToList()
                })
                .ToListAsync(ct);

            if (wantedColors.Count > 0)
            {
                products = products
                    .Where(p => p.Variants.Any(v => wantedColors.Contains(Normalize(v.Color ?? string.Empty))))
                    .ToList();
            }

            if (wantedSizes.Count > 0)
            {
                products = products
                    .Where(p => p.Variants.Any(v => wantedSizes.Contains(Normalize(v.Size ?? string.Empty))))
                    .ToList();
            }

            if (keywords.Count > 0)
            {
                products = products
                    .Where(p =>
                    {
                        var searchable = Normalize($"{p.Name} {p.Description} {p.Sku}");
                        return keywords.Any(searchable.Contains);
                    })
                    .ToList();
            }

            return products
                .Take(8)
                .Select(p =>
                {
                    var variants = p.Variants
                        .Where(v => wantedColors.Count == 0 || wantedColors.Contains(Normalize(v.Color ?? string.Empty)))
                        .Where(v => wantedSizes.Count == 0 || wantedSizes.Contains(Normalize(v.Size ?? string.Empty)))
                        .Take(5)
                        .Select(v => $"{v.Color}/{v.Size} {v.Stock} sp {FormatMoney(v.Price)}");

                    return $"{p.Name} - tu {FormatMoney(p.Price)}, ton {p.Stock}, danh gia {p.AverageRating:0.0}/5, bien the: {string.Join("; ", variants)}";
                })
                .ToList();
        }

        private async Task<string> GenerateAnswerAsync(string message, AiChatIntent intent, string context, CancellationToken ct)
        {
            var apiKey = _configuration["OpenAI:ApiKey"]
                ?? _configuration["OPENAI_API_KEY"]
                ?? Environment.GetEnvironmentVariable("OPENAI_API_KEY")
                ?? Environment.GetEnvironmentVariable("CHATGPT_API_KEY");

            if (string.IsNullOrWhiteSpace(apiKey))
            {
                return GenerateLocalAnswer(intent, context);
            }

            using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/chat/completions");
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);
            request.Content = JsonContent.Create(new
            {
                model = _configuration["OpenAI:Model"] ?? "gpt-4o-mini",
                temperature = 0.3,
                messages = new object[]
                {
                    new { role = "system", content = "Ban la AI cham soc khach hang cua HauShop. Tra loi bang tieng Viet, ngan gon, huu ich. Chi dua thong tin dua tren context. Neu khong chac hoac can thao tac nhay cam, noi se chuyen nhan vien that." },
                    new { role = "system", content = context },
                    new { role = "user", content = message }
                }
            });

            using var response = await _httpClient.SendAsync(request, ct);
            if (!response.IsSuccessStatusCode)
            {
                return GenerateLocalAnswer(intent, context);
            }

            await using var stream = await response.Content.ReadAsStreamAsync(ct);
            using var json = await JsonDocument.ParseAsync(stream, cancellationToken: ct);
            var content = json.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();

            return string.IsNullOrWhiteSpace(content) ? GenerateLocalAnswer(intent, context) : content.Trim();
        }

        private static string GenerateLocalAnswer(AiChatIntent intent, string context)
        {
            return intent switch
            {
                AiChatIntent.ProductFilter => $"Minh da loc theo yeu cau cua ban trong du lieu hien co:\n{ExtractContextSection(context, "San pham lien quan trong database:")}\nBan co the gui them muc gia, mau hoac size de minh loc sat hon.",
                AiChatIntent.ProductAdvice => $"Minh goi y mot so san pham phu hop:\n{ExtractContextSection(context, "San pham lien quan trong database:")}\nNeu ban cho minh biet phong cach, ngan sach va size thuong mac, minh se tu van chinh xac hon.",
                AiChatIntent.Combo => $"Combo nen chon dua tren san pham hien co:\n{ExtractContextSection(context, "San pham lien quan trong database:")}\nGoi y nhanh: chon 1 mon chinh, 1 phu kien cung tone mau va 1 san pham co size/mau con hang.",
                AiChatIntent.OrderStatus => $"Minh kiem tra duoc cac don hang gan day cua ban:\n{ExtractContextSection(context, "Don hang gan day cua khach:")}",
                AiChatIntent.Policy => "HauShop ho tro doi tra trong 7 ngay neu san pham con tem/mac, chua qua su dung va co bang chung mua hang. Voi loi do shop hoac giao sai san pham, ban gui hinh anh/tinh trang de duoc ho tro nhanh.",
                AiChatIntent.ReturnExchange => $"Minh co the ho tro doi tra dua tren don hang cua ban:\n{ExtractContextSection(context, "Don hang gan day cua khach:")}\nBan vui long gui ma don, san pham can doi/tra, ly do va hinh anh neu co.",
                _ => "Minh co the tu van san pham, loc theo gia/mau/size, kiem tra don hang, giai thich chinh sach, goi y combo va ho tro doi tra. Ban muon minh ho tro phan nao?"
            };
        }

        private static AiChatIntent DetectIntent(string message)
        {
            var text = Normalize(message);
            if (ContainsAny(text, "nhan vien", "nguoi that", "admin", "gap nguoi", "tu van vien")) return AiChatIntent.HumanHandoff;
            if (ContainsAny(text, "doi tra", "doi hang", "tra hang", "hoan tien", "bao hanh", "loi hang")) return AiChatIntent.ReturnExchange;
            if (ContainsAny(text, "don hang", "ma don", "van don", "giao hang", "trang thai don", "ship")) return AiChatIntent.OrderStatus;
            if (ContainsAny(text, "chinh sach", "phi ship", "van chuyen", "thanh toan", "bao mat")) return AiChatIntent.Policy;
            if (ContainsAny(text, "combo", "phoi", "set", "mac chung", "di kem")) return AiChatIntent.Combo;
            if (ContainsAny(text, "gia", "duoi", "tren", "mau", "size", "kich co", "loc")) return AiChatIntent.ProductFilter;
            if (ContainsAny(text, "tu van", "goi y", "nen mua", "san pham", "ao", "quan", "giay", "tui", "dong ho")) return AiChatIntent.ProductAdvice;
            return AiChatIntent.General;
        }

        private static bool ContainsAny(string text, params string[] values) => values.Any(text.Contains);

        private static bool ShouldEscalate(string answer)
        {
            var text = Normalize(answer);
            return ContainsAny(text, "chuyen nhan vien", "nhan vien that", "khong chac", "khong the xu ly");
        }

        private static string Normalize(string value)
        {
            var formD = value.ToLowerInvariant().Normalize(NormalizationForm.FormD);
            var chars = formD.Where(c => CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark).ToArray();
            return new string(chars).Normalize(NormalizationForm.FormC).Replace('đ', 'd');
        }

        private static decimal? ExtractMaxPrice(string text)
        {
            var match = Regex.Match(text, @"(?:duoi|tam|khoang|<=|toi da)?\s*(\d+(?:[.,]\d+)?)\s*(trieu|tr|m|k|nghin)?");
            if (!match.Success) return null;

            if (!decimal.TryParse(match.Groups[1].Value.Replace(',', '.'), NumberStyles.Number, CultureInfo.InvariantCulture, out var value))
            {
                return null;
            }

            var unit = match.Groups[2].Value;
            if (unit is "trieu" or "tr" or "m") value *= 1_000_000;
            if (unit is "k" or "nghin") value *= 1_000;
            return value;
        }

        private static HashSet<string> ExtractValues(string text, IEnumerable<string> values)
        {
            var words = text.Split(' ', StringSplitOptions.RemoveEmptyEntries).ToHashSet();
            return values.Where(words.Contains).ToHashSet();
        }

        private static string ExtractContextSection(string context, string title)
        {
            var start = context.IndexOf(title, StringComparison.OrdinalIgnoreCase);
            if (start < 0) return "- Chua co du lieu phu hop.";
            var section = context[(start + title.Length)..].Trim();
            var next = section.IndexOf("\n\n", StringComparison.Ordinal);
            return (next >= 0 ? section[..next] : section).Trim();
        }

        private static string FormatMoney(decimal value) => $"{value.ToString("N0", CultureInfo.GetCultureInfo("vi-VN"))} VND";

        private static readonly HashSet<string> StopWords = new()
        {
            "toi", "minh", "ban", "cho", "can", "tim", "mua", "san", "pham", "voi", "theo", "mot", "cai",
            "hang", "hau", "shop", "co", "khong", "nao", "nhe", "nha", "giup", "duoc", "gia", "mau", "size"
        };

        private enum AiChatIntent
        {
            General,
            ProductAdvice,
            ProductFilter,
            OrderStatus,
            Policy,
            Combo,
            ReturnExchange,
            HumanHandoff
        }
    }
}
