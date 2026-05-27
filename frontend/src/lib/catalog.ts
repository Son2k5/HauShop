import type { ProductQueryDto } from "../@types/product.type";

export const SORT_OPTIONS: {
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

export const PRICE_RANGES = [
  { label: "Tất cả", min: undefined, max: undefined },
  { label: "Dưới 500K", min: undefined, max: 500000 },
  { label: "500K – 1Tr", min: 500000, max: 1000000 },
  { label: "1Tr – 2Tr", min: 1000000, max: 2000000 },
  { label: "Trên 2Tr", min: 2000000, max: undefined },
] as const;

export const STATUS_OPTIONS = [
  { label: "Đang bán", value: true },
  { label: "Ngừng bán", value: false },
  { label: "Tất cả", value: undefined },
] as const;

export const PAGE_SIZE = 15;
