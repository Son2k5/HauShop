import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CartState, ProductSummaryDto } from "../@types/product.type";

type CartItemPayload = {
  product: ProductSummaryDto;
  qty?: number;
  variantId?: string;
  variantSku?: string;
  unitPrice?: number;
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
      const { product, qty = 1, variantId, variantSku, unitPrice } = action.payload;
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
      } else {
        state.items.push({
          product,
          qty: Math.min(qty, stockLimit),
          variantId,
          variantSku,
          unitPrice: resolvedUnitPrice,
        });
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
  },
});

export const { addItem, removeItem, updateQty, clearCart } = cartSlice.actions;
export { STORAGE_KEY };
export default cartSlice.reducer;