import { useContext } from "react";
import { AuthActionsContext } from "../context/authContext";
import type { AuthActionsValue } from "../context/authContext";
 
export function useAuthActions(): AuthActionsValue {
  const ctx = useContext(AuthActionsContext);
  if (!ctx) throw new Error("useAuthActions must be used inside <AuthProvider>");
  return ctx;
}