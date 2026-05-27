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
                ? "Yêu cầu này cần nhân viên HauShop xử lý trực tiếp. Bạn hãy mở popup chat nhân viên bên dưới và gửi lại mã đơn hàng, sản phẩm cần đổi trả hoặc yêu cầu cụ thể để được hỗ trợ nhanh hơn."
                : await GenerateAnswerAsync(message, intent, context, ct);

            if (ShouldEscalate(answer))
            {
                requiresHuman = true;
                answer += "\n\nBạn hãy mở popup chat nhân viên bên dưới để tiếp tục với bộ phận hỗ trợ.";
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
            builder.AppendLine("Thông tin của HauShop:");
            builder.AppendLine("- Hỗ trợ tư vấn sản phẩm, lọc theo giá/màu/size, kiểm tra đơn hàng, chính sách, combo và đổi trả.");
            builder.AppendLine("- Chính sách đổi trả mặc định: hỗ trợ trong 7 ngày nếu sản phẩm còn tem/mác, chưa qua sử dụng và có bằng chứng mua hàng.");
            builder.AppendLine("- Phí vận chuyển và thời gian giao hàng phụ thuộc địa chỉ nhận hàng và trạng thái đơn.");

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
                builder.AppendLine("Lịch sử chat gần đây:");
                foreach (var item in history)
                {
                    builder.AppendLine($"- {item}");
                }
            }

            if (intent is AiChatIntent.ProductAdvice or AiChatIntent.ProductFilter or AiChatIntent.Combo or AiChatIntent.General)
            {
                var products = await FindProductsAsync(message, ct);
                builder.AppendLine();
                builder.AppendLine(ProductContextTitle);
                if (products.Count == 0)
                {
                    builder.AppendLine("- Chưa tìm thấy sản phẩm phù hợp với yêu cầu hiện tại.");
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
                builder.AppendLine(OrderContextTitle);
                if (orders.Count == 0)
                {
                    builder.AppendLine("- Khách chưa có đơn hàng trong hệ thống.");
                }
                else
                {
                    foreach (var order in orders)
                    {
                        builder.AppendLine($"- Đơn {order.Id}: {order.Status}, tổng {FormatMoney(order.Total)}, ngày {order.Created:dd/MM/yyyy}, vận đơn {order.TrackingNumber ?? "chưa có"}, sản phẩm: {string.Join("; ", order.Items)}");
                    }
                }
            }

            return builder.ToString();
        }

        private async Task<List<string>> FindProductsAsync(string message, CancellationToken ct)
        {
            var normalized = Normalize(message);
            var minPrice = ExtractMinPrice(normalized);
            var maxPrice = ExtractMaxPrice(normalized);
            var wantedSizes = ExtractValues(normalized, SizeTerms);
            var wantedColors = ExtractWantedColors(normalized);
            var searchTerms = BuildSearchTerms(normalized, wantedColors, wantedSizes);

            var query = _context.Products
                .AsNoTracking()
                .Where(p => p.IsActive && (p.Stock > 0 || p.ProductVariants.Any(v => v.IsActive && v.Stock > 0)));

            if (maxPrice.HasValue)
            {
                query = query.Where(p => p.Price <= maxPrice.Value || p.ProductVariants.Any(v => v.IsActive && v.Stock > 0 && v.Price <= maxPrice.Value));
            }

            if (minPrice.HasValue)
            {
                query = query.Where(p => p.Price >= minPrice.Value || p.ProductVariants.Any(v => v.IsActive && v.Stock > 0 && v.Price >= minPrice.Value));
            }

            var products = await query
                .OrderByDescending(p => p.AverageRating)
                .ThenBy(p => p.Price)
                .Select(p => new ProductSearchItem
                {
                    Name = p.Name,
                    Description = p.Description,
                    Sku = p.Sku,
                    Slug = p.Slug,
                    Price = p.Price,
                    Stock = p.Stock,
                    AverageRating = p.AverageRating,
                    BrandName = p.Brand != null ? p.Brand.Name : string.Empty,
                    CategoryNames = p.ProductCategories
                        .Where(pc => pc.Category != null)
                        .Select(pc => pc.Category.Name)
                        .ToList(),
                    TotalVariantStock = p.ProductVariants
                        .Where(v => v.IsActive)
                        .Sum(v => (int?)v.Stock) ?? 0,
                    MinVariantPrice = p.ProductVariants
                        .Where(v => v.IsActive && v.Stock > 0)
                        .Min(v => (decimal?)v.Price) ?? p.Price,
                    Variants = p.ProductVariants
                        .Where(v => v.IsActive && v.Stock > 0)
                        .OrderBy(v => v.Price)
                        .Select(v => new ProductVariantSearchItem
                        {
                            Color = v.Color,
                            Size = v.Size,
                            Stock = v.Stock,
                            Price = v.Price
                        })
                        .ToList()
                })
                .ToListAsync(ct);

            if (wantedColors.Count > 0)
            {
                products = products
                    .Where(p => p.Variants.Any(v => MatchesAnyToken(v.Color, wantedColors)))
                    .ToList();
            }

            if (wantedSizes.Count > 0)
            {
                products = products
                    .Where(p => p.Variants.Any(v => wantedSizes.Contains(Normalize(v.Size ?? string.Empty))))
                    .ToList();
            }

            var scoredProducts = products
                .Select(p => new
                {
                    Product = p,
                    Score = ScoreProductMatch(p, searchTerms, wantedColors, wantedSizes)
                })
                .Where(p => searchTerms.Count == 0 || p.Score > 0)
                .OrderByDescending(p => p.Score)
                .ThenByDescending(p => p.Product.AverageRating)
                .ThenBy(p => p.Product.MinVariantPrice)
                .Take(8)
                .Select(p => p.Product)
                .ToList();

            return scoredProducts
                .Select(p =>
                {
                    var variants = p.Variants
                        .Where(v => wantedColors.Count == 0 || MatchesAnyToken(v.Color, wantedColors))
                        .Where(v => wantedSizes.Count == 0 || wantedSizes.Contains(Normalize(v.Size ?? string.Empty)))
                        .Take(5)
                        .Select(v => $"{v.Color}/{v.Size} còn {v.Stock} sp {FormatMoney(v.Price)}");

                    var stock = p.TotalVariantStock > 0 ? p.TotalVariantStock : p.Stock;

                    return $"{p.Name} - từ {FormatMoney(p.MinVariantPrice)}, tồn {stock}, đánh giá {p.AverageRating:0.0}/5, biến thể: {string.Join("; ", variants)}";
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
                    new { role = "system", content = "Bạn là AI chăm sóc khách hàng của HauShop. Trả lời bằng tiếng Việt có dấu, ngắn gọn, hữu ích. Hiểu cả tin nhắn tiếng Việt có dấu và không dấu. Chỉ đưa thông tin dựa trên context. Nếu không chắc hoặc cần thao tác nhạy cảm, nói sẽ chuyển nhân viên thật." },
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
                AiChatIntent.ProductFilter => $"Mình đã lọc theo yêu cầu của bạn trong dữ liệu hiện có:\n{ExtractContextSection(context, ProductContextTitle)}\nBạn có thể gửi thêm mức giá, màu hoặc size để mình lọc sát hơn.",
                AiChatIntent.ProductAdvice => $"Mình gợi ý một số sản phẩm phù hợp:\n{ExtractContextSection(context, ProductContextTitle)}\nNếu bạn cho mình biết phong cách, ngân sách và size thường mặc, mình sẽ tư vấn chính xác hơn.",
                AiChatIntent.Combo => $"Combo nên chọn dựa trên sản phẩm hiện có:\n{ExtractContextSection(context, ProductContextTitle)}\nGợi ý nhanh: chọn 1 món chính, 1 phụ kiện cùng tone màu và 1 sản phẩm có size/màu còn hàng.",
                AiChatIntent.OrderStatus => $"Mình kiểm tra được các đơn hàng gần đây của bạn:\n{ExtractContextSection(context, OrderContextTitle)}",
                AiChatIntent.Policy => "HauShop hỗ trợ đổi trả trong 7 ngày nếu sản phẩm còn tem/mác, chưa qua sử dụng và có bằng chứng mua hàng. Với lỗi do shop hoặc giao sai sản phẩm, bạn gửi hình ảnh/tình trạng để được hỗ trợ nhanh.",
                AiChatIntent.ReturnExchange => $"Mình có thể hỗ trợ đổi trả dựa trên đơn hàng của bạn:\n{ExtractContextSection(context, OrderContextTitle)}\nBạn vui lòng gửi mã đơn, sản phẩm cần đổi/trả, lý do và hình ảnh nếu có.",
                _ => "Mình có thể tư vấn sản phẩm, lọc theo giá/màu/size, kiểm tra đơn hàng, giải thích chính sách, gợi ý combo và hỗ trợ đổi trả. Bạn muốn mình hỗ trợ phần nào?"
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
            if (string.IsNullOrWhiteSpace(value))
            {
                return string.Empty;
            }

            var formD = value.ToLowerInvariant().Normalize(NormalizationForm.FormD);
            var chars = formD.Where(c => CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark).ToArray();
            var withoutDiacritics = new string(chars)
                .Normalize(NormalizationForm.FormC)
                .Replace('đ', 'd');

            var normalized = Regex.Replace(withoutDiacritics, @"[^\p{L}\p{Nd}]+", " ");
            return Regex.Replace(normalized, @"\s+", " ").Trim();
        }

        private static decimal? ExtractMaxPrice(string text)
        {
            var matches = Regex.Matches(
                text,
                @"(?<cue>duoi|tam|khoang|toi da|gia|muc gia|ngan sach|<=)?\s*(?<value>\d+(?:[.,]\d+)?)\s*(?<unit>trieu|tr|m|k|nghin|ngan|vnd|dong)?");

            foreach (Match match in matches)
            {
                var value = ExtractPriceValue(match);
                if (value.HasValue) return value;
            }

            return null;
        }

        private static decimal? ExtractMinPrice(string text)
        {
            var matches = Regex.Matches(
                text,
                @"(?<cue>tren|tu|toi thieu|>=)\s*(?<value>\d+(?:[.,]\d+)?)\s*(?<unit>trieu|tr|m|k|nghin|ngan|vnd|dong)?");

            foreach (Match match in matches)
            {
                var value = ExtractPriceValue(match);
                if (value.HasValue) return value;
            }

            return null;
        }

        private static decimal? ExtractPriceValue(Match match)
        {
            var hasCue = match.Groups["cue"].Success;
            var hasUnit = match.Groups["unit"].Success;
            if (!hasCue && !hasUnit)
            {
                return null;
            }

            if (!decimal.TryParse(match.Groups["value"].Value.Replace(',', '.'), NumberStyles.Number, CultureInfo.InvariantCulture, out var value))
            {
                return null;
            }

            var unit = match.Groups["unit"].Value;
            if (unit is "trieu" or "tr" or "m")
            {
                value *= 1_000_000;
            }
            else if (unit is "k" or "nghin" or "ngan")
            {
                value *= 1_000;
            }
            else if (!hasUnit && hasCue && value < 10_000)
            {
                value *= 1_000;
            }

            return value;
        }

        private static HashSet<string> ExtractValues(string text, IEnumerable<string> values)
        {
            var words = Tokenize(text).ToHashSet();
            return values.Where(words.Contains).ToHashSet();
        }

        private static HashSet<string> ExtractWantedColors(string text)
        {
            var colorText = text;
            foreach (var phrase in NonColorDoPhrases)
            {
                colorText = colorText.Replace(phrase, " ");
            }

            return ExtractValues(colorText, ColorTerms);
        }

        private static List<string> BuildSearchTerms(string text, HashSet<string> wantedColors, HashSet<string> wantedSizes)
        {
            var terms = new List<string>();

            foreach (var alias in ProductPhraseAliases)
            {
                if (ContainsPhrase(text, alias.Phrase))
                {
                    terms.AddRange(alias.Terms);
                }
            }

            terms.AddRange(Tokenize(text)
                .Where(word => IsSearchKeyword(word, wantedColors, wantedSizes)));

            return terms
                .Select(Normalize)
                .Where(term => term.Length > 0)
                .Distinct()
                .Take(10)
                .ToList();
        }

        private static bool IsSearchKeyword(string word, HashSet<string> wantedColors, HashSet<string> wantedSizes)
        {
            if (word.Length < 3 && !ShortSearchTerms.Contains(word))
            {
                return false;
            }

            if (StopWords.Contains(word) || wantedColors.Contains(word) || wantedSizes.Contains(word))
            {
                return false;
            }

            return !Regex.IsMatch(word, @"^\d+[a-z]*$");
        }

        private static int ScoreProductMatch(
            ProductSearchItem product,
            IReadOnlyCollection<string> searchTerms,
            HashSet<string> wantedColors,
            HashSet<string> wantedSizes)
        {
            var variantText = string.Join(' ', product.Variants.Select(v => $"{v.Color} {v.Size}"));
            var searchable = Normalize(
                $"{product.Name} {product.Description} {product.Sku} {product.Slug} {product.BrandName} {string.Join(' ', product.CategoryNames)} {variantText}");
            var compactSearchable = Compact(searchable);
            var score = searchTerms.Count == 0 ? 1 : 0;

            foreach (var term in searchTerms)
            {
                var compactTerm = Compact(term);
                if (ContainsPhrase(searchable, term))
                {
                    score += term.Contains(' ') ? 6 : 3;
                }
                else if (compactTerm.Length > 0 && compactSearchable.Contains(compactTerm))
                {
                    score += 2;
                }
            }

            if (wantedColors.Count > 0 && product.Variants.Any(v => MatchesAnyToken(v.Color, wantedColors)))
            {
                score += 2;
            }

            if (wantedSizes.Count > 0 && product.Variants.Any(v => wantedSizes.Contains(Normalize(v.Size ?? string.Empty))))
            {
                score += 2;
            }

            return score;
        }

        private static bool MatchesAnyToken(string? value, HashSet<string> expectedTokens)
        {
            var words = Tokenize(Normalize(value ?? string.Empty)).ToHashSet();
            return expectedTokens.Any(words.Contains);
        }

        private static bool ContainsPhrase(string text, string phrase)
        {
            var normalizedPhrase = Normalize(phrase);
            if (normalizedPhrase.Length == 0)
            {
                return false;
            }

            if (!normalizedPhrase.Contains(' '))
            {
                return Tokenize(text).Contains(normalizedPhrase);
            }

            return $" {text} ".Contains($" {normalizedPhrase} ")
                || Compact(text).Contains(Compact(normalizedPhrase));
        }

        private static string Compact(string value) => value.Replace(" ", string.Empty);

        private static string[] Tokenize(string text) =>
            text.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        private static string ExtractContextSection(string context, string title)
        {
            var start = context.IndexOf(title, StringComparison.OrdinalIgnoreCase);
            if (start < 0) return "- Chưa có dữ liệu phù hợp.";
            var section = context[(start + title.Length)..].Trim();
            var next = section.IndexOf("\n\n", StringComparison.Ordinal);
            return (next >= 0 ? section[..next] : section).Trim();
        }

        private static string FormatMoney(decimal value) => $"{value.ToString("N0", CultureInfo.GetCultureInfo("vi-VN"))} VND";

        private const string ProductContextTitle = "Sản phẩm liên quan trong database:";
        private const string OrderContextTitle = "Đơn hàng gần đây của khách:";

        private static readonly HashSet<string> StopWords = new()
        {
            "toi", "minh", "ban", "cho", "can", "tim", "mua", "san", "pham", "voi", "theo", "mot", "cai",
            "hang", "hau", "shop", "co", "khong", "nao", "nhe", "nha", "giup", "duoc", "gia", "mau", "size",
            "tu", "van", "goi", "y", "loc", "duoi", "tren", "tam", "khoang", "toi", "da", "muc", "ngan", "sach",
            "con", "hang", "loai", "kieu", "form", "cho"
        };

        private static readonly HashSet<string> SizeTerms = new()
        {
            "xs", "s", "m", "l", "xl", "xxl", "2xl", "3xl",
            "35", "36", "37", "38", "39", "40", "41", "42", "43", "44"
        };

        private static readonly HashSet<string> ColorTerms = new()
        {
            "den", "trang", "do", "xanh", "vang", "hong", "be", "kem", "nau", "xam", "ghi", "tim", "cam"
        };

        private static readonly HashSet<string> ShortSearchTerms = new()
        {
            "ao", "so", "mi", "mu", "nu"
        };

        private static readonly string[] NonColorDoPhrases =
        {
            "do the thao",
            "do nam",
            "do nu",
            "do bo",
            "do doi"
        };

        private static readonly (string Phrase, string[] Terms)[] ProductPhraseAliases =
        {
            ("ao khoac", new[] { "ao khoac", "khoac" }),
            ("aokhoac", new[] { "ao khoac", "khoac" }),
            ("ao thun", new[] { "ao thun", "thun" }),
            ("aothun", new[] { "ao thun", "thun" }),
            ("ao so mi", new[] { "ao so mi", "so mi", "somi" }),
            ("ao somi", new[] { "ao so mi", "so mi", "somi" }),
            ("somi", new[] { "so mi", "somi" }),
            ("so mi", new[] { "so mi", "somi" }),
            ("ao polo", new[] { "ao polo", "polo" }),
            ("polo", new[] { "polo" }),
            ("quan dai", new[] { "quan dai" }),
            ("quandai", new[] { "quan dai" }),
            ("quan dui", new[] { "quan dui" }),
            ("quandui", new[] { "quan dui" }),
            ("do the thao", new[] { "do the thao", "the thao" }),
            ("dothethao", new[] { "do the thao", "the thao" }),
            ("giay sneaker", new[] { "giay sneaker", "sneaker" }),
            ("sneaker", new[] { "sneaker" }),
            ("giay the thao", new[] { "giay the thao", "giay", "the thao" }),
            ("giaythethao", new[] { "giay the thao", "giay", "the thao" }),
            ("tui xach", new[] { "tui xach", "tui" }),
            ("tuixach", new[] { "tui xach", "tui" }),
            ("dong ho", new[] { "dong ho" }),
            ("dongho", new[] { "dong ho" }),
            ("kinh mat", new[] { "kinh mat", "kinh" }),
            ("kinhmat", new[] { "kinh mat", "kinh" }),
            ("balo", new[] { "balo" }),
            ("vay dam", new[] { "vay dam", "vay", "dam" }),
            ("vay", new[] { "vay" }),
            ("dam", new[] { "dam" }),
            ("mu", new[] { "mu" }),
            ("nam", new[] { "nam" }),
            ("nu", new[] { "nu" }),
            ("unisex", new[] { "unisex" })
        };

        private sealed class ProductSearchItem
        {
            public string Name { get; set; } = string.Empty;
            public string Description { get; set; } = string.Empty;
            public string Sku { get; set; } = string.Empty;
            public string Slug { get; set; } = string.Empty;
            public decimal Price { get; set; }
            public int Stock { get; set; }
            public decimal AverageRating { get; set; }
            public string BrandName { get; set; } = string.Empty;
            public List<string> CategoryNames { get; set; } = new();
            public int TotalVariantStock { get; set; }
            public decimal MinVariantPrice { get; set; }
            public List<ProductVariantSearchItem> Variants { get; set; } = new();
        }

        private sealed class ProductVariantSearchItem
        {
            public string? Color { get; set; }
            public string? Size { get; set; }
            public int Stock { get; set; }
            public decimal Price { get; set; }
        }

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
