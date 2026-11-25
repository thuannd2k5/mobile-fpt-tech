import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useAppSelector } from '@/redux/hooks';
import { callFetchMessage, callCreateMessage } from '@/api';
import { IMessage } from '@/types/backend';
import { FptHeader, FptLoading } from '@/components/common';

export default function ChatRoomScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user } = useAppSelector((state) => state.account);

    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState<IMessage[]>([]);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);

    const flatListRef = useRef<FlatList>(null);

    const loadMessages = useCallback(async () => {
        if (!id) return;
        try {
            const res = await callFetchMessage(`conversation_id=${id}&pageSize=100&sort=-createdAt`);
            if (res && res.data && Array.isArray(res.data.result)) {
                setMessages(res.data.result);
            }
        } catch {
            // handle error
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadMessages();
        // Poll every 5s for new messages
        const interval = setInterval(loadMessages, 5000);
        return () => clearInterval(interval);
    }, [loadMessages]);

    const handleSend = async () => {
        if (!text.trim() || !id || sending) return;

        const content = text.trim();
        setText('');
        setSending(true);

        const optimisticMsg: IMessage = {
            _id: Date.now().toString(),
            conversation_id: id,
            sender_id: { _id: user._id, name: user.name },
            content,
            createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [optimisticMsg, ...prev]);

        try {
            const res = await callCreateMessage({
                conversation_id: id,
                content,
            });

            if (res && res.data) {
                // Re-fetch to synchronize real backend ID and timestamps
                loadMessages();
            }
        } catch {
            // handle error
        } finally {
            setSending(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="flex-1 bg-fpt-grayBg"
        >
            <FptHeader safeArea title="Phòng trao đổi" showBack />

            {loading ? (
                <FptLoading message="Đang tải tin nhắn..." />
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    inverted
                    keyExtractor={(item) => item._id || Math.random().toString()}
                    contentContainerStyle={{ padding: 16 }}
                    ListEmptyComponent={
                        <View className="py-12 items-center justify-center">
                            <Ionicons name="chatbubbles-outline" size={36} color="#CBD5E0" />
                            <Text className="mt-2 text-xs text-gray-400">
                                Hãy gửi tin nhắn đầu tiên để bắt đầu cuộc trò chuyện.
                            </Text>
                        </View>
                    }
                    renderItem={({ item }) => {
                        const senderId =
                            typeof item.sender_id === 'object' && item.sender_id !== null
                                ? (item.sender_id as any)._id
                                : item.sender_id;
                        const isMe = senderId === user._id;
                        const time = item.createdAt ? dayjs(item.createdAt).format('HH:mm') : '';

                        return (
                            <View
                                className={`mb-3 flex-row ${
                                    isMe ? 'justify-end' : 'justify-start'
                                }`}
                            >
                                <View
                                    className={`max-w-[78%] rounded-2xl px-4 py-2.5 shadow-sm ${
                                        isMe
                                            ? 'bg-fpt-orange rounded-br-xs'
                                            : 'bg-white rounded-bl-xs border border-gray-100'
                                    }`}
                                >
                                    {!isMe && typeof item.sender_id === 'object' && (item.sender_id as any)?.name && (
                                        <Text className="mb-0.5 text-[10px] font-bold text-gray-400">
                                            {(item.sender_id as any).name}
                                        </Text>
                                    )}
                                    <Text
                                        className={`text-sm leading-relaxed ${
                                            isMe ? 'text-white font-medium' : 'text-gray-800'
                                        }`}
                                    >
                                        {item.content}
                                    </Text>
                                    <Text
                                        className={`mt-1 text-[9px] text-right ${
                                            isMe ? 'text-orange-200' : 'text-gray-400'
                                        }`}
                                    >
                                        {time}
                                    </Text>
                                </View>
                            </View>
                        );
                    }}
                />
            )}

            {/* Input Bar */}
            <View className="flex-row items-center border-t border-gray-200 bg-white px-4 py-3">
                <TextInput
                    className="flex-1 rounded-2xl bg-gray-100 px-4 py-2.5 text-sm text-gray-900"
                    placeholder="Nhập nội dung tin nhắn..."
                    placeholderTextColor="#A0AEC0"
                    value={text}
                    onChangeText={setText}
                    multiline
                    maxLength={500}
                />
                <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={!text.trim() || sending}
                    onPress={handleSend}
                    className={`ml-2.5 h-10 w-10 items-center justify-center rounded-2xl ${
                        text.trim() ? 'bg-fpt-orange' : 'bg-gray-200'
                    }`}
                >
                    {sending ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Ionicons name="send" size={18} color="#FFFFFF" />
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}
