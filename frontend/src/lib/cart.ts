import type { CartDto, CartState } from "../@types/product.type";

export const emptyCartState: CartState = {
  items: [],
  totalQty: 0,
  subtotal: 0,
};

export function cartDtoToState(cart?: CartDto | null): CartState {
  if (!cart) {
    return emptyCartState;
  }

  const items = (cart.items ?? []).map((item) => ({
    cartItemId: item.id,
    product: {
      id: item.productId,
      sku: item.variantSku ?? "",
      name: item.productName,
      slug: item.productSlug,
      imageUrl: item.variantImageUrl ?? item.productImageUrl ?? null,
      price: item.unitPrice,
      minVariantPrice: item.unitPrice,
      totalStock: item.availableStock,
      isActive: true,
      brandId: null,
      brandName: null,
      categories: [],
      created: item.created,
      defaultVariantId: item.productVariantId ?? null,
      stock: item.availableStock,
      averageRating: 0,
      reviewCount: 0,
    },
    qty: item.quantity,
    variantId: item.productVariantId,
    variantSku: item.variantSku,
    unitPrice: item.unitPrice,
    availableStock: item.availableStock,
    variantSize: item.variantSize,
    variantColor: item.variantColor,
  }));

  return {
    items,
    totalQty: cart.totalItems,
    subtotal: cart.subtotal,
  };
}
