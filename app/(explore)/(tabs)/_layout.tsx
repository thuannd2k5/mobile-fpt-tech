import FptTabs from '@/components/common/FptTabs';
export default function ExploreTabs() {
    return (
        <FptTabs
            items={[
                {
                    name: 'index',
                    title: 'Khám phá',
                    icon: 'compass-outline',
                    activeIcon: 'compass',
                },
                {
                    name: 'consultation',
                    title: 'Tư vấn',
                    icon: 'help-circle-outline',
                    activeIcon: 'help-circle',
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
