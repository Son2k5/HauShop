import { useContext } from "react";
import { AuthStateContext } from "../context/authContext";
import type { AuthStateValue } from "../context/authContext";
 
export function useAuthState(): AuthStateValue {
  const ctx = useContext(AuthStateContext);
  if (!ctx) throw new Error("useAuthState must be used inside <AuthProvider>");
  return ctx;
}
 