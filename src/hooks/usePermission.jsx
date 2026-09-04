import { useSelector } from 'react-redux';

const usePermission = () => {
    const { user, permissions, role } = useSelector((s) => s.auth);

    // ── Application Super Admin ───────────────────────────
    // Sab orgs, sab users, system settings
    const isSuperAdmin = () => role?.name === 'super_admin';

    // ── Org Owner/Admin ───────────────────────────────────
    // Apni org ka full access
    const isOrgAdmin = () =>
        user?.user_type === 'org_owner' ||
        role?.name === 'org_admin';

    // ── Super Admin OR Org Admin ──────────────────────────
    const isAdmin = () => isSuperAdmin() || isOrgAdmin();

    // ── Role check ────────────────────────────────────────
    const isRole = (roleName) => role?.name === roleName;

    // ── Permission check ─────────────────────────────────
    // Super Admin aur Org Admin ko sab permissions milte hain
    const can = (permissionOrArray) => {
        if (isSuperAdmin() || isOrgAdmin()) return true;

        if (Array.isArray(permissionOrArray)) {
            return permissionOrArray.some((p) => permissions?.includes(p));
        }
        return permissions?.includes(permissionOrArray);
    };

    const canAll = (permissionsArray) => {
        if (isSuperAdmin() || isOrgAdmin()) return true;
        return permissionsArray.every((p) => permissions?.includes(p));
    };

    const hasRole = (roleName) => role?.name === roleName;

    return { can, canAll, isSuperAdmin, isOrgAdmin, isAdmin, isRole, hasRole };
};

export default usePermission;