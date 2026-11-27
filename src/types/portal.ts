export type PortalRole =
    | 'STUDENT'
    | 'TEACHER'
    | 'CONSULTANT'
    | 'MANAGER'
    | 'ACCOUNTANT'
    | 'NORMAL_USER'
    | 'UNKNOWN';
export const normalizeRole = (value: unknown = ''): string => {
    if (typeof value === 'object' && value !== null && 'name' in value)
        value = (value as { name?: unknown }).name;
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .replace(/\s+/g, ' ')
        .toUpperCase();
};
export const canRegisterForCourse = (roleName?: string): boolean =>
    ['STUDENT', 'NORMAL USER'].includes(normalizeRole(roleName));
export const isBackofficeRole = (roleName?: string): boolean =>
    ['ADMIN', 'SUPER ADMIN', 'QUAN TRI', 'QUAN TRI VIEN'].includes(
        normalizeRole(roleName),
    );
export const getPortalRole = (roleName?: string): PortalRole => {
    const role = normalizeRole(roleName);
    if (['MANAGER', 'QUAN LY'].includes(role)) return 'MANAGER';
    if (['TEACHER', 'GIANG VIEN'].includes(role)) return 'TEACHER';
    if (['CONSULTANT', 'TU VAN', 'TU VAN VIEN'].includes(role))
        return 'CONSULTANT';
    if (['ACCOUNTANT', 'KETOAN', 'KE TOAN'].includes(role)) return 'ACCOUNTANT';
    if (role === 'NORMAL USER') return 'NORMAL_USER';
    if (role === 'STUDENT') return 'STUDENT';
    return 'UNKNOWN';
};
export const getRoleLabel = (roleName?: string): string =>
    isBackofficeRole(roleName)
        ? 'Quản trị hệ thống'
        : {
              STUDENT: 'Học viên',
              TEACHER: 'Giảng viên',
              CONSULTANT: 'Tư vấn viên',
              MANAGER: 'Quản lý đào tạo',
              ACCOUNTANT: 'Kế toán',
              NORMAL_USER: 'Tài khoản mới',
              UNKNOWN: 'Chưa xác định vai trò',
          }[getPortalRole(roleName)];
export const getDefaultRouteForRole = (roleName?: string): string => {
    if (isBackofficeRole(roleName)) return '/admin';
    return {
        STUDENT: '/(student)',
        TEACHER: '/(teacher)',
        CONSULTANT: '/(consultant)',
        MANAGER: '/(manager)',
        ACCOUNTANT: '/(accountant)',
        NORMAL_USER: '/(explore)',
        UNKNOWN: '/unsupported',
    }[getPortalRole(roleName)];
};
