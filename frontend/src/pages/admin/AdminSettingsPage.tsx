import { Icon } from "@iconify/react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { UpdateProfileDto } from "../../@types/auth.type";
import { useAdminSettings, useUpdateAdminSettings } from "../../hooks/useAdmin";
import { useAuth } from "../../hooks/useAuth";
import { userService } from "../../services/userService";
import {
  AdminBadge,
  AdminPanel,
  AdminPanelHeader,
  AdminPrimaryButton,
  AdminSecondaryButton,
  AdminStatCard,
  getInitials,
} from "./adminShared";

type AdminSettingsState = {
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  lowStockThreshold: number;
  recentOrdersLimit: number;
  enableOrderNotifications: boolean;
  enableInventoryAlerts: boolean;
  enableWeeklySummary: boolean;
};

const STORAGE_KEY = "haushop_admin_settings";

const defaultSettings: AdminSettingsState = {
  storeName: "HauShop",
  supportEmail: "admin@haushop.vn",
  supportPhone: "1900 1234",
  lowStockThreshold: 5,
  recentOrdersLimit: 6,
  enableOrderNotifications: true,
  enableInventoryAlerts: true,
  enableWeeklySummary: false,
};

export default function AdminSettingsPage() {
  const { user, refreshUser, updateAvatar, removeAvatar } = useAuth();
  const settingsQuery = useAdminSettings();
  const updateSettingsMutation = useUpdateAdminSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState<AdminSettingsState>(defaultSettings);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const [profileForm, setProfileForm] = useState<UpdateProfileDto>({
    firstName: "",
    lastName: "",
    phoneNumber: "",
  });
  const [originalProfile, setOriginalProfile] = useState<UpdateProfileDto>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as AdminSettingsState & { savedAt?: string };
      setSettings({
        storeName: parsed.storeName ?? defaultSettings.storeName,
        supportEmail: parsed.supportEmail ?? defaultSettings.supportEmail,
        supportPhone: parsed.supportPhone ?? defaultSettings.supportPhone,
        lowStockThreshold: parsed.lowStockThreshold ?? defaultSettings.lowStockThreshold,
        recentOrdersLimit: parsed.recentOrdersLimit ?? defaultSettings.recentOrdersLimit,
        enableOrderNotifications:
          parsed.enableOrderNotifications ?? defaultSettings.enableOrderNotifications,
        enableInventoryAlerts:
          parsed.enableInventoryAlerts ?? defaultSettings.enableInventoryAlerts,
        enableWeeklySummary: parsed.enableWeeklySummary ?? defaultSettings.enableWeeklySummary,
      });
      setSavedAt(parsed.savedAt ?? null);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const data = {
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phoneNumber: user.phoneNumber || "",
    };
    setProfileForm(data);
    setOriginalProfile(data);
  }, [user]);

  useEffect(() => {
    if (!settingsQuery.data) return;

    setSettings({
      storeName: settingsQuery.data.storeName,
      supportEmail: settingsQuery.data.supportEmail,
      supportPhone: settingsQuery.data.supportPhone,
      lowStockThreshold: settingsQuery.data.lowStockThreshold,
      recentOrdersLimit: settingsQuery.data.recentOrdersLimit,
      enableOrderNotifications: settingsQuery.data.enableOrderNotifications,
      enableInventoryAlerts: settingsQuery.data.enableInventoryAlerts,
      enableWeeklySummary: settingsQuery.data.enableWeeklySummary,
    });

    if (settingsQuery.data.updated) {
      setSavedAt(new Date(settingsQuery.data.updated).toLocaleString("vi-VN"));
    }
  }, [settingsQuery.data]);

  const updateField = <K extends keyof AdminSettingsState>(key: K, value: AdminSettingsState[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
    setSettingsMessage(null);
  };

  const handleSaveSettings = async () => {
    const savedSettings = await updateSettingsMutation.mutateAsync(settings);
    const nextSavedAt = savedSettings.updated
      ? new Date(savedSettings.updated).toLocaleString("vi-VN")
      : new Date().toLocaleString("vi-VN");

    setSettings({
      storeName: savedSettings.storeName,
      supportEmail: savedSettings.supportEmail,
      supportPhone: savedSettings.supportPhone,
      lowStockThreshold: savedSettings.lowStockThreshold,
      recentOrdersLimit: savedSettings.recentOrdersLimit,
      enableOrderNotifications: savedSettings.enableOrderNotifications,
      enableInventoryAlerts: savedSettings.enableInventoryAlerts,
      enableWeeklySummary: savedSettings.enableWeeklySummary,
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...savedSettings, savedAt: nextSavedAt }));
    setSavedAt(nextSavedAt);
    setSettingsMessage("Đã lưu cấu hình cục bộ cho khu vực admin.");
  };

  const hasProfileChanges =
    profileForm.firstName !== originalProfile.firstName ||
    profileForm.lastName !== originalProfile.lastName ||
    profileForm.phoneNumber !== originalProfile.phoneNumber;

  const handleProfileChange = (key: keyof UpdateProfileDto, value: string) => {
    setProfileForm((current) => ({ ...current, [key]: value }));
    setProfileMessage(null);
  };

  const handleSaveProfile = async () => {
    if (!hasProfileChanges) return;

    setSavingProfile(true);
    setProfileMessage(null);

    try {
      await userService.updateProfile({
        firstName: profileForm.firstName?.trim(),
        lastName: profileForm.lastName?.trim(),
        phoneNumber: profileForm.phoneNumber?.trim(),
      });
      await refreshUser();
      setOriginalProfile(profileForm);
      setProfileMessage({ type: "success", text: "Đã cập nhật thông tin tài khoản." });
    } catch (error) {
      setProfileMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Không thể cập nhật tài khoản.",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setProfileMessage(null);

    try {
      await updateAvatar(file);
      setProfileMessage({ type: "success", text: "Đã cập nhật ảnh đại diện." });
    } catch (error) {
      setProfileMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Không thể tải ảnh đại diện.",
      });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveAvatar = async () => {
    if (!confirm("Bạn có chắc muốn xóa ảnh đại diện?")) return;

    setUploadingAvatar(true);
    setProfileMessage(null);

    try {
      await removeAvatar();
      setProfileMessage({ type: "success", text: "Đã xóa ảnh đại diện." });
    } catch (error) {
      setProfileMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Không thể xóa ảnh đại diện.",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const fullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "Admin";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          icon="mdi:store-outline"
          label="Tên cửa hàng"
          value={settings.storeName}
          meta="Hiển thị trong admin"
          accentClass="bg-blue-50 text-blue-700"
        />
        <AdminStatCard
          icon="mdi:package-variant-closed"
          label="Ngưỡng low stock"
          value={String(settings.lowStockThreshold)}
          meta="Áp dụng cho theo dõi kho"
          accentClass="bg-cyan-50 text-cyan-700"
        />
        <AdminStatCard
          icon="mdi:clipboard-text-outline"
          label="Đơn gần đây"
          value={String(settings.recentOrdersLimit)}
          meta="Hiển thị trên dashboard"
          accentClass="bg-sky-50 text-sky-700"
        />
        <AdminStatCard
          icon="mdi:clock-outline"
          label="Cập nhật gần nhất"
          value={savedAt ?? "--"}
          meta="Lưu trong localStorage"
          accentClass="bg-violet-50 text-violet-700"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <AdminPanel>
          <AdminPanelHeader
            title="Tài khoản quản trị"
          
          />

          <div className="space-y-5 p-5 sm:p-6">
            <div className="rounded-[26px] border border-sky-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f0f9ff_100%)] p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="relative shrink-0">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[26px] bg-[linear-gradient(135deg,#2563eb,#06b6d4)] text-2xl font-semibold text-white shadow-[0_18px_40px_rgba(37,99,235,0.2)]">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      getInitials(fullName)
                    )}
                  </div>
                  {uploadingAvatar ? (
                    <div className="absolute inset-0 flex items-center justify-center rounded-[26px] bg-black/45">
                      <div className="h-7 w-7 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    </div>
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-lg font-semibold text-slate-900">{fullName}</p>
                  <p className="truncate text-sm text-slate-500">{user?.email ?? "--"}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <AdminBadge className="bg-blue-100 text-blue-700">{user?.role ?? "Admin"}</AdminBadge>
                    <AdminBadge className={user?.isOnline ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}>
                      {user?.isOnline ? "Đang hoạt động" : "Ngoại tuyến"}
                    </AdminBadge>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  hidden
                  onChange={handleAvatarChange}
                />
                <div className="flex flex-col gap-3 sm:flex-row">
                  <AdminPrimaryButton type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar} className="w-full sm:w-auto">
                    <Icon icon="mdi:camera-outline" width={18} className="mr-2" />
                    Đổi ảnh đại diện
                  </AdminPrimaryButton>
                  <AdminSecondaryButton type="button" onClick={() => void handleRemoveAvatar()} disabled={uploadingAvatar || !user?.avatar} className="w-full sm:w-auto">
                    <Icon icon="mdi:trash-can-outline" width={18} className="mr-2" />
                    Xóa ảnh
                  </AdminSecondaryButton>
                </div>
                <Link
                  to="/change-password"
                  className="inline-flex items-center gap-2 text-sm font-medium text-red-600 transition hover:text-red-700"
                >
                  <Icon icon="mdi:lock-outline" width={18} />
                  <span>Đổi mật khẩu</span>
                </Link>
              </div>
            </div>

            {profileMessage ? (
              <div
                className={[
                  "rounded-[20px] px-4 py-3 text-sm",
                  profileMessage.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700",
                ].join(" ")}
              >
                {profileMessage.text}
              </div>
            ) : null}

            <div className="grid gap-4">
              <Field label="Tên">
                <input
                  value={profileForm.firstName ?? ""}
                  onChange={(event) => handleProfileChange("firstName", event.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none"
                />
              </Field>
              <Field label="Họ">
                <input
                  value={profileForm.lastName ?? ""}
                  onChange={(event) => handleProfileChange("lastName", event.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none"
                />
              </Field>
              <Field label="Số điện thoại">
                <input
                  value={profileForm.phoneNumber ?? ""}
                  onChange={(event) => handleProfileChange("phoneNumber", event.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none"
                />
              </Field>
            </div>

            <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
              Backend hiện hỗ trợ cập nhật 3 trường: <strong>Tên</strong>, <strong>Họ</strong>, <strong>Số điện thoại</strong>.
            </div>

            <AdminPrimaryButton type="button" onClick={() => void handleSaveProfile()} disabled={savingProfile || !hasProfileChanges} className="w-full">
              {savingProfile ? "Đang cập nhật tài khoản..." : "Lưu thông tin tài khoản"}
            </AdminPrimaryButton>
          </div>
        </AdminPanel>

        <div className="space-y-6">
          <AdminPanel>
            <AdminPanelHeader title="Thông tin cửa hàng"  />
            <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-6">
              <Field label="Tên cửa hàng">
                <input
                  value={settings.storeName}
                  onChange={(event) => updateField("storeName", event.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none"
                />
              </Field>
              <Field label="Email hỗ trợ">
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(event) => updateField("supportEmail", event.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none"
                />
              </Field>
              <Field label="Số điện thoại hỗ trợ">
                <input
                  value={settings.supportPhone}
                  onChange={(event) => updateField("supportPhone", event.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none"
                />
              </Field>
              <Field label="Số đơn gần đây trên dashboard">
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={settings.recentOrdersLimit}
                  onChange={(event) =>
                    updateField("recentOrdersLimit", Math.min(20, Math.max(1, Number(event.target.value) || 1)))
                  }
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none"
                />
              </Field>
              <Field label="Ngưỡng cảnh báo kho">
                <input
                  type="number"
                  min={0}
                  value={settings.lowStockThreshold}
                  onChange={(event) =>
                    updateField("lowStockThreshold", Math.max(0, Number(event.target.value) || 0))
                  }
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none"
                />
              </Field>
            </div>
          </AdminPanel>

          <AdminPanel>
            <AdminPanelHeader title="Thông báo"  />
            <div className="space-y-4 px-5 py-5 sm:px-6">
              <ToggleRow
                label="Thông báo đơn hàng mới"
                checked={settings.enableOrderNotifications}
                onChange={(checked) => updateField("enableOrderNotifications", checked)}
              />
              <ToggleRow
                label="Cảnh báo tồn kho thấp"
                checked={settings.enableInventoryAlerts}
                onChange={(checked) => updateField("enableInventoryAlerts", checked)}
              />
              <ToggleRow
                label="Báo cáo tổng hợp tuần"
                checked={settings.enableWeeklySummary}
                onChange={(checked) => updateField("enableWeeklySummary", checked)}
              />

              <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                Các mục bên dưới đang được lưu cục bộ trên frontend. Nếu cần, mình có thể nối tiếp sang API backend sau.
              </div>

              {settingsMessage ? (
                <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {settingsMessage}
                </div>
              ) : null}

              <AdminPrimaryButton
                type="button"
                onClick={() => void handleSaveSettings()}
                className="w-full"
                disabled={updateSettingsMutation.isPending}
              >
                Lưu cài đặt admin
              </AdminPrimaryButton>
            </div>
          </AdminPanel>
        </div>
      </div>
    </div>
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

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm font-medium text-gray-800">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={[
          "inline-flex rounded-full px-3 py-1 text-xs font-medium",
          checked ? "bg-black text-white" : "bg-gray-100 text-gray-700",
        ].join(" ")}
      >
        {checked ? "Bật" : "Tắt"}
      </button>
    </div>
  );
}
