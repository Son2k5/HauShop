import { Icon } from "@iconify/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { memo, startTransition, useEffect, useMemo, useState } from "react";
import type { AdminPagedResultDto } from "../../@types/admin.type";
import type { CreateProductDto, ProductDto, ProductSummaryDto, UpdateProductDto } from "../../@types/product.type";
import { useDebounce } from "../../hooks/useDebounce";
import { cachePolicy } from "../../lib/cachePolicy";
import { queryKeys } from "../../lib/queryKeys";
import { categoryService } from "../../services/categoryService";
import { adminService } from "../../services/adminService";
import { uploadImages } from "../../services/productService";
import { formatPrice } from "../../utils/formatPrice";
import {
  AdminBadge,
  AdminEmptyState,
  AdminPanel,
  AdminPanelHeader,
  AdminPrimaryButton,
  AdminSecondaryButton,
  AdminStatCard,
  formatAdminDate,
} from "./adminShared";

type ProductFormState = {
  sku: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  stock: string;
  taxable: boolean;
  isActive: boolean;
  brandId: string;
  imageUrl: string;
  imageKey: string;
  averageRating: string;
  reviewCount: string;
  categoryIds: string[];
};

const emptyForm: ProductFormState = {
  sku: "",
  name: "",
  slug: "",
  description: "",
  price: "",
  stock: "0",
  taxable: false,
  isActive: true,
  brandId: "",
  imageUrl: "",
  imageKey: "",
  averageRating: "0",
  reviewCount: "0",
  categoryIds: [],
};

function updateProductInPagedResult(
  current: AdminPagedResultDto<ProductSummaryDto> | undefined,
  product: ProductDto
) {
  if (!current) return current;

  return {
    ...current,
    items: current.items.map((item) =>
      item.id === product.id
        ? {
            ...item,
            sku: product.sku,
            name: product.name,
            slug: product.slug,
            imageUrl: product.imageUrl,
            price: product.price,
            minVariantPrice: product.minVariantPrice ?? null,
            totalStock: product.totalStock ?? null,
            isActive: product.isActive,
            brandId: product.brandId,
            brandName: product.brand?.name ?? null,
            categories: product.categories,
            stock: product.stock,
            averageRating: product.averageRating,
            reviewCount: product.reviewCount,
          }
        : item
    ),
  };
}

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedProductId, setSelectedProductId] = useState<string>();
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const debouncedSearch = useDebounce(search, 350);

  const productsQuery = useQuery({
    queryKey: queryKeys.admin.products({ search: debouncedSearch, page, pageSize: 12 }),
    queryFn: () =>
      adminService.getProducts({
        search: debouncedSearch,
        page,
        pageSize: 12,
      }),
    placeholderData: (prev) => prev,
  });

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.active,
    queryFn: () => categoryService.getActive(),
    staleTime: cachePolicy.category.staleTime,
    gcTime: cachePolicy.category.gcTime,
  });

  const selectedProductQuery = useQuery({
    queryKey: queryKeys.admin.product(selectedProductId ?? ""),
    queryFn: () => adminService.getProductById(selectedProductId!),
    enabled: !!selectedProductId,
  });
  const isLoadingSelectedProduct = formMode === "edit" && selectedProductQuery.isLoading;
  const products = productsQuery.data?.items ?? [];

  const createMutation = useMutation({
    mutationFn: (dto: CreateProductDto) => adminService.createProduct(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products", "list"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateProductDto }) => adminService.updateProduct(id, dto),
    onSuccess: (product) => {
      queryClient.setQueryData(queryKeys.admin.product(product.id), product);
      queryClient.setQueriesData<AdminPagedResultDto<ProductSummaryDto>>(
        { queryKey: ["admin", "products"] },
        (current) => updateProductInPagedResult(current, product)
      );
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products", "list"] });
      queryClient.invalidateQueries({ queryKey: ["products", "detail"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteProduct(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: queryKeys.admin.product(deletedId) });
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products", "list"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
      if (selectedProductId === deletedId) {
        resetForm();
      }
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => adminService.toggleProductActive(id),
    onSuccess: (product) => {
      queryClient.setQueryData(queryKeys.admin.product(product.id), product);
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products", "list"] });
      queryClient.invalidateQueries({ queryKey: ["products", "detail"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });

  const stats = useMemo(() => {
    return {
      active: products.filter((item) => item.isActive).length,
      inactive: products.filter((item) => !item.isActive).length,
      totalStock: products.reduce((sum, item) => sum + (item.totalStock ?? item.stock ?? 0), 0),
    };
  }, [products]);

  const fillForm = (product: ProductDto) => {
    setFormMode("edit");
    setSelectedProductId(product.id);
    setForm({
      sku: product.sku ?? "",
      name: product.name ?? "",
      slug: product.slug ?? "",
      description: product.description ?? "",
      price: String(product.price ?? 0),
      stock: String(product.stock ?? 0),
      taxable: !!product.taxable,
      isActive: !!product.isActive,
      brandId: product.brandId ?? "",
      imageUrl: product.imageUrl ?? "",
      imageKey: product.imageKey ?? "",
      averageRating: String(product.averageRating ?? 0),
      reviewCount: String(product.reviewCount ?? 0),
      categoryIds: product.categories.map((item) => item.id),
    });
    setFormError(null);
  };

  useEffect(() => {
    if (!selectedProductQuery.data) return;
    fillForm(selectedProductQuery.data);
  }, [selectedProductQuery.data]);

  const resetForm = () => {
    setFormMode("create");
    setSelectedProductId(undefined);
    setForm(emptyForm);
    setFormError(null);
  };

  const validateForm = () => {
    if (!form.sku.trim()) return "SKU là bắt buộc.";
    if (!form.name.trim()) return "Tên sản phẩm là bắt buộc.";
    if (!form.description.trim()) return "Mô tả là bắt buộc.";
    if (!form.price.trim() || Number(form.price) < 0) return "Giá bán không hợp lệ.";
    if (!form.stock.trim() || Number(form.stock) < 0) return "Tồn kho không hợp lệ.";
    if (form.averageRating.trim() && Number(form.averageRating) < 0) return "Rating không hợp lệ.";
    if (form.reviewCount.trim() && Number(form.reviewCount) < 0) return "Số review không hợp lệ.";
    if (!form.categoryIds.length) return "Chọn ít nhất một danh mục.";
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError(null);

    if (formMode === "create") {
      await createMutation.mutateAsync({
        sku: form.sku.trim(),
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        description: form.description.trim(),
        price: Number(form.price),
        stock: Number(form.stock),
        taxable: form.taxable,
        isActive: form.isActive,
        brandId: form.brandId.trim() || undefined,
        imageUrl: form.imageUrl.trim() || undefined,
        imageKey: form.imageKey.trim() || undefined,
        averageRating: Number(form.averageRating || 0),
        reviewCount: Number(form.reviewCount || 0),
        categoryIds: form.categoryIds,
      });
      return;
    }

    if (!selectedProductId) {
      setFormError("Chưa chọn sản phẩm để cập nhật.");
      return;
    }

    await updateMutation.mutateAsync({
      id: selectedProductId,
      dto: {
        sku: form.sku.trim(),
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        description: form.description.trim(),
        price: Number(form.price),
        stock: Number(form.stock),
        taxable: form.taxable,
        isActive: form.isActive,
        brandId: form.brandId.trim() ? form.brandId.trim() : "null",
        imageUrl: form.imageUrl.trim() || undefined,
        imageKey: form.imageKey.trim() || undefined,
        averageRating: Number(form.averageRating || 0),
        reviewCount: Number(form.reviewCount || 0),
        categoryIds: form.categoryIds,
      },
    });
  };

  const handleUploadFile = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const result = await uploadImages([files[0]]);
      if (result.uploaded[0]) {
        setForm((current) => ({ ...current, imageUrl: result.uploaded[0] }));
      }
      if (result.errors.length) {
        setFormError(result.errors[0].error);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          icon="mdi:package-variant-closed"
          label="Tổng sản phẩm"
          value={String(productsQuery.data?.total ?? 0)}
        />
        <AdminStatCard
          icon="mdi:store-outline"
          label="Đang bán"
          value={String(stats.active)}
        />
        <AdminStatCard
          icon="mdi:eye-off-outline"
          label="Tạm ẩn"
          value={String(stats.inactive)}
        />
        <AdminStatCard
          icon="mdi:archive-outline"
          label="Tồn kho hiện tại"
          value={String(stats.totalStock)}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_420px]">
        <AdminPanel>
          <AdminPanelHeader title="Danh sách sản phẩm" />
          <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:px-6">
            <div className="relative w-full">
              <Icon
                icon="mdi:magnify"
                width={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(event) => {
                  setPage(1);
                  startTransition(() => setSearch(event.target.value));
                }}
                placeholder="Tìm theo tên, SKU, slug"
                className="w-full rounded-xl border border-gray-300 px-11 py-3 text-sm outline-none"
              />
            </div>
          </div>

          <div className="px-4 pb-4 pt-4 md:hidden">
            {products.length ? (
              <div className="space-y-3">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className={[
                      "rounded-2xl border p-4 transition",
                      selectedProductId === product.id
                        ? "border-blue-200 bg-blue-50/80"
                        : "border-gray-200 bg-white",
                    ].join(" ")}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setFormMode("edit");
                        setSelectedProductId(product.id);
                        setFormError(null);
                      }}
                      className="block w-full text-left"
                    >
                      <p className="truncate font-semibold text-black">{product.name}</p>
                      <p className="mt-1 truncate text-xs text-gray-500">
                        {product.sku} · {product.slug}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">Tạo ngày {formatAdminDate(product.created)}</p>
                    </button>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Giá</p>
                        <p className="font-semibold tabular-nums text-black">{formatPrice(product.price)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Kho</p>
                        <p className="font-semibold text-gray-900">{product.totalStock ?? product.stock}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <AdminBadge className={product.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"}>
                        {product.isActive ? "Đang bán" : "Tạm ẩn"}
                      </AdminBadge>
                      <button
                        type="button"
                        onClick={() => void toggleMutation.mutateAsync(product.id)}
                        className="inline-flex min-h-9 items-center rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700"
                      >
                        <Icon icon="mdi:eye-outline" width={16} className="mr-1.5" />
                        Ẩn/Hiện
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Xóa sản phẩm "${product.name}"?`)) {
                            void deleteMutation.mutateAsync(product.id);
                          }
                        }}
                        className="inline-flex min-h-9 items-center rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700"
                      >
                        <Icon icon="mdi:delete-outline" width={16} className="mr-1.5" />
                        Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <AdminEmptyState
                icon="mdi:package-variant-closed"
                title="Không có sản phẩm phù hợp"
                description="Thử thay đổi từ khóa tìm kiếm hoặc tạo mới sản phẩm."
              />
            )}
          </div>

          <div className="hidden overflow-x-auto px-2 pb-4 pt-2 sm:px-4 md:block">
            <table className="min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-[11px] uppercase tracking-[0.18em] text-gray-500">
                  <th className="px-4 py-3 font-semibold">Sản phẩm</th>
                  <th className="px-4 py-3 font-semibold">Giá</th>
                  <th className="px-4 py-3 font-semibold">Kho</th>
                  <th className="px-5 py-3 font-semibold">Trạng thái</th>
                  <th className="px-4 py-3 font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    selected={selectedProductId === product.id}
                    onSelect={() => {
                      setFormMode("edit");
                      setSelectedProductId(product.id);
                      setFormError(null);
                    }}
                    onToggle={() => void toggleMutation.mutateAsync(product.id)}
                    onDelete={() => void deleteMutation.mutateAsync(product.id)}
                  />
                ))}
              </tbody>
            </table>

            {!products.length ? (
              <div className="px-2 py-4">
                <AdminEmptyState
                  icon="mdi:package-variant-closed"
                  title="Không có sản phẩm phù hợp"
                  description="Thử thay đổi từ khóa tìm kiếm hoặc tạo mới sản phẩm."
                />
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <span>Tổng {productsQuery.data?.total ?? 0} sản phẩm</span>
            <div className="flex items-center gap-2">
              <AdminSecondaryButton
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
                className="px-3 py-2"
              >
                Trước
              </AdminSecondaryButton>
              <span className="px-2 font-semibold text-black">
                {page}/{productsQuery.data?.totalPages ?? 1}
              </span>
              <AdminSecondaryButton
                type="button"
                disabled={page >= (productsQuery.data?.totalPages ?? 1)}
                onClick={() => setPage((current) => current + 1)}
                className="px-3 py-2"
              >
                Sau
              </AdminSecondaryButton>
            </div>
          </div>
        </AdminPanel>

        <AdminPanel>
          <AdminPanelHeader title={formMode === "create" ? "Thêm sản phẩm mới" : "Chỉnh sửa sản phẩm"} />
          {isLoadingSelectedProduct ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 px-5 py-5 text-sm text-gray-500 sm:px-6">
              <Icon icon="mdi:loading" width={28} className="animate-spin text-sky-600" />
              <span>Đang tải thông tin sản phẩm...</span>
            </div>
          ) : (
          <div className="space-y-4 px-5 py-5 sm:px-6">
            <Field label="SKU">
              <input
                value={form.sku}
                onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value }))}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none"
              />
            </Field>
            <Field label="Tên sản phẩm">
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none"
              />
            </Field>
            <Field label="Slug">
              <input
                value={form.slug}
                onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none"
              />
            </Field>
            <Field label="Mô tả">
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                className="min-h-28 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Giá bán">
                <input
                  type="number"
                  value={form.price}
                  onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none"
                />
              </Field>
              <Field label="Tồn kho">
                <input
                  type="number"
                  value={form.stock}
                  onChange={(event) => setForm((current) => ({ ...current, stock: event.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none"
                />
              </Field>
              <Field label="Rating trung bình">
                <input
                  type="number"
                  step="0.1"
                  value={form.averageRating}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, averageRating: event.target.value }))
                  }
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none"
                />
              </Field>
              <Field label="Số review">
                <input
                  type="number"
                  value={form.reviewCount}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, reviewCount: event.target.value }))
                  }
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none"
                />
              </Field>
            </div>

            <Field label="Brand ID">
              <input
                value={form.brandId}
                onChange={(event) => setForm((current) => ({ ...current, brandId: event.target.value }))}
                placeholder="Để trống nếu không có brand"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none"
              />
            </Field>

            <Field label="Danh mục">
              <div className="grid gap-2 rounded-xl border border-gray-300 p-3">
                {(categoriesQuery.data ?? []).map((category) => {
                  const checked = form.categoryIds.includes(category.id);
                  return (
                    <label key={category.id} className="flex items-center gap-3 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setForm((current) => ({
                            ...current,
                            categoryIds: checked
                              ? current.categoryIds.filter((item) => item !== category.id)
                              : [...current.categoryIds, category.id],
                          }))
                        }
                      />
                      <span>{category.name}</span>
                    </label>
                  );
                })}
              </div>
            </Field>

            <Field label="Ảnh sản phẩm">
              <div className="space-y-3">
                <input
                  value={form.imageUrl}
                  onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value }))}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none"
                />
                <input
                  value={form.imageKey}
                  onChange={(event) => setForm((current) => ({ ...current, imageKey: event.target.value }))}
                  placeholder="Image key"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none"
                />
                <input type="file" accept="image/*" onChange={(event) => void handleUploadFile(event.target.files)} />
                {uploading ? <p className="text-sm text-gray-500">Đang tải ảnh...</p> : null}
                {form.imageUrl ? (
                  <img
                    src={form.imageUrl}
                    alt="Preview"
                    className="h-28 w-28 rounded-xl border border-gray-200 object-cover"
                  />
                ) : null}
              </div>
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <ToggleField
                label="Có tính thuế"
                checked={form.taxable}
                onToggle={() => setForm((current) => ({ ...current, taxable: !current.taxable }))}
              />
              <ToggleField
                label="Đang bán"
                checked={form.isActive}
                onToggle={() => setForm((current) => ({ ...current, isActive: !current.isActive }))}
              />
            </div>

            {selectedProductQuery.data?.variants?.length ? (
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-sm font-medium text-gray-800">Biến thể hiện có</p>
                <div className="mt-3 space-y-2">
                  {selectedProductQuery.data.variants.map((variant) => (
                    <div key={variant.id} className="flex flex-col gap-1 rounded-lg bg-gray-50 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                      <span className="break-words">{variant.sku}</span>
                      <span className="shrink-0">
                        {formatPrice(variant.price)} · Kho {variant.stock}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {formError ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div> : null}
            {createMutation.isSuccess ? (
              <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Tạo sản phẩm thành công.
              </div>
            ) : null}
            {updateMutation.isSuccess ? (
              <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Cập nhật sản phẩm thành công.
              </div>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row">
              <AdminPrimaryButton
                type="button"
                onClick={() => void handleSubmit()}
                className="flex-1"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                <Icon
                  icon={formMode === "create" ? "mdi:plus-circle-outline" : "mdi:content-save-outline"}
                  width={18}
                  className="mr-2"
                />
                {formMode === "create"
                  ? createMutation.isPending
                    ? "Đang tạo..."
                    : "Thêm sản phẩm"
                  : updateMutation.isPending
                    ? "Đang lưu..."
                    : "Lưu thay đổi"}
              </AdminPrimaryButton>
              <AdminSecondaryButton type="button" onClick={resetForm}>
                <Icon icon="mdi:refresh" width={18} className="mr-2" />
                Làm mới
              </AdminSecondaryButton>
            </div>
          </div>
          )}
        </AdminPanel>
      </div>
    </div>
  );
}

const ProductRow = memo(function ProductRow({
  product,
  selected,
  onSelect,
  onToggle,
  onDelete,
}: {
  product: ProductSummaryDto;
  selected: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <tr className={["border-b border-gray-200 last:border-b-0", selected ? "bg-gray-50" : ""].join(" ")}>
      <td className="px-4 py-4">
        <button type="button" onClick={onSelect} className="text-left">
          <p className="font-semibold text-black">{product.name}</p>
          <p className="text-xs text-gray-500">
            {product.sku} · {product.slug}
          </p>
          <p className="text-xs text-gray-500">Tạo ngày {formatAdminDate(product.created)}</p>
        </button>
      </td>
      <td className="px-4 py-4">
        <p className="text-[13px] font-semibold tabular-nums text-black">{formatPrice(product.price)}</p>
      </td>
      <td className="px-4 py-4 text-gray-700">{product.totalStock ?? product.stock}</td>
      <td className="px-4 py-4">
        <AdminBadge className={product.isActive ? "min-w-[96px] items-center justify-center text-center leading-5 bg-emerald-100 text-emerald-700" : "min-w-[96px] items-center justify-center text-center leading-5 bg-gray-100 text-gray-700"}>
          {product.isActive ? "Đang bán" : "Tạm ẩn"}
        </AdminBadge>
      </td>
      <td className="px-4 py-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700"
          >
            <Icon icon="mdi:eye-outline" width={16} className="mr-1.5" />
            Ẩn/Hiện
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm(`Xóa sản phẩm "${product.name}"?`)) {
                onDelete();
              }
            }}
            className="inline-flex items-center rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700"
          >
            <Icon icon="mdi:delete-outline" width={16} className="mr-1.5" />
            Xóa
          </button>
        </div>
      </td>
    </tr>
  );
}, (previous, next) => previous.product === next.product && previous.selected === next.selected);

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}

function ToggleField({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center justify-between rounded-xl border border-gray-300 px-4 py-3 text-sm"
    >
      <span className="font-medium text-gray-700">{label}</span>
      <AdminBadge className={checked ? "bg-black text-white" : "bg-gray-100 text-gray-700"}>
        {checked ? "Bật" : "Tắt"}
      </AdminBadge>
    </button>
  );
}
