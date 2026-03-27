

import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { authService } from "../services/Auth.service";
import type {
  AuthState,
  ChangePasswordDto,
  LoginDto,
  RegisterDto,
  UserDto,
} from "../@types/auth.type";

// ── Storage helpers (export để hooks dùng) ────────────────────────
const STORAGE_KEY = "_u";

export const storage = {
  load:  (): UserDto | null => { try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) as UserDto : null; } catch { return null; } },
  save:  (u: UserDto)       => localStorage.setItem(STORAGE_KEY, JSON.stringify(u)),
  clear: ()                  => localStorage.removeItem(STORAGE_KEY),
};

// ── Reducer ───────────────────────────────────────────────────────
type Action =
  | { type: "LOADING" }
  | { type: "SET_USER";    payload: UserDto }
  | { type: "SIGN_OUT" }
  | { type: "SET_ERROR";   payload: string }
  | { type: "CLEAR_ERROR" };

function reducer(state: AuthState, action: Action): AuthState {
  switch (action.type) {
    case "LOADING":     return { ...state, status: "loading",           error: null };
    case "SET_USER":    return { user: action.payload, status: "authenticated",  error: null };
    case "SIGN_OUT":    return { user: null,           status: "unauthenticated", error: null };
    case "SET_ERROR":   return { ...state,             status: "unauthenticated", error: action.payload };
    case "CLEAR_ERROR": return { ...state,             error: null };
    default:            return state;
  }
}

// Khởi tạo đồng bộ từ localStorage:
// - có cached user → "loading" (verify token ở background)
// - không có       → "unauthenticated" (không cần gọi API)
function getInitialState(): AuthState {
  const user = storage.load();
  return { user, status: user ? "loading" : "unauthenticated", error: null };
}

// ── Context types (export để hooks import) ────────────────────────
export interface AuthStateValue extends AuthState {
  isAuthenticated: boolean;
  isLoading:       boolean;
}

export interface AuthActionsValue {
  login:           (dto: LoginDto)             => Promise<UserDto>;
  register:        (dto: RegisterDto)          => Promise<UserDto>;
  logout:          ()                          => Promise<void>;
  changePassword:  (dto: ChangePasswordDto)    => Promise<void>;
  loginWithGoogle: ()                          => void;
  clearError:      ()                          => void;
  patchUser:       (partial: Partial<UserDto>) => void;
}

// ── Context objects (export để hooks dùng — components không import trực tiếp) ──
export const AuthStateContext   = createContext<AuthStateValue   | null>(null);
export const AuthActionsContext = createContext<AuthActionsValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, getInitialState);
  const isMounted         = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // Verify session 1 lần khi mount — chỉ nếu có cached user
  useEffect(() => {
    if (state.status !== "loading") return;
    let cancelled = false;

    authService.refreshToken()
      .then(() => {
        if (cancelled || !isMounted.current) return;
        dispatch({ type: "SET_USER", payload: state.user! });
      })
      .catch(() => {
        if (cancelled || !isMounted.current) return;
        storage.clear();
        dispatch({ type: "SIGN_OUT" });
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // chỉ chạy 1 lần khi mount

  // ── Actions — useCallback giữ reference ổn định ───────────────
  const login = useCallback(async (dto: LoginDto): Promise<UserDto> => {
    dispatch({ type: "LOADING" });
    try {
      const { user } = await authService.login(dto);
      storage.save(user);
      dispatch({ type: "SET_USER", payload: user });
      return user;
    } catch (e) {
      dispatch({ type: "SET_ERROR", payload: (e as { message?: string }).message ?? "Login failed" });
      throw e;
    }
  }, []);

  const register = useCallback(async (dto: RegisterDto): Promise<UserDto> => {
    dispatch({ type: "LOADING" });
    try {
      const { user } = await authService.register(dto);
      storage.save(user);
      dispatch({ type: "SET_USER", payload: user });
      return user;
    } catch (e) {
      dispatch({ type: "SET_ERROR", payload: (e as { message?: string }).message ?? "Registration failed" });
      throw e;
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    dispatch({ type: "LOADING" });
    try { await authService.logout(); } catch { /* clear dù server lỗi */ }
    storage.clear();
    dispatch({ type: "SIGN_OUT" });
  }, []);

  const changePassword = useCallback(async (dto: ChangePasswordDto): Promise<void> => {
    await authService.changePassword(dto);
    storage.clear();
    dispatch({ type: "SIGN_OUT" });
  }, []);

  const loginWithGoogle = useCallback(() => authService.loginWithGoogle(), []);

  const clearError = useCallback(() => dispatch({ type: "CLEAR_ERROR" }), []);

  const patchUser = useCallback((partial: Partial<UserDto>) => {
    const current = storage.load();
    if (!current) return;
    const updated = { ...current, ...partial };
    storage.save(updated);
    dispatch({ type: "SET_USER", payload: updated });
  }, []);

  // ── Memoized context values ────────────────────────────────────
  const stateValue = useMemo<AuthStateValue>(() => ({
    ...state,
    isAuthenticated: state.status === "authenticated",
    isLoading:       state.status === "loading" || state.status === "idle",
  }), [state]);

  // actionsValue KHÔNG phụ thuộc state → reference ổn định mãi mãi
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const actionsValue = useMemo<AuthActionsValue>(() => ({
    login, register, logout, changePassword, loginWithGoogle, clearError, patchUser,
  }), []); // intentionally empty — callbacks đã stable

  return (
    <AuthStateContext.Provider value={stateValue}>
      <AuthActionsContext.Provider value={actionsValue}>
        {children}
      </AuthActionsContext.Provider>
    </AuthStateContext.Provider>
  );
}