import React, {
    createContext,
    useCallback,
    useEffect,
    useMemo,
    useReducer,
} from 'react';
import { useLocation } from 'react-router-dom';
import { queryClient } from '../lib/queryClient';
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
                scope === 'orders'
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
function shouldBootstrapAuth(pathname: string): boolean {
    return (
        pathname.startsWith('/admin') ||
        pathname.startsWith('/cart') ||
        pathname.startsWith('/profile') ||
        pathname.startsWith('/change-password') ||
        pathname.startsWith('/checkout') ||
        pathname.startsWith('/orders') ||
        pathname.startsWith('/wishlist') ||
        pathname.startsWith('/support-chat') ||
        pathname.startsWith('/payment')
    );
}

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
    refreshUser: () => Promise<void>;
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
    refreshUser: () => Promise<void>;
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
        if (!shouldBootstrapAuth(location.pathname)) return;

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
        const handler = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY && e.newValue === null) {
                removeAccountScopedQueries();
                dispatch({ type: 'SIGN_OUT' });
            }
        };
        window.addEventListener('storage', handler);
        return () => window.removeEventListener('storage', handler);
    }, []);

    // ── Actions ───────────────────────────────────────────────────────────────

    const login = useCallback(async (dto: LoginDto): Promise<UserDto> => {
        dispatch({ type: 'LOADING' });
        try {
            const authService = await loadAuthService();
            const response = await authService.login(dto);
            // Xử lý cả trường hợp backend trả về PascalCase và camelCase
            const user = response.user || (response as any).User;

            if (!user) {
                throw new Error('User data not found in response');
            }

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
            const response = await authService.register(dto);
            // Xử lý cả trường hợp backend trả về PascalCase và camelCase
            const user = response.user || (response as any).User;

            if (!user) {
                throw new Error('User data not found in response');
            }

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
        removeAccountScopedQueries();
        dispatch({ type: 'SIGN_OUT' });
    }, []);

    const changePassword = useCallback(async (dto: ChangePasswordDto): Promise<void> => {
        const authService = await loadAuthService();
        await authService.changePassword(dto);
        // Đổi mật khẩu → revoke tất cả token → bắt login lại
        storage.clear();
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
    const refreshUser = useCallback(async (): Promise<void> => {
        try {
            const authService = await loadAuthService();
            const freshUser = await authService.getCurrentUser();
            const currentUser = storage.load();

            // Chỉ dispatch nếu user thực sự thay đổi
            if (JSON.stringify(freshUser) !== JSON.stringify(currentUser)) {
                storage.save(freshUser);
                dispatch({ type: 'SET_USER', payload: freshUser });
            }
        } catch {
            // Nếu cookie hết hạn và refresh cũng fail → interceptor đã redirect /signin
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
