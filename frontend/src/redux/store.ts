import { configureStore } from '@reduxjs/toolkit';
import storage from 'redux-persist/lib/storage';
import {
  persistReducer,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import orebiReducer from './orebiSlice'; // reducer của bạn
import bannerReducer from './bannerSlice';

// Cấu hình redux-persist
const persistConfig = {
  key: 'root',
  storage,
};

// Gộp reducer
const rootReducer = {
  orebiReducer: persistReducer(persistConfig, orebiReducer),
  banner: bannerReducer,
};

// Tạo store
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

// Tạo persistor
export const persistor = persistStore(store);

// Type cho RootState & AppDispatch
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
