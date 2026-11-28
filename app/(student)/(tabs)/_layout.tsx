import FptTabs from '@/components/common/FptTabs';
export default function StudentTabs() {
    return (
        <FptTabs
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
                    name: 'schedule',
                    title: 'Lớp của tôi',
                    icon: 'calendar-outline',
                    activeIcon: 'calendar',
                },
                {
                    name: 'invoices',
                    title: 'Học phí',
                    icon: 'receipt-outline',
                    activeIcon: 'receipt',
                },
                {
                    name: 'chat',
                    title: 'Tin nhắn',
                    icon: 'chatbubbles-outline',
                    activeIcon: 'chatbubbles',
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
