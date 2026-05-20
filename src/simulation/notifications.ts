// ─────────────────────────────────────────────
// src/simulation/notifications.ts
//
// Local push notification helpers for plant events.
//
// Uses Expo Notifications API to schedule alerts
// when plants reach harvest_ready or critical states.
//
// Notifications are only scheduled if the user has
// enabled them in Settings.
// ─────────────────────────────────────────────

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ─── Initialisation ───────────────────────────

/**
 * Request notification permissions and configure channel.
 * Should be called once at app startup.
 */
export async function initNotifications(): Promise<boolean> {
  try {
    // Configure default notification behaviour
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });

    // Android requires a notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('plant-events', {
        name: 'Plant Events',
        description: 'Notifications when your plants need attention',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 100],
      });
    }

    // Request permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.warn('[Notifications] Init failed:', error);
    return false;
  }
}

// ─── Schedule Notifications ───────────────────

/**
 * Schedule a notification when a plant is ready to harvest.
 * Returns the notification ID, or null if failed.
 */
export async function scheduleHarvestReadyNotification(
  plantId: string,
  plantName: string,
): Promise<string | null> {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌱 Ready to Harvest!',
        body: `${plantName} is ready! Tap to harvest your crop.`,
        data: { plantId, type: 'harvest_ready' },
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // immediate
    });
    return id;
  } catch (error) {
    console.warn('[Notifications] Schedule harvest-ready failed:', error);
    return null;
  }
}

/**
 * Schedule a notification when a plant is critically thirsty.
 */
export async function scheduleWaterCriticalNotification(
  plantId: string,
  plantName: string,
): Promise<string | null> {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💧 Thirsty Plant!',
        body: `${plantName} is critically low on water. Give it a drink!`,
        data: { plantId, type: 'water_critical' },
        priority: Notifications.AndroidNotificationPriority.DEFAULT,
      },
      trigger: null,
    });
    return id;
  } catch (error) {
    console.warn('[Notifications] Schedule water-critical failed:', error);
    return null;
  }
}

/**
 * Schedule a notification when a plant has died.
 */
export async function schedulePlantDiedNotification(
  plantId: string,
  plantName: string,
): Promise<string | null> {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🥀 Plant Lost',
        body: `${plantName} has died. You can compost it for some spores.`,
        data: { plantId, type: 'plant_died' },
        priority: Notifications.AndroidNotificationPriority.DEFAULT,
      },
      trigger: null,
    });
    return id;
  } catch (error) {
    console.warn('[Notifications] Schedule plant-died failed:', error);
    return null;
  }
}

/**
 * Cancel all pending notifications for a specific plant.
 * Called when a plant is harvested or composted.
 */
export async function cancelPlantNotifications(plantId: string): Promise<void> {
  try {
    const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
    const toCancel = allScheduled
      .filter((n: any) => n.content.data?.plantId === plantId)
      .map((n: any) => n.identifier);

    for (const id of toCancel) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }
  } catch (error) {
    console.warn('[Notifications] Cancel failed:', error);
  }
}

/**
 * Get the number of pending notifications.
 */
export async function getPendingNotificationCount(): Promise<number> {
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    return all.length;
  } catch {
    return 0;
  }
}