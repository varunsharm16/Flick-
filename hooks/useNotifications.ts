import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export interface NotificationState {
    expoPushToken: string | null;
    permissionStatus: Notifications.PermissionStatus | null;
    notification: Notifications.Notification | null;
}

export function useNotifications() {
    const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
    const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(null);
    const [notification, setNotification] = useState<Notifications.Notification | null>(null);

    const notificationListener = useRef<Notifications.EventSubscription | null>(null);
    const responseListener = useRef<Notifications.EventSubscription | null>(null);

    useEffect(() => {
        // Register for push notifications
        registerForPushNotificationsAsync().then(({ token, status }) => {
            setExpoPushToken(token);
            setPermissionStatus(status);
        });

        // Listen for incoming notifications while app is foregrounded
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            setNotification(notification);
        });

        // Listen for user interactions with notifications
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            handleNotificationResponse(response);
        });

        return () => {
            if (notificationListener.current) {
                notificationListener.current.remove();
            }
            if (responseListener.current) {
                responseListener.current.remove();
            }
        };
    }, []);

    return {
        expoPushToken,
        permissionStatus,
        notification,
        requestPermissions: requestPermissionsAsync,
    };
}

async function registerForPushNotificationsAsync(): Promise<{
    token: string | null;
    status: Notifications.PermissionStatus;
}> {
    let token: string | null = null;
    let status: Notifications.PermissionStatus = Notifications.PermissionStatus.UNDETERMINED;

    // Push notifications only work on physical devices
    if (!Device.isDevice) {
        console.log('Push notifications require a physical device');
        return { token: null, status };
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    status = existingStatus;

    // Request permissions if not already granted
    if (existingStatus !== Notifications.PermissionStatus.GRANTED) {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        status = newStatus;
    }

    // Get the Expo Push Token if permissions are granted
    if (status === Notifications.PermissionStatus.GRANTED) {
        try {
            const tokenData = await Notifications.getExpoPushTokenAsync({
                projectId: undefined, // Will use the project ID from app.json/eas.json
            });
            token = tokenData.data;
            console.log('Expo Push Token:', token);
        } catch (error) {
            console.error('Failed to get push token:', error);
        }
    }

    // Android requires a notification channel
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'Default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF6F3C',
        });
    }

    return { token, status };
}

async function requestPermissionsAsync(): Promise<boolean> {
    if (!Device.isDevice) {
        return false;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    return status === Notifications.PermissionStatus.GRANTED;
}

function handleNotificationResponse(response: Notifications.NotificationResponse) {
    const data = response.notification.request.content.data;

    // Handle deep linking based on notification data
    if (data?.screen === 'record') {
        router.push('/(tabs)/record');
    } else if (data?.screen === 'drills') {
        router.push('/drills');
    }
    // Default: just open the app (no navigation needed)
}

// Utility function to send a test local notification
export async function sendTestNotification() {
    await Notifications.scheduleNotificationAsync({
        content: {
            title: "Time to shoot! 🏀",
            body: "Get some shots up and track your progress.",
            data: { screen: 'record' },
        },
        trigger: null, // Send immediately
    });
}
