import { Icon } from "@iconify/react";
import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import type { Role } from "../../@types/auth.type";
import { useAdminUser, useAdminUsers, useUpdateAdminUserRole } from "../../hooks/useAdmin";
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
  formatAdminDateTime,
  formatRoleLabel,
  getInitials,
  roleBadgeClass,
} from "./adminShared";

const roleOptions: Array<Role | ""> = ["", "Admin", "Merchant", "Member"];

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<string>();
  const [draftRole, setDraftRole] = useState<Role | "">("");
  const [merchantId, setMerchantId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const deferredSearch = useDeferredValue(search);
  const filters = useMemo(
    () => ({
      search: deferredSearch,
      role: role || undefined,
      page,
      pageSize: 10,
    }),
    [deferredSearch, page, role]
  );

  const usersQuery = useAdminUsers(filters);
  const selectedUserQuery = useAdminUser(selectedUserId);
  const updateRoleMutation = useUpdateAdminUserRole();
  const selectedUser = selectedUserQuery.data;

  const roleSummary = useMemo(() => {
    const items = usersQuery.data?.items ?? [];
    return {
      admin: items.filter((item) => item.role === "Admin").length,
      merchant: items.filter((item) => item.role === "Merchant").length,
      member: items.filter((item) => item.role === "Member").length,
    };
  }, [usersQuery.data?.items]);

  useEffect(() => {
    if (!selectedUser) return;
    setDraftRole(selectedUser.role);
    setMerchantId(selectedUser.merchantId ?? "");
    setFormError(null);
  }, [selectedUser]);

  const handleSubmitRole = async () => {
    if (!selectedUserId || !draftRole) {
      setFormError("Cần chọn người dùng và vai trò hợp lệ.");
      return;
    }

    if (draftRole === "Merchant" && !merchantId.trim()) {
      setFormError("Merchant ID là bắt buộc khi cấp vai trò Merchant.");
      return;
    }

    setFormError(null);

    try {
      await updateRoleMutation.mutateAsync({
        userId: selectedUserId,
        dto: {
          role: draftRole,
          merchantId: draftRole === "Merchant" ? merchantId.trim() : null,
        },
      });
    } catch (error) {
      setFormError((error as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AdminStatCard
          icon="solar:shield-user-bold-duotone"
          label="Admin"
          value={String(roleSummary.admin)}
          meta="Quyền hệ thống"
          accentClass="bg-blue-50 text-blue-700"
        />
        <AdminStatCard
          icon="solar:shop-bold-duotone"
          label="Nhân viên bán hàng"
          value={String(roleSummary.merchant)}
          meta="Có Merchant ID"
          accentClass="bg-cyan-50 text-cyan-700"
        />
        <AdminStatCard
          icon="solar:user-bold-duotone"
          label="Người dùng"
          value={String(roleSummary.member)}
          meta={`Tổng ${usersQuery.data?.total ?? 0}`}
          accentClass="bg-sky-50 text-sky-700"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_420px]">
        <AdminPanel>
          <AdminPanelHeader title="Danh sách tài khoản" />

          <div className="flex flex-col gap-3 border-b border-slate-200/80 px-5 py-5 sm:flex-row sm:px-6">
            <div className="relative flex-1">
              <Icon
                icon="solar:magnifer-bold-duotone"
                width={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => {
                  const value = event.target.value;
                  startTransition(() => {
                    setPage(1);
                    setSearch(value);
                  });
                }}
                placeholder="Tìm theo tên, email, số điện thoại"
                className="w-full rounded-xl border border-sky-200 bg-slate-50 px-11 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white"
              />
            </div>

            <select
              value={role}
              onChange={(event) => {
                setPage(1);
                setRole(event.target.value as Role | "");
              }}
              className="rounded-xl border border-sky-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400"
            >
              <option value="">Tất cả vai trò</option>
              <option value="Admin">Admin</option>
              <option value="Merchant">Merchant</option>
              <option value="Member">Member</option>
            </select>
          </div>

          <div className="overflow-x-auto px-2 pb-4 pt-2 sm:px-4">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-[0.18em] text-slate-500">
                  <th className="px-4 py-3 font-semibold">Người dùng</th>
                  <th className="px-4 py-3 font-semibold">Vai trò</th>
                  <th className="px-4 py-3 font-semibold">Trạng thái</th>
                  <th className="px-4 py-3 font-semibold">Ngày tạo</th>
                </tr>
              </thead>
              <tbody>
                {(usersQuery.data?.items ?? []).map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    className={[
                      "cursor-pointer border-b border-slate-100 transition last:border-b-0 hover:bg-sky-50/70",
                      selectedUserId === user.id ? "bg-blue-50/70" : "",
                    ].join(" ")}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2563eb,#06b6d4)] text-sm font-semibold text-white">
                          {getInitials(user.fullName)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">
                            {user.fullName || "Chưa cập nhật tên"}
                          </p>
                          <p className="truncate text-slate-600">{user.email}</p>
                          <p className="truncate text-xs text-slate-400">
                            {user.phoneNumber || "Chưa có số điện thoại"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <AdminBadge className={roleBadgeClass[user.role]}>
                        {formatRoleLabel(user.role)}
                      </AdminBadge>
                    </td>
                    <td className="px-4 py-4">
                      <AdminBadge className={user.isOnline ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}>
                        {user.isOnline ? "Online" : "Offline"}
                      </AdminBadge>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{formatAdminDate(user.created)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!usersQuery.data?.items.length ? (
              <div className="px-2 py-4">
                <AdminEmptyState
                  icon="solar:user-speak-bold-duotone"
                  title="Không có tài khoản phù hợp"
                  description="Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc hiện tại."
                />
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200/80 px-5 py-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <span>Tổng {usersQuery.data?.total ?? 0} tài khoản</span>
            <div className="flex items-center gap-2">
              <AdminSecondaryButton
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
                className="px-3 py-2"
              >
                Trước
              </AdminSecondaryButton>
              <span className="px-2 font-semibold text-slate-900">
                {page}/{usersQuery.data?.totalPages ?? 1}
              </span>
              <AdminSecondaryButton
                type="button"
                disabled={page >= (usersQuery.data?.totalPages ?? 1)}
                onClick={() => setPage((current) => current + 1)}
                className="px-3 py-2"
              >
                Sau
              </AdminSecondaryButton>
            </div>
          </div>
        </AdminPanel>

        <AdminPanel>
          <AdminPanelHeader title="Chi tiết tài khoản" />

          <div className="px-5 pb-6 pt-5 sm:px-6">
            {!selectedUserId ? (
              <AdminEmptyState
                icon="solar:user-id-bold-duotone"
                title="Chọn một tài khoản"
                description="Thông tin chi tiết sẽ hiển thị tại đây."
              />
            ) : selectedUserQuery.isLoading ? (
              <div className="h-72 animate-pulse rounded-[24px] bg-slate-100" />
            ) : selectedUser ? (
              <div className="space-y-5">
                <div className="rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f0f9ff_100%)] p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[linear-gradient(135deg,#2563eb,#06b6d4)] text-base font-semibold text-white">
                      {getInitials(selectedUser.fullName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-semibold text-slate-900">{selectedUser.fullName}</p>
                      <p className="truncate text-sm text-slate-600">{selectedUser.email}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <AdminBadge className={roleBadgeClass[selectedUser.role]}>
                          {formatRoleLabel(selectedUser.role)}
                        </AdminBadge>
                        <AdminBadge className={selectedUser.isOnline ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}>
                          {selectedUser.isOnline ? "Đang hoạt động" : "Ngoại tuyến"}
                        </AdminBadge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <InfoCard label="Tổng đơn" value={String(selectedUser.totalOrders)} />
                  <InfoCard label="Tổng chi tiêu" value={formatPrice(selectedUser.totalSpent)} />
                  <InfoCard label="Ngày tạo" value={formatAdminDate(selectedUser.created)} />
                  <InfoCard label="Mua gần nhất" value={formatAdminDate(selectedUser.lastOrderAt)} />
                </div>

                <div className="rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5">
                  <div className="space-y-4">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-800">Vai trò</span>
                      <select
                        value={draftRole}
                        onChange={(event) => {
                          setDraftRole(event.target.value as Role | "");
                          setFormError(null);
                          if (event.target.value !== "Merchant") {
                            setMerchantId("");
                          }
                        }}
                        className="w-full rounded-xl border border-sky-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400"
                      >
                        {roleOptions.map((item) => (
                          <option key={item || "empty"} value={item}>
                            {item ? formatRoleLabel(item) : "Chọn vai trò"}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-800">Merchant ID</span>
                      <input
                        value={merchantId}
                        onChange={(event) => {
                          setMerchantId(event.target.value);
                          setFormError(null);
                        }}
                        disabled={draftRole !== "Merchant"}
                        placeholder="Bắt buộc khi vai trò là Merchant"
                        className="w-full rounded-xl border border-sky-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 disabled:bg-slate-100 disabled:text-slate-400"
                      />
                    </label>

                    {formError ? (
                      <div className="rounded-[18px] bg-red-50 px-4 py-3 text-sm text-red-700">
                        {formError}
                      </div>
                    ) : null}

                    {updateRoleMutation.isSuccess ? (
                      <div className="rounded-[18px] bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        Cập nhật vai trò thành công.
                      </div>
                    ) : null}

                    <AdminPrimaryButton
                      type="button"
                      onClick={() => void handleSubmitRole()}
                      disabled={
                        updateRoleMutation.isPending ||
                        !draftRole ||
                        (draftRole === "Merchant" && !merchantId.trim())
                      }
                      className="w-full"
                    >
                      {updateRoleMutation.isPending ? "Đang cập nhật..." : "Cập nhật phân quyền"}
                    </AdminPrimaryButton>
                  </div>
                </div>

                <div className="rounded-[24px] border border-slate-200/80 bg-white p-5">
                  <p className="text-sm font-semibold text-slate-800">Thông tin thêm</p>
                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    <ActivityRow
                      label="Số điện thoại"
                      value={selectedUser.phoneNumber || "Chưa cập nhật"}
                    />
                    <ActivityRow
                      label="Merchant ID"
                      value={selectedUser.merchantId || "Không liên kết"}
                    />
                    <ActivityRow
                      label="Hoạt động cuối"
                      value={formatAdminDateTime(selectedUser.lastSeen)}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <AdminEmptyState
                icon="solar:danger-circle-bold-duotone"
                title="Không tìm thấy hồ sơ"
                description="Tài khoản này có thể đã bị xóa hoặc không còn tồn tại."
              />
            )}
          </div>
        </AdminPanel>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-slate-200/80 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-base font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function ActivityRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
      <span className="text-slate-400">{label}</span>
      <span className="text-right font-medium text-slate-800">{value}</span>
    </div>
  );
}
