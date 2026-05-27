import type { UpdateProfileDto, UserDto } from "../@types/auth.type";
import type { AddressDto, CreateAddressDto, UpdateAddressDto } from "../@types/address.type";
import { http } from "../lib/http";

type UserEnvelope = {
  user?: UserDto;
};

type AddressEnvelope = {
  address?: AddressDto;
  addresses?: AddressDto[];
};

function extractUser(data: UserEnvelope | UserDto): UserDto {
  if ("user" in data && data.user) {
    return data.user;
  }

  if ("id" in data || "email" in data) {
    return data as UserDto;
  }

  throw new Error("Invalid response structure from /auth/me");
}

export const userService = {
  async getCurrentUser(): Promise<UserDto> {
    const data = await http.get<UserEnvelope | UserDto>("/auth/me");
    return extractUser(data);
  },

  async updateProfile(data: UpdateProfileDto): Promise<{ user: UserDto }> {
    return http.put<{ user: UserDto }>("/user/profile", data);
  },

  async updateAvatar(file: File): Promise<{ success: boolean; avatarUrl: string; user: UserDto }> {
    if (!file.type.startsWith("image/")) {
      throw new Error("File must be an image");
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error("File size must be less than 5MB");
    }

    const formData = new FormData();
    formData.append("file", file);

    return http.post<{ success: boolean; avatarUrl: string; user: UserDto }>("/user/avatar", formData);
  },

  async removeAvatar(): Promise<{ success: boolean; user: UserDto }> {
    return http.delete<{ success: boolean; user: UserDto }>("/user/avatar");
  },

  async getAddresses(): Promise<AddressDto[]> {
    const data = await http.get<AddressEnvelope | AddressDto[]>("/user/addresses");
    return Array.isArray(data) ? data : data.addresses ?? [];
  },

  async createAddress(data: CreateAddressDto): Promise<AddressDto> {
    const response = await http.post<AddressEnvelope>("/user/addresses", data);
    if (!response.address) throw new Error("Invalid address response");
    return response.address;
  },

  async updateAddress(id: string, data: UpdateAddressDto): Promise<AddressDto> {
    const response = await http.put<AddressEnvelope>(`/user/addresses/${id}`, data);
    if (!response.address) throw new Error("Invalid address response");
    return response.address;
  },

  async deleteAddress(id: string): Promise<void> {
    await http.delete(`/user/addresses/${id}`);
  },
};
