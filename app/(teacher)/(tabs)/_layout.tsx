import React from 'react';
import FptTabs from '@/components/common/FptTabs';

export default function PortalTabsLayout() {
    return <FptTabs items={[
        { name: 'index', title: 'Lịch dạy', icon: 'calendar-outline', activeIcon: 'calendar' },
        { name: 'classes', title: 'Lớp học', icon: 'school-outline', activeIcon: 'school' },
        { name: 'chat', title: 'Tin nhắn', icon: 'chatbubbles-outline', activeIcon: 'chatbubbles' },
        { name: 'profile', title: 'Cá nhân', icon: 'person-outline', activeIcon: 'person' },
    ]} />;
}
