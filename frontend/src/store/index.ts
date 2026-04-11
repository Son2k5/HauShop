import { configureStore } from "@reduxjs/toolkit";
import cartReducer, { STORAGE_KEY } from "./cartSlice";

export const store = configureStore({
  reducer: {
    cart: cartReducer,
  },
});

store.subscribe(() => {
  try {
    const state = store.getState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cart));
  } catch {
    // ignore storage errors
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;