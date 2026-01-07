// orebiSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Product {
  _id: string | number;
  productName: string;
  price: string;
  img: string;
  badge?: boolean;
  color?: string;
  quantity: number;
  des?: string;
}

interface OrebiState {
  userInfo: any[]; // Hoặc có thể tạo interface riêng cho userInfo nếu cần
  products: Product[];
}

const initialState: OrebiState = {
  userInfo: [],
  products: [],
};

export const orebiSlice = createSlice({
  name: 'orebi',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<Product>) => {
      const item = state.products.find((p) => p._id === action.payload._id);
      if (item) {
        item.quantity += action.payload.quantity;
      } else {
        state.products.push(action.payload);
      }
    },
    increaseQuantity: (
      state,
      action: PayloadAction<{ _id: string | number }>
    ) => {
      const item = state.products.find((p) => p._id === action.payload._id);
      if (item) {
        item.quantity++;
      }
    },
    decreaseQuantity: (
      state,
      action: PayloadAction<{ _id: string | number }>
    ) => {
      const item = state.products.find((p) => p._id === action.payload._id);
      if (item) {
        item.quantity = Math.max(1, item.quantity - 1);
      }
    },
    deleteItem: (state, action: PayloadAction<string | number>) => {
      state.products = state.products.filter((p) => p._id !== action.payload);
    },
    resetCart: (state) => {
      state.products = [];
    },
  },
});

export const {
  addToCart,
  increaseQuantity,
  decreaseQuantity,
  deleteItem,
  resetCart,
} = orebiSlice.actions;

export default orebiSlice.reducer;
