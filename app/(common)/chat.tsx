import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import FptErrorBanner from '@/components/common/FptErrorBanner';
import 'dayjs/locale/vi';
import { callFetchMyConversations } from '@/api';
import { IConversation } from '@/types/backend';
import { FptHeader, FptCard, FptLoading, FptEmptyState } from '@/components/common';

dayjs.extend(relativeTime);
dayjs.locale('vi');


export default function ConversationsScreen() {
    const router = useRouter();

    const [loadError, setLoadError] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [conversations, setConversations] = useState<IConversation[]>([]);

    const fetchConversations = useCallback(async () => {
        setLoadError('');
        try {
            const res = await callFetchMyConversations();
            if (res && res.data && Array.isArray(res.data)) {
                setConversations(res.data);
            }
        } catch {
            setLoadError('Không thể tải dữ liệu. Vui lòng kiểm tra kết nối và thử lại.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchConversations();
    };

    return (
        <View className="flex-1 bg-fpt-grayBg">
            <FptHeader safeArea title="Hộp thư Tin nhắn" showBack />
            {loadError ? <FptErrorBanner message={loadError} onRetry={onRefresh} /> : null}

            {loading && !refreshing ? (
                <FptLoading message="Đang tải các cuộc trò chuyện..." />
            ) : (
                <FlatList
                    data={conversations}
                    keyExtractor={(item) => item._id || Math.random().toString()}
                    contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#F26522']}
                            tintColor="#F26522"
                        />
                    }
                    ListEmptyComponent={loadError ? undefined :
                        <FptEmptyState
                            title="Chưa có tin nhắn"
                            description="Bạn chưa có cuộc trò chuyện nào. Hãy liên hệ với Giảng viên hoặc Tư vấn viên khi cần hỗ trợ!"
                            icon="chatbubbles-outline"
                        />
                    }
                    renderItem={({ item }) => {
                        const title = item.title || 'Hộp thoại trao đổi';
                        const lastMsg = item.lastMessage || 'Bắt đầu cuộc trò chuyện...';
                        const time = item.updatedAt ? dayjs(item.updatedAt).fromNow() : '';

                        return (
                            <FptCard
                                className="mb-3"
                                onPress={() =>
                                    item._id &&
                                    router.push(`/(common)/chat-room/${item._id}` as any)
                                }
                            >
                                <View className="flex-row items-center">
                                    <View className="h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 mr-3.5">
                                        <Ionicons name="chatbubble-ellipses" size={24} color="#F26522" />
                                    </View>
                                    <View className="flex-1">
                                        <View className="flex-row items-center justify-between">
                                            <Text
                                                className="text-base font-bold text-gray-900 flex-1 mr-2"
                                                numberOfLines={1}
                                            >
                                                {title}
                                            </Text>
                                            {time ? (
                                                <Text className="text-[11px] text-gray-400">
                                                    {time}
                                                </Text>
                                            ) : null}
                                        </View>
                                        <Text
                                            className="text-xs text-gray-500 mt-1"
                                            numberOfLines={1}
                                        >
                                            {lastMsg}
                                        </Text>
                                    </View>
                                </View>
                            </FptCard>
                        );
                    }}
                />
            )}
        </View>
    );
}
