export type PermissionGrant = { method: string; path: string };
export const canUse = (
    permissions: readonly PermissionGrant[] | undefined,
    method: string,
    path: string,
): boolean =>
    !!permissions?.some(
        (permission) =>
            permission.method.toUpperCase() === method.toUpperCase() &&
            permission.path === path,
    );
