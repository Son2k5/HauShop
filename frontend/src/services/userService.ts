import type { UpdateProfileDto, UserDto } from '../@types/auth.type';
import type { AddressDto, CreateAddressDto, UpdateAddressDto } from '../@types/address.type';
import api from '../api/apiClient';

export const userService = {
    async getCurrentUser(): Promise<UserDto> {
        const response = await api.get('/auth/me');
        console.log('📡 getCurrentUser response:', response.data);

        // Sau khi qua toCamelCase, backend trả User → user
        if (response.data?.user) {
            return response.data.user;
        }
        // Fallback: nếu response trực tiếp là user object
        if (response.data?.id || response.data?.email) {
            return response.data;
        }
        throw new Error('Invalid response structure from /auth/me');
    },

    async updateProfile(data: UpdateProfileDto): Promise<{ user: UserDto }> {
        const response = await api.put('/user/profile', data);
        return response.data;
    },

    async updateAvatar(file: File): Promise<{ success: boolean; avatarUrl: string; user: UserDto }> {
        if (!file.type.startsWith('image/')) {
            throw new Error('File must be an image');
        }
        if (file.size > 5 * 1024 * 1024) {
            throw new Error('File size must be less than 5MB');
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/user/avatar', formData);
            return response.data;
        } catch (error: any) {
            // Debug logging
            console.error('Upload error details:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message,
                fullError: error
            });
            // Extract error message from response
            const message = error.response?.data?.message || error.message || 'Upload failed';
            throw new Error(message);
        }
    },

    async removeAvatar(): Promise<{ success: boolean; user: UserDto }> {
        try {
            const response = await api.delete('/user/avatar');
            return response.data;
        } catch (error: any) {
            // Extract error message from response
            const message = error.response?.data?.message || error.message || 'Remove avatar failed';
            throw new Error(message);
        }
    },

    async getAddresses(): Promise<AddressDto[]> {
        const response = await api.get('/user/addresses');
        return response.data.addresses || [];
    },

    async createAddress(data: CreateAddressDto): Promise<AddressDto> {
        const response = await api.post('/user/addresses', data);
        return response.data.address;
    },

    async updateAddress(id: string, data: UpdateAddressDto): Promise<AddressDto> {
        const response = await api.put(`/user/addresses/${id}`, data);
        return response.data.address;
    },

    async deleteAddress(id: string): Promise<void> {
        await api.delete(`/user/addresses/${id}`);
    },
};
