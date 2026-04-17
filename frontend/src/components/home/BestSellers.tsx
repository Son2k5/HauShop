import { Link } from "react-router-dom";
import { useState } from "react";
import { useProducts } from "../../hooks/useProducts";
import ProductCard from "../product/ProductCard";
import ProductCardSkeleton from "../product/Productcardskeleton";
import { useScrollReveal } from "../../hooks/useScrollReveal";

const TABS = [
  {
    key: "all",
    label: "Tất cả",
    search: undefined,
  },
  {
    key: "tee",
    label: "Áo thun",
    search: "Áo Thun",
  },
  {
    key: "jacket",
    label: "Áo khoác",
    search: "Áo Khoác",
  },
  {
    key: "sneaker",
    label: "Sneaker",
    search: "Sneaker",
  },
  {
    key: "accessory",
    label: "Phụ kiện",
    search: "Balo",
  },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function BestSellers() {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const { ref, visible } = useScrollReveal<HTMLDivElement>();
  const activeTabDef = TABS.find((tab) => tab.key === activeTab)!;

  const { items, isLoading, isError, error } = useProducts({
    isActive: true,
    sortBy: "created",
    sortOrder: "desc",
    pageSize: 8,
    search: activeTabDef.search,
  });

  const allResultsPath = activeTabDef.search
    ? `/shop?search=${encodeURIComponent(activeTabDef.search)}`
    : "/shop";

  return (
    <section className="bg-white px-4 py-20 sm:px-6 lg:px-10">
      <div className="max-w-container mx-auto">
        <div
          ref={ref}
          className={`mb-8 flex flex-col gap-5 transition-all duration-700 md:flex-row md:items-end md:justify-between ${
            visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
        >
          <div>
            <h2 className="section-title">Best Sellers</h2>
          </div>

          <Link
            to={allResultsPath}
            className="group flex w-fit items-center gap-1.5 border-b border-primeColor pb-0.5 font-bodyFont text-sm font-medium transition-colors duration-200 hover:border-red-500 hover:text-red-500"
          >
            Xem tất cả
            <svg
              className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="mb-9 flex gap-2 overflow-x-auto border-b border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`-mb-px shrink-0 border-b-2 px-5 py-3 font-bodyFont text-sm transition-all duration-200 ${
                activeTab === tab.key
                  ? "border-red-500 font-medium text-red-500"
                  : "border-transparent text-lightText hover:text-primeColor"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isError && (
          <div className="py-16 text-center font-bodyFont text-sm text-red-500">
            {error ?? "Không thể tải sản phẩm. Vui lòng thử lại."}
          </div>
        )}

        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 xl:grid-cols-4">
          {isLoading
            ? Array.from({ length: 8 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))
            : items.map((product, index) => (
                <div
                  key={product.id}
                  className={`transition-all duration-700 ${
                    visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                  }`}
                  style={{ transitionDelay: `${index * 60}ms` }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
        </div>

        {!isLoading && !isError && items.length === 0 && (
          <div className="py-16 text-center font-bodyFont text-sm text-lightText">
            Không có sản phẩm nào.
          </div>
        )}
      </div>
    </section>
  );
}
