import { Icon } from "@iconify/react";
import { startTransition, useEffect, useMemo, useState } from "react";
import { Roles, type Role } from "../../@types/enums.type";
import {
  useAdminUser,
  useAdminUsers,
  useDeleteAdminUser,
  useUpdateAdminUserRole,
} from "../../hooks/useAdmin";
import { useDebounce } from "../../hooks/useDebounce";
import { formatPrice } from "../../utils/formatPrice";
import {
  AdminBadge,
  AdminEmptyState,
  AdminPanel,
  AdminPanelHeader,
  AdminPrimaryButton,
  AdminSecondaryButton,
  AdminStatCard,
  ResizableTh,
  formatAdminDate,
  formatAdminDateTime,
  formatOrderStatusLabel,
  formatRoleLabel,
  roleBadgeClass,
  statusTone,
  useResizableColumns,
} from "./adminShared";

const roleOptions: Array<Role | ""> = ["", Roles.Admin, Roles.Merchant, Roles.Member];
const PAGE_SIZE = 10;

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<string>();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [draftRole, setDraftRole] = useState<Role | "">("");
  const [merchantId, setMerchantId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { widths, startResize } = useResizableColumns([46, 60, 170, 210, 130, 150, 140, 120]);

  const debouncedSearch = useDebounce(search, 350);
  const filters = useMemo(
    () => ({
      search: debouncedSearch,
      role: role || undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
    [debouncedSearch, page, role]
  );

  const usersQuery = useAdminUsers(filters);
  const selectedUserQuery = useAdminUser(selectedUserId);
  const updateRoleMutation = useUpdateAdminUserRole();
  const deleteUserMutation = useDeleteAdminUser();
  const selectedUser = selectedUserQuery.data;
  const users = usersQuery.data?.items ?? [];

  const roleSummary = useMemo(() => {
    return {
      admin: users.filter((item) => item.role === "Admin").length,
      merchant: users.filter((item) => item.role === "Merchant").length,
      member: users.filter((item) => item.role === "Member").length,
    };
  }, [users]);

  const allCurrentSelected =
    users.length > 0 && users.every((u) => selectedIds.includes(u.id));

  const toggleSelectAll = () => {
    if (allCurrentSelected) {
      const currentIds = new Set(users.map((u) => u.id));
      setSelectedIds((prev) => prev.filter((id) => !currentIds.has(id)));
    } else {
      const merged = new Set([...selectedIds, ...users.map((u) => u.id)]);
      setSelectedIds(Array.from(merged));
    }
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) return;
    if (!confirm(`Bạn có chắc muốn xóa ${selectedIds.length} tài khoản đã chọn?`)) return;

    try {
      for (const id of selectedIds) {
        await deleteUserMutation.mutateAsync(id);
      }
      if (selectedUserId && selectedIds.includes(selectedUserId)) {
        setSelectedUserId(undefined);
      }
      setSelectedIds([]);
    } catch (error) {
      alert((error as Error).message || "Không thể xóa tài khoản đã chọn.");
    }
  };

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
      setFormError("Mã định danh là bắt buộc khi cấp vai trò Nhân viên bán hàng.");
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
          label="Quản trị viên"
          value={String(roleSummary.admin)}
          meta="Quyền hệ thống"
          accentClass="bg-blue-50 text-blue-700"
        />
        <AdminStatCard
          label="Nhân viên bán hàng"
          value={String(roleSummary.merchant)}
          meta="Có mã định danh bán hàng"
          accentClass="bg-cyan-50 text-cyan-700"
        />
        <AdminStatCard
          label="Người dùng"
          value={String(roleSummary.member)}
          meta={`Tổng ${usersQuery.data?.total ?? 0}`}
          accentClass="bg-sky-50 text-sky-700"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_380px]">
        <AdminPanel className="self-start">
          <AdminPanelHeader
            title="Danh sách tài khoản"
            action={
              selectedIds.length > 0 ? (
                <button
                  type="button"
                  onClick={() => void handleDeleteSelected()}
                  disabled={deleteUserMutation.isPending}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  <Icon icon="mdi:delete-outline" width={16} />
                  <span>
                    {deleteUserMutation.isPending
                      ? "Đang xóa..."
                      : `Xóa đã chọn (${selectedIds.length})`}
                  </span>
                </button>
              ) : null
            }
          />

          <div className="flex flex-col gap-3 border-b border-slate-200/80 px-5 py-4 sm:flex-row sm:px-6">
            <div className="relative flex-1">
              <Icon
                icon="mdi:magnify"
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
                placeholder="Tìm theo tên, thư điện tử, số điện thoại"
                className="w-full rounded-lg border border-sky-200 bg-slate-50 px-11 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white"
              />
            </div>

            <select
              value={role}
              onChange={(event) => {
                setPage(1);
                setRole(event.target.value as Role | "");
              }}
              className="w-full rounded-lg border border-sky-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 sm:w-auto"
            >
              <option value="">Tất cả vai trò</option>
              <option value="Admin">Quản trị viên</option>
              <option value="Merchant">Nhân viên bán hàng</option>
              <option value="Member">Người dùng</option>
            </select>
          </div>

          <div className="overflow-x-auto px-2 pt-2 sm:px-4">
            <table className="w-full table-fixed border-collapse font-inter text-sm font-normal">
              <colgroup>
                {widths.map((w, i) => (
                  <col key={i} style={{ width: w }} />
                ))}
              </colgroup>
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] uppercase tracking-[0.12em] text-slate-500">
                  <ResizableTh align="center" onResizeStart={startResize(0)}>
                    <input
                      type="checkbox"
                      checked={allCurrentSelected}
                      onChange={toggleSelectAll}
                      aria-label="Chọn tất cả"
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </ResizableTh>
                  <ResizableTh align="center" onResizeStart={startResize(1)}>
                    STT
                  </ResizableTh>
                  <ResizableTh onResizeStart={startResize(2)}>Họ và tên</ResizableTh>
                  <ResizableTh onResizeStart={startResize(3)}>Thư điện tử</ResizableTh>
                  <ResizableTh onResizeStart={startResize(4)}>Số điện thoại</ResizableTh>
                  <ResizableTh align="center" onResizeStart={startResize(5)}>
                    Vai trò
                  </ResizableTh>
                  <ResizableTh align="center" onResizeStart={startResize(6)}>
                    Trạng thái
                  </ResizableTh>
                  <ResizableTh showDivider={false}>Ngày tạo</ResizableTh>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => {
                  const stt = (page - 1) * PAGE_SIZE + index + 1;
                  const checked = selectedIds.includes(user.id);
                  return (
                    <tr
                      key={user.id}
                      onClick={() => setSelectedUserId(user.id)}
                      className={[
                        "cursor-pointer border-b border-slate-100 transition last:border-b-0 hover:bg-sky-50/70",
                        selectedUserId === user.id ? "bg-blue-50/70" : "",
                      ].join(" ")}
                    >
                      <td
                        className="whitespace-nowrap px-3 py-3 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSelectUser(user.id)}
                          aria-label={`Chọn ${user.fullName || user.email}`}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-center font-normal text-slate-500">
                        {stt}
                      </td>
                      <td
                        className="truncate whitespace-nowrap px-3 py-3 font-medium text-slate-800"
                        title={user.fullName || "Chưa cập nhật"}
                      >
                        {user.fullName || "Chưa cập nhật"}
                      </td>
                      <td
                        className="truncate whitespace-nowrap px-3 py-3 font-normal text-slate-600"
                        title={user.email}
                      >
                        {user.email}
                      </td>
                      <td
                        className="truncate whitespace-nowrap px-3 py-3 font-normal text-slate-600"
                        title={user.phoneNumber || "Chưa cập nhật"}
                      >
                        {user.phoneNumber || "Chưa cập nhật"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-center">
                        <AdminBadge className={[roleBadgeClass[user.role], "max-w-full truncate"].join(" ")}>
                          {formatRoleLabel(user.role)}
                        </AdminBadge>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-center">
                        <AdminBadge
                          className={[
                            user.isOnline
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-600",
                            "max-w-full truncate",
                          ].join(" ")}
                        >
                          {user.isOnline ? "Đang hoạt động" : "Ngoại tuyến"}
                        </AdminBadge>
                      </td>
                      <td
                        className="truncate whitespace-nowrap px-3 py-3 font-normal text-slate-600"
                        title={formatAdminDate(user.created)}
                      >
                        {formatAdminDate(user.created)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {!users.length ? (
              <div className="px-2 py-4">
                <AdminEmptyState
                  icon="mdi:account-search-outline"
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

        <div className="min-h-[520px] xl:relative xl:self-stretch">
          <AdminPanel className="flex max-h-[680px] flex-col overflow-hidden xl:absolute xl:inset-0 xl:max-h-none">
            <AdminPanelHeader title="Chi tiết tài khoản" />

            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-5 sm:px-6">
            {!selectedUserId ? (
              <AdminEmptyState
                icon="mdi:card-account-details-outline"
                title="Chọn một tài khoản"
                description="Thông tin chi tiết sẽ hiển thị tại đây."
              />
            ) : selectedUserQuery.isLoading ? (
              <div className="h-72 animate-pulse rounded-lg bg-slate-100" />
            ) : selectedUser ? (
              <div className="space-y-5">
                <div className="rounded-lg border border-slate-200/80 bg-white p-5">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold text-slate-900">
                      {selectedUser.fullName || "Chưa cập nhật tên"}
                    </p>
                    <p className="mt-1 truncate text-sm text-slate-600">{selectedUser.email}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {selectedUser.phoneNumber || "Chưa có số điện thoại"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <AdminBadge className={roleBadgeClass[selectedUser.role]}>
                        {formatRoleLabel(selectedUser.role)}
                      </AdminBadge>
                      <AdminBadge
                        className={
                          selectedUser.isOnline
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }
                      >
                        {selectedUser.isOnline ? "Đang hoạt động" : "Ngoại tuyến"}
                      </AdminBadge>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoCard label="Tổng đơn" value={String(selectedUser.totalOrders ?? 0)} />
                  <InfoCard label="Tổng chi tiêu" value={formatPrice(selectedUser.totalSpent ?? 0)} />
                  <InfoCard label="Ngày tạo" value={formatAdminDate(selectedUser.created)} />
                  <InfoCard label="Mua gần nhất" value={formatAdminDate(selectedUser.lastOrderAt)} />
                </div>

                <div className="rounded-lg border border-slate-200/80 bg-white p-5">
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
                        className="w-full rounded-lg border border-sky-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400"
                      >
                        {roleOptions.map((item) => (
                          <option key={item || "empty"} value={item}>
                            {item ? formatRoleLabel(item) : "Chọn vai trò"}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-800">
                        Mã định danh bán hàng
                      </span>
                      <input
                        value={merchantId}
                        onChange={(event) => {
                          setMerchantId(event.target.value);
                          setFormError(null);
                        }}
                        disabled={draftRole !== "Merchant"}
                        placeholder="Bắt buộc khi vai trò là Nhân viên bán hàng"
                        className="w-full rounded-lg border border-sky-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 disabled:bg-slate-100 disabled:text-slate-400"
                      />
                    </label>

                    {formError ? (
                      <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                        {formError}
                      </div>
                    ) : null}

                    {updateRoleMutation.isSuccess ? (
                      <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
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

                <div className="rounded-lg border border-slate-200/80 bg-white p-5">
                  <p className="text-sm font-semibold text-slate-800">Đơn hàng gần đây</p>
                  {(selectedUser.recentOrders ?? []).length ? (
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full table-fixed border-collapse font-inter text-xs font-normal">
                        <thead>
                          <tr className="border-b border-slate-200 text-left uppercase tracking-wider text-slate-400">
                            <th className="w-24 whitespace-nowrap py-2 pr-2 font-medium">Mã đơn</th>
                            <th className="w-28 whitespace-nowrap px-2 py-2 font-medium">Thời gian</th>
                            <th className="w-24 whitespace-nowrap px-2 py-2 text-right font-medium">Tổng tiền</th>
                            <th className="w-28 whitespace-nowrap py-2 pl-2 text-center font-medium">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(selectedUser.recentOrders ?? []).map((order) => (
                            <tr key={order.id} className="border-b border-slate-100 last:border-b-0">
                              <td className="truncate whitespace-nowrap py-2.5 pr-2 font-medium text-slate-800" title={order.id}>
                                {order.id}
                              </td>
                              <td className="truncate whitespace-nowrap px-2 py-2.5 font-normal text-slate-500" title={formatAdminDateTime(order.created)}>
                                {formatAdminDateTime(order.created)}
                              </td>
                              <td className="truncate whitespace-nowrap px-2 py-2.5 text-right font-medium text-slate-800">
                                {formatPrice(order.totalAmount ?? 0)}
                              </td>
                              <td className="whitespace-nowrap py-2.5 pl-2 text-center">
                                <AdminBadge className={[statusTone(order.status), "max-w-full truncate"].join(" ")}>
                                  {formatOrderStatusLabel(order.status)}
                                </AdminBadge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-500">Chưa có đơn hàng nào.</p>
                  )}
                </div>
              </div>
            ) : (
              <AdminEmptyState
                icon="mdi:alert-circle-outline"
                title="Không tìm thấy người dùng"
                description="Tài khoản có thể đã bị xóa hoặc không tồn tại."
              />
            )}
          </div>
          </AdminPanel>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200/80 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 truncate text-base font-semibold text-slate-900" title={value}>{value}</p>
    </div>
  );
}
