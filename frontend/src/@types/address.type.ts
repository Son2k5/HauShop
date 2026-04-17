export interface AddressDto {
  id: string;
  addressLine: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  isDefault: boolean;
  displayText: string;
}

export interface CreateAddressDto {
  addressLine: string;
  city: string;
  state?: string;
  country?: string;
  zipCode?: string;
  isDefault: boolean;
}

export type UpdateAddressDto = CreateAddressDto;
