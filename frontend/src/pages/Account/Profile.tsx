import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import type { UpdateProfileDto } from '../../@types/auth.type';
import type { AddressDto, CreateAddressDto } from '../../@types/address.type';
import { ROUTES } from '../../lib/routes';

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
        Local: 'Tài khoản mật khẩu',
        Google: 'Google',
    };

    return providers[provider ?? 'Local'] ?? 'Tài khoản mật khẩu';
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

const Profile: React.FC = () => {
    const { user, updateAvatar, removeAvatar, refreshUser, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form state
    const [formData, setFormData] = useState<UpdateProfileDto>({
        firstName: '',
        lastName: '',
        phoneNumber: '',
    });
    const [originalData, setOriginalData] = useState<UpdateProfileDto>({});
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const emptyAddressForm: CreateAddressDto = {
        addressLine: '',
        city: '',
        state: '',
        country: 'Việt Nam',
        zipCode: '',
        isDefault: false,
    };
    const [addresses, setAddresses] = useState<AddressDto[]>([]);
    const [addressForm, setAddressForm] = useState<CreateAddressDto>(emptyAddressForm);
    const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
    const [addressesLoading, setAddressesLoading] = useState(false);
    const [savingAddress, setSavingAddress] = useState(false);

    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            navigate(ROUTES.SIGN_IN);
        }
    }, [isAuthenticated, navigate]);

    // Load user data into form
    useEffect(() => {
        if (user) {
            const data = {
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phoneNumber: user.phoneNumber || '',
            };
            setFormData(data);
            setOriginalData(data);
        }
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

    // Check if form has changes
    const hasChanges = () => {
        return (
            formData.firstName !== originalData.firstName ||
            formData.lastName !== originalData.lastName ||
            formData.phoneNumber !== originalData.phoneNumber
        );
    };

    // Handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setMessage(null);
    };

    // Handle form submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hasChanges()) return;

        setLoading(true);
        setMessage(null);

        try {
            await userService.updateProfile(formData);
            await refreshUser();
            setMessage({ type: 'success', text: 'Đã cập nhật hồ sơ thành công.' });
            setOriginalData(formData);
        } catch (error) {
            const msg = error instanceof Error ? translateError(error.message) : 'Không thể cập nhật hồ sơ.';
            setMessage({ type: 'error', text: msg });
        } finally {
            setLoading(false);
        }
    };

    // Handle avatar upload
    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file
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

    // Handle remove avatar
    const handleRemoveAvatar = async () => {
        if (!confirm('Bạn có chắc muốn xóa ảnh đại diện không?')) return;

        setLoading(true);
        setMessage(null);

        try {
            await removeAvatar();
            setMessage({ type: 'success', text: 'Đã xóa ảnh đại diện.' });
        } catch (error) {
            const msg = error instanceof Error ? translateError(error.message) : 'Không thể xóa ảnh đại diện.';
            setMessage({ type: 'error', text: msg });
        } finally {
            setLoading(false);
        }
    };

    // Cancel changes
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
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-500">Đang tải hồ sơ...</p>
                </div>
            </div>
        );
    }

    const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 px-4 py-8 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="relative mb-8 overflow-hidden rounded-[28px] border border-orange-100 bg-gradient-to-br from-orange-300 via-orange-400 to-amber-400 shadow-[0_24px_80px_rgba(251,146,60,0.28)]">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.55),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.3),transparent_54%)]" />
                    <div className="relative px-6 py-8 sm:px-8 sm:py-10">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 to-amber-400 text-2xl font-bold text-white shadow-lg ring-4 ring-white/70">
                                        {user.avatar ? (
                                            <img
                                                src={`${user.avatar}?t=${Date.now()}`}
                                                alt="Ảnh đại diện"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            initials || 'U'
                                        )}
                                    </div>
                                    <span className="absolute -bottom-1 -right-1 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700 shadow">
                                        <span
                                            className={`w-2 h-2 rounded-full ${
                                                user.isOnline ? 'bg-green-500' : 'bg-gray-400'
                                            }`}
                                        />
                                        {user.isOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}
                                    </span>
                                </div>

                                <div>
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-orange-950/60">
                                        Hồ sơ tài khoản
                                    </p>
                                    <h1 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-sm">
                                        {fullName || 'Hồ sơ của tôi'}
                                    </h1>
                                    <p className="mt-1 font-medium text-white/90">{user.email}</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-orange-700 ring-1 ring-white/70">
                                            {translateRole(user.role)}
                                        </span>
                                        <span className="inline-flex items-center rounded-full bg-orange-950/10 px-3 py-1 text-xs font-semibold text-orange-950 ring-1 ring-orange-950/10">
                                            {translateProvider(user.provider)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
                                <div className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3 shadow-sm backdrop-blur">
                                    <p className="text-xs uppercase tracking-wide text-orange-950/50">Thành viên từ</p>
                                    <p className="mt-1 text-sm font-semibold text-orange-950">
                                        {formatDate(user.created)}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3 shadow-sm backdrop-blur">
                                    <p className="text-xs uppercase tracking-wide text-orange-950/50">Số điện thoại</p>
                                    <p className="mt-1 text-sm font-semibold text-orange-950">
                                        {user.phoneNumber || 'Chưa cập nhật'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Message Alert */}
                {message && (
                    <div
                        className={`mb-6 rounded-2xl border px-4 py-4 shadow-sm ${
                            message.type === 'success'
                                ? 'bg-green-50 text-green-800 border-green-200'
                                : 'bg-red-50 text-red-800 border-red-200'
                        }`}
                    >
                        <div className="flex items-start gap-3">
                            <div className="shrink-0 mt-0.5">
                                {message.type === 'success' ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )}
                            </div>
                            <span className="font-medium">{message.text}</span>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Left Column */}
                    <div className="space-y-6">
                        <div className="overflow-hidden rounded-[26px] border border-white/80 bg-white/95 shadow-lg">
                            <div className="bg-gradient-to-r from-orange-400 via-orange-500 to-amber-400 px-6 py-4">
                                <h2 className="text-lg font-semibold text-white">Ảnh đại diện</h2>
                                <p className="mt-1 text-sm text-white/80">Cập nhật ảnh rõ mặt để tài khoản dễ nhận diện hơn.</p>
                            </div>

                            <div className="p-6">
                                <div className="flex flex-col items-center">
                                    <div className="relative group w-36 h-36 mb-5">
                                        <div
                                            className="w-full h-full rounded-full overflow-hidden bg-gray-100 cursor-pointer ring-4 ring-orange-100 shadow-lg transition-all duration-300 group-hover:scale-[1.02] group-hover:ring-orange-200"
                                            onClick={handleAvatarClick}
                                        >
                                            {user.avatar ? (
                                                <img
                                                    src={`${user.avatar}?t=${Date.now()}`}
                                                    alt="Ảnh đại diện"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center text-white text-4xl font-bold">
                                                    {initials || 'U'}
                                                </div>
                                            )}
                                        </div>

                                        <div
                                            className="absolute inset-0 rounded-full bg-black/35 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                            onClick={handleAvatarClick}
                                        >
                                            <div className="flex flex-col items-center text-white">
                                                <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                <span className="text-xs font-medium">Đổi ảnh</span>
                                            </div>
                                        </div>

                                        {uploadingAvatar && (
                                            <div className="absolute inset-0 rounded-full bg-black/55 flex items-center justify-center">
                                                <div className="w-9 h-9 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        )}
                                    </div>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/gif"
                                        className="hidden"
                                        onChange={handleAvatarChange}
                                    />

                                    <div className="w-full space-y-3">
                                        <button
                                            onClick={handleAvatarClick}
                                            disabled={uploadingAvatar}
                                            className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-3 text-white font-semibold shadow-md hover:shadow-lg hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {uploadingAvatar ? 'Đang tải ảnh...' : 'Tải ảnh mới'}
                                        </button>

                                        {user.avatar && (
                                            <button
                                                onClick={handleRemoveAvatar}
                                                disabled={loading}
                                                className="w-full rounded-xl border border-red-200 px-4 py-3 text-red-600 font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                                            >
                                                Xóa ảnh
                                            </button>
                                        )}
                                    </div>

                                    <div className="mt-4 rounded-2xl bg-gray-50 border border-gray-200 px-4 py-3 w-full text-center">
                                        <p className="text-xs text-gray-500 leading-5">
                                            Hỗ trợ: JPG, PNG, WebP, GIF
                                            <br />
                                            Dung lượng tối đa: 5MB
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[26px] border border-white/80 bg-white/95 p-6 shadow-lg">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-lg font-semibold text-gray-900">Thông tin tài khoản</h2>
                                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5.121 17.804A9 9 0 1118.88 6.197M15 11a3 3 0 11-6 0 3 3 0 016 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Email</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900 break-all">{user.email}</p>
                                </div>

                                <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Vai trò</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">{translateRole(user.role)}</p>
                                </div>

                                <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Phương thức đăng nhập</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">{translateProvider(user.provider)}</p>
                                </div>

                                <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Hoạt động gần nhất</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">
                                        {formatDateTime(user.lastSeen)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="xl:col-span-2 space-y-6">
                        <div className="overflow-hidden rounded-[26px] border border-white/80 bg-white/95 shadow-lg">
                            <div className="px-6 py-5 border-b border-gray-100 bg-white/70">
                                <h2 className="text-xl font-semibold text-gray-900">Thông tin cá nhân</h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Quản lý họ tên và số điện thoại dùng cho tài khoản HAUSHOP.
                                </p>
                            </div>

                            <div className="p-6">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>
                                            <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-2">
                                                Tên <span className="text-orange-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                id="firstName"
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                                                placeholder="Nhập tên"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-2">
                                                Họ <span className="text-orange-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                id="lastName"
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                                                placeholder="Nhập họ"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="phoneNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                                            Số điện thoại
                                        </label>
                                        <input
                                            type="tel"
                                            id="phoneNumber"
                                            name="phoneNumber"
                                            value={formData.phoneNumber}
                                            onChange={handleChange}
                                            className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                                            placeholder="Nhập số điện thoại"
                                        />
                                    </div>

                                    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-800">
                                                    {hasChanges() ? 'Bạn có thay đổi chưa lưu' : 'Thông tin đã được cập nhật'}
                                                </p>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {hasChanges()
                                                        ? 'Lưu thay đổi để cập nhật thông tin hồ sơ.'
                                                        : 'Thông tin hiện tại đã được lưu trên hệ thống.'}
                                                </p>
                                            </div>

                                            {hasChanges() && (
                                                <span className="inline-flex w-fit items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                                                    Chờ lưu
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                                        <button
                                            type="submit"
                                            disabled={loading || !hasChanges()}
                                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 px-6 py-3 text-white font-semibold shadow-md hover:shadow-lg hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loading && (
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            )}
                                            Lưu thay đổi
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleCancel}
                                            disabled={loading || !hasChanges()}
                                            className="rounded-2xl border border-gray-300 bg-white px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                                        >
                                            Hủy
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-[26px] border border-white/80 bg-white/95 shadow-lg">
                            <div className="px-6 py-5 border-b border-gray-100 bg-white/70">
                                <h2 className="text-xl font-semibold text-gray-900">Địa chỉ giao hàng</h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Thêm hoặc chỉnh sửa địa chỉ dùng khi thanh toán đơn hàng.
                                </p>
                            </div>

                            <div className="p-6 space-y-6">
                                <form onSubmit={handleSaveAddress} className="space-y-5">
                                    <div>
                                        <label htmlFor="addressLine" className="block text-sm font-semibold text-gray-700 mb-2">
                                            Địa chỉ cụ thể <span className="text-orange-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="addressLine"
                                            name="addressLine"
                                            value={addressForm.addressLine}
                                            onChange={handleAddressChange}
                                            required
                                            className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                                            placeholder="Số nhà, đường, phường/xã..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>
                                            <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-2">
                                                Tỉnh/Thành phố <span className="text-orange-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                id="city"
                                                name="city"
                                                value={addressForm.city}
                                                onChange={handleAddressChange}
                                                required
                                                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                                                placeholder="Nhập tỉnh/thành phố"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="state" className="block text-sm font-semibold text-gray-700 mb-2">
                                                Quận/Huyện
                                            </label>
                                            <input
                                                type="text"
                                                id="state"
                                                name="state"
                                                value={addressForm.state}
                                                onChange={handleAddressChange}
                                                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                                                placeholder="Nhập quận/huyện"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>
                                            <label htmlFor="country" className="block text-sm font-semibold text-gray-700 mb-2">
                                                Quốc gia
                                            </label>
                                            <input
                                                type="text"
                                                id="country"
                                                name="country"
                                                value={addressForm.country}
                                                onChange={handleAddressChange}
                                                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                                                placeholder="Việt Nam"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="zipCode" className="block text-sm font-semibold text-gray-700 mb-2">
                                                Mã bưu chính
                                            </label>
                                            <input
                                                type="text"
                                                id="zipCode"
                                                name="zipCode"
                                                value={addressForm.zipCode}
                                                onChange={handleAddressChange}
                                                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                                                placeholder="Nhập mã bưu chính"
                                            />
                                        </div>
                                    </div>

                                    <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
                                        <input
                                            type="checkbox"
                                            name="isDefault"
                                            checked={addressForm.isDefault}
                                            onChange={handleAddressChange}
                                            className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                                        />
                                        Đặt làm địa chỉ giao hàng mặc định
                                    </label>

                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                        <button
                                            type="submit"
                                            disabled={savingAddress}
                                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 px-6 py-3 text-white font-semibold shadow-md hover:shadow-lg hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {savingAddress && (
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            )}
                                            {editingAddressId ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ'}
                                        </button>

                                        {editingAddressId && (
                                            <button
                                                type="button"
                                                onClick={resetAddressForm}
                                                disabled={savingAddress}
                                                className="rounded-2xl border border-gray-300 bg-white px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                                            >
                                                Hủy chỉnh sửa
                                            </button>
                                        )}
                                    </div>
                                </form>

                                <div className="border-t border-gray-100 pt-6">
                                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4">
                                        Địa chỉ đã lưu
                                    </h3>

                                    {addressesLoading ? (
                                        <div className="h-20 rounded-2xl bg-gray-100 animate-pulse" />
                                    ) : addresses.length === 0 ? (
                                        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-500">
                                            Bạn chưa có địa chỉ giao hàng. Hãy thêm địa chỉ trước khi thanh toán.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {addresses.map(address => (
                                                <div
                                                    key={address.id}
                                                    className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                                                >
                                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{address.displayText}</p>
                                                            <p className="text-sm text-gray-500 mt-1">
                                                                {[address.city, address.state, address.country, address.zipCode]
                                                                    .filter(Boolean)
                                                                    .join(', ')}
                                                            </p>
                                                            {address.isDefault && (
                                                                <span className="inline-flex mt-3 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                                                    Mặc định
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="flex gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleEditAddress(address)}
                                                                disabled={savingAddress}
                                                                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                                            >
                                                                Sửa
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteAddress(address.id)}
                                                                disabled={savingAddress}
                                                                className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                                                            >
                                                                Xóa
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[26px] border border-white/80 bg-white/95 p-6 shadow-lg">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-2xl bg-orange-100 flex items-center justify-center">
                                            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 11c1.657 0 3-1.567 3-3.5S13.657 4 12 4 9 5.567 9 7.5 10.343 11 12 11zm0 0v2m-6 7h12a2 2 0 002-2v-3a4 4 0 00-4-4H8a4 4 0 00-4 4v3a2 2 0 002 2z" />
                                            </svg>
                                        </div>

                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900">Bảo mật</h2>
                                            <p className="text-sm text-gray-500">
                                                Cập nhật mật khẩu định kỳ để bảo vệ tài khoản tốt hơn.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => navigate('/change-password')}
                                    className="rounded-2xl border border-orange-200 bg-white px-5 py-3 text-orange-600 font-semibold hover:bg-orange-50 transition-colors"
                                >
                                    Đổi mật khẩu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
