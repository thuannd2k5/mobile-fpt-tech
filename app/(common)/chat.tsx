import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import { callFetchMyConversations } from '@/api';
import { IConversation } from '@/types/backend';
import { FptHeader, FptCard, FptLoading, FptEmptyState } from '@/components/common';

dayjs.extend(relativeTime);
dayjs.locale('vi');

export default function ConversationsScreen() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [conversations, setConversations] = useState<IConversation[]>([]);

    const fetchConversations = useCallback(async () => {
        try {
            const res = await callFetchMyConversations();
            if (res && res.data && Array.isArray(res.data)) {
                setConversations(res.data);
            }
        } catch {
            // handle error
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
        <View className="flex-1 bg-gray-50">
            <FptHeader title="Hộp thư Tin nhắn" showBack />

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
                    ListEmptyComponent={
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
