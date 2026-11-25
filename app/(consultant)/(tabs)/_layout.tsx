import React from 'react';
import FptTabs from '@/components/common/FptTabs';

export default function PortalTabsLayout() {
    return <FptTabs items={[
        { name: 'index', title: 'Tư vấn', icon: 'people-outline', activeIcon: 'people' },
        { name: 'courses', title: 'Khóa học', icon: 'book-outline', activeIcon: 'book' },
        { name: 'chat', title: 'Tin nhắn', icon: 'chatbubbles-outline', activeIcon: 'chatbubbles' },
        { name: 'profile', title: 'Cá nhân', icon: 'person-outline', activeIcon: 'person' },
    ]} />;
}
