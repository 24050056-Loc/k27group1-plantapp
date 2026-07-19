import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

// ─── Cấu hình hiển thị thông báo khi app đang foreground ─────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Channel ID ───────────────────────────────────────────────────────────────
const PLANT_CHANNEL_ID = "plant-care";
const VOUCHER_CHANNEL_ID = "voucher-ready";

// ─── Tạo notification channels cho Android ───────────────────────────────────
async function ensureChannels() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(PLANT_CHANNEL_ID, {
      name: "Chăm sóc cây",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#2E7D32",
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      showBadge: true,
    });
    await Notifications.setNotificationChannelAsync(VOUCHER_CHANNEL_ID, {
      name: "Voucher sẵn sàng",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 200, 500],
      lightColor: "#FF8F00",
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      showBadge: true,
    });
  }
}

// ─── Yêu cầu quyền thông báo ─────────────────────────────────────────────────
export async function requestNotificationPermission(): Promise<boolean> {
  await ensureChannels();

  if (!Device.isDevice) {
    // Emulator — giả lập luôn được cấp quyền
    return true;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowCriticalAlerts: false,
      },
    });
    finalStatus = status;
  }

  return finalStatus === "granted";
}

// ─── Lên lịch thông báo "Cây sắp lên giai đoạn" ─────────────────────────────
export async function scheduleStageAlmostDoneNotification(
  stageName: string,
  secondsFromNow: number
): Promise<string | null> {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "🌱 Cây sắp lên giai đoạn mới!",
        body: `Cây của bạn sắp trở thành ${stageName}. Vào xem ngay!`,
        sound: true,
        badge: 1,
        data: { type: "stage_almost_done" },
        ...(Platform.OS === "android" && {
          channelId: PLANT_CHANNEL_ID,
          color: "#2E7D32",
          priority: "high",
          sticky: false,
        }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsFromNow,
        repeats: false,
      },
    });
    return id;
  } catch (e) {
    console.warn("scheduleStageAlmostDoneNotification error:", e);
    return null;
  }
}

// ─── Thông báo tức thì: Voucher sẵn sàng nhận ────────────────────────────────
export async function sendVoucherReadyNotification(
  voucherLabel: string,
  stageName: string
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🎁 Voucher sẵn sàng!",
        body: `Cây đã đạt ${stageName}! Bạn có thể nhận ${voucherLabel} ngay bây giờ.`,
        sound: true,
        badge: 1,
        data: { type: "voucher_ready" },
        ...(Platform.OS === "android" && {
          channelId: VOUCHER_CHANNEL_ID,
          color: "#FF8F00",
          priority: "max",
          sticky: false,
        }),
      },
      trigger: null, // Ngay lập tức
    });
  } catch (e) {
    console.warn("sendVoucherReadyNotification error:", e);
  }
}

// ─── Thông báo nhắc tưới cây hằng ngày lúc 8:00 sáng ─────────────────────────
export async function scheduleDailyWaterReminder(): Promise<string | null> {
  try {
    // Hủy lịch cũ trước
    await cancelDailyWaterReminder();

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "💧 Đến giờ tưới cây rồi!",
        body: "Cây của bạn đang chờ được tưới nước. Mở PlantApp để chăm sóc cây nhé!",
        sound: true,
        badge: 1,
        data: { type: "daily_water" },
        ...(Platform.OS === "android" && {
          channelId: PLANT_CHANNEL_ID,
          color: "#1565C0",
          priority: "high",
        }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 8,
        minute: 0,
      },
    });
    return id;
  } catch (e) {
    console.warn("scheduleDailyWaterReminder error:", e);
    return null;
  }
}

// ─── Hủy nhắc tưới cây ───────────────────────────────────────────────────────
const DAILY_REMINDER_TAG = "daily-water-reminder";

export async function cancelDailyWaterReminder(): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.content.data?.type === "daily_water") {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
  } catch (e) {
    console.warn("cancelDailyWaterReminder error:", e);
  }
}

// ─── Hủy tất cả thông báo cây ────────────────────────────────────────────────
export async function cancelAllPlantNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.dismissAllNotificationsAsync();
  } catch (e) {
    console.warn("cancelAllPlantNotifications error:", e);
  }
}
