import FptTabs from '@/components/common/FptTabs';

export default function AccountantTabs() {
    return <FptTabs items={[
        { name: 'index', title: 'Tài chính', icon: 'home-outline', activeIcon: 'home' },
        { name: 'invoices', title: 'Hóa đơn', icon: 'document-text-outline', activeIcon: 'document-text' },
        { name: 'payments', title: 'Phiếu thu', icon: 'wallet-outline', activeIcon: 'wallet' },
        { name: 'profile', title: 'Tài khoản', icon: 'person-outline', activeIcon: 'person' },
    ]} />;
}
