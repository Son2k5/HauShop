import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import type { ReviewStatus } from "../@types/enums.type";
import { ReviewStatuses } from "../@types/enums.type";
import { queryKeys } from "../lib/queryKeys";
import { ROUTES } from "../lib/routes";
import { deleteReviewApi, getMyReviewsApi } from "../services/reviewService";

const reviewStatusMeta: Record<ReviewStatus, { label: string; tone: string }> = {
  [ReviewStatuses.WaitingApproval]: {
    label: "Chờ duyệt",
    tone: "bg-amber-50 text-amber-700",
  },
  [ReviewStatuses.Approved]: {
    label: "Đã duyệt",
    tone: "bg-emerald-50 text-emerald-700",
  },
  [ReviewStatuses.Rejected]: {
    label: "Bị từ chối",
    tone: "bg-red-50 text-red-700",
  },
};

export default function MyReviewsPage() {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const queryClient = useQueryClient();

  const reviewsQuery = useQuery({
    queryKey: queryKeys.reviews.mine(page, pageSize),
    queryFn: () => getMyReviewsApi(page, pageSize),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteReviewApi,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["reviews", "mine"] });
    },
  });

  const reviews = reviewsQuery.data?.items ?? [];
  const total = reviewsQuery.data?.total ?? 0;
  const totalPages = reviewsQuery.data?.totalPages ?? 0;
  const canGoPrevious = page > 1;
  const canGoNext = totalPages > 0 && page < totalPages;

  const handleDelete = async (reviewId: string) => {
    const confirmed = window.confirm("Bạn có chắc muốn xóa đánh giá này?");
    if (!confirmed) return;

    await deleteMutation.mutateAsync(reviewId);
  };

  if (reviewsQuery.isLoading) {
    return (
      <div className="mx-auto max-w-container space-y-4 px-4 py-12 sm:px-6 lg:px-10">
        <div className="h-28 animate-skeleton bg-gray-100" />
        <div className="h-28 animate-skeleton bg-gray-100" />
        <div className="h-28 animate-skeleton bg-gray-100" />
      </div>
    );
  }

  if (reviewsQuery.isError) {
    const error = reviewsQuery.error as { message?: string };

    return (
      <div className="mx-auto max-w-container px-4 py-12 sm:px-6 lg:px-10">
        <p className="text-red-500">{error?.message ?? "Không thể tải đánh giá."}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-container px-4 py-12 sm:px-6 lg:px-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Account</p>
          <h1 className="mt-2 font-titleFont text-3xl font-bold text-gray-950">Đánh giá sản phẩm</h1>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to={ROUTES.ORDERS}
            className="inline-flex h-10 items-center justify-center border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:border-gray-950 hover:text-gray-950"
          >
            Đơn hàng của tôi 
          </Link>
          <Link
            to={ROUTES.CANCELLATIONS}
            className="inline-flex h-10 items-center justify-center border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:border-gray-950 hover:text-gray-950"
          >
            Đơn hàng đã hủy
          </Link>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="border border-dashed border-gray-200 px-6 py-10 text-center">
          <p className="text-sm text-lightText">Bạn chưa có đánh giá nào.</p>
          <Link
            to={ROUTES.ORDERS}
            className="mt-5 inline-flex h-11 items-center justify-center bg-primeColor px-6 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Xem đơn hàng
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          <p className="text-sm text-lightText">{total} Đánh giá</p>

          <div className="space-y-5">
            {reviews.map((review) => {
              const statusMeta = reviewStatusMeta[review.status] ?? {
                label: review.status,
                tone: "bg-gray-100 text-gray-600",
              };

              return (
                <article key={review.id} className="border border-gray-200 bg-white p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-lg font-semibold text-gray-950">{review.productName}</p>
                      <p className="mt-1 text-sm text-lightText">
                        {new Date(review.created).toLocaleString("vi-VN")}
                      </p>
                    </div>

                    <span
                      className={[
                        "inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold",
                        statusMeta.tone,
                      ].join(" ")}
                    >
                      {statusMeta.label}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-1" aria-label={`${review.rating} sao`}>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <span
                        key={index}
                        className={index < review.rating ? "text-warning" : "text-gray-200"}
                      >
                        ★
                      </span>
                    ))}
                    <span className="ml-2 text-sm font-medium text-gray-700">{review.rating}/5</span>
                  </div>

                  {review.content ? (
                    <p className="mt-3 text-sm leading-6 text-gray-600">{review.content}</p>
                  ) : null}

                  <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                    <Link
                      to={ROUTES.SHOP}
                      className="text-sm font-medium text-gray-700 transition hover:text-red-500"
                    >
                      Tiếp tục mua sắm
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleDelete(review.id)}
                      disabled={deleteMutation.isPending}
                      className="text-sm font-semibold text-red-500 transition hover:text-red-600 disabled:opacity-50"
                    >
                      Xóa đánh giá
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {totalPages > 1 ? (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={!canGoPrevious}
                className="h-10 border border-gray-300 px-4 text-sm disabled:opacity-50"
              >
                Trước
              </button>
              <span className="text-sm text-lightText">
                Trang {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => current + 1)}
                disabled={!canGoNext}
                className="h-10 border border-gray-300 px-4 text-sm disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
