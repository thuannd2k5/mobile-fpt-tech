export type PortalRole = 'STUDENT' | 'TEACHER' | 'CONSULTANT' | 'MANAGER' | 'ACCOUNTANT';

export const normalizeRole = (value: unknown = ''): string => {
    if (typeof value === 'object' && value !== null && 'name' in value) {
        value = (value as { name?: unknown }).name;
    }
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase();
};

export const canRegisterForCourse = (roleName?: string): boolean => {
    const role = normalizeRole(roleName);
    return role === 'STUDENT' || role === 'NORMAL USER' || role === '';
};

export const isBackofficeRole = (roleName?: string): boolean => {
    const role = normalizeRole(roleName);
    return role.includes('ADMIN') || role.includes('QUAN TRI');
};

export const getPortalRole = (roleName?: string): PortalRole => {
    const role = normalizeRole(roleName);
    if (role.includes('MANAGER') || role.includes('QUAN LY')) return 'MANAGER';
    if (role.includes('TEACHER') || role.includes('GIANG VIEN')) return 'TEACHER';
    if (role.includes('CONSULTANT') || role.includes('TU VAN')) return 'CONSULTANT';
    if (role.includes('ACCOUNTANT') || role.includes('KE TOAN')) return 'ACCOUNTANT';
    return 'STUDENT';
};

export const getDefaultRouteForRole = (roleName?: string): string => {
    const role = getPortalRole(roleName);
    switch (role) {
        case 'TEACHER':
            return '/(teacher)';
        case 'CONSULTANT':
            return '/(consultant)';
        case 'MANAGER':
        case 'ACCOUNTANT':
        case 'STUDENT':
        default:
            return '/(student)';
    }
};
