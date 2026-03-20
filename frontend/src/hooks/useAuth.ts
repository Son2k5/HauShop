import { useAuthActions } from "./useAuthActions";
import { useAuthState }   from "./useAuthState";
 
export function useAuth() {
  const state   = useAuthState();
  const actions = useAuthActions();
 
  return {
    // State
    user:            state.user,
    status:          state.status,
    error:           state.error,
    isAuthenticated: state.isAuthenticated,
    isLoading:       state.isLoading,
 
    // Actions
    login:           actions.login,
    register:        actions.register,
    logout:          actions.logout,
    changePassword:  actions.changePassword,
    loginWithGoogle: actions.loginWithGoogle,
    clearError:      actions.clearError,
    patchUser:       actions.patchUser,
  };
}