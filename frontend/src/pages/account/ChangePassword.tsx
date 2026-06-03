import { Icon } from "@iconify/react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ROUTES } from "../../lib/routes";

type FormState = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const initialForm: FormState = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export default function ChangePassword() {
  const navigate = useNavigate();
  const { changePassword, isAuthenticated, user } = useAuth();

  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<keyof FormState, boolean>>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(ROUTES.SIGN_IN, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const returnPath = useMemo(() => {
    return user?.role === "Admin" ? "/admin/settings" : "/profile";
  }, [user?.role]);

  const handleChange = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setServerError("");
  };

  const validate = () => {
    const nextErrors: FormErrors = {};

    if (!form.currentPassword.trim()) {
      nextErrors.currentPassword = "Vui lòng nhập mật khẩu hiện tại.";
    }

    if (!form.newPassword.trim()) {
      nextErrors.newPassword = "Vui lòng nhập mật khẩu mới.";
    } else if (form.newPassword.length < 6) {
      nextErrors.newPassword = "Mật khẩu mới phải có ít nhất 6 ký tự.";
    } else if (form.newPassword === form.currentPassword) {
      nextErrors.newPassword = "Mật khẩu mới phải khác mật khẩu hiện tại.";
    }

    if (!form.confirmPassword.trim()) {
      nextErrors.confirmPassword = "Vui lòng xác nhận mật khẩu mới.";
    } else if (form.confirmPassword !== form.newPassword) {
      nextErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setServerError("");

    try {
      await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      navigate(ROUTES.SIGN_IN, {
        replace: true,
        state: { from: returnPath, passwordChanged: true },
      });
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Không thể đổi mật khẩu.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-orange-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_minmax(0,520px)]">
          <section className="relative overflow-hidden rounded-[32px] border border-white/70 bg-white/85 p-8 shadow-xl backdrop-blur sm:p-10">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-orange-400/10 to-transparent" />
            <div className="relative space-y-6">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-orange-400 text-white shadow-lg">
                <Icon icon="mdi:lock-reset" width={28} />
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-red-500">
                  Bảo mật tài khoản
                </p>
                <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                  Đổi mật khẩu
                </h1>
                <p className="max-w-xl text-base leading-7 text-slate-600">
                  Sau khi đổi mật khẩu thành công, backend sẽ thu hồi phiên đăng nhập hiện tại và bạn
                  sẽ đăng nhập lại bằng mật khẩu mới.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <InfoCard
                  icon="mdi:shield-check-outline"
                  title="Xác thực mật khẩu cũ"
                  text="Backend chỉ chấp nhận đổi mật khẩu khi mật khẩu hiện tại khớp."
                />
                <InfoCard
                  icon="mdi:logout-variant"
                  title="Đăng nhập lại sau khi đổi"
                  text="Toàn bộ refresh token hiện tại sẽ bị thu hồi theo flow bảo mật."
                />
              </div>

              <div className="rounded-[28px] border border-red-100 bg-red-50/80 p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-xl bg-white p-2 text-red-500 shadow-sm">
                    <Icon icon="mdi:information-outline" width={20} />
                  </div>
                  <div className="space-y-2 text-sm leading-6 text-red-900">
                    <p className="font-semibold">Lưu ý trước khi đổi mật khẩu</p>
                    <p>
                      Nếu bạn đang đăng nhập ở nhiều thiết bị, các phiên đó cũng sẽ cần đăng nhập lại
                      sau khi đổi mật khẩu.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-xl backdrop-blur sm:p-8">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Cập nhật mật khẩu</h2>
                <p className="mt-1 text-sm text-slate-500">Nhập đúng mật khẩu hiện tại trước khi lưu.</p>
              </div>
              <Link
                to={returnPath}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                <Icon icon="mdi:arrow-left" width={18} />
                Quay lại
              </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <PasswordField
                id="currentPassword"
                label="Mật khẩu hiện tại"
                value={form.currentPassword}
                error={errors.currentPassword}
                visible={showPasswords.currentPassword}
                onToggle={() =>
                  setShowPasswords((current) => ({
                    ...current,
                    currentPassword: !current.currentPassword,
                  }))
                }
                onChange={(value) => handleChange("currentPassword", value)}
              />

              <PasswordField
                id="newPassword"
                label="Mật khẩu mới"
                value={form.newPassword}
                error={errors.newPassword}
                visible={showPasswords.newPassword}
                hint="Tối thiểu 6 ký tự và nên khác hoàn toàn mật khẩu cũ."
                onToggle={() =>
                  setShowPasswords((current) => ({
                    ...current,
                    newPassword: !current.newPassword,
                  }))
                }
                onChange={(value) => handleChange("newPassword", value)}
              />

              <PasswordField
                id="confirmPassword"
                label="Xác nhận mật khẩu mới"
                value={form.confirmPassword}
                error={errors.confirmPassword}
                visible={showPasswords.confirmPassword}
                onToggle={() =>
                  setShowPasswords((current) => ({
                    ...current,
                    confirmPassword: !current.confirmPassword,
                  }))
                }
                onChange={(value) => handleChange("confirmPassword", value)}
              />

              {serverError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {serverError}
                </div>
              ) : null}

            

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-500 to-orange-400 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Icon icon="mdi:check-circle-outline" width={18} />
                )}
                {submitting ? "Đang cập nhật mật khẩu..." : "Lưu mật khẩu mới"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[28px] border border-white/80 bg-white/90 p-5 shadow-sm">
      <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-red-600">
        <Icon icon={icon} width={22} />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  error,
  hint,
  visible,
  onToggle,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  hint?: string;
  visible: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={[
            "w-full rounded-2xl border bg-white px-4 py-3.5 pr-12 text-sm text-slate-900 outline-none transition",
            error
              ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
              : "border-slate-200 focus:border-red-400 focus:ring-2 focus:ring-red-100",
          ].join(" ")}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
          aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        >
          <Icon icon={visible ? "mdi:eye-off-outline" : "mdi:eye-outline"} width={20} />
        </button>
      </div>
      {error ? <p className="mt-2 text-xs font-medium text-red-500">{error}</p> : null}
      {!error && hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
    </label>
  );
}
