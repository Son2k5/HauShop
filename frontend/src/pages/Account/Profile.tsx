import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import type { UpdateProfileDto } from '../../@types/auth.type';

// Profile Page Component
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

    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/signin');
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
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setOriginalData(formData);
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Failed to update profile';
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
            setMessage({ type: 'error', text: 'Please select an image file' });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'Image size should be less than 5MB' });
            return;
        }

        setUploadingAvatar(true);
        setMessage(null);

        try {
            await updateAvatar(file);
            setMessage({ type: 'success', text: 'Avatar updated successfully!' });
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Failed to upload avatar';
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
        if (!confirm('Are you sure you want to remove your avatar?')) return;

        setLoading(true);
        setMessage(null);

        try {
            await removeAvatar();
            setMessage({ type: 'success', text: 'Avatar removed successfully!' });
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Failed to remove avatar';
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

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-orange-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-500">Loading profile...</p>
                </div>
            </div>
        );
    }

    const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-orange-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                {/* Hero Header */}
                <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/80 backdrop-blur shadow-xl mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-pink-500/10 to-orange-400/10" />
                    <div className="relative px-6 py-8 sm:px-8 sm:py-10">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-orange-400 text-white flex items-center justify-center text-2xl font-bold shadow-lg overflow-hidden">
                                        {user.avatar ? (
                                            <img
                                                src={`${user.avatar}?t=${Date.now()}`}
                                                alt="Profile"
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
                                        {user.isOnline ? 'Online' : 'Offline'}
                                    </span>
                                </div>

                                <div>
                                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                                        {fullName || 'My Profile'}
                                    </h1>
                                    <p className="mt-1 text-gray-600">{user.email}</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                                            {user.role}
                                        </span>
                                        <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                                            {user.provider || 'Local'} Login
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
                                <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                                    <p className="text-xs uppercase tracking-wide text-gray-500">Member Since</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">
                                        {new Date(user.created).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                                    <p className="text-xs uppercase tracking-wide text-gray-500">Phone</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">
                                        {user.phoneNumber || 'Not updated'}
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
                        {/* Avatar Card */}
                        <div className="rounded-3xl border border-white/70 bg-white/90 backdrop-blur shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-red-500 to-orange-400 px-6 py-4">
                                <h2 className="text-lg font-semibold text-white">Profile Picture</h2>
                                <p className="text-sm text-white/80 mt-1">Upload a photo to personalize your account</p>
                            </div>

                            <div className="p-6">
                                <div className="flex flex-col items-center">
                                    <div className="relative group w-36 h-36 mb-5">
                                        <div
                                            className="w-full h-full rounded-full overflow-hidden bg-gray-100 cursor-pointer ring-4 ring-red-100 shadow-lg transition-all duration-300 group-hover:scale-[1.02] group-hover:ring-red-200"
                                            onClick={handleAvatarClick}
                                        >
                                            {user.avatar ? (
                                                <img
                                                    src={`${user.avatar}?t=${Date.now()}`}
                                                    alt="Profile"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-red-500 to-orange-400 flex items-center justify-center text-white text-4xl font-bold">
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
                                                <span className="text-xs font-medium">Change photo</span>
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
                                            className="w-full rounded-xl bg-gradient-to-r from-red-500 to-orange-400 px-4 py-3 text-white font-semibold shadow-md hover:shadow-lg hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {uploadingAvatar ? 'Uploading...' : 'Upload New Photo'}
                                        </button>

                                        {user.avatar && (
                                            <button
                                                onClick={handleRemoveAvatar}
                                                disabled={loading}
                                                className="w-full rounded-xl border border-red-200 px-4 py-3 text-red-600 font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                                            >
                                                Remove Photo
                                            </button>
                                        )}
                                    </div>

                                    <div className="mt-4 rounded-2xl bg-gray-50 border border-gray-200 px-4 py-3 w-full text-center">
                                        <p className="text-xs text-gray-500 leading-5">
                                            Supported: JPG, PNG, WebP, GIF
                                            <br />
                                            Maximum file size: 5MB
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Account Info */}
                        <div className="rounded-3xl border border-white/70 bg-white/90 backdrop-blur shadow-lg p-6">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-lg font-semibold text-gray-900">Account Info</h2>
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
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Role</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">{user.role}</p>
                                </div>

                                <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Provider</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">{user.provider || 'Local'}</p>
                                </div>

                                <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Last Seen</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">
                                        {user.lastSeen ? new Date(user.lastSeen).toLocaleString() : 'Unavailable'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="xl:col-span-2 space-y-6">
                        {/* Personal Information */}
                        <div className="rounded-3xl border border-white/70 bg-white/90 backdrop-blur shadow-lg overflow-hidden">
                            <div className="px-6 py-5 border-b border-gray-100 bg-white/70">
                                <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Update your personal details and keep your account information up to date.
                                </p>
                            </div>

                            <div className="p-6">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>
                                            <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-2">
                                                First Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                id="firstName"
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                                                placeholder="Enter first name"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-2">
                                                Last Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                id="lastName"
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                                                placeholder="Enter last name"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="phoneNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            id="phoneNumber"
                                            name="phoneNumber"
                                            value={formData.phoneNumber}
                                            onChange={handleChange}
                                            className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                                            placeholder="Enter phone number"
                                        />
                                    </div>

                                    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-800">
                                                    {hasChanges() ? 'You have unsaved changes' : 'Everything is up to date'}
                                                </p>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {hasChanges()
                                                        ? 'Save your changes to update your profile information.'
                                                        : 'Your current profile information is already saved.'}
                                                </p>
                                            </div>

                                            {hasChanges() && (
                                                <span className="inline-flex w-fit items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                                                    Pending changes
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                                        <button
                                            type="submit"
                                            disabled={loading || !hasChanges()}
                                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-500 to-orange-400 px-6 py-3 text-white font-semibold shadow-md hover:shadow-lg hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loading && (
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            )}
                                            Save Changes
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleCancel}
                                            disabled={loading || !hasChanges()}
                                            className="rounded-2xl border border-gray-300 bg-white px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Security Section */}
                        <div className="rounded-3xl border border-white/70 bg-white/90 backdrop-blur shadow-lg p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-2xl bg-red-100 flex items-center justify-center">
                                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 11c1.657 0 3-1.567 3-3.5S13.657 4 12 4 9 5.567 9 7.5 10.343 11 12 11zm0 0v2m-6 7h12a2 2 0 002-2v-3a4 4 0 00-4-4H8a4 4 0 00-4 4v3a2 2 0 002 2z" />
                                            </svg>
                                        </div>

                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900">Security</h2>
                                            <p className="text-sm text-gray-500">
                                                Keep your account secure by updating your password regularly.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => navigate('/change-password')}
                                    className="rounded-2xl border border-red-200 bg-white px-5 py-3 text-red-600 font-semibold hover:bg-red-50 transition-colors"
                                >
                                    Change Password
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