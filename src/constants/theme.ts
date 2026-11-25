export const COLORS = {
    // FPT Brand Colors
    primary: '#F26522', // FPT Orange
    primaryDark: '#D95214',
    primaryLight: '#FFF2E8',
    secondary: '#0050B3', // FPT Blue
    secondaryDark: '#003A8C',
    secondaryLight: '#E6F4FE',

    // Status Colors
    success: '#52C41A',
    successLight: '#F6FFED',
    warning: '#FAAD14',
    warningLight: '#FFFBE6',
    danger: '#FF4D4F',
    dangerLight: '#FFF1F0',
    info: '#1890FF',
    infoLight: '#E6F7FF',

    // Neutrals
    white: '#FFFFFF',
    background: '#F4F6FA',
    cardBackground: '#FFFFFF',
    border: '#E8E8E8',
    borderLight: '#F0F0F0',
    text: '#262626',
    textSecondary: '#595959',
    textMuted: '#8C8C8C',
    textDisabled: '#BFBFBF',
};

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
};

export const RADIUS = {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 18,
    full: 9999,
};

export const SHADOWS = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
        elevation: 6,
    },
};

export default {
    COLORS,
    SPACING,
    RADIUS,
    SHADOWS,
};
