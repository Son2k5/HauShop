import React, {
    createContext,
    useCallback,
    useEffect,
    useMemo,
    useReducer,
} from 'react';
import { useLocation } from 'react-router-dom';
import { queryClient } from '../lib/queryClient';
import { AUTH_IDLE_TIMEOUT_MS } from '../lib/env';
import type {
    ChangePasswordDto,
    LoginDto,
    RegisterDto,
    UserDto,
} from '../@types/auth.type';

async function loadAuthService() {
    const { authService } = await import('../services/authService');
    return authService;
}

async function loadUserService() {
    const { userService } = await import('../services/userService');
    return userService;
}

// ── Storage ──────────────────────────────────────────────────────────────────
// Chỉ lưu UserDto (thông tin hiển thị UI) vào localStorage.
// accessToken và refreshToken luôn nằm trong HttpOnly cookie — KHÔNG lưu ở đây.
const STORAGE_KEY = '_u';
const ACTIVITY_STORAGE_KEY = '_auth_last_activity';
const ACTIVITY_WRITE_THROTTLE_MS = 15 * 1000;
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'scroll', 'touchstart', 'focus'] as const;

const storage = {
    load: (): UserDto | null => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? (JSON.parse(raw) as UserDto) : null;
        } catch {
            return null;
        }
    },
    save: (u: UserDto): void => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    },
    clear: (): void => {
        localStorage.removeItem(STORAGE_KEY);
    },
};

function clearAuthActivity(): void {
    localStorage.removeItem(ACTIVITY_STORAGE_KEY);
}

// ── State & Reducer ───────────────────────────────────────────────────────────
function removeAccountScopedQueries(): void {
    queryClient.removeQueries({
        predicate: (query) => {
            const [scope] = query.queryKey as readonly unknown[];
            return (
                scope === 'wishlist' ||
                scope === 'auth' ||
                scope === 'admin' ||
                scope === 'cart' ||
                scope === 'orders' ||
                scope === 'notifications'
            );
        },
    });
}

type State = {
    user: UserDto | null;
    status: 'idle' | 'authenticated' | 'unauthenticated';
    loading: boolean;
    error: string | null;
};

type Action =
    | { type: 'LOADING' }
    | { type: 'SET_USER'; payload: UserDto }
    | { type: 'SIGN_OUT' }
    | { type: 'SET_ERROR'; payload: string }
    | { type: 'CLEAR_ERROR' };

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'LOADING':
            return { ...state, loading: true, error: null };
        case 'SET_USER':
            return {
                user: action.payload,
                status: 'authenticated',
                loading: false,
                error: null,
            };
        case 'SIGN_OUT':
            return {
                user: null,
                status: 'unauthenticated',
                loading: false,
                error: null,
            };
        case 'SET_ERROR':
            return {
                ...state,
                loading: false,
                // Không đổi status khi có lỗi - chỉ đổi khi SIGN_OUT hoặc LOGIN failed
                // Điều này tránh logout user khi upload avatar hoặc các operation khác fail
                error: action.payload,
            };
        case 'CLEAR_ERROR':
            return { ...state, error: null };
        default:
            return state;
    }
}

function getInitialState(): State {
    const user = storage.load();
    return {
        user,
        status: user ? 'idle' : 'unauthenticated',
        loading: false,
        error: null,
    };
}

// ── Context types ────────────────────────────────────────────────────────────
export interface AuthStateValue {
    user: UserDto | null;
    status: 'idle' | 'authenticated' | 'unauthenticated';
    loading: boolean;
    error: string | null;
    isAuthenticated: boolean;
}

export interface AuthActionsValue {
    login: (dto: LoginDto) => Promise<UserDto>;
    register: (dto: RegisterDto) => Promise<UserDto>;
    loginWithGoogle: () => void;
    logout: () => Promise<void>;
    changePassword: (dto: ChangePasswordDto) => Promise<void>;
    updateAvatar: (file: File) => Promise<void>;
    removeAvatar: () => Promise<void>;
    refreshUser: () => Promise<UserDto | null>;
    clearError: () => void;
}

export interface AuthContextType extends State {
    isAuthenticated: boolean;
    login: (dto: LoginDto) => Promise<UserDto>;
    register: (dto: RegisterDto) => Promise<UserDto>;
    loginWithGoogle: () => void;
    logout: () => Promise<void>;
    changePassword: (dto: ChangePasswordDto) => Promise<void>;
    updateAvatar: (file: File) => Promise<void>;
    removeAvatar: () => Promise<void>;
    refreshUser: () => Promise<UserDto | null>;
    clearError: () => void;
}

export const AuthStateContext = createContext<AuthStateValue | null>(null);
export const AuthActionsContext = createContext<AuthActionsValue | null>(null);
export const AuthContext = createContext<AuthContextType | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(reducer, undefined, getInitialState);
    const location = useLocation();

    useEffect(() => {
        const hasCachedUser = !!storage.load();
        if (!hasCachedUser) return;
        if (state.status === 'authenticated') return;

        let cancelled = false;

        const bootstrapAuth = async () => {
            try {
                const authService = await loadAuthService();
                const freshUser = await authService.getCurrentUser();
                if (cancelled) return;

                storage.save(freshUser);
                dispatch({ type: 'SET_USER', payload: freshUser });
            } catch {
                if (cancelled) return;

                storage.clear();
                clearAuthActivity();
                dispatch({ type: 'SIGN_OUT' });
            }
        };

        const schedule =
            typeof window.requestIdleCallback === 'function'
                ? window.requestIdleCallback(() => void bootstrapAuth(), { timeout: 2500 })
                : window.setTimeout(() => void bootstrapAuth(), 1200);

        return () => {
            cancelled = true;
            if (typeof window.cancelIdleCallback === 'function') {
                window.cancelIdleCallback(schedule);
            } else {
                window.clearTimeout(schedule);
            }
        };
    }, [location.pathname, state.status]);

    // Sync nhiều tab: nếu tab khác logout (xóa _u) thì tab này cũng sign out
    useEffect(() => {
        const clearCurrentTab = () => {
            clearAuthActivity();
            removeAccountScopedQueries();
            dispatch({ type: 'SIGN_OUT' });
        };

        const handler = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY && e.newValue === null) {
                clearCurrentTab();
            }
        };

        window.addEventListener('storage', handler);
        window.addEventListener('auth:clear', clearCurrentTab);

        return () => {
            window.removeEventListener('storage', handler);
            window.removeEventListener('auth:clear', clearCurrentTab);
        };
    }, []);

    // ── Actions ───────────────────────────────────────────────────────────────

    const login = useCallback(async (dto: LoginDto): Promise<UserDto> => {
        dispatch({ type: 'LOADING' });
        try {
            const authService = await loadAuthService();
            const user = await authService.login(dto);
            // Xử lý cả trường hợp backend trả về PascalCase và camelCase
            removeAccountScopedQueries();
            storage.save(user);
            dispatch({ type: 'SET_USER', payload: user });
            return user;
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : 'Login failed';
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            throw e;
        }
    }, []);

    const register = useCallback(async (dto: RegisterDto): Promise<UserDto> => {
        dispatch({ type: 'LOADING' });
        try {
            const authService = await loadAuthService();
            const user = await authService.register(dto);
            // Xử lý cả trường hợp backend trả về PascalCase và camelCase
            removeAccountScopedQueries();
            storage.save(user);
            dispatch({ type: 'SET_USER', payload: user });
            return user;
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : 'Register failed';
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            throw e;
        }
    }, []);

    const loginWithGoogle = useCallback(() => {
        void loadAuthService().then((authService) => authService.loginWithGoogle());
    }, []);

    const logout = useCallback(async (): Promise<void> => {
        try {
            const authService = await loadAuthService();
            await authService.logout();
        } catch {
            // Dù API fail vẫn clear local state
        }
        storage.clear();
        clearAuthActivity();
        removeAccountScopedQueries();
        dispatch({ type: 'SIGN_OUT' });
    }, []);

    useEffect(() => {
        if (state.status !== 'authenticated') return;

        let timeoutId: ReturnType<typeof window.setTimeout> | undefined;
        let lastActivityWrite = 0;

        function readLastActivity(): number {
            const raw = localStorage.getItem(ACTIVITY_STORAGE_KEY);
            const parsed = raw ? Number(raw) : NaN;
            return Number.isFinite(parsed) && parsed > 0 ? parsed : Date.now();
        }

        function clearIdleTimer(): void {
            if (timeoutId !== undefined) {
                window.clearTimeout(timeoutId);
                timeoutId = undefined;
            }
        }

        function expireIfIdle(): void {
            const idleForMs = Date.now() - readLastActivity();
            if (idleForMs >= AUTH_IDLE_TIMEOUT_MS) {
                void logout();
                return;
            }

            scheduleIdleCheck();
        }

        function scheduleIdleCheck(): void {
            clearIdleTimer();
            const idleForMs = Date.now() - readLastActivity();
            const remainingMs = AUTH_IDLE_TIMEOUT_MS - idleForMs;
            timeoutId = window.setTimeout(expireIfIdle, Math.max(remainingMs, 1000));
        }

        function markActivity(force = false): void {
            const now = Date.now();
            if (!force && now - lastActivityWrite < ACTIVITY_WRITE_THROTTLE_MS) return;

            lastActivityWrite = now;
            localStorage.setItem(ACTIVITY_STORAGE_KEY, String(now));
            scheduleIdleCheck();
        }

        const handleActivity = () => markActivity();
        const handleStorage = (event: StorageEvent) => {
            if (event.key === ACTIVITY_STORAGE_KEY) {
                scheduleIdleCheck();
            }
        };

        markActivity(true);
        ACTIVITY_EVENTS.forEach((eventName) => {
            window.addEventListener(eventName, handleActivity, { passive: true });
        });
        window.addEventListener('storage', handleStorage);

        return () => {
            clearIdleTimer();
            ACTIVITY_EVENTS.forEach((eventName) => {
                window.removeEventListener(eventName, handleActivity);
            });
            window.removeEventListener('storage', handleStorage);
        };
    }, [logout, state.status]);

    const changePassword = useCallback(async (dto: ChangePasswordDto): Promise<void> => {
        const authService = await loadAuthService();
        await authService.changePassword(dto);
        // Đổi mật khẩu → revoke tất cả token → bắt login lại
        storage.clear();
        clearAuthActivity();
        removeAccountScopedQueries();
        dispatch({ type: 'SIGN_OUT' });
    }, []);

    /**
     * updateAvatar: upload file → backend xử lý Cloudinary → trả UserDto mới.
     * Dùng useCallback không phụ thuộc state.user để tránh recreate hàm khi avatar thay đổi.
     */
    const updateAvatar = useCallback(async (file: File): Promise<void> => {
        dispatch({ type: 'LOADING' });
        try {
            const userService = await loadUserService();
            const res = await userService.updateAvatar(file);
            storage.save(res.user);
            dispatch({ type: 'SET_USER', payload: res.user });
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : (e as { message?: string })?.message ?? 'Upload failed';
            dispatch({ type: 'SET_ERROR', payload: msg });
            throw e;
        }
    }, []); // Không phụ thuộc state.user — check auth ở backend qua cookie

    /**
     * removeAvatar: xóa avatar trên Cloudinary + DB → trả UserDto mới (avatar = null).
     */
    const removeAvatar = useCallback(async (): Promise<void> => {
        dispatch({ type: 'LOADING' });
        try {
            const userService = await loadUserService();
            const res = await userService.removeAvatar();
            storage.save(res.user);
            dispatch({ type: 'SET_USER', payload: res.user });
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : (e as { message?: string })?.message ?? 'Remove failed';
            dispatch({ type: 'SET_ERROR', payload: msg });
            throw e;
        }
    }, []); // Không phụ thuộc state.user

    /**
     * refreshUser: lấy thông tin user mới nhất từ server.
     * Dùng khi component mount để đảm bảo data đồng bộ với DB.
     * Chỉ dispatch nếu user thực sự thay đổi để tránh render loop.
     */
    const refreshUser = useCallback(async (): Promise<UserDto | null> => {
        try {
            const authService = await loadAuthService();
            const freshUser = await authService.getCurrentUser();
            const currentUser = storage.load();

            // Chỉ dispatch nếu user thực sự thay đổi
            if (JSON.stringify(freshUser) !== JSON.stringify(currentUser)) {
                storage.save(freshUser);
                dispatch({ type: 'SET_USER', payload: freshUser });
            }
            return freshUser;
        } catch {
            // Nếu cookie hết hạn và refresh cũng fail, interceptor sẽ xử lý redirect /signin.
            storage.clear();
            clearAuthActivity();
            removeAccountScopedQueries();
            dispatch({ type: 'SIGN_OUT' });
            return null;
        }
    }, []);

    const clearError = useCallback(() => {
        dispatch({ type: 'CLEAR_ERROR' });
    }, []);

    // ── Memo ──────────────────────────────────────────────────────────────────
    const stateValue = useMemo<AuthStateValue>(
        () => ({
            user: state.user,
            status: state.status,
            loading: state.loading,
            error: state.error,
            isAuthenticated: state.status === 'authenticated',
        }),
        [state]
    );

    const actionsValue = useMemo<AuthActionsValue>(
        () => ({
            login,
            register,
            loginWithGoogle,
            logout,
            changePassword,
            updateAvatar,
            removeAvatar,
            refreshUser,
            clearError,
        }),
        [login, register, loginWithGoogle, logout, changePassword, updateAvatar, removeAvatar, refreshUser, clearError]
    );

    const contextValue = useMemo<AuthContextType>(
        () => ({
            ...state,
            isAuthenticated: state.status === 'authenticated',
            login,
            register,
            loginWithGoogle,
            logout,
            changePassword,
            updateAvatar,
            removeAvatar,
            refreshUser,
            clearError,
        }),
        [state, login, register, loginWithGoogle, logout, changePassword, updateAvatar, removeAvatar, refreshUser, clearError]
    );

    return (
        <AuthStateContext.Provider value={stateValue}>
            <AuthActionsContext.Provider value={actionsValue}>
                <AuthContext.Provider value={contextValue}>
                    {children}
                </AuthContext.Provider>
            </AuthActionsContext.Provider>
        </AuthStateContext.Provider>
    );
}
