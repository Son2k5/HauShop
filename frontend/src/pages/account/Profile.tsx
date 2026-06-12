import { Icon } from '@iconify/react';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AddressDto, CreateAddressDto } from '../../@types/address.type';
import type { UpdateProfileDto } from '../../@types/auth.type';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../lib/routes';
import { userService } from '../../services/userService';

const translateRole = (role?: string) => {
    const roles: Record<string, string> = {
        Admin: 'Quản trị viên',
        Member: 'Khách hàng',
        Merchant: 'Nhà bán hàng',
    };

    return roles[role ?? ''] ?? 'Khách hàng';
};

const translateProvider = (provider?: string) => {
    const providers: Record<string, string> = {
        Local: 'Mật khẩu',
        Google: 'Google',
    };

    return providers[provider ?? 'Local'] ?? 'Mật khẩu';
};

const formatDate = (value?: string | null) =>
    value
        ? new Intl.DateTimeFormat('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
          }).format(new Date(value))
        : 'Chưa có thông tin';

const formatDateTime = (value?: string | null) =>
    value
        ? new Intl.DateTimeFormat('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
          }).format(new Date(value))
        : 'Chưa có thông tin';

const translateError = (message: string) => {
    const messages: Record<string, string> = {
        'Failed to load addresses': 'Không thể tải danh sách địa chỉ.',
        'Failed to update profile': 'Không thể cập nhật hồ sơ.',
        'Failed to upload avatar': 'Không thể tải ảnh đại diện.',
        'Failed to remove avatar': 'Không thể xóa ảnh đại diện.',
        'Failed to save address': 'Không thể lưu địa chỉ.',
        'Failed to delete address': 'Không thể xóa địa chỉ.',
        'File must be an image': 'Tệp tải lên phải là hình ảnh.',
        'File size must be less than 5MB': 'Dung lượng ảnh phải nhỏ hơn 5MB.',
        'Invalid address response': 'Dữ liệu địa chỉ trả về không hợp lệ.',
    };

    return messages[message] ?? message;
};

const panelClass = 'rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';
const inputClass =
    'h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-100';
const secondaryButtonClass =
    'inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50';
const primaryButtonClass =
    'inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,23,42,0.16)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-45';

const emptyAddressForm: CreateAddressDto = {
    addressLine: '',
    city: '',
    state: '',
    country: 'Việt Nam',
    zipCode: '',
    isDefault: false,
};

const Profile: React.FC = () => {
    const { user, updateAvatar, removeAvatar, refreshUser, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<UpdateProfileDto>({
        firstName: '',
        lastName: '',
        phoneNumber: '',
    });
    const [originalData, setOriginalData] = useState<UpdateProfileDto>({});
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [avatarVersion, setAvatarVersion] = useState(() => Date.now());
    const [addresses, setAddresses] = useState<AddressDto[]>([]);
    const [addressForm, setAddressForm] = useState<CreateAddressDto>(emptyAddressForm);
    const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
    const [addressesLoading, setAddressesLoading] = useState(false);
    const [savingAddress, setSavingAddress] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate(ROUTES.SIGN_IN);
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        if (!user) return;

        const data = {
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            phoneNumber: user.phoneNumber || '',
        };
        setFormData(data);
        setOriginalData(data);
    }, [user]);

    const loadAddresses = async () => {
        try {
            setAddressesLoading(true);
            const data = await userService.getAddresses();
            setAddresses(data);
        } catch (error) {
            const msg = error instanceof Error ? translateError(error.message) : 'Không thể tải danh sách địa chỉ.';
            setMessage({ type: 'error', text: msg });
        } finally {
            setAddressesLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            void loadAddresses();
        }
    }, [isAuthenticated]);

    const hasChanges = () =>
        formData.firstName !== originalData.firstName ||
        formData.lastName !== originalData.lastName ||
        formData.phoneNumber !== originalData.phoneNumber;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setMessage(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hasChanges()) return;

        const payload = {
            firstName: formData.firstName?.trim(),
            lastName: formData.lastName?.trim(),
            phoneNumber: formData.phoneNumber?.trim(),
        };

        setLoading(true);
        setMessage(null);

        try {
            await userService.updateProfile(payload);
            await refreshUser();
            setFormData(payload);
            setOriginalData(payload);
            setMessage({ type: 'success', text: 'Đã cập nhật hồ sơ thành công.' });
        } catch (error) {
            const msg = error instanceof Error ? translateError(error.message) : 'Không thể cập nhật hồ sơ.';
            setMessage({ type: 'error', text: msg });
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setMessage({ type: 'error', text: 'Vui lòng chọn một tệp hình ảnh.' });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'Dung lượng ảnh phải nhỏ hơn 5MB.' });
            return;
        }

        setUploadingAvatar(true);
        setMessage(null);

        try {
            await updateAvatar(file);
            setAvatarVersion(Date.now());
            setMessage({ type: 'success', text: 'Đã cập nhật ảnh đại diện.' });
        } catch (error) {
            const msg = error instanceof Error ? translateError(error.message) : 'Không thể tải ảnh đại diện.';
            setMessage({ type: 'error', text: msg });
        } finally {
            setUploadingAvatar(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemoveAvatar = async () => {
        if (!confirm('Bạn có chắc muốn xóa ảnh đại diện không?')) return;

        setLoading(true);
        setMessage(null);

        try {
            await removeAvatar();
            setAvatarVersion(Date.now());
            setMessage({ type: 'success', text: 'Đã xóa ảnh đại diện.' });
        } catch (error) {
            const msg = error instanceof Error ? translateError(error.message) : 'Không thể xóa ảnh đại diện.';
            setMessage({ type: 'error', text: msg });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setFormData(originalData);
        setMessage(null);
    };

    const resetAddressForm = () => {
        setAddressForm(emptyAddressForm);
        setEditingAddressId(null);
    };

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setAddressForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        setMessage(null);
    };

    const handleEditAddress = (address: AddressDto) => {
        setEditingAddressId(address.id);
        setAddressForm({
            addressLine: address.addressLine,
            city: address.city,
            state: address.state || '',
            country: address.country || 'Việt Nam',
            zipCode: address.zipCode || '',
            isDefault: address.isDefault,
        });
        setMessage(null);
    };

    const handleSaveAddress = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!addressForm.addressLine.trim() || !addressForm.city.trim()) {
            setMessage({ type: 'error', text: 'Vui lòng nhập địa chỉ và tỉnh/thành phố.' });
            return;
        }

        try {
            setSavingAddress(true);
            const payload = {
                ...addressForm,
                addressLine: addressForm.addressLine.trim(),
                city: addressForm.city.trim(),
                state: addressForm.state?.trim(),
                country: addressForm.country?.trim() || 'Việt Nam',
                zipCode: addressForm.zipCode?.trim(),
                isDefault: addressForm.isDefault || addresses.length === 0,
            };

            if (editingAddressId) {
                await userService.updateAddress(editingAddressId, payload);
                setMessage({ type: 'success', text: 'Đã cập nhật địa chỉ.' });
            } else {
                await userService.createAddress(payload);
                setMessage({ type: 'success', text: 'Đã thêm địa chỉ mới.' });
            }

            resetAddressForm();
            await loadAddresses();
        } catch (error) {
            const msg = error instanceof Error ? translateError(error.message) : 'Không thể lưu địa chỉ.';
            setMessage({ type: 'error', text: msg });
        } finally {
            setSavingAddress(false);
        }
    };

    const handleDeleteAddress = async (addressId: string) => {
        if (!confirm('Bạn có chắc muốn xóa địa chỉ này không?')) return;

        try {
            setSavingAddress(true);
            await userService.deleteAddress(addressId);
            if (editingAddressId === addressId) {
                resetAddressForm();
            }
            setMessage({ type: 'success', text: 'Đã xóa địa chỉ.' });
            await loadAddresses();
        } catch (error) {
            const msg = error instanceof Error ? translateError(error.message) : 'Không thể xóa địa chỉ.';
            setMessage({ type: 'error', text: msg });
        } finally {
            setSavingAddress(false);
        }
    };

    if (!user) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
                    <p className="text-sm font-medium text-slate-500">Đang tải hồ sơ...</p>
                </div>
            </div>
        );
    }

    const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
    const avatarSrc = user.avatar ? `${user.avatar}?t=${avatarVersion}` : null;
    const profileHasChanges = hasChanges();
    const defaultAddress = addresses.find(address => address.isDefault);
    const completedProfileFields = [user.firstName, user.lastName, user.email, user.phoneNumber, user.avatar].filter(Boolean).length;
    const profileScore = Math.round((completedProfileFields / 5) * 100);
    const providerLabel = translateProvider(user.provider);

    const accountStats = [
        {
            label: 'Hồ sơ',
            value: `${profileScore}%`,
            meta: profileScore === 100 ? 'Đã hoàn thiện' : 'Cần bổ sung thông tin',
            icon: 'mdi:account-check-outline',
            tone: 'text-blue-700 bg-blue-50 border-blue-100',
        },
        {
            label: 'Địa chỉ',
            value: String(addresses.length),
            meta: defaultAddress ? 'Có địa chỉ mặc định' : 'Chưa chọn mặc định',
            icon: 'mdi:map-marker-radius-outline',
            tone: 'text-emerald-700 bg-emerald-50 border-emerald-100',
        },
        {
            label: 'Đăng nhập',
            value: providerLabel,
            meta: user.provider === 'Google' ? 'Xác thực qua Google' : 'Tài khoản mật khẩu',
            icon: 'mdi:shield-key-outline',
            tone: 'text-violet-700 bg-violet-50 border-violet-100',
        },
        {
            label: 'Trạng thái',
            value: user.isOnline ? 'Online' : 'Offline',
            meta: `Lần cuối: ${formatDateTime(user.lastSeen)}`,
            icon: 'mdi:access-time',
            tone: user.isOnline ? 'text-teal-700 bg-teal-50 border-teal-100' : 'text-slate-700 bg-slate-50 border-slate-200',
        },
    ];

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-slate-500">Account Center</p>
                        <h1 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">
                            Quản lý tài khoản
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                            Cập nhật thông tin cá nhân, địa chỉ giao hàng và bảo mật tài khoản HauShop trong một không gian gọn, rõ ràng.
                        </p>
                    </div>

                    <div className="inline-flex w-fit items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
                        <span className={['h-2 w-2 rounded-full', user.isOnline ? 'bg-emerald-500' : 'bg-slate-400'].join(' ')} />
                        <span>{user.isOnline ? 'Đang hoạt động' : `Hoạt động gần nhất ${formatDateTime(user.lastSeen)}`}</span>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                    <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
                        <section className={`${panelClass} p-4`}>
                            <div className="flex items-start gap-3">
                                <button
                                    type="button"
                                    onClick={handleAvatarClick}
                                    className="group relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-950 text-xl font-semibold text-white shadow-sm"
                                    aria-label="Đổi ảnh đại diện"
                                >
                                    {avatarSrc ? (
                                        <img src={avatarSrc} alt="Ảnh đại diện" className="h-full w-full object-cover" />
                                    ) : (
                                        initials || 'U'
                                    )}
                                    <span className="absolute inset-0 flex items-center justify-center bg-slate-950/45 opacity-0 transition group-hover:opacity-100">
                                        <Icon icon="mdi:camera-outline" width={22} />
                                    </span>
                                    {uploadingAvatar ? (
                                        <span className="absolute inset-0 flex items-center justify-center bg-slate-950/55">
                                            <span className="h-7 w-7 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        </span>
                                    ) : null}
                                </button>

                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-lg font-semibold text-slate-950">{fullName || 'Hồ sơ của tôi'}</p>
                                    <p className="mt-1 truncate text-sm text-slate-500">{user.email}</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <StatusPill tone="slate">{translateRole(user.role)}</StatusPill>
                                        <StatusPill tone={user.isOnline ? 'green' : 'gray'}>
                                            {user.isOnline ? 'Online' : 'Offline'}
                                        </StatusPill>
                                    </div>
                                </div>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                className="hidden"
                                onChange={handleAvatarChange}
                            />

                            <div className="mt-4 grid gap-2">
                                <button
                                    type="button"
                                    onClick={handleAvatarClick}
                                    disabled={uploadingAvatar}
                                    className={secondaryButtonClass}
                                >
                                    <Icon icon="mdi:image-plus-outline" width={18} />
                                    {uploadingAvatar ? 'Đang tải ảnh...' : 'Tải ảnh mới'}
                                </button>

                                {user.avatar ? (
                                    <button
                                        type="button"
                                        onClick={handleRemoveAvatar}
                                        disabled={loading}
                                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <Icon icon="mdi:trash-can-outline" width={18} />
                                        Xóa ảnh
                                    </button>
                                ) : null}
                            </div>

                            <p className="mt-3 text-xs leading-5 text-slate-500">
                                JPG, PNG, WebP hoặc GIF. Dung lượng tối đa 5MB.
                            </p>
                        </section>

                        <section className={panelClass}>
                            <div className="border-b border-slate-200 px-4 py-3">
                                <p className="text-sm font-semibold text-slate-900">Điều hướng</p>
                            </div>
                            <nav className="p-2">
                                <SidebarLink href="#overview" icon="mdi:view-dashboard-outline" label="Tổng quan" active />
                                <SidebarLink href="#profile-details" icon="mdi:account-outline" label="Thông tin cá nhân" />
                                <SidebarLink href="#addresses" icon="mdi:map-marker-outline" label="Địa chỉ giao hàng" />
                                <SidebarLink href="#security" icon="mdi:lock-outline" label="Bảo mật" />
                            </nav>
                        </section>

                        <section className={`${panelClass} p-4`}>
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Sức khỏe tài khoản</p>
                                    <p className="mt-1 text-sm text-slate-500">{profileScore}% thông tin đã hoàn thiện</p>
                                </div>
                                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-blue-50 text-blue-700">
                                    <Icon icon="mdi:chart-donut" width={22} />
                                </div>
                            </div>
                            <div className="mt-4 h-2 rounded-full bg-slate-100">
                                <div className="h-full rounded-full bg-blue-600" style={{ width: `${profileScore}%` }} />
                            </div>
                        </section>
                    </aside>

                    <main className="min-w-0 space-y-6" id="overview">
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            {accountStats.map(stat => (
                                <StatCard key={stat.label} {...stat} />
                            ))}
                        </div>

                        {message ? (
                            <div
                                className={[
                                    'rounded-lg border px-4 py-3 shadow-sm',
                                    message.type === 'success'
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                        : 'border-red-200 bg-red-50 text-red-800',
                                ].join(' ')}
                            >
                                <div className="flex items-start gap-3">
                                    <Icon
                                        icon={message.type === 'success' ? 'mdi:check-circle-outline' : 'mdi:alert-circle-outline'}
                                        width={20}
                                        className="mt-0.5 shrink-0"
                                    />
                                    <span className="text-sm font-medium leading-6">{message.text}</span>
                                </div>
                            </div>
                        ) : null}

                        <section id="profile-details" className={panelClass}>
                            <SectionHeader
                                title="Thông tin cá nhân"
                                description="Thông tin này được dùng cho đơn hàng, hỗ trợ khách hàng và xác minh tài khoản."
                                icon="mdi:account-outline"
                            />

                            <form onSubmit={handleSubmit}>
                                <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
                                    <Field label="Tên" required>
                                        <input
                                            type="text"
                                            id="firstName"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            required
                                            className={inputClass}
                                            placeholder="Nhập tên"
                                        />
                                    </Field>

                                    <Field label="Họ" required>
                                        <input
                                            type="text"
                                            id="lastName"
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            required
                                            className={inputClass}
                                            placeholder="Nhập họ"
                                        />
                                    </Field>

                                    <Field label="Email">
                                        <div className="flex h-11 items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
                                            <span className="truncate">{user.email}</span>
                                            <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                                Đã xác thực
                                            </span>
                                        </div>
                                    </Field>

                                    <Field label="Số điện thoại">
                                        <input
                                            type="tel"
                                            id="phoneNumber"
                                            name="phoneNumber"
                                            value={formData.phoneNumber}
                                            onChange={handleChange}
                                            className={inputClass}
                                            placeholder="Nhập số điện thoại"
                                        />
                                    </Field>
                                </div>

                                <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={[
                                                'flex h-9 w-9 items-center justify-center rounded-md',
                                                profileHasChanges ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700',
                                            ].join(' ')}
                                        >
                                            <Icon icon={profileHasChanges ? 'mdi:clock-outline' : 'mdi:check-outline'} width={19} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">
                                                {profileHasChanges ? 'Có thay đổi chưa lưu' : 'Thông tin đã được lưu'}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                {profileHasChanges
                                                    ? 'Nhấn lưu để cập nhật hồ sơ của bạn.'
                                                    : 'Dữ liệu hiện tại đã đồng bộ với hệ thống.'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        <button
                                            type="button"
                                            onClick={handleCancel}
                                            disabled={loading || !profileHasChanges}
                                            className={secondaryButtonClass}
                                        >
                                            Hủy
                                        </button>
                                        <button type="submit" disabled={loading || !profileHasChanges} className={primaryButtonClass}>
                                            {loading ? <Spinner /> : <Icon icon="mdi:content-save-outline" width={18} />}
                                            Lưu thay đổi
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </section>

                        <section id="addresses" className={panelClass}>
                            <SectionHeader
                                title="Địa chỉ giao hàng"
                                description="Quản lý địa chỉ mặc định và các địa chỉ dùng khi thanh toán."
                                icon="mdi:map-marker-radius-outline"
                                action={
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                        {addresses.length} địa chỉ
                                    </span>
                                }
                            />

                            <div className="grid gap-6 p-4 xl:grid-cols-[minmax(0,1fr)_380px] sm:p-5">
                                <form onSubmit={handleSaveAddress} className="grid gap-4">
                                    <Field label="Địa chỉ cụ thể" required>
                                        <input
                                            type="text"
                                            id="addressLine"
                                            name="addressLine"
                                            value={addressForm.addressLine}
                                            onChange={handleAddressChange}
                                            required
                                            className={inputClass}
                                            placeholder="Số nhà, đường, phường/xã..."
                                        />
                                    </Field>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Field label="Tỉnh/Thành phố" required>
                                            <input
                                                type="text"
                                                id="city"
                                                name="city"
                                                value={addressForm.city}
                                                onChange={handleAddressChange}
                                                required
                                                className={inputClass}
                                                placeholder="Nhập tỉnh/thành phố"
                                            />
                                        </Field>

                                        <Field label="Quận/Huyện">
                                            <input
                                                type="text"
                                                id="state"
                                                name="state"
                                                value={addressForm.state}
                                                onChange={handleAddressChange}
                                                className={inputClass}
                                                placeholder="Nhập quận/huyện"
                                            />
                                        </Field>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Field label="Quốc gia">
                                            <input
                                                type="text"
                                                id="country"
                                                name="country"
                                                value={addressForm.country}
                                                onChange={handleAddressChange}
                                                className={inputClass}
                                                placeholder="Việt Nam"
                                            />
                                        </Field>

                                        <Field label="Mã bưu chính">
                                            <input
                                                type="text"
                                                id="zipCode"
                                                name="zipCode"
                                                value={addressForm.zipCode}
                                                onChange={handleAddressChange}
                                                className={inputClass}
                                                placeholder="Nhập mã bưu chính"
                                            />
                                        </Field>
                                    </div>

                                    <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700">
                                        <input
                                            type="checkbox"
                                            name="isDefault"
                                            checked={addressForm.isDefault}
                                            onChange={handleAddressChange}
                                            className="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-300"
                                        />
                                        Đặt làm địa chỉ giao hàng mặc định
                                    </label>

                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        <button type="submit" disabled={savingAddress} className={primaryButtonClass}>
                                            {savingAddress ? <Spinner /> : <Icon icon={editingAddressId ? 'mdi:pencil-outline' : 'mdi:plus'} width={18} />}
                                            {editingAddressId ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ'}
                                        </button>

                                        {editingAddressId ? (
                                            <button type="button" onClick={resetAddressForm} disabled={savingAddress} className={secondaryButtonClass}>
                                                Hủy chỉnh sửa
                                            </button>
                                        ) : null}
                                    </div>
                                </form>

                                <div className="min-w-0">
                                    <div className="mb-3 flex items-center justify-between gap-3">
                                        <p className="text-sm font-semibold text-slate-900">Địa chỉ đã lưu</p>
                                        {defaultAddress ? <StatusPill tone="green">Có mặc định</StatusPill> : null}
                                    </div>

                                    {addressesLoading ? (
                                        <div className="h-28 animate-pulse rounded-lg bg-slate-100" />
                                    ) : addresses.length === 0 ? (
                                        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-500">
                                            Bạn chưa có địa chỉ giao hàng. Hãy thêm địa chỉ trước khi thanh toán.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {addresses.map(address => (
                                                <div key={address.id} className="rounded-lg border border-slate-200 bg-white p-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                                                            <Icon icon="mdi:map-marker-outline" width={18} />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <p className="break-words text-sm font-semibold text-slate-950">{address.displayText}</p>
                                                                {address.isDefault ? <StatusPill tone="green">Mặc định</StatusPill> : null}
                                                            </div>
                                                            <p className="mt-1 text-sm leading-6 text-slate-500">
                                                                {[address.city, address.state, address.country, address.zipCode].filter(Boolean).join(', ')}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEditAddress(address)}
                                                            disabled={savingAddress}
                                                            className="inline-flex min-h-9 flex-1 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            <Icon icon="mdi:pencil-outline" width={17} />
                                                            Sửa
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteAddress(address.id)}
                                                            disabled={savingAddress}
                                                            className="inline-flex min-h-9 flex-1 items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            <Icon icon="mdi:trash-can-outline" width={17} />
                                                            Xóa
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        <section id="security" className={panelClass}>
                            <SectionHeader
                                title="Bảo mật"
                                description="Kiểm tra phương thức đăng nhập và cập nhật mật khẩu định kỳ để bảo vệ tài khoản."
                                icon="mdi:shield-lock-outline"
                            />

                            <div className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center sm:p-5">
                                <div className="grid gap-3 sm:grid-cols-3">
                                    <InfoItem label="Phương thức" value={providerLabel} icon="mdi:key-outline" />
                                    <InfoItem label="Vai trò" value={translateRole(user.role)} icon="mdi:badge-account-outline" />
                                    <InfoItem label="Thành viên từ" value={formatDate(user.created)} icon="mdi:calendar-outline" />
                                </div>

                                <button
                                    type="button"
                                    onClick={() => navigate('/change-password')}
                                    className={primaryButtonClass}
                                >
                                    <Icon icon="mdi:lock-reset" width={18} />
                                    Đổi mật khẩu
                                </button>
                            </div>
                        </section>
                    </main>
                </div>
            </div>
        </div>
    );
};

function Spinner() {
    return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />;
}

function Field({
    label,
    required = false,
    children,
}: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <label className="block min-w-0">
            <span className="mb-2 block text-sm font-medium text-slate-700">
                {label}
                {required ? <span className="text-red-500"> *</span> : null}
            </span>
            {children}
        </label>
    );
}

function SectionHeader({
    title,
    description,
    icon,
    action,
}: {
    title: string;
    description: string;
    icon: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                    <Icon icon={icon} width={21} />
                </div>
                <div className="min-w-0">
                    <h2 className="text-base font-semibold text-slate-950">{title}</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
                </div>
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
        </div>
    );
}

function SidebarLink({
    href,
    icon,
    label,
    active = false,
}: {
    href: string;
    icon: string;
    label: string;
    active?: boolean;
}) {
    return (
        <a
            href={href}
            className={[
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition',
                active ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
            ].join(' ')}
        >
            <Icon icon={icon} width={18} />
            <span>{label}</span>
        </a>
    );
}

function StatusPill({ children, tone }: { children: React.ReactNode; tone: 'slate' | 'green' | 'gray' }) {
    const toneClass = {
        slate: 'bg-slate-100 text-slate-700',
        green: 'bg-emerald-100 text-emerald-700',
        gray: 'bg-slate-100 text-slate-500',
    }[tone];

    return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${toneClass}`}>{children}</span>;
}

function StatCard({
    label,
    value,
    meta,
    icon,
    tone,
}: {
    label: string;
    value: string;
    meta: string;
    icon: string;
    tone: string;
}) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
                    <p className="mt-2 truncate text-xl font-semibold text-slate-950">{value}</p>
                </div>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${tone}`}>
                    <Icon icon={icon} width={20} />
                </div>
            </div>
            <p className="mt-3 truncate text-sm text-slate-500">{meta}</p>
        </div>
    );
}

function InfoItem({ label, value, icon }: { label: string; value: string; icon: string }) {
    return (
        <div className="flex min-w-0 items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
            <Icon icon={icon} width={18} className="mt-0.5 shrink-0 text-slate-500" />
            <div className="min-w-0">
                <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
                <p className="mt-1 break-words text-sm font-semibold text-slate-900">{value}</p>
            </div>
        </div>
    );
}

export default Profile;
