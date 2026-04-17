import api from "../api/apiClient";

export type ReviewStatus = 0 | 1 | 2;

export interface ReviewDto {
  id: string;
  productId: string;
  productName: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  rating: number;
  content?: string | null;
  status: ReviewStatus;
  created: string;
  updated?: string | null;
}

export interface PagedReviewDto {
  items: ReviewDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateReviewDto {
  productId: string;
  rating: number;
  content?: string;
}

export async function getProductReviewsApi(
  productId: string,
  page = 1,
  pageSize = 10
): Promise<PagedReviewDto> {
  const res = await api.get(`/review/product/${productId}`, {
    params: { page, pageSize },
  });
  return res.data;
}

export async function createReviewApi(dto: CreateReviewDto): Promise<ReviewDto> {
  const res = await api.post("/review", dto);
  return res.data;
}

export async function getMyReviewsApi(page = 1, pageSize = 10): Promise<PagedReviewDto> {
  const res = await api.get("/review/me", {
    params: { page, pageSize },
  });
  return res.data;
}

export async function deleteReviewApi(reviewId: string): Promise<void> {
  await api.delete(`/review/${reviewId}`);
}
