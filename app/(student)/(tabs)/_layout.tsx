import FptTabs from '@/components/common/FptTabs';
export default function StudentTabs() {
    return (
        <FptTabs
            hidden={['schedule']}
            items={[
                {
                    name: 'index',
                    title: 'Học tập',
                    icon: 'home-outline',
                    activeIcon: 'home',
                },
                {
                    name: 'courses',
                    title: 'Khóa học',
                    icon: 'book-outline',
                    activeIcon: 'book',
                },
                {
                    name: 'invoices',
                    title: 'Học phí',
                    icon: 'receipt-outline',
                    activeIcon: 'receipt',
                },
                {
                    name: 'profile',
                    title: 'Tài khoản',
                    icon: 'person-outline',
                    activeIcon: 'person',
                },
            ]}
        />
    );
}
