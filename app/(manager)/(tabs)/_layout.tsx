import React from 'react';
import FptTabs from '@/components/common/FptTabs';

export default function ManagerTabs() {
    return <FptTabs items={[
        { name: 'index', title: 'Điều hành', icon: 'grid-outline', activeIcon: 'grid' },
        { name: 'classes', title: 'Lớp học', icon: 'school-outline', activeIcon: 'school' },
        { name: 'teachers', title: 'Giảng viên', icon: 'people-outline', activeIcon: 'people' },
        { name: 'profile', title: 'Tài khoản', icon: 'person-outline', activeIcon: 'person' },
    ]} />;
}
