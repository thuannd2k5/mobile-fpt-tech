import React from 'react';
import FptTabs from '@/components/common/FptTabs';

export default function ConsultantTabsLayout() {
    return <FptTabs items={[
        { name: 'index', title: 'Hộp tư vấn', icon: 'mail-outline', activeIcon: 'mail' },
        { name: 'courses', title: 'Khóa học', icon: 'book-outline', activeIcon: 'book' },
        { name: 'chat', title: 'Trao đổi', icon: 'chatbubbles-outline', activeIcon: 'chatbubbles' },
        { name: 'profile', title: 'Tài khoản', icon: 'person-outline', activeIcon: 'person' },
    ]} />;
}
