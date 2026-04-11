import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CartState, ProductSummaryDto } from "../@types/product.type";

type CartItemPayload = {
  product: ProductSummaryDto;
  qty?: number;
  variantId?: string;
  variantSku?: string;
  unitPrice?: number;
  cartItemId?: string;
};

type ServerCartItemDto = {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  imageUrl?: string | null;
  unitPrice: number;
  quantity: number;
  availableStock: number;
  variantId?: string;
  variantSku?: string;
  variantSize?: string;
  variantColor?: string;
};

type ServerCartDto = {
  id: string;
  userId: string;
  items: ServerCartItemDto[];
  totalItems: number;
  subtotal: number;
  created: string;
};

const STORAGE_KEY = "haushop_cart_rtk";

function getDisplayPrice(product: ProductSummaryDto): number {
  return product.minVariantPrice != null && product.minVariantPrice < product.price
    ? product.minVariantPrice
    : product.price;
}

function calcTotals(items: CartState["items"]) {
  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  return { totalQty, subtotal };
}

function loadInitialState(): CartState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [], totalQty: 0, subtotal: 0 };

    const parsed = JSON.parse(raw) as CartState;
    if (!parsed || !Array.isArray(parsed.items)) {
      return { items: [], totalQty: 0, subtotal: 0 };
    }

    const totals = calcTotals(parsed.items);
    return {
      items: parsed.items,
      totalQty: totals.totalQty,
      subtotal: totals.subtotal,
    };
  } catch {
    return { items: [], totalQty: 0, subtotal: 0 };
  }
}

const initialState: CartState = loadInitialState();

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<CartItemPayload>) => {
      const { product, qty = 1, variantId, variantSku, unitPrice, cartItemId } = action.payload;
      if (!product?.id || qty <= 0) return;

      const resolvedUnitPrice = unitPrice ?? getDisplayPrice(product);
      const stockLimit =
        product.totalStock != null && product.totalStock >= 0
          ? product.totalStock
          : Number.MAX_SAFE_INTEGER;

      const existing = state.items.find(
        (item) => item.product.id === product.id && item.variantId === variantId
      );

      if (existing) {
        existing.qty = Math.min(existing.qty + qty, stockLimit);
        existing.unitPrice = resolvedUnitPrice;
        existing.variantSku = variantSku;
        (existing as any).cartItemId = cartItemId ?? (existing as any).cartItemId;
      } else {
        state.items.push({
          product,
          qty: Math.min(qty, stockLimit),
          variantId,
          variantSku,
          unitPrice: resolvedUnitPrice,
          ...(cartItemId ? { cartItemId } : {}),
        } as any);
      }

      const totals = calcTotals(state.items);
      state.totalQty = totals.totalQty;
      state.subtotal = totals.subtotal;
    },

    removeItem: (
      state,
      action: PayloadAction<{ productId: string; variantId?: string }>
    ) => {
      const { productId, variantId } = action.payload;

      state.items = state.items.filter(
        (item) => !(item.product.id === productId && item.variantId === variantId)
      );

      const totals = calcTotals(state.items);
      state.totalQty = totals.totalQty;
      state.subtotal = totals.subtotal;
    },

    updateQty: (
      state,
      action: PayloadAction<{ productId: string; qty: number; variantId?: string }>
    ) => {
      const { productId, qty, variantId } = action.payload;

      if (qty <= 0) {
        state.items = state.items.filter(
          (item) => !(item.product.id === productId && item.variantId === variantId)
        );
      } else {
        const item = state.items.find(
          (x) => x.product.id === productId && x.variantId === variantId
        );

        if (item) {
          const stockLimit =
            item.product.totalStock != null && item.product.totalStock >= 0
              ? item.product.totalStock
              : Number.MAX_SAFE_INTEGER;

          item.qty = Math.min(qty, stockLimit);
        }
      }

      const totals = calcTotals(state.items);
      state.totalQty = totals.totalQty;
      state.subtotal = totals.subtotal;
    },

    clearCart: (state) => {
      state.items = [];
      state.totalQty = 0;
      state.subtotal = 0;
    },

    setCartFromServer: (state, action: PayloadAction<ServerCartDto>) => {
      const serverCart = action.payload;

      state.items = (serverCart.items ?? []).map((item) => ({
        product: {
          id: item.productId,
          sku: item.variantSku ?? "",
          name: item.productName,
          slug: item.productSlug,
          imageUrl: item.imageUrl ?? null,
          price: item.unitPrice,
          minVariantPrice: item.unitPrice,
          totalStock: item.availableStock,
          isActive: true,
          brandId: null,
          brandName: null,
          categories: [],
          created: "",
          stock: item.availableStock,
          averageRating: 0,
          reviewCount: 0,
        },
        qty: item.quantity,
        variantId: item.variantId,
        variantSku: item.variantSku,
        unitPrice: item.unitPrice,
        cartItemId: item.id,
      })) as any;

      const totals = calcTotals(state.items);
      state.totalQty = totals.totalQty;
      state.subtotal = totals.subtotal;
    },
  },
});

export const {
  addItem,
  removeItem,
  updateQty,
  clearCart,
  setCartFromServer,
} = cartSlice.actions;

export { STORAGE_KEY };
export default cartSlice.reducer;