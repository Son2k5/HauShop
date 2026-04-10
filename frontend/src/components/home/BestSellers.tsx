import { useState, useMemo } from "react";
import ProductCard, { type Product } from "../product/ProductCard";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import { useProducts } from "../../hooks/useProducts";
import type { ProductSummary } from "../../@types/product.type";

// MOCK DATA for testing when API is not available
const MOCK_PRODUCTS: ProductSummary[] = [
  {
    id: "1",
    name: "Áo sơ mi nam cotton cao cấp",
    sku: "SHIRT001",
    slug: "ao-so-mi-nam-cotton-cao-cap",
    imageUrl: null,
    price: 450000,
    minVariantPrice: 350000,
    totalStock: 50,
    isActive: true,
    brandId: null,
    brandName: "HauShop",
    categories: [{ id: "1", name: "Thời trang nam", slug: "thoi-trang-nam" }],
    created: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Váy nữ hè 2024",
    sku: "DRESS001",
    slug: "vay-nu-he-2024",
    imageUrl: null,
    price: 899000,
    minVariantPrice: null,
    totalStock: 30,
    isActive: true,
    brandId: null,
    brandName: "HauShop",
    categories: [{ id: "2", name: "Thời trang nữ", slug: "thoi-trang-nu" }],
    created: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    name: "Túi xách da thật",
    sku: "BAG001",
    slug: "tui-xach-da-that",
    imageUrl: null,
    price: 1299000,
    minVariantPrice: 999000,
    totalStock: 8,
    isActive: true,
    brandId: null,
    brandName: "Luxury",
    categories: [{ id: "3", name: "Phụ kiện", slug: "phu-kien" }],
    created: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "4",
    name: "Quần jean nam slim fit",
    sku: "JEAN001",
    slug: "quan-jean-nam-slim-fit",
    imageUrl: null,
    price: 799000,
    minVariantPrice: null,
    totalStock: 100,
    isActive: true,
    brandId: null,
    brandName: "DenimCo",
    categories: [{ id: "1", name: "Thời trang nam", slug: "thoi-trang-nam" }],
    created: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "5",
    name: "Áo khoác blazer nữ",
    sku: "BLAZER001",
    slug: "ao-khoac-blazer-nu",
    imageUrl: null,
    price: 1599000,
    minVariantPrice: 1299000,
    totalStock: 15,
    isActive: true,
    brandId: null,
    brandName: "Elegant",
    categories: [{ id: "2", name: "Thời trang nữ", slug: "thoi-trang-nu" }],
    created: new Date().toISOString(),
  },
  {
    id: "6",
    name: "Dây chuyền bạc cao cấp",
    sku: "NECKLACE001",
    slug: "day-chuyen-bac-cao-cap",
    imageUrl: null,
    price: 599000,
    minVariantPrice: null,
    totalStock: 5,
    isActive: true,
    brandId: null,
    brandName: "SilverLine",
    categories: [{ id: "3", name: "Phụ kiện", slug: "phu-kien" }],
    created: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Map API data to ProductCard format
const mapToProduct = (p: ProductSummary): Product => {
  const catName = p.categories[0]?.name?.toLowerCase() || "";
  let cat: "women" | "men" | "acc" = "women";
  if (catName.includes("nam") || catName.includes("men")) cat = "men";
  else if (catName.includes("nữ") || catName.includes("women")) cat = "women";
  else if (catName.includes("phụ kiện") || catName.includes("acc")) cat = "acc";

  const stars = Math.floor(Math.random() * 2) + 4;
  const reviewCount = Math.floor(Math.random() * 200) + 50;

  let badge: string | undefined;
  let badgeVariant: "hot" | "new" | "sale" | undefined;
  let oldPrice: number | undefined;
  let discount: string | undefined;

  if (p.minVariantPrice && p.minVariantPrice < p.price) {
    badge = "SALE";
    badgeVariant = "sale";
    oldPrice = p.price;
    const discountPercent = Math.round(((p.price - p.minVariantPrice) / p.price) * 100);
    discount = `-${discountPercent}%`;
  } else if (new Date(p.created).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000) {
    badge = "NEW";
    badgeVariant = "new";
  } else if (p.totalStock && p.totalStock < 10) {
    badge = "HOT";
    badgeVariant = "hot";
  }

  const bgColors: Record<string, string> = {
    women: "#f5eae8",
    men: "#e8eef5",
    acc: "#f0ede8",
  };

  return {
    id: p.id,
    name: p.name,
    category: p.categories[0]?.name || "Không phân loại",
    price: p.minVariantPrice || p.price,
    oldPrice,
    discount,
    badge,
    badgeVariant,
    stars,
    reviewCount,
    bgColor: bgColors[cat] || "#f5f5f5",
    cat,
  };
};

const TABS = [
  { key: "all", label: "Tất cả" },
  { key: "women", label: "Nữ" },
  { key: "men", label: "Nam" },
  { key: "acc", label: "Phụ kiện" },
] as const;

type Tab = (typeof TABS)[number]["key"];

interface Props {
  onAddToCart: (p: Product) => void;
  onBuyNow: (p: Product) => void;
}

export default function BestSellers({ onAddToCart, onBuyNow }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const { ref, visible } = useScrollReveal<HTMLDivElement>();

  const queryParams = useMemo(() => ({
    pageSize: 9,
    sortBy: "created" as const,
    sortOrder: "desc" as const,
  }), []);

  const {
    products: apiProducts,
    isLoading,
    error,
  } = useProducts(queryParams);

  // FIX: wrap in useMemo để tránh tạo reference mới mỗi render → vòng lặp vô hạn
  const productsToUse = useMemo(
    () => (apiProducts.length > 0 ? apiProducts : MOCK_PRODUCTS),
    [apiProducts]
  );

  const mappedProducts = useMemo(
    () => productsToUse.map(mapToProduct),
    [productsToUse]
  );

  const filtered = useMemo(() => {
    if (activeTab === "all") return mappedProducts;
    return mappedProducts.filter((p) => p.cat === activeTab);
  }, [activeTab, mappedProducts]);

  if (isLoading) {
    return (
      <section className="py-20 px-10">
        <div className="max-w-container mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 px-10">
        <div className="max-w-container mx-auto text-center">
          <p className="text-red-500">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-10">
      <div className="max-w-container mx-auto">
        {/* Header */}
        <div
          ref={ref}
          className={`flex items-end justify-between mb-10 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <div>
            <p className="text-[11px] tracking-[3px] uppercase text-red-500 font-semibold mb-2 font-bodyFont">
              Được yêu thích nhất
            </p>
            <h2 className="font-titleFont text-[34px] font-semibold leading-tight">
              Sản phẩm nổi tiếng
            </h2>
          </div>
          <button className="text-sm font-medium font-bodyFont flex items-center gap-1.5 border-b border-primeColor pb-0.5 hover:text-red-500 hover:border-red-500 transition-colors duration-200 group">
            Xem tất cả
            <svg className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-9">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-2.5 text-sm font-bodyFont border-b-2 -mb-px transition-all duration-200 ${
                activeTab === tab.key
                  ? "border-red-500 text-red-500 font-medium"
                  : "border-transparent text-lightText hover:text-primeColor"
              }}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {filtered.map((product, i) => (
              <div
                key={product.id}
                className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <ProductCard
                  product={product}
                  onAddToCart={onAddToCart}
                  onBuyNow={onBuyNow}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-500 font-bodyFont">Chưa có sản phẩm nào trong danh mục này</p>
          </div>
        )}

        {/* Pagination info */}
        <div className="mt-8 text-center text-sm text-gray-500 font-bodyFont">
          Hiển thị {filtered.length} sản phẩm
          {apiProducts.length === 0 && (
            <span className="ml-2 text-xs text-yellow-600">(Đang dùng dữ liệu mẫu)</span>
          )}
        </div>
      </div>
    </section>
  );
}