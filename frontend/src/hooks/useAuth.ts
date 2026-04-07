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
    loading:         state.loading,
 
    // Actions
    login:           actions.login,
    register:        actions.register,
    logout:          actions.logout,
    changePassword:  actions.changePassword,
    updateAvatar:    actions.updateAvatar,
    removeAvatar:    actions.removeAvatar,
    refreshUser:     actions.refreshUser,
    clearError:      actions.clearError,
  };
}