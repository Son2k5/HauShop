import { createContext, useContext, useReducer, useCallback, type ReactNode } from "react";
import type { CartItem, CartState, CartContextValue } from "../@types/product.type";
import type { ProductSummaryDto } from "../@types/product.type";

// ── Reducer ───────────────────────────────────────────────────────────────────

type Action =
  | { type: "ADD_ITEM";    payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: { productId: string; variantId?: string } }
  | { type: "UPDATE_QTY";  payload: { productId: string; qty: number; variantId?: string } }
  | { type: "CLEAR_CART" };

const INITIAL: CartState = { items: [], totalQty: 0, subtotal: 0 };

/** Key duy nhất cho mỗi dòng giỏ hàng */
const itemKey = (productId: string, variantId?: string) =>
  variantId ? `${productId}::${variantId}` : productId;

function recalc(items: CartItem[]): CartState {
  return {
    items,
    totalQty: items.reduce((s, i) => s + i.qty, 0),
    subtotal:  items.reduce((s, i) => s + i.unitPrice * i.qty, 0),
  };
}

function reducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const pid = action.payload.product.id;
      const vid = action.payload.variantId;
      const existing = state.items.find(
        (i) => i.product.id === pid && i.variantId === vid
      );
      const items = existing
        ? state.items.map((i) =>
            i.product.id === pid && i.variantId === vid
              ? { ...i, qty: i.qty + action.payload.qty }
              : i
          )
        : [...state.items, action.payload];
      return recalc(items);
    }
    case "REMOVE_ITEM": {
      const key = itemKey(action.payload.productId, action.payload.variantId);
      return recalc(state.items.filter((i) => itemKey(i.product.id, i.variantId) !== key));
    }
    case "UPDATE_QTY": {
      const key = itemKey(action.payload.productId, action.payload.variantId);
      const items =
        action.payload.qty <= 0
          ? state.items.filter((i) => itemKey(i.product.id, i.variantId) !== key)
          : state.items.map((i) =>
              itemKey(i.product.id, i.variantId) === key
                ? { ...i, qty: action.payload.qty }
                : i
            );
      return recalc(items);
    }
    case "CLEAR_CART":
      return INITIAL;
    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  const addItem = useCallback(
    (
      product: ProductSummaryDto,
      qty = 1,
      variantId?: string,
      variantSku?: string,
      unitPrice?: number
    ) => {
      // Snapshot giá: variant price → minVariantPrice → price
      const price =
        unitPrice ??
        (product.minVariantPrice != null && product.minVariantPrice < product.price
          ? product.minVariantPrice
          : product.price);

      dispatch({
        type: "ADD_ITEM",
        payload: { product, qty, variantId, variantSku, unitPrice: price },
      });
    },
    []
  );

  const removeItem = useCallback(
    (productId: string, variantId?: string) =>
      dispatch({ type: "REMOVE_ITEM", payload: { productId, variantId } }),
    []
  );

  const updateQty = useCallback(
    (productId: string, qty: number, variantId?: string) =>
      dispatch({ type: "UPDATE_QTY", payload: { productId, qty, variantId } }),
    []
  );

  const clearCart = useCallback(() => dispatch({ type: "CLEAR_CART" }), []);

  const isInCart = useCallback(
    (productId: string, variantId?: string) =>
      state.items.some(
        (i) => i.product.id === productId && i.variantId === variantId
      ),
    [state.items]
  );

  return (
    <CartContext.Provider
      value={{ ...state, addItem, removeItem, updateQty, clearCart, isInCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCartContext must be used within <CartProvider>");
  return ctx;
}