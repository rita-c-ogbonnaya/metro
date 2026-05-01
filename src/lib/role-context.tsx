import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Role = "manager" | "landlord" | "tenant";

interface RoleContextValue {
  role: Role;
  setRole: (r: Role) => void;
}

const RoleContext = createContext<RoleContextValue>({ role: "manager", setRole: () => {} });

export function RoleProvider({ children }: { children: ReactNode }) {
  // SSR-safe default; per-route hooks lock the correct role on mount.
  const [role, setRoleState] = useState<Role>("manager");

  const setRole = (r: Role) => {
    setRoleState(r);
    if (typeof window !== "undefined") localStorage.setItem("metro-role", r);
  };

  return <RoleContext.Provider value={{ role, setRole }}>{children}</RoleContext.Provider>;
}

export const useRole = () => useContext(RoleContext);

/**
 * Lock the role for the current route. Call at the top of every role-scoped
 * page so that navigation between dashboards always shows the right identity,
 * sidebar, and feature set — regardless of any previously-stored role.
 */
export function useLockRole(role: Role) {
  const { setRole } = useRole();
  useEffect(() => {
    setRole(role);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);
}
