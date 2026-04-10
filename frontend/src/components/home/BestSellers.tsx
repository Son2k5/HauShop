import { useState } from "react";
import { useProducts } from "../../hooks/useProducts";
import ProductCard from "../product/ProductCard";
import ProductCardSkeleton from "../product/Productcardskeleton";
import { useScrollReveal } from "../../hooks/useScrollReveal";

const TABS = [
  { key: "all",   label: "Tất cả",   categoryId: undefined },
  { key: "women", label: "Nữ",       categoryId: undefined },
  { key: "men",   label: "Nam",      categoryId: undefined },
  { key: "acc",   label: "Phụ kiện", categoryId: undefined },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// ✅ Không nhận props — CartContext + ToastContext được dùng bên trong ProductCard
export default function BestSellers() {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const { ref, visible } = useScrollReveal<HTMLDivElement>();

  const activeTabDef = TABS.find((t) => t.key === activeTab)!;

  const { items, isLoading, isError, error } = useProducts({
    isActive:   true,
    sortBy:     "created",
    sortOrder:  "desc",
    pageSize:   6,
    categoryId: activeTabDef.categoryId,
  });

  return (
    <section className="py-20 px-10">
      <div className="max-w-container mx-auto">

        {/* Header */}
        <div
          ref={ref}
          className={`flex items-end justify-between mb-10 transition-all duration-700
                      ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <div>
            <p className="section-label">Được yêu thích nhất</p>
            <h2 className="section-title">Sản phẩm nổi tiếng</h2>
          </div>
          <button className="text-sm font-medium font-bodyFont flex items-center gap-1.5
                             border-b border-primeColor pb-0.5
                             hover:text-red-500 hover:border-red-500 transition-colors duration-200 group">
            Xem tất cả
            <svg className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                 fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
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
              className={`px-6 py-2.5 text-sm font-bodyFont border-b-2 -mb-px transition-all duration-200
                          ${activeTab === tab.key
                            ? "border-red-500 text-red-500 font-medium"
                            : "border-transparent text-lightText hover:text-primeColor"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {isError && (
          <div className="text-center py-16 text-red-500 font-bodyFont text-sm">
            {error ?? "Không thể tải sản phẩm. Vui lòng thử lại."}
          </div>
        )}

        {/* Grid — ProductCard tự dùng useCartContext() + useToast() */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : items.map((product, i) => (
                <div
                  key={product.id}
                  className={`transition-all duration-700
                              ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                  style={{ transitionDelay: `${i * 80}ms` }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
        </div>

        {/* Empty */}
        {!isLoading && !isError && items.length === 0 && (
          <div className="text-center py-16 text-lightText font-bodyFont text-sm">
            Không có sản phẩm nào.
          </div>
        )}
      </div>
    </section>
  );
}