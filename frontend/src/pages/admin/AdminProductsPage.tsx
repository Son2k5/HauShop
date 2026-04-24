import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type { CreateProductDto, ProductDto, ProductSummaryDto, UpdateProductDto } from "../../@types/product.type";
import { queryKeys } from "../../lib/queryKeys";
import { categoryService } from "../../services/categoryService";
import { productService, uploadImages } from "../../services/productService";
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

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedProductId, setSelectedProductId] = useState<string>();
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const productsQuery = useQuery({
    queryKey: queryKeys.products.list({ search, page, pageSize: 12, sortBy: "created", sortOrder: "desc" }),
    queryFn: () =>
      productService.getAll({
        search,
        page,
        pageSize: 12,
        sortBy: "created",
        sortOrder: "desc",
      }),
    placeholderData: (prev) => prev,
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories", "active"],
    queryFn: () => categoryService.getActive(),
    staleTime: 60_000,
  });

  const selectedProductQuery = useQuery({
    queryKey: queryKeys.products.detailById(selectedProductId ?? ""),
    queryFn: () => productService.getById(selectedProductId!),
    enabled: !!selectedProductId,
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateProductDto) => productService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", "list"] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateProductDto }) => productService.update(id, dto),
    onSuccess: (product) => {
      queryClient.setQueryData(queryKeys.products.detailById(product.id), product);
      queryClient.invalidateQueries({ queryKey: ["products", "list"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productService.delete(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: queryKeys.products.detailById(deletedId) });
      queryClient.invalidateQueries({ queryKey: ["products", "list"] });
      if (selectedProductId === deletedId) {
        resetForm();
      }
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => productService.toggleActive(id),
    onSuccess: (product) => {
      queryClient.setQueryData(queryKeys.products.detailById(product.id), product);
      queryClient.invalidateQueries({ queryKey: ["products", "list"] });
    },
  });

  const stats = useMemo(() => {
    const items = productsQuery.data?.items ?? [];
    return {
      active: items.filter((item) => item.isActive).length,
      inactive: items.filter((item) => !item.isActive).length,
      totalStock: items.reduce((sum, item) => sum + (item.totalStock ?? item.stock ?? 0), 0),
    };
  }, [productsQuery.data?.items]);

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
      

      <div className="grid gap-4 md:grid-cols-4">
        <AdminStatCard label="Tổng sản phẩm" value={String(productsQuery.data?.total ?? 0)} />
        <AdminStatCard label="Đang bán" value={String(stats.active)} />
        <AdminStatCard label="Tạm ẩn" value={String(stats.inactive)} />
        <AdminStatCard label="Tồn kho trạng hiện tại" value={String(stats.totalStock)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_420px]">
        <AdminPanel>
          <AdminPanelHeader title="Danh sách sản phẩm" />
          <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:px-6">
            <input
              value={search}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
              placeholder="Tìm theo tên, SKU, slug"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none"
            />
          </div>

          <div className="overflow-x-auto px-2 pb-4 pt-2 sm:px-4">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-[11px] uppercase tracking-[0.18em] text-gray-500">
                  <th className="px-4 py-3 font-semibold">Sản phẩm</th>
                  <th className="px-4 py-3 font-semibold">Giá</th>
                  <th className="px-4 py-3 font-semibold">Kho</th>
                  <th className="px-4 py-3 font-semibold">Trạng thái</th>
                  <th className="px-4 py-3 font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {(productsQuery.data?.items ?? []).map((product) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    selected={selectedProductId === product.id}
                    onSelect={async () => {
                      const detail = await productService.getById(product.id);
                      fillForm(detail);
                    }}
                    onToggle={() => void toggleMutation.mutateAsync(product.id)}
                    onDelete={() => void deleteMutation.mutateAsync(product.id)}
                  />
                ))}
              </tbody>
            </table>

            {!productsQuery.data?.items.length ? (
              <div className="px-2 py-4">
                <AdminEmptyState
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
                    <div key={variant.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                      <span>{variant.sku}</span>
                      <span>
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

            <div className="flex gap-2">
              <AdminPrimaryButton
                type="button"
                onClick={() => void handleSubmit()}
                className="flex-1"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {formMode === "create"
                  ? createMutation.isPending
                    ? "Đang tạo..."
                    : "Thêm sản phẩm"
                  : updateMutation.isPending
                    ? "Đang lưu..."
                    : "Lưu thay đổi"}
              </AdminPrimaryButton>
              <AdminSecondaryButton type="button" onClick={resetForm}>
                Làm mới
              </AdminSecondaryButton>
            </div>
          </div>
        </AdminPanel>
      </div>
    </div>
  );
}

function ProductRow({
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
      <td className="px-4 py-4 font-medium text-black">{formatPrice(product.minVariantPrice ?? product.price)}</td>
      <td className="px-4 py-4 text-gray-700">{product.totalStock ?? product.stock}</td>
      <td className="px-4 py-4">
        <AdminBadge className={product.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"}>
          {product.isActive ? "Đang bán" : "Tạm ẩn"}
        </AdminBadge>
      </td>
      <td className="px-4 py-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onToggle}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700"
          >
            Ẩn/Hiện
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm(`Xóa sản phẩm "${product.name}"?`)) {
                onDelete();
              }
            }}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700"
          >
            Xóa
          </button>
        </div>
      </td>
    </tr>
  );
}

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
