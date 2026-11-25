import React from 'react';
import FptTabs from '@/components/common/FptTabs';

export default function PortalTabsLayout() {
    return <FptTabs items={[
        { name: 'index', title: 'Tổng quan', icon: 'home-outline', activeIcon: 'home' },
        { name: 'courses', title: 'Khóa học', icon: 'book-outline', activeIcon: 'book' },
        { name: 'schedule', title: 'Lịch học', icon: 'calendar-outline', activeIcon: 'calendar' },
        { name: 'invoices', title: 'Học phí', icon: 'receipt-outline', activeIcon: 'receipt' },
        { name: 'profile', title: 'Cá nhân', icon: 'person-outline', activeIcon: 'person' },
    ]} />;
}
