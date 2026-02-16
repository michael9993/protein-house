import { PermissionEnum } from "@dashboard/graphql";
import { ReactNode } from "react";

import NotFound from "../../NotFound";
import { useUser } from "..";
import { hasAllPermissions, hasAnyPermissions } from "../misc";

type MatchPermissionType = "all" | "any";

interface SectionGuardProps {
  permissions?: PermissionEnum[];
  matchPermission?: MatchPermissionType;
  children: ReactNode;
}

const matchAll = (match: MatchPermissionType) => match === "all";

/**
 * Permission-based route guard. Wraps a route element and renders
 * <NotFound /> if the current user lacks the required permissions.
 *
 * Usage in v6 Routes:
 *   <Route path="/products/*" element={
 *     <SectionGuard permissions={[PermissionEnum.MANAGE_PRODUCTS]}>
 *       <ProductSection />
 *     </SectionGuard>
 *   } />
 */
export const SectionGuard = ({
  permissions,
  matchPermission = "all",
  children,
}: SectionGuardProps) => {
  const { user } = useUser();

  // Prevents race condition
  if (user === undefined) {
    return null;
  }

  const hasSectionPermissions = () => {
    if (!permissions) {
      return true;
    }

    if (matchAll(matchPermission)) {
      return hasAllPermissions(permissions, user!);
    }

    return hasAnyPermissions(permissions, user!);
  };

  return hasSectionPermissions() ? <>{children}</> : <NotFound />;
};

SectionGuard.displayName = "SectionGuard";

// Keep backward-compatible default export name for existing imports
export default SectionGuard;
