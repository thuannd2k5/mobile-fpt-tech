import React from 'react';
import FptTabs from '@/components/common/FptTabs';

export default function TeacherTabsLayout() {
    return <FptTabs hidden={['classes', 'chat']} items={[
        { name: 'index', title: 'Lớp dạy', icon: 'school-outline', activeIcon: 'school' },
        { name: 'availability', title: 'Lịch rảnh', icon: 'calendar-outline', activeIcon: 'calendar' },
        { name: 'students', title: 'Học viên', icon: 'people-outline', activeIcon: 'people' },
        { name: 'profile', title: 'Tài khoản', icon: 'person-outline', activeIcon: 'person' },
    ]} />;
}
