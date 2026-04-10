import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { useProducts } from "../hooks/useProducts";
import ProductCard from "../components/product/ProductCard";
import ProductCardSkeleton from "../components/product/Productcardskeleton";
import type { ProductQueryDto, CategorySummaryDto } from "../@types/product.type";
import { useDebounce } from "../hooks/useDebounce";

// ── Sort options ──────────────────────────────────────────────────────────────
const SORT_OPTIONS: {
  label: string;
  sortBy: ProductQueryDto["sortBy"];
  sortOrder: ProductQueryDto["sortOrder"];
}[] = [
  { label: "Mới nhất", sortBy: "created", sortOrder: "desc" },
  { label: "Cũ nhất", sortBy: "created", sortOrder: "asc" },
  { label: "Giá tăng dần", sortBy: "price", sortOrder: "asc" },
  { label: "Giá giảm dần", sortBy: "price", sortOrder: "desc" },
  { label: "Tên A → Z", sortBy: "name", sortOrder: "asc" },
  { label: "Tên Z → A", sortBy: "name", sortOrder: "desc" },
];

const PRICE_RANGES = [
  { label: "Tất cả", min: undefined, max: undefined },
  { label: "Dưới 500K", min: undefined, max: 500000 },
  { label: "500K – 1Tr", min: 500000, max: 1000000 },
  { label: "1Tr – 2Tr", min: 1000000, max: 2000000 },
  { label: "Trên 2Tr", min: 2000000, max: undefined },
];

const STATUS_OPTIONS = [
  { label: "Đang bán", value: true },
  { label: "Ngừng bán", value: false },
  { label: "Tất cả", value: undefined },
];

const PAGE_SIZE = 15;
const API_BASE = import.meta.env.VITE_API_URL ?? "https://localhost:7288";

export default function ShopPage() {
  // ── Filter state ──────────────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState("");
  const [sortIdx, setSortIdx] = useState(0);
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [status, setStatus] = useState<boolean | undefined>(true);
  const [page, setPage] = useState(1);

  // ── Remote filter data ────────────────────────────────────────────────────
  const [categories, setCategories] = useState<CategorySummaryDto[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/category`)
      .then((r) => r.json())
      .then((d) => setCategories(d?.data ?? d ?? []))
      .catch(() => {});
  }, []);

  const debouncedSearch = useDebounce(searchInput, 400);
  const sort = SORT_OPTIONS[sortIdx];

  const query: ProductQueryDto = {
    search: debouncedSearch || undefined,
    isActive: status,
    sortBy: sort.sortBy,
    sortOrder: sort.sortOrder,
    minPrice,
    maxPrice,
    categoryId,
    page,
    pageSize: PAGE_SIZE,
  };

  const { items, total, totalPages, isLoading, isError, error, refetch } = useProducts(query);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSearch = useCallback((v: string) => {
    setSearchInput(v);
    setPage(1);
  }, []);

  const handleSort = useCallback((idx: number) => {
    setSortIdx(idx);
    setPage(1);
  }, []);

  const handlePrice = useCallback((min?: number, max?: number) => {
    setMinPrice(min);
    setMaxPrice(max);
    setPage(1);
  }, []);

  const handleCategory = useCallback((id?: string) => {
    setCategoryId(id);
    setPage(1);
  }, []);

  const handleStatus = useCallback((value?: boolean) => {
    setStatus(value);
    setPage(1);
  }, []);

  const handleReset = useCallback(() => {
    setSearchInput("");
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setCategoryId(undefined);
    setStatus(true);
    setSortIdx(0);
    setPage(1);
  }, []);

  const hasActiveFilter = !!(
    searchInput ||
    minPrice !== undefined ||
    maxPrice !== undefined ||
    categoryId ||
    status !== true
  );

  return (
    <div className="min-h-screen bg-white">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="bg-[#f7f5f2] border-b border-gray-200 py-10 px-10">
        <div className="max-w-container mx-auto">
          <nav className="flex items-center gap-2 text-sm text-lightText font-bodyFont mb-3">
            <Link to="/" className="hover:text-red-500 transition-colors">Home</Link>
            <span className="text-gray-300">/</span>
            <span className="text-primeColor">Shop</span>
          </nav>
          <h1 className="font-titleFont text-3xl font-bold">Tất cả sản phẩm</h1>
          <p className="text-sm text-lightText font-bodyFont mt-1.5">
            {isLoading ? "Đang tải..." : `Hiển thị ${items.length} / ${total} sản phẩm`}
          </p>
        </div>
      </div>

      <div className="max-w-container mx-auto px-10 py-10 flex gap-10">

        {/* ── Sidebar ───────────────────────────────────────────────────── */}
        <aside className="hidden lg:block w-[240px] flex-shrink-0">
          <div className="sticky top-20 space-y-8">

            {/* Search */}
            <div>
              <h4 className="text-xs tracking-[2px] uppercase font-semibold mb-4 font-titleFont">
                Tìm kiếm
              </h4>

              <div className="relative">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Tên sản phẩm, SKU..."
                  className="w-full h-11 rounded-none border border-gray-200 bg-white pl-4 pr-11 text-sm font-bodyFont text-primeColor placeholder:text-lightText outline-none transition-colors focus:border-red-400"
                />

                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.7}
                    viewBox="0 0 24 24"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>
                </span>
              </div>
            </div>

            {/* Category */}
            {categories.length > 0 && (
              <div>
                <h4 className="text-xs tracking-[2px] uppercase font-semibold mb-4 font-titleFont">
                  Danh mục
                </h4>
                <div className="space-y-2.5">
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="radio"
                      name="category"
                      checked={!categoryId}
                      onChange={() => handleCategory(undefined)}
                      className="accent-red-500 cursor-pointer"
                    />
                    <span className="text-sm font-bodyFont text-lightText group-hover:text-primeColor transition-colors">
                      Tất cả
                    </span>
                  </label>

                  {categories.map((c) => (
                    <label key={c.id} className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                        type="radio"
                        name="category"
                        checked={categoryId === c.id}
                        onChange={() => handleCategory(c.id)}
                        className="accent-red-500 cursor-pointer"
                      />
                      <span className="text-sm font-bodyFont text-lightText group-hover:text-primeColor transition-colors">
                        {c.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Price range */}
            <div>
              <h4 className="text-xs tracking-[2px] uppercase font-semibold mb-4 font-titleFont">
                Khoảng giá
              </h4>
              <div className="space-y-2.5">
                {PRICE_RANGES.map((opt) => (
                  <label key={opt.label} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="radio"
                      name="price"
                      checked={minPrice === opt.min && maxPrice === opt.max}
                      onChange={() => handlePrice(opt.min, opt.max)}
                      className="accent-red-500 cursor-pointer"
                    />
                    <span className="text-sm font-bodyFont text-lightText group-hover:text-primeColor transition-colors">
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <h4 className="text-xs tracking-[2px] uppercase font-semibold mb-4 font-titleFont">
                Trạng thái
              </h4>
              <div className="space-y-2.5">
                {STATUS_OPTIONS.map((opt) => (
                  <label key={opt.label} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="radio"
                      name="status"
                      checked={status === opt.value}
                      onChange={() => handleStatus(opt.value)}
                      className="accent-red-500 cursor-pointer"
                    />
                    <span className="text-sm font-bodyFont text-lightText group-hover:text-primeColor transition-colors">
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Clear filters */}
            {hasActiveFilter && (
              <button
                onClick={handleReset}
                className="w-full py-2.5 border border-gray-200 text-sm font-bodyFont text-lightText
                           hover:border-red-400 hover:text-red-500 transition-all duration-200"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        </aside>

        {/* ── Main content ──────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Toolbar */}
          <div className="flex items-center justify-between mb-7 pb-5 border-b border-gray-100">
            <p className="text-sm text-lightText font-bodyFont hidden md:block">
              {isLoading ? "..." : `${total} sản phẩm`}
            </p>
            <div className="flex items-center gap-3">
              <span className="text-sm text-lightText font-bodyFont">Sắp xếp:</span>
              <select
                value={sortIdx}
                onChange={(e) => handleSort(Number(e.target.value))}
                className="text-sm border border-gray-200 px-3 py-2 outline-none
                           font-bodyFont cursor-pointer focus:border-red-400
                           transition-colors bg-white"
              >
                {SORT_OPTIONS.map((opt, i) => (
                  <option key={opt.label} value={i}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Active filter tags */}
          {hasActiveFilter && (
            <div className="flex flex-wrap gap-2 mb-5">
              {categoryId && (
                <FilterTag
                  label={`Danh mục: ${categories.find((c) => c.id === categoryId)?.name}`}
                  onRemove={() => handleCategory(undefined)}
                />
              )}

              {(minPrice !== undefined || maxPrice !== undefined) && (
                <FilterTag
                  label={
                    PRICE_RANGES.find((r) => r.min === minPrice && r.max === maxPrice)?.label ?? "Giá"
                  }
                  onRemove={() => handlePrice(undefined, undefined)}
                />
              )}

              {searchInput && (
                <FilterTag
                  label={`"${searchInput}"`}
                  onRemove={() => handleSearch("")}
                />
              )}

              {status !== true && (
                <FilterTag
                  label={`Trạng thái: ${status === false ? "Ngừng bán" : "Tất cả"}`}
                  onRemove={() => handleStatus(true)}
                />
              )}
            </div>
          )}

          {/* Error */}
          {isError && (
            <div className="text-center py-20">
              <p className="text-red-500 font-bodyFont text-sm mb-4">{error}</p>
              <button onClick={refetch} className="btn-outline text-sm px-6 py-2.5">
                Thử lại
              </button>
            </div>
          )}

          {/* Grid */}
          {!isError && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {isLoading
                ? Array.from({ length: PAGE_SIZE }).map((_, i) => <ProductCardSkeleton key={i} />)
                : items.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          )}

          {/* Empty */}
          {!isLoading && !isError && items.length === 0 && (
            <div className="text-center py-24">
              <div className="w-16 h-16 mx-auto mb-5 text-gray-200">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1}>
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </div>
              <p className="font-titleFont text-lg font-semibold mb-1">Không tìm thấy sản phẩm</p>
              <p className="text-sm text-lightText font-bodyFont">
                Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
              </p>
              <button onClick={handleReset} className="mt-5 btn-outline text-sm px-6 py-2.5">
                Xóa bộ lọc
              </button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && !isLoading && (
            <div className="flex items-center justify-center gap-2 mt-12">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-10 h-10 flex items-center justify-center border border-gray-200
                           hover:bg-primeColor hover:text-white hover:border-primeColor
                           disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => {
                if (n === 1 || n === totalPages || (n >= page - 2 && n <= page + 2)) {
                  return (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={`w-10 h-10 flex items-center justify-center text-sm font-medium
                                  font-bodyFont border transition-all duration-200
                                  ${
                                    n === page
                                      ? "bg-red-500 border-red-500 text-white"
                                      : "border-gray-200 hover:bg-primeColor hover:text-white hover:border-primeColor"
                                  }`}
                    >
                      {n}
                    </button>
                  );
                }
                if (n === page - 3 || n === page + 3) {
                  return (
                    <span key={n} className="w-10 h-10 flex items-center justify-center text-lightText font-bodyFont">
                      ...
                    </span>
                  );
                }
                return null;
              })}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-10 h-10 flex items-center justify-center border border-gray-200
                           hover:bg-primeColor hover:text-white hover:border-primeColor
                           disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Filter tag chip ───────────────────────────────────────────────────────────
function FilterTag({ label, onRemove }: { label?: string; onRemove: () => void }) {
  if (!label) return null;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100
                 text-xs font-bodyFont text-primeColor border border-gray-200"
    >
      {label}
      <button onClick={onRemove} className="hover:text-red-500 transition-colors leading-none">
        ✕
      </button>
    </span>
  );
}