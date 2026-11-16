import { View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import '../global.css';

export default function HomeScreen() {
    return (
        <View className="flex-1 items-center justify-center bg-white p-6">
            <StatusBar style="auto" />
            <Text className="text-2xl font-bold text-fpt-orange">FPT Education Mobile</Text>
            <Text className="mt-2 text-base text-gray-500">React Native Expo + Expo Router + NativeWind</Text>
        </View>
    );
}
